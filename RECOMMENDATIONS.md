# Code Review Recommendations - Components Directory

This document outlines key findings and recommendations for the components in `src/components`.

## High Priority Issues

### 1. Missing Error Handling in API Calls (`CreateTable`, `LeaderboardTable`)
Multiple components use `fetch` without checking `response.ok`. This leads to the UI assuming success even when the server returns an error.
- **Recommendation**: Always check `if (!response.ok)` after a fetch call and handle errors appropriately (e.g., showing a notification to the user).

### 2. Layout Shifts with Portal-based Overlays (`TableItem`)
In `table.tsx`, the `TableItem` returns `IFrameOverlay` when spectating. Since `IFrameOverlay` uses `createPortal` to `document.body`, the grid cell where the table was rendered becomes empty, causing a layout shift in the `TableList`.
- **Recommendation**: Render the `IFrameOverlay` alongside the table content or at the top level of the application, rather than replacing the component's internal UI with a portal.


## Medium Priority Issues

### 4. Polling Implementation in `MatchHistoryList`
Using `setInterval` for polling can lead to race conditions if requests take longer than the interval.
- **Recommendation**: Use a recursive `setTimeout` or a specialized hook like `useSWR` or `react-query` for more robust data fetching and polling.

### 5. Prop Drilling and State Management
Some components are passing down `userId` and `userName` through multiple levels.
- **Recommendation**: Consider using a User Context to provide these values to components that need them.

## Low Priority Issues

### 6. TypeScript Typings for Event Listeners
The `as any` cast in `CreateTable.tsx` for `removeEventListener` is a workaround for DOM typing discrepancies.
- **Recommendation**: While acceptable, a more typed approach using `EventListenerOrEventListenerObject` could be used.

### 7. Sorting in `TableList`
Sorting `tables` in `useMemo` is good, but `[...tables].sort(...)` creates a new array every time `tables` changes. If the list is large, this could be optimized, though for current scale it is fine.


✦ Change summary: Architectural and logic review of the components directory to identify potential bugs and improvement opportunities.

  The components generally follow a consistent structure, but there are several recurring issues regarding API error handling, layout stability when using portals, and event
  handling that should be addressed to improve robustness.

  File: src/components/createtable.tsx
  L23: [HIGH] Missing response validation in fetch call.
  The fetch call does not check if the response was successful (response.ok). If the server returns a 500 or 400 error, onCreate() will still be called, potentially leading to
  inconsistent UI state.

  Suggested change:

    1     try {
    2 -     await fetch("/api/tables", {
    3 +     const response = await fetch("/api/tables", {
    4         method: "POST",
    5         headers: { "Content-Type": "application/json" },
    6         body: JSON.stringify({ userId, userName, ruleType }),
    7       })
    8 +     if (!response.ok) throw new Error('Failed to create table')
    9       onCreate()
   10     } finally {

  File: src/components/table.tsx
  L113: [MEDIUM] Layout shift when spectating.
  Replacing the entire TableItem content with IFrameOverlay (which is a portal to document.body) will cause the table's grid cell in TableList to appear empty, leading to layout
  shifts or a broken grid appearance.

  Suggested change:

    1   if (isSpectating) {
    2     return (
    3 +     <>
    4 +       <div className={`table-card ${tableClass} ${isCreator ? "table-card-creator" : ""}`}>
    5 +         {/* Render a placeholder or the original table content while spectating */}
    6 +       </div>
    7         <IFrameOverlay
    8           target={spectatorUrl}
    9           onClose={handleCloseSpectate}
   10           title="Spectator Window"
   11         />
   12 +     </>
   13     )
   14   }

  File: src/components/LeaderboardTable.tsx
  L46: [LOW] Redundant navigation and potential event conflict.
  The handleRowClick navigates the entire page via globalThis.location.href, while the row also contains an <a> tag (L157) pointing to the same URL. This is redundant and
  clicking the link will trigger both.

  Suggested change:

   1 -   const handleRowClick = (id: string) => {
   2 -     const replayUrl = `/api/rank/${id}?ruletype=${ruleType}`
   3 -     globalThis.location.href = replayUrl
   4 -   }
   5 +   // Remove handleRowClick and rely on the <a> tag or vice-versa

  File: src/components/tablelist.tsx
  L16: [LOW] Ignored promise result.
  The handleJoin function awaits onJoin, but it doesn't use the returned boolean value to provide feedback or handle failure cases.

  Suggested change:

   1    const handleJoin = async (tableId: string) => {
   2 -    await onJoin(tableId)
   3 +    const success = await onJoin(tableId)
   4 +    if (!success) {
   5 +      // Handle join failure (e.g., table full)
   6 +    }
   7    }