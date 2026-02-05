# Lobby Improvement Plan

This plan outlines the improvements to `lobby.tsx` to support a better matchmaking experience, including a seeking spinner and automatic timeout redirection.

## Objective
To provide visual feedback when a user is waiting for an opponent and to streamline the lobby by removing redundant controls. Matches are now initiated from the `/game` page via query parameters.

## Phase 1: State and Logic
- **Seeking State**: Add a `seekingTableId` state (string | null) to `lobby.tsx` to track the table the user is waiting for.
- **Find or Create Flow**:
    - Update `handleFindOrCreate` to check the returned table's player count.
    - If `players.length === 1`, set `seekingTableId` to the table's ID.
    - If `players.length === 2`, show the `PlayModal` immediately.
- **Table Monitoring**:
    - Enhance the `useEffect` that monitors `tables` to track the `seekingTableId`.
    - If the table acquires a second player, show `PlayModal` and clear `seekingTableId`.
    - If the table is no longer present in the `tables` list (indicating a server-side timeout), redirect the user back to `/game`.

## Phase 2: UI Updates
- **Remove Redundant Button**: Delete the `CreateTable` component from `lobby.tsx`.
- **Seeking Spinner**:
    - When `seekingTableId` is set, display a loading spinner with a "Seeking Opponent..." message.
    - The `TableList` and other lobby elements should be hidden or dimmed during this state to focus on matchmaking.
- **Cancel Matchmaking**: Add a way to cancel the search, which clears `seekingTableId`.

## Phase 3: Verification
- Verify that users arriving from `/game?action=join&gameType=...` see the spinner.
- Verify that joining an existing table (2 players total) skips the spinner and shows the `PlayModal`.
- Verify that if no one joins within the timeout period, the user is redirected back to `/game`.
