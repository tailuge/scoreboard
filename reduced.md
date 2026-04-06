# Project Transformation: No SSR Architecture

This report outlines the strategy to transform the Billiards Scoreboard project into a pure client-side architecture ("No SSR"). The primary goals are to eliminate server-side CPU consumption (Fluid Active CPU) and minimize Edge Function invocations.

## 1. Current State Analysis

The project currently uses **Incremental Static Regeneration (ISR)** on the main lobby page (`src/pages/game.tsx`).

- **Entry Point**: `src/pages/game.tsx` implements `getStaticProps` with `revalidate: 60`.
- **Server Load**: Every 60 seconds (when active), Vercel executes the `getStaticProps` function on an Edge/Serverless instance to fetch:
    - Top 10 highscores for all game types (multiple KV calls).
    - Recent 50 match results (one KV call).
- **Edge Invocations**: Each revalidation counts as an invocation. Additionally, client-side hooks (`useAllLeaderboards`, `useMatchHistory`) fetch fresh data on mount if `initialData` is stale or missing.

## 2. Transition to No SSR (Static Export)

To completely remove server-side execution for page rendering, the following steps are recommended:

### A. Remove `getStaticProps` from `src/pages/game.tsx`
- Delete the `getStaticProps` function.
- Update the `Game` component to no longer expect `initialHighscores` and `initialMatchResults` as props.
- **Impact**: The component will mount with empty states, and the existing `useEffect` in `useAllLeaderboards` and `useMatchHistory` will automatically trigger client-side fetches.

### B. Enable Static Export in `next.config.mjs`
- Add `output: 'export'` to the `nextConfig` object.
- **Impact**: Next.js will generate a collection of static HTML/JS/CSS files that can be served directly from the Vercel CDN (Global Edge Network) without any compute overhead for routing or rendering.

### C. Handle Dynamic Routes & Redirects
- Since `output: 'export'` does not support Next.js `redirects` in `next.config.mjs` at the Edge level, these must be moved to `vercel.json` or handled via client-side meta tags/scripts in `_document.tsx`.

## 3. Minimizing Edge Calls

While No SSR reduces compute during page load, the client still needs to fetch data from API routes (which are Edge Functions). To minimize these:

- **Aggressive Caching**: Ensure all GET API routes (e.g., `/api/rank`, `/api/match-results`) use optimized `Cache-Control` headers:
    ```http
    Cache-Control: public, s-maxage=60, stale-while-revalidate=30
    ```
    This allows the Vercel Edge Network to serve cached JSON responses, preventing the Edge Function from executing for every client request.
- **SWR (Stale-While-Revalidate)**: Implement a client-side fetching library like `swr` or `react-query`. This ensures that data is cached in the browser and only revalidated when necessary, reducing redundant network requests as users navigate between "Lobby" and "Leaderboard".
- **Local Storage Fallbacks**: For semi-static data like "Top Scores", the client can cache the last successful fetch in `localStorage` to provide an instant UI on subsequent visits.

## 4. Expected Impact

| Metric | Current (ISR) | Target (No SSR + Caching) |
| :--- | :--- | :--- |
| **Fluid Active CPU** | Consumed every 60s per page | **Zero** (Pages served as static assets) |
| **Edge Invocations** | Page Revalidation + Client Fetches | Client Fetches only (Heavily cached) |
| **Time to First Byte** | ~50-100ms (Revalidation/Edge) | **<20ms** (CDN Static Asset) |

## 5. Implementation Note

**No code changes have been applied to the source files in this PR.** This document serves as the technical blueprint for the transformation. Transitioning to `output: 'export'` would require a separate PR once environmental dependencies (like API route hostnames) are confirmed for a static environment.
