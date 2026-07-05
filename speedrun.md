# Speedrun Leaderboard API Spec

Update the existing Next.js API implementation for `/api/speedrun-results` to minimise bandwidth, KV reads/writes and compute. The project already has Vercel KV configured and similar leaderboard APIs, so keep the style consistent.

## Storage design

Do **not** store the replay `state` inside the leaderboard entries.

Instead use exactly **two KV keys**:

### Key 1: `speedrun-leaderboard`

Contains only lightweight metadata, grouped by `positionId`.

Example:

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
  "another-position": [
    ...
  ]
}
```

Only retain the **fastest 3 entries per position**. Sort ascending by `timeSec`.

### Key 2: `speedrun-states`

Contains only replay states keyed by result id.

Example:

```json
{
  "abc123": "crushed replay string...",
  "def456": "crushed replay string..."
}
```

There will only ever be around 8 positions with a maximum of 3 results each (roughly 24 entries total), so storing each key as one JSON document is acceptable and keeps the KV namespace tidy.

## POST /api/speedrun-results

Input remains unchanged:

```json
{
  "positionId": "...",
  "playerName": "...",
  "timeSec": 12.45,
  "ruleType": "...",
  "state": "..."
}
```

Implementation:

1. Generate a unique id.
2. Load `speedrun-leaderboard`.
3. Insert the new metadata entry.
4. Sort that position by `timeSec`.
5. Keep only the fastest three.
6. If an entry is evicted from the top three, also delete its replay state from `speedrun-states`.
7. Save the updated leaderboard.
8. Save the replay state into `speedrun-states` using the generated id.
9. Return the metadata object (same API contract as today).

## GET /api/speedrun-results

Read only `speedrun-leaderboard`.

Flatten all grouped entries into the existing flat array response.

Do **not** touch `speedrun-states`.

This endpoint should be a single KV read with a very small response payload.

## GET /api/speedrun-results/{id}

1. Read `speedrun-leaderboard`.
2. Locate the metadata entry by id.
3. Read `speedrun-states`.
4. Fetch the corresponding replay state.
5. Construct `replayUrl` from the stored state and known game base URL.
6. Return the existing response shape.

## Goals

- Only **two KV keys**.
- Leaderboard fetches never download replay state.
- Replay data is only loaded when a replay is requested.
- Low bandwidth.
- Low KV compute.
- Preserve the existing REST API contract so no client changes are required.
