# Recommendations to Reduce Edge Invocation Count

To stay within Vercel's free tier limits for Edge Function invocations, the following changes are recommended for the `billiards` repository. These recommendations focus on consolidating requests, utilizing Incremental Static Regeneration (ISR), and optimizing client-side fetching patterns.

## 1. Implement ISR for the Leaderboard Page
**Current State:** `src/pages/leaderboard.tsx` is a client-side page that triggers three separate edge invocations (one for each game type: Snooker, 9-Ball, and Three-Cushion) via `LeaderboardTable` components.
**Recommendation:**
- Add `getStaticProps` to `src/pages/leaderboard.tsx` to fetch all leaderboard data at build/revalidation time (using the same logic as `src/pages/game.tsx`).
- Pass the fetched data as props to the `LeaderboardTable` components to avoid client-side fetches on initial load.
- Set a reasonable `revalidate` interval (e.g., 60 seconds) to keep the data fresh while significantly reducing invocations.

## 2. Consolidate Data Fetching with Composition Patterns
**Current State:** Multiple components (`HighscoreGrid`, `LeaderboardTable`) may trigger redundant fetches if not properly hydrated with initial data.
**Recommendation:**
- Use a **Data Provider Pattern**: Create a `LeaderboardProvider` that fetches all leaderboard data once (using `/api/rank?ruletype=all`) and shares it via React Context.
- Refactor `LeaderboardTable` and `HighscoreGrid` to consume data from this provider instead of each calling their own hooks (`useLeaderboard`, `useAllLeaderboards`).
- This ensures that even if multiple components need the same data, only one Edge invocation is made.

## 3. Batch or Sample Usage Metrics
**Current State:** The `markUsage` utility in `src/utils/usage.ts` sends a PUT request to `/api/usage/[metric]` for every event (e.g., every time a user enters the lobby).
**Recommendation:**
- **Batching:** Collect usage metrics in a client-side queue and send them in a single batch request every 30-60 seconds or when the user leaves the page.
- **Sampling:** For high-frequency events like `lobby`, implement a sampling rate (e.g., only record 10% of lobby entries) to reduce the total number of Edge invocations.

## 4. Optimize API Runtimes
**Current State:** All API routes in `src/pages/api/` are currently configured with `runtime: "edge"`.
**Recommendation:**
- Evaluate which API routes actually require the low latency of the Edge runtime.
- Routes such as `/api/client-error`, `/api/logs`, and `/api/shorten` might be suitable for the standard Node.js runtime. Moving them would shift their execution away from the Edge invocation quota.

## 5. Refine Client-Side Polling
**Current State:** Hooks like `useLeaderboard` and `useMatchHistory` may implement polling to keep data updated.
**Recommendation:**
- Increase the polling interval for non-critical data.
- Use `stale-while-revalidate` headers (which are already partially implemented) more aggressively to allow the CDN to serve cached data, reducing the number of times the Edge Function is actually executed.
- Ensure that client-side polling only occurs when the tab is active to avoid wasted invocations.
