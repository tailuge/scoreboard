# Bolt's Journal - Performance Learnings

## 2024-05-14 - Redundant Redis calls in TableService
**Learning:** The `getTables` method was calling `expireTables` (which performed an `hgetall`) followed by another `hgetall` for the actual data. In a serverless/edge environment, every extra Redis call adds significant latency and cost.
**Action:** Combined expiration and retrieval into a single `hgetall` pass. Processed expiration in memory and issued a non-blocking `hdel` for cleanup.

## 2024-05-14 - Unnecessary data fetching in MatchResultService
**Learning:** `zrange` with `0, -1` fetches the entire set even if the application only needs a small subset (e.g., top 50).
**Action:** Optimized `zrange` to use the requested limit when no server-side filtering (like `gameType`) is required.

## 2024-05-14 - React re-render cascades in the Lobby
**Learning:** The Lobby page updates frequently via Nchan subscriptions, causing the entire `TableList` and `MatchHistoryList` to re-render. Since `fetch` returns new object instances, default `React.memo` (shallow comparison) is insufficient.
**Action:** Implemented `React.memo` with custom comparison functions (using `lastUsedAt` for tables and `id` for match results) to skip re-renders even when object references change but data remains identical.
