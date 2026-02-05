# Lobby Seeking Flow Plan

This plan outlines the improvements to the lobby to support a "seeking" state when a player is waiting for an opponent.

## Objective
Provide a better user experience when a player initiates a game search from the `/game` page. Instead of showing a static lobby with a redundant "Create Table" button, the lobby will show a progress spinner and handle timeouts gracefully.

## Proposed Changes

### 1. Simplify Lobby UI
- Remove the `CreateTable` component from `lobby.tsx`. Users should now initiate games from the `/game` page.
- This reduces UI clutter and centralizes game entry points.

### 2. Implement Seeking State
- Add a `seekingGameType` state to the `Lobby` component.
- When `useAutoJoin` triggers `handleFindOrCreate`, set `seekingGameType` to the requested game type.
- Display a spinner and a "Seeking [GameType] Opponent..." message when `seekingGameType` is active.

### 3. Handle Match Found
- The lobby already monitors `tables` for a table where `table.creator.id === userId` and `table.players.length === 2`.
- When this condition is met, the `PlayModal` opens.
- We should clear `seekingGameType` when the modal opens or when we detect a match.

### 4. Implement Timeout and Redirection
- If no opponent is found within a specific period (e.g., 45 seconds), the seeking state should time out.
- On timeout, show a brief message and redirect the user back to `/game`.

## Step-by-Step Implementation

### Phase 1: State Management [DONE]
1. Add `seekingGameType` (string | null) state to `Lobby` component.
2. Update `handleFindOrCreate` to set `seekingGameType`.
3. Add a `useEffect` to clear `seekingGameType` if a match is found (existing logic for `modalTable`).

### Phase 2: UI Updates [DONE]
1. Replace `<CreateTable />` with a conditional render:
   - If `seekingGameType` is set, show a spinner and status message.
   - Otherwise, show nothing (or a simplified "Select a game from the Game page" if appropriate, but the user wants it redundant).

### Phase 3: Timeout Logic [DONE]
1. Add a `useEffect` that starts a timer when `seekingGameType` is set.
2. If the timer reaches the limit, use `router.push('/game')`.
3. Ensure the timer is cleared if `seekingGameType` is cleared or the component unmounts.
4. Added server-side cleanup (delete table) on timeout or unmount.

### Phase 4: Verification
1. Navigate from `/game` to `/lobby` by clicking a game.
2. Verify the spinner appears.
3. Verify that joining from another tab opens the `PlayModal` and clears the spinner.
4. Verify that waiting for the timeout redirects back to `/game`.