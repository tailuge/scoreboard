# Performance Optimization Suggestions

Based on Vercel React Best Practices review.

## CRITICAL Priority

### 1. Add SWR for Data Fetching (`client-swr-dedup`)

The codebase does NOT use SWR - all data fetching uses raw `fetch()` with manual state management.

**Files to update:**

| File                                     | Line  | Current Pattern                    |
| ---------------------------------------- | ----- | ---------------------------------- |
| `src/components/LeaderboardTable.tsx`    | 18-34 | Fetch in useEffect without caching |
| `src/components/MatchHistoryList.tsx`    | 24-28 | Manual polling with setInterval    |
| `src/components/hooks/useLobbyTables.ts` | 27-29 | Fetch on mount pattern             |
| `src/pages/server-logs.tsx`              | 30-32 | Fetch on mount with empty deps     |

**Benefits of SWR:**

- Request deduplication
- Automatic revalidation
- Error retry with backoff
- Built-in caching

---

### 2. Add Abort Signal to Cleanup Fetch (`async-api-routes`)

**File:** `src/pages/lobby.tsx:114-125`

```tsx
// Current - potential memory leak
useEffect(() => {
  return () => {
    if (seekingTableIdRef.current) {
      fetch(`/api/tables/${seekingTableIdRef.current}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    }
  };
}, [userId]);
```

**Fix:** Add AbortController to cancel in-flight requests on unmount.

---

### 3. Fix LobbyContext Granularity (`rerender-dependencies`)

**File:** `src/contexts/LobbyContext.tsx:33`

Context updates on every nchan message, causing all consumers to re-render even if they only need specific data.

**Options:**

- Split context into smaller pieces
- Use selectors to prevent unnecessary re-renders
- Consider using `useSyncExternalStore` with selectors

---

## HIGH Priority

### 4. Memoize Components (`rerender-memo`)

| Component            | File                                    | Line    | Usage                            |
| -------------------- | --------------------------------------- | ------- | -------------------------------- |
| `GroupBox`           | `src/components/GroupBox.tsx`           | 11-38   | Recreates on every parent render |
| `LiveMatchesList`    | `src/components/LiveMatchesList.tsx`    | 14-66   | No memo, used frequently         |
| `LocationTimeBadge`  | `src/components/LocationTimeBadge.tsx`  | 13-46   | Used in lists                    |
| `PlayerMatchDisplay` | `src/components/PlayerMatchDisplay.tsx` | 9-42    | Used in lists                    |
| `GameButton`         | `src/pages/game.tsx`                    | 52-102  | Rendered in grid                 |
| `GameGrid`           | `src/pages/game.tsx`                    | 104-154 | Renders 6 game cards             |

---

### 5. Use useCallback for Handlers in Loops (`rerender-functional-setstate`)

**File:** `src/components/LiveMatchesList.tsx:29-41`

```tsx
// Current - new function for each table
{
  tables.map((table) => {
    const handleSpectate = async () => {
      onSpectate(table.id);
    };
    // ...
  });
}
```

**Fix:** Move handler outside map with `useCallback`, pass tableId as parameter.

---

### 6. Dynamic Imports for Heavy Components (`bundle-dynamic-imports`)

| Component          | Location                                    | Recommendation                                         |
| ------------------ | ------------------------------------------- | ------------------------------------------------------ |
| `PlayModal`        | `src/pages/lobby.tsx:4`                     | Conditionally rendered - could be dynamically imported |
| `LiveMatchesPanel` | `src/pages/game.tsx:15`, `lobby.tsx:3`      | Below-fold content - lazy load                         |
| `IFrameOverlay`    | `src/components/PlayModal.tsx`, `table.tsx` | Only needed when spectating                            |

---

## MEDIUM Priority

### 7. Hoist Functions Outside Components (`rendering-hoist-jsx`)

| File                                  | Line   | Issue                                      |
| ------------------------------------- | ------ | ------------------------------------------ |
| `src/components/LeaderboardTable.tsx` | 57-68  | `renderTrophy()` function inside component |
| `src/pages/tablelogs.tsx`             | 69-135 | `renderMessages()` recreates each render   |
| `src/components/MatchHistoryList.tsx` | 30-50  | `renderContent()` recreates each render    |

---

### 8. Memoize Expensive Computations (`js-cache-function-results`)

**File:** `src/components/LocationTimeBadge.tsx:22-24`

`countryCodeToFlagEmoji()` call could be wrapped in `useMemo` if expensive.

---

### 9. Lazy State Initialization (`rerender-lazy-state-init`)

**File:** `src/contexts/UserContext.tsx:35-41`

localStorage read could use function initialization for useState:

```tsx
// Current
const [userName, setUserName] = useState("");

// Better - only runs once
const [userName, setUserName] = useState(() => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("userName") || "";
});
```

---

### 10. Add localStorage Error Handling

**File:** `src/contexts/UserContext.tsx`

No error handling for localStorage (quota exceeded, private browsing).

---

## Already Good Patterns

| Pattern                        | File                                 | Line           |
| ------------------------------ | ------------------------------------ | -------------- |
| Dynamic import with ssr: false | `src/pages/api-doc.tsx`              | 6-8            |
| memo() with custom comparison  | `src/components/MatchResultCard.tsx` | 93-100         |
| memo() with version marker     | `src/components/table.tsx`           | 174-181        |
| useMemo for sorted data        | `src/components/tablelist.tsx`       | 28-31          |
| useCallback for handlers       | `src/components/tablelist.tsx`       | 18-26          |
| useMemo for context value      | `src/contexts/UserContext.tsx`       | 49-56          |
| Tree-shakeable imports         | Heroicons imports                    | Multiple files |

---

## Implementation Order

1. Add SWR package and migrate data fetching
2. Add abort signal to lobby.tsx cleanup
3. Memoize high-frequency components
4. Add dynamic imports for modals
5. Hoist static functions outside components
6. Add localStorage error handling
