# Plan: Live Online User Counts

## 1. Investigation Findings

### Current Mechanism
The application retrieves the online user count using the following flow:
1.  **Source**: The Nginx status page at `https://billiards-network.onrender.com/basic_status`.
2.  **Fetching Logic**: `src/nchan/nchanpub.ts` -> `get()` method fetches this page and parses the "Active connections" count using regex.
3.  **State Management**: `src/components/hooks/useServerStatus.ts` exposes this data via the `activeUsers` property.
    -   It polls this data on mount.
    -   It exposes `fetchActiveUsers` to manually refresh.
4.  **Live Updates**:
    -   `src/pages/lobby.tsx` subscribes to Nchan updates (`NchanSub`).
    -   When a "connected" message is received (published via `/api/connected`), it triggers `fetchActiveUsers` to update the count.

### Current Implementation Status
-   **Lobby (`lobby.tsx`)**: Already displays live user counts via the `ServerStatus` component (which uses `StatusIndicator`). It also instantiates `useServerStatus` directly to access `fetchActiveUsers` for the Nchan subscription callback.
-   **Game Selection (`game.tsx`)**: Currently displays a hardcoded value (`<OnlineCount count={3} />`). It does not fetch real data.

## 2. Implementation Plan

### Goal
Ensure both `lobby.tsx` and `game.tsx` display accurate, live online user counts using a shared, consistent mechanism.

### Step 1: Centralize Configuration
The status page URL is currently duplicated in `lobby.tsx` and hardcoded inside `NchanPub` class.
-   **Action**: Create a constant for the status URL (e.g., in `src/utils/constants.ts` or `src/config.ts`) to ensure `useServerStatus` and `NchanPub` rely on the same source of truth.

### Step 2: Implement in `game.tsx`
Replace the hardcoded value in the Game Selection screen.
-   **Action**:
    1.  Import `useServerStatus` in `src/pages/game.tsx`.
    2.  Call the hook: `const { activeUsers } = useServerStatus(STATUS_PAGE_URL)`.
    3.  Pass `activeUsers` to the `OnlineCount` component.
    4.  Handle the `null` state (loading) gracefully (e.g., show a spinner or nothing until loaded).

### Step 3: Refactor `lobby.tsx` (Optional Optimization)
`lobby.tsx` currently has a minor inefficiency: it calls `useServerStatus` at the top level *and* renders `<ServerStatus />` which also calls `useServerStatus`. This results in double fetching on load.
-   **Action**:
    -   Pass the `activeUsers` (and other state) from the top-level hook down to `<ServerStatus />` (modifying it to accept props instead of fetching internally) OR leave as is if the overhead is negligible (current path is simplest).
    -   Ensure the `NchanSub` subscription logic in `lobby.tsx` remains to keep the count "live".

### Step 4: Live Updates for `game.tsx` (Bonus)
Currently, `game.tsx` does not subscribe to Nchan updates like `lobby.tsx` does.
-   **Action**: If "live" updates are critical for the game selection screen (vs just "current on load"), replicate the `NchanSub` logic from `lobby.tsx` into `game.tsx` or wrap it into the `useServerStatus` hook itself to make it self-contained.
    -   *Recommendation*: Move the `NchanSub` logic *inside* `useServerStatus` (controlled by a flag or always on) so any component using the hook gets live updates automatically.

## 3. Summary of Changes
1.  **Extract** `STATUS_PAGE_URL` constant.
2.  **Update** `game.tsx` to use `useServerStatus`.
3.  **Refactor** `useServerStatus` to optionally handle `NchanSub` subscription (encapsulating the "live" aspect).
4.  **Verify** both pages show the same user count.
