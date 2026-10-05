# Simplifying the hi-score upload: drop fflate + jsoncrush from the scoreboard

## Goal

The scoreboard only decompresses a replay blob in one place — `src/pages/api/hiscore.ts`
— to read two values: the client version `v` and the `score`. Everything else in the
submission (`ruletype`, `id`, the raw `state`) is already plain.

Instead of decoding the blob, have the client pass `v` and `score` as plain params.
That removes the scoreboard's only use of `fflate` and `jsoncrush`, and both libraries
stay solely in the client (`../billiards`) where the blob is still produced.

The `state` blob is **kept** in the submission: it is stored raw for the leaderboard
replay and used byte-for-byte for duplicate detection.

## Current flow (for reference)

1. Client builds state `{ init, shots, ..., score, v: 1 }`.
2. `LinkFormatter.getHiScoreUri` fflate-encodes it to `f~...` and links to
   `hiscore.html?ruletype=…&state=<f~…>&userId=…&userName=…`.
3. `public/hiscore.html` POSTs `globalThis.location.search` as the body to
   `/api/hiscore?ruletype=…&id=…`.
4. `api/hiscore.ts` reads `state` from the body and fflate-decodes it to get `v`/`score`.

## Changes — scoreboard (this repo)

### 1. `src/pages/api/hiscore.ts`

- Parse the body once: `const params = new URLSearchParams(await request.text())`.
- Read `state`, `v`, and `score` from `params`.
- Version check: `Number(params.get("v")) === 1`, same 400 message/wording as today.
- Score: `const raw = Number(params.get("score"))`; reject with 400 if not finite.
  Then keep `raw + (Date.now() - base) / base` unchanged.
- Keep `ruletype` from `url.searchParams` and `id` from `url.searchParams`.
- Keep the dedupe check (`urlState(rowData) === stateParam`) and keep storing the raw body.
- Remove the `ReplayCodec` import and the decode try/catch.

### 2. Delete `src/utils/replay-codec.ts`

Its only consumer is the route above.

### 3. Remove dependencies

- `package.json`: remove `fflate` and `jsoncrush` from `dependencies`.
- Refresh `yarn.lock` (e.g. `yarn install`) so the lockfile drops them.

### 4. Remove the jsoncrush plumbing

- `next.config.mjs`: drop `"jsoncrush"` from `transpilePackages`.
- `src/tests/jest.config.js`: drop the jsoncrush ESM comment and change
  `transformIgnorePatterns` back to the default (no jsoncrush exception).

### 5. Update tests — `src/tests/api.hiscore.test.ts`

- Replace `ReplayCodec.encode(...)` bodies with plain bodies carrying params, e.g.
  `state=<opaque>&score=150&v=1` (the `state` value no longer needs to be valid).
- Add a case for missing/invalid `score`/`v` → 400.
- Remove the legacy JSONCrush test and the `jsoncrush` / `ReplayCodec` imports.

### 6. Checks

`yarn prettify && yarn lint && yarn test`

## Changes — client (`../billiards`)

### 1. `src/view/link-formatter.ts`

In `getHiScoreUri`, append the two params to the returned URL:

```
&score=<score>&v=1
```

(`state.score` is already set to `score`, so the replay content is unchanged.)

### 2. Verify every upload entry point sends the params

- `LinkFormatter.getHiScoreUri` — updated above.
- `BrowserContainer.offerUpload()` links with raw `location.search`. Confirm that
  page's query always contains `score`/`v`, or route it through `getHiScoreUri`.

### 3. Keep fflate/jsoncrush in the client

Nothing to remove here — `ReplayCodec.encode` still needs `fflate`, and the legacy
`JSONCrush` decode fallback is only relevant to the client. If the fallback is no
longer wanted, that is a separate cleanup and out of scope.

### 4. Update tests — `test/view/link-formatter.spec.ts`

The "include score" test currently decodes the blob. Change it to assert the
`score` and `v` query params instead of `ReplayCodec.decode`.

### 5. Checks

`yarn prettify && yarn lint && yarn test`

## Rollout order

The two projects deploy separately, and old client bundles will not send the new
params. Deploy **client first**, then the scoreboard, so uploads keep working through
the transition. If a hard cutover is acceptable, deploy in either order and accept
that clients lacking `score`/`v` get a 400.

## Notes / non-goals

- The score was never validated against the replay, so moving it to a param does not
  weaken or strengthen integrity — it stays client-trusted.
- The blob still needs compression in the client for URL/body size; only the
  scoreboard stops decoding.
