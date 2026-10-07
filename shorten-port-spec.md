# Short link port: simplified backend spec

The simplified take on the scoreboard's shortener. This file covers **the backend
write and resolve path only** — the client repoint and the scoreboard's own routes
are out of scope, apart from the note under Sharing.

Written in the behaviour-only style of `matchresult-port-spec.md`: what must be
stored, returned and redirected to, not which API calls to type. There are no
code blocks by request.

Target: `../messaging`, where the handlers live in a new `docker/shorten.njs`
module driven from `docker/api.njs`, writing to the same Upstash KV the
scoreboard already uses.

## Status

- Not started. No code has been changed.
- The scoreboard's `src/services/shortener.ts`, `src/pages/api/shorten.ts` and
  `src/pages/api/replay/[id].ts` are left exactly as they are, so every link
  already in the wild keeps resolving.
- Shared KV, so no data migration: keys minted by either host resolve on both.

## Goal

Mint short links and resolve them to game URLs from messaging, so sharing a
replay stops billing Vercel.

The success condition is "short-link traffic no longer bills Vercel". The player
is waiting: the share button calls mint, then hands the result to the OS share
sheet or the clipboard, so keep the mint to as few round trips as the
scoreboard's (two) and add no lookups.

## Scope

**In scope**

- A `POST /api/shorten` handler in messaging, in its own module.
- A `GET /api/replay/<key>` handler in the same module.
- The KV keys and the stored value shape.
- The response/redirect contract the sharing flow depends on.

**Out of scope**

- The client repoint in `../billiards` (`src/utils/shorten.ts` has the endpoint
  constant) — tracked elsewhere; see Sharing for what it means.
- Editing or retiring the scoreboard's three files. Leave them untouched.
- Expiry, trimming, analytics, duplicate suppression.
- The `input` payload's contents, and anything about the replay blob, the
  `/api/match-replay` route, or the lobby.

## Current flow (for reference)

The scoreboard's `Shortener` does the whole job:

- Mint: `INCR idfountain` for the next key, then store the posted body under
  `urlkey<key>`, then answer `{input, key, shortUrl}`.
- Resolve: read `urlkey<key>`, and redirect to the game URL with the stored
  query string appended.

Relevant facts established while reviewing:

- Keys: `idfountain` (counter) and `urlkey<key>` (JSON `{"input": "<query>"}`).
  **Neither has a TTL.** Links are permanent, so expiry is not part of this
  port.
- Only the game's share flow calls mint. `src/utils/shorten.ts` posts
  `{input: <the replay URL's query string only>}` and keys on `shortUrl` in the
  response; if the field is absent it falls back to the unshortened URL. So the
  stored value is a query string, not a whole URL — that is what makes the link
  host-independent.
- The resolve handler takes the key from the path (`/api/replay/534`) and
  forwards the caller's extra query params, except `id`, onto the game URL.
  Verified against the deployed route: `/api/replay/534?lod=4` 302s to
  `GAME_BASE_URL` with the stored `state` and `lod=4`.
- A missing key redirects to `<host>/notfound.html`, which is itself a 404 on
  the scoreboard host today (no such file in `public/`).

## Route and wiring

- New module `docker/shorten.njs`, exporting two handlers via a default export
  (suggested names `shorten` and `replay`), matching how `api.njs` and
  `nchan_meta.js` already export.
- `docker/api.njs` gains one import at the top and two dispatch lines in its
  `router`: `POST /api/shorten`, and a prefix match on `/api/replay/`. Nothing
  else in `api.njs` changes; it stays a dispatcher and does not grow handlers.
- `docker/Dockerfile` gains a `COPY` for the new file, beside the existing
  `COPY api.njs`. Only `api.njs` stays in `js_import`; `shorten.njs` is reached
  by import from it.
- No `nginx.conf` change. The existing `location /api/` block
  (`docker/nchan.conf:195`) already matches both paths, applies the same rate
  limiting, and includes `cors.conf` — so the preflight `OPTIONS` is answered by
  nginx with 204 and the handlers need no CORS of their own. The scoreboard sets
  CORS in the handlers; that job belongs to nginx here.
- No logging. Nothing on the happy path, nothing on failure.
- Happy path only. No input validation, no error-state design.
- Reuse the module-local helpers already in `api.njs` (`readBody`, `redis`,
  `json`). No new library, no KV client.

## KV

| Order | Operation | Key | Notes |
| --- | --- | --- | --- |
| 1 | `INCR` | `idfountain` | Returns the key for this link |
| 2 | `SET` value = JSON `{"input": <body.input>}` | `urlkey<key>` | No expiry |

Keep both key names, the JSON member shape and the absence of a TTL identical to
today: that is what lets links minted by either host resolve on both, and what
keeps the round trips at two.

The two commands cannot share one pipeline: the `SET` key is the value the `INCR`
returns. The scoreboard pays the same two round trips.

Read back with `GET urlkey<key>` and take field `input` from the parsed JSON. Do
not store the body verbatim if that changes the shape — existing entries are the
`{"input": ...}` object and a plain-string entry would not parse.

## Responses

Mint (`POST /api/shorten`)

- Body in: JSON with an `input` field. Read it with the existing `readBody`.
- 200 JSON `{input, key, shortUrl}`. Keep all three field names: the client keys
  on `shortUrl` and falls back to the long link without it.
- `shortUrl` = the minting host + `/api/replay/` + key, where the minting host is
  the API host that serves this nginx (the client's `API_BASE`,
  `https://billiards-network.onrender.com`). Existing links point at the
  scoreboard host; both keep working.
- Because only the query string is stored, the minted URL is portable between
  hosts and the redirect re-adds nothing.

Resolve (`GET /api/replay/<key>`)

- Take the key from the path segment, unvalidated.
- Read `urlkey<key>`; on a hit, 302 with `Location` = game base URL + stored
  `input`, then the caller's query params except `id` merged on top.
- On a miss, 302 to `notfound.html` on the minting host, exactly as today. That
  page does not exist in messaging's `docker/html/`, so either copy one in or
  accept the host's 404 — same visible outcome as today.
- Method handling doesn't extend beyond what the router already does, and the
  client only ever sends POST for mint and GET (browser navigation) for resolve.

## Sharing flow (its use for replay links)

- The game builds a replay URL, posts only its query string as `{input}`, takes
  `shortUrl`, and hands it to `navigator.share` (mobile) or the clipboard
  (desktop), echoing the outcome into chat as today. Nothing about that flow
  changes, and no share UI or success text changes.
- The remaining work after this port is a one-line host change in
  `../billiards/src/utils/shorten.ts`. Hardcoded
  `scoreboard-tailuge.vercel.app/api/replay/...` links in the lobby motd
  (`../messaging/src/client/motd-panel.js`) and the blog pages stay valid while
  the scoreboard route is untouched; repointing them is optional.
- Existing short links are permanent and live on the scoreboard host, so its
  resolve route must never be deleted, whatever the mint path becomes.

## Decisions

| Decision | Choice |
| --- | --- |
| Handler location | New `docker/shorten.njs`, dispatched from `api.njs` |
| Keys | `idfountain` and `urlkey<key>`, unchanged |
| Stored value | JSON `{"input": <query>}`, unchanged |
| Expiry | None, unchanged |
| Mint round trips | Two (`INCR`, then `SET`), unchanged |
| Response | `{input, key, shortUrl}`, names unchanged |
| Minted host | The messaging API host, not the scoreboard |
| Resolve | 302, stored query + caller params except `id` |
| Missing key | 302 to `notfound.html`, as today |
| CORS | nginx `cors.conf`, none in the handlers |
| Logging | None |
| Client repoint | Out of scope |
| Scoreboard routes | Untouched |

## Verification

No NJS unit tests exist for `api.njs` or its siblings, and E2E is out of scope
for cloud agents. Verify manually against the container:

- `POST /api/shorten` with `{"input":"?ruletype=nineball&state=x"}` returns 200
  with `key`, `input` and a `shortUrl` on the messaging host, and `GET urlkey<key>`
  in KV returns the JSON `{"input":"?ruletype=nineball&state=x"}` with no TTL set.
- Two mints in a row return different keys, proving `idfountain` is shared.
- `GET <shortUrl>` 302s to `GAME_BASE_URL?ruletype=nineball&state=x`, and
  `GET <shortUrl>?lod=4` appends `lod=4`.
- `GET /api/replay/999999` gives the not-found behaviour and nothing hangs.
- A key minted by the scoreboard (e.g. `534`) resolves from messaging, proving
  key compatibility over the shared KV.
- The MOTD's `/api/replay/534?lod=4` link still resolves.

## Checks

- `../messaging`: `npm run lint` (`tsc --noEmit` plus oxlint over `src` and
  `test`) — note the new `.njs` module sits outside those paths, so it is not
  covered by that gate.
- `../messaging`: a syntax error in an NJS module surfaces at nginx start, so a
  container start plus one mint and one resolve is the real gate.
- `../scoreboard`: `yarn test` and `yarn lint` (nothing changes here, but the
  shortener tests pin the behaviour this port must keep).

## Future work

- Deleting the scoreboard's mint route once nothing mints against it; its resolve
  route has to stay for the links already minted.
- The `INCR`/`SET` pair is not atomic, so a failure between them burns a key
  number. Harmless, and no worse than today.
