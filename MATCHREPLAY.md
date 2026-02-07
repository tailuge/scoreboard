# Match Replay Storage Design

## Objective
Implement storage and retrieval for match replays associated with match results.
The solution must be bandwidth-efficient, only fetching replay data when requested, and maintaining the same 50-match rolling history as the existing service.

## Design

### 1. Data Model Updates
The `MatchResult` interface will be extended with an optional flag to indicate the presence of a replay.

```typescript
// src/types/match.ts
export interface MatchResult {
  id: string
  // ... existing fields ...
  hasReplay?: boolean // Indicates if a replay blob exists for this match
}
```

### 2. KV Storage Strategy
To save bandwidth, `replayData` is stored in separate keys rather than inside the `MatchResult` objects in the sorted set.

- **Match History**: `match_results` (Sorted Set)
  - Stores `MatchResult` objects (excluding the large `replayData` blob).
- **Replay Blobs**: `match_replay:{matchId}` (String)
  - Stores the URL-safe blob of text.

### 3. API Changes

#### `POST /api/match-results`
- Accepts an optional `replayData` string in the request body.
- If `replayData` is provided:
  - The service saves it to `match_replay:{id}`.
  - The `MatchResult` object is stored with `hasReplay: true`.

#### `GET /api/match-results`
- Continues to return the list of `MatchResult` objects.
- Since `replayData` is stored separately, the response size remains small.
- The `hasReplay` flag allows the UI to display a "Watch Replay" button.

#### `GET /api/match-replay?id={id}`
- A new endpoint to fetch the replay blob.
- Implementation: `kv.get("match_replay:" + id)`.

### 4. Cleanup Logic
The `MatchResultService` will be updated to ensure `match_replay:{id}` keys are deleted when their corresponding match result is trimmed from the history (keeping only the 50 most recent).

## Phased Implementation Plan

### Phase 1: Foundation (Types & Service Interface) ✅ Done
- Add `hasReplay?: boolean` to the `MatchResult` interface.
- Extend `MatchResultService.addMatchResult` to accept an optional `replayData` parameter.
- Define the new storage key pattern `match_replay:{id}`.

### Phase 2: Storage & Cleanup Logic ✅ Done
- Update `MatchResultService.addMatchResult` to:
  1. Save `replayData` to its own key if provided.
  2. Identify matches that are about to be evicted from the sorted set (beyond the 50 limit).
  3. Delete the `match_replay:{id}` keys for those evicted matches to prevent data leaks.

### Phase 3: API Integration
- Update `src/pages/api/match-results.ts` to pass `replayData` from the request body to the service.
- Create `/src/pages/api/match-replay.ts` to serve the replay data from KV.
- Ensure appropriate error handling if a replay is requested but not found.

### Phase 4: Verification
- Add unit tests to `src/tests/MatchResultService.test.ts` to verify:
  - Replay data is stored separately.
  - Replay data is cleaned up alongside match results.
  - Match history list does not contain the large blobs.
- Add integration tests for the new API functionality.
