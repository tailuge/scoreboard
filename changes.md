# Recommendations to Optimize Vercel Resource Usage

To stay within Vercel's free tier limits, it is important to distinguish between **Edge Function Invocations** (500,000 per month) and **Serverless Function Executions** (100,000 per month). Currently, most API routes in this repository use the Edge runtime.

This document focuses on reducing the invocation count for `game.tsx` and background reporting systems.

## 1. Optimize `game.tsx` (Lobby Page)
The lobby page is the primary entry point and currently utilizes Incremental Static Regeneration (ISR).

### 1.1 Increase ISR Revalidation Interval
- **Current State:** `src/pages/game.tsx` has `revalidate: 15`, meaning every 15 seconds, a request to the lobby can trigger a background regeneration (one Edge invocation per game type for highscores, plus one for match results).
- **Recommendation:** Increase `revalidate` to 60 or 120 seconds. Since the lobby also uses client-side hooks to fetch the latest data after hydration, the impact on user experience is minimal, but the background invocation overhead is reduced by 75-80%.

### 1.2 Batch or Sample Usage Metrics
- **Current State:** `markUsage("lobby")` is called immediately upon entry in `game.tsx`. This triggers a PUT request to `/api/usage/lobby` (an Edge invocation).
- **Recommendation:**
    - **Sampling:** Only call `markUsage("lobby")` for a percentage of users (e.g., 10%) if exact counts are not required.
    - **Batching:** Buffer usage events (`lobby`, `createTable`, `joinTable`) in a client-side queue and send them as a single POST request to a consolidated endpoint when the user navigates away or after a set interval.

## 2. Refine Background Reporting
### 2.1 Consolidate `ClientErrorReporter`
- **Current State:** `ClientErrorReporter` in `src/errors/ClientErrorReporter.ts` flushes the error queue every 5,000ms using `setInterval`. Each flush is an Edge invocation to `/api/client-error`.
- **Recommendation:**
    - Increase the `flushIntervalMs` to 30,000ms or more.
    - Errors are non-critical for the user experience; longer intervals drastically reduce background invocations for long-lived sessions.

## 3. Verify Polling and Data Fetching
- **Confirmation:** A review of `src/components/hooks` confirms that `useLeaderboard`, `useAllLeaderboards`, and `useMatchHistory` **do not** implement automatic `setInterval` polling. They fetch data once upon mounting (if `initialData` is missing).
- **Consolidation:** While they don't poll, the `HighscoreGrid` in `game.tsx` currently triggers a fetch for all leaderboards if ISR data is missing. Ensuring the ISR data is always present (by increasing revalidation time and handling KV misses gracefully) prevents these fallback invocations.

## 4. Optimize API Runtimes
- **Recommendation:** Not all routes benefit from the Edge runtime. Non-latency-sensitive routes like `/api/client-error`, `/api/logs`, and `/api/usage` should be evaluated for the standard Serverless runtime (Node.js) to move their execution away from the Edge invocation quota, although this still counts against the 100k Serverless execution limit.
