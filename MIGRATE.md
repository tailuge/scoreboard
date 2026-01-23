# Migration Plan: Leaderboard

This document outlines the steps to migrate `public/leaderboard.html` (vanilla HTML/JS) to a React page in the Next.js application.

## 1. Type Definitions

Create a new type definition file `src/types/leaderboard.ts` to define the shape of the leaderboard data.

```typescript
export interface LeaderboardItem {
  id: string;
  name: string;
  score: number;
  likes: number;
}
```

## 2. Component Creation

Create a reusable component `src/components/LeaderboardTable.tsx` to render a single leaderboard table.

**Functionality:**
-   Accepts props: `title` (string), `ruleType` (string), `gameUrl` (string).
-   Fetches data from `/api/rank?ruletype={ruleType}` on mount (or receives data as props). *Recommendation: Fetch in the parent page or use SWR/React Query.*
-   Renders the table structure.
-   Handles the "Like" button functionality (PUT request to `/api/rank/{id}?ruletype={ruleType}`).
-   Renders the trophy icons based on rank (index).
-   Uses Tailwind CSS for styling, mimicking `public/leaderboard.css`.

**Tailwind Mapping (Approximate):**
-   `.leaderboard` -> `bg-white p-2.5 rounded shadow-md flex-1 min-w-[300px]`
-   `th`, `td` -> `p-1 text-left border-b border-gray-200`
-   `.like-button` -> `inline-flex items-center bg-white text-blue-600 border border-blue-200 rounded-full px-2.5 py-1 text-xs cursor-pointer hover:bg-blue-50 transition-colors ml-2`

## 3. Page Implementation

Create `src/pages/leaderboard.tsx`.

**Structure:**
-   Import `LeaderboardTable`.
-   Layout container (`div.leaderboards`) with `flex flex-wrap gap-5 justify-start p-5`.
-   Render three instances of `LeaderboardTable` for:
    1.  **Snooker**: `ruletype="snooker"`, Link: `https://tailuge.github.io/billiards/dist?ruletype=snooker`
    2.  **9-Ball**: `ruletype="nineball"`, Link: `https://tailuge.github.io/billiards/dist`
    3.  **Three Cushion**: `ruletype="threecushion"`, Link: `https://tailuge.github.io/billiards/dist?ruletype=threecushion`

## 4. Tasks

- [ ] Create `src/types/leaderboard.ts`.
- [ ] Create `src/components/LeaderboardTable.tsx` with Tailwind styling.
- [ ] Create `src/pages/leaderboard.tsx` and integrate the components.
- [ ] Verify functionality (data loading, likes, links).
- [ ] Remove `public/leaderboard.html`.
- [ ] Remove `public/leaderboard.css` (if no longer used).

## 5. Future Considerations

-   "Top 3 from each category in the game page" (User Request). This component should be designed to be reusable so it can be embedded in the game page later, possibly with a `limit` prop to show only the top 3.
