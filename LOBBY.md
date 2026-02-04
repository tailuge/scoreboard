# Lobby Rework Plan

This plan outlines the steps to hide the "Create New Game" button in the lobby when there is a game currently waiting for an opponent.

## Objective
To improve matchmaking by encouraging players to join existing waiting tables instead of creating new ones, thereby reducing fragmentation in the lobby.

## Proposed Changes

### 1. Identify "Waiting" Tables
A table is considered "waiting" if:
- It has exactly **one player** (`players.length === 1`).
- It is **not completed** (`completed === false`).

### 2. Update `src/pages/lobby.tsx`
- Calculate a boolean `hasWaitingTable` by checking if any table in the `tables` array matches the "waiting" criteria.
- Use `useMemo` to optimize this calculation.
- Pass a `hidden` state or conditionally render the `CreateTable` component.

```tsx
const hasWaitingTable = useMemo(() =>
  tables.some(table => table.players.length === 1 && !table.completed),
  [tables]
);

// ... in JSX ...
{!hasWaitingTable && (
  <div className="flex justify-start items-center px-2">
    <CreateTable onCreate={fetchTables} />
  </div>
)}
```

### 3. Handle Timeouts
- Tables with 1 player have a **60-second timeout** of inactivity (defined as `TABLE_TIMEOUT` in `src/services/TableService.ts`).
- If a table is not joined within this minute, it will be automatically removed from the list by the server's `expireTables` logic.
- Once the waiting table is removed (or once it is joined and starts), the "Create New Game" button will automatically reappear in the lobby.

## Step-by-Step Implementation
1. Open `src/pages/lobby.tsx`.
2. Import `useMemo` from `react` if not already present.
3. Add the `hasWaitingTable` constant using `useMemo` based on the `tables` state.
4. Locate the `CreateTable` component inside the `GroupBox`.
5. Wrap the `CreateTable` container with a conditional check for `!hasWaitingTable`.
6. Save the file and verify the UI behavior:
   - Create a table and ensure the button disappears.
   - Wait 60 seconds (or join with another user) and ensure the button reappears.
