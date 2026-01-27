# Recommendations

## Lobby Page Refactoring (`src/pages/lobby.tsx`)

### 1. Extract Data Fetching and Real-time Updates into `useLobbyTables`
**Status: DONE**
The lobby page currently manages table state, API calls for joining/spectating/creating, and Nchan subscriptions. This logic is intertwined with UI concerns.
- **Action:** Create a `useLobbyTables` hook to encapsulate `tables` state, `fetchTables`, and the `NchanSub` lifecycle.
- **Benefit:** Reduces component size, improves testability, and separates side effects from rendering.

### 2. Decouple Auto-Join Logic
**Status: DONE**
The `useEffect` handling auto-join based on query parameters is complex and has many dependencies.
- **Action:** Extract this into a `useAutoJoin` hook.
- **Benefit:** Clarifies the intent of the logic and simplifies the main `Lobby` component's effect chain.

### 3. Improve Modal Trigger Logic
**Status: DONE**
The current `useEffect` that sets `modalTable` based on `tables` updates will re-trigger every time the table list refreshes, even if the user manually closed the modal.
- **Action:** Use a ref or a "dismissed" state to track if a modal has already been shown/closed for a specific table ID. Alternatively, move the modal trigger to be event-driven (e.g., triggered by the specific action that completes the player count) rather than purely state-driven from the entire list.

### 4. Optimize Table Actions
**Status: DONE**
`handleJoin` and `handleSpectate` rely on `tables` being in scope. If `tables` updates during the async `tableAction` call, the subsequent `find` might use stale data.
- **Action:** Ensure `tableAction` returns the updated table data from the API response instead of relying on a separate `fetchTables` call and searching the local state.