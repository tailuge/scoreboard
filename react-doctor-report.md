# React Doctor Report

This report contains the findings from running `react-doctor` on the project root.

## Summary

**Score: 87 / 100 (Great)**

| Metric | Count |
| --- | --- |
| Errors (✗) | 9 |
| Warnings (⚠) | 34 |
| Files Affected | 26 / 143 |

### Key Issues Found

- **next/head in App Router**: 5 occurrences. Recommendation: Use the Metadata API instead.
- **fetch() inside useEffect**: 2 occurrences. Recommendation: Use a data fetching library (react-query, SWR) or server component.
- **Derived state in useEffect**: Compute during render instead.
- **Prefers-reduced-motion**: Missing handling for accessibility (WCAG 2.3.3).
- **Default prop values**: Avoid using `[]` as default prop values directly to prevent unnecessary re-renders.
- **Inline render functions**: 5 occurrences. Recommendation: Extract to separate components.
- **Client-side redirect in useEffect**: 2 occurrences. Recommendation: Use `redirect()` in a server component or middleware.
- **Complex state management**: Use `useReducer` for components with many `useState` calls or multiple `setState` calls in a single `useEffect`.
- **framer-motion optimization**: Use `LazyMotion` and `m` instead of `motion`.
- **Dead Code**: Several unused files, exports, and types detected.
- **Duplicate exports**: Multiple files have both named and default exports for the same component.

---

## Detailed Findings (Verbose Output)

### Errors (✗)

#### next/head is not supported in the App Router
- `src/pages/index.tsx: 4`
- `src/pages/lobby.tsx: 9`
- `src/pages/game.tsx: 1`
- `src/pages/leaderboard.tsx: 2`
- `src/pages/_app.tsx: 4`

#### fetch() inside useEffect
- `src/components/LeaderboardTable.tsx: 18`
- `src/pages/lobby.tsx: 138`

#### Derived state in useEffect
- `src/components/User.tsx: 11`

#### Prefers-reduced-motion handling
- `package.json`

### Warnings (⚠)

#### Default prop value [] creates a new array reference
- `src/components/MatchHistoryList.tsx: 15`

#### Inline render function
- `src/components/MatchHistoryList.tsx: 58`
- `src/components/RecentGamesList.tsx: 59`
- `src/components/LeaderboardTable.tsx: 118`
- `src/pages/server-logs.tsx: 79`
- `src/pages/tablelogs.tsx: 144`

#### Client-side redirect in useEffect
- `src/pages/index.tsx: 10`
- `src/pages/lobby.tsx: 129`

#### Component "Lobby" has 5 useState calls
- `src/pages/lobby.tsx: 15`

#### 4 setState calls in a single useEffect
- `src/pages/lobby.tsx: 100, 120`
- `src/contexts/LobbyContext.tsx: 41`
- `src/contexts/UserContext.tsx: 32`

#### Import "m" with LazyMotion instead of "motion"
- `src/components/LogoSection.tsx: 2`

#### Unused file (3)
- `public/leaderboard.css`
- `public/usage.css`
- `src/tests/seed-db.mjs`

#### Unused export (9)
- `src/tests/mockkv.ts`
- `src/contexts/LobbyContext.tsx`
- `src/components/User.tsx`
- `src/components/MatchHistoryList.tsx`
- `src/tests/mockData.ts`
- `src/components/MatchResultCard.tsx`
- `src/services/MatchResultService.ts`
- `src/utils/game.ts`

#### Unused type (4)
- `src/nchan/types.ts`
- `src/components/GameButtons.tsx`

#### Duplicate export (4)
- `src/components/User.tsx`
- `src/components/MatchHistoryList.tsx`
- `src/components/BallIcon.tsx`
- `src/components/MatchResultCard.tsx`
