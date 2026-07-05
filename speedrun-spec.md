# Speedrun Leaderboard API Spec

## Overview

Create a new Next.js API endpoint `/api/speedrun-results` for maintaining a speedrun leaderboard. Minimise bandwidth, KV reads/writes, and compute. The project already has Vercel KV configured and similar leaderboard APIs — keep the style consistent.

**This is a brand-new endpoint, not an update to an existing one.**

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Architecture | Inline KV calls in handler (no service class) | Follows elo.ts pattern; simpler, fewer files |
| CORS | None in the handler | Follows elo.ts pattern; CORS handled at Vercel reverse-proxy level |
| Validation | None on POST | Trust the client |
| Caching | `public, s-maxage=30` | Follows elo.ts pattern |
| Testing | API-level only (no service class tests) | Follows api.match-results.test.ts pattern |
| Tiebreaking | Keep both entries if timeSec is equal | Don't evict a tied entry; evict the next-worst instead |
| State on eviction | Skip saving replay state if entry doesn't make top 3 | Avoids unnecessary KV writes |
| POST response shape | Return the updated position's entries | Client sees the new state of that position |

## Storage Design

Do **not** store the replay `state` inside the leaderboard entries.

Use exactly **two KV keys**:

### Key 1: `speedrun-leaderboard`

Type: plain JSON string stored via `kv.set`/`kv.get`.

Contains only lightweight metadata, grouped by `positionId`.

```json
{
  "nineball-break": [
    {
      "id": "abc123",
      "playerName": "Alice",
      "timeSec": 12.45,
      "ruleType": "nineball",
      "date": "2026-07-04T12:00:00Z"
    },
    {
      "id": "def456",
      "playerName": "Bob",
      "timeSec": 13.18,
      "ruleType": "nineball",
      "date": "2026-07-04T12:05:00Z"
    }
  ],
  "another-position": [...]
}
```

Only retain the **fastest 3 entries per position**. Sort ascending by `timeSec`.

**Tiebreaking rule**: If multiple entries have the same `timeSec`, keep both entries (allow >3 entries in that position temporarily) rather than evicting a tied entry. Evict the next-worst (4th distinct time) instead. This avoids losing valid entries due to ties.

### Key 2: `speedrun-states`

Type: plain JSON string stored via `kv.set`/`kv.get`.

Contains only replay states keyed by result id.

```json
{
  "abc123": "crushed replay string...",
  "def456": "crushed replay string..."
}
```

There will only ever be around 8 positions with a maximum of 3 results each (roughly 24 entries total), so storing each key as a single JSON document is acceptable and keeps the KV namespace tidy.

## Files to Create

- `src/pages/api/speedrun-results.ts` — handler for `GET` and `POST` on `/api/speedrun-results`
- `src/pages/api/speedrun-results/[id].ts` — handler for `GET /api/speedrun-results/{id}`
- `src/tests/api.speedrun-results.test.ts` — API-level tests

## API Endpoints

### POST /api/speedrun-results

**Input** (JSON body):

```json
{
  "positionId": "nineball-break",
  "playerName": "Alice",
  "timeSec": 12.45,
  "ruleType": "nineball",
  "state": "crushed replay string..."
}
```

No validation — trust the client. All fields are passed through as-is.

**Implementation:**

1. Generate a unique id using `getUID()` from `@/utils/uid`.
2. Read `speedrun-leaderboard` from KV (via `kv.get`, parsing JSON). Default to `{}` if not set.
3. If the position doesn't exist, initialize it as an empty array.
4. Insert the new metadata entry: `{ id, playerName, timeSec, ruleType, date: new Date().toISOString() }`.
5. Sort that position's entries by `timeSec` ascending.
6. If two entries have the same `timeSec`, keep both — only evict beyond 3 distinct times.
7. Identify entries evicted from the top positions. For each evicted entry:
   - Remove its replay state from the `speedrun-states` object.
8. Save the updated leaderboard back to KV (`kv.set`).
9. Save the updated states back to KV (`kv.set`).
10. **Only save the replay state** if the new entry remains in the top positions after eviction.
11. Return the updated position's entries as JSON with status 201. Headers include `Cache-Control: private, no-cache` (so CDN doesn't cache POST responses).

**Response** (status 201):

Returns the full updated array of entries for that position (after sort/eviction):

```json
[
  {
    "id": "abc123",
    "playerName": "Alice",
    "timeSec": 12.45,
    "ruleType": "nineball",
    "date": "2026-07-04T12:00:00Z"
  },
  {
    "id": "def456",
    "playerName": "Bob",
    "timeSec": 13.18,
    "ruleType": "nineball",
    "date": "2026-07-04T12:05:00Z"
  }
]
```

**Error handling:** Return 500 with plain text "Internal Server Error" on unexpected failures.

### GET /api/speedrun-results

Read only `speedrun-leaderboard` from KV. Do **not** touch `speedrun-states`.

Flatten all grouped entries into a flat array, adding `positionId` to each entry.

**Response:**

```json
[
  {
    "id": "abc123",
    "playerName": "Alice",
    "timeSec": 12.45,
    "ruleType": "nineball",
    "date": "2026-07-04T12:00:00Z",
    "positionId": "nineball-break"
  },
  {
    "id": "def456",
    "playerName": "Bob",
    "timeSec": 13.18,
    "ruleType": "nineball",
    "date": "2026-07-04T12:05:00Z",
    "positionId": "nineball-break"
  }
]
```

**Headers:** `Cache-Control: public, s-maxage=30`

**No filtering** by positionId — always return all positions.

**Error handling:** Return 500 with plain text "Internal Server Error" on unexpected failures.

### GET /api/speedrun-results/{id}

1. Read `speedrun-leaderboard` from KV.
2. Iterate all positions to find the entry whose `id` matches the URL param.
3. If not found, return **404 Not Found** (plain text).
4. Read `speedrun-states` from KV.
5. Retrieve the replay state string for that id.
6. Construct the replay URL:
   - Base: `GAME_BASE_URL` from `@/config`
   - Query params: `ruletype=<entry.ruleType>&state=<replayState>`
7. Return a **307 Temporary Redirect** to the constructed URL (same pattern as match-replay.ts).

**Headers:** `Cache-Control: private, no-cache`

## Implementation Style

Follow the existing patterns in the codebase:

- **Edge runtime**: `export const config = { runtime: "edge" }`
- **NextRequest**: Import from `next/server`
- **KV**: Import `kv` from `@vercel/kv`
- **UID**: Import `getUID` from `@/utils/uid`
- **Config**: Import `GAME_BASE_URL` from `@/config`
- **Logger**: Import `logger` from `@/utils/logger` for error logging
- **Response**: Use `Response.json()` for JSON and `new Response()` for plain text/errors
- **No CORS headers**: CORS is handled at the Vercel reverse-proxy level; do NOT use `corsJson`/`corsResponse` in this endpoint

## Testing

Create `src/tests/api.speedrun-results.test.ts` following the pattern in `api.match-results.test.ts`:

- Mock KV with the existing mockkv
- Test GET returns flattened leaderboard with correct shape
- Test POST adds entry, returns updated position
- Test POST evicts 4th+ entries
- Test POST cleans up evicted replay states
- Test GET /{id} returns 404 for missing id
- Test GET /{id} redirects to replay URL for valid id
- Test method not allowed (PUT, DELETE, etc.)

## Goals

- Only **two KV keys**.
- Leaderboard fetches never download replay state.
- Replay data is only loaded when a replay is requested.
- Low bandwidth.
- Low KV compute.
- Consistent with existing codebase patterns.
