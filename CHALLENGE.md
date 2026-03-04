# Challenge System Specification

Implement a peer-to-peer "Challenge" system using presence-based signaling and existing lobby matchmaking.

## 1. Inline User List Updates

In the `OnlineUsersPopover` component (`src/components/OnlineUsersPopover.tsx`):
- Add a small **Challenge** pill button next to each user in the list.
- **Action**: Clicking the button navigates the user to:
  `/lobby?opponentId=[ID]&opponentName=[NAME]`
  (Ensure existing URL parameters like `ruletype`, `reds`, or `raceTo` are preserved).

## 2. Lobby Screen Logic

Modify the Lobby route handler (`src/pages/lobby.tsx`):
- **Rule Selection**: If `opponentId` is present in the URL but `ruletype` is missing, display a selection modal for the game type (**Snooker**, **Nine Ball**, or **Three Cushion**).
- **Matchmaking**: Once a rule is selected, trigger the existing `findOrCreateTable` flow.
- **Presence Signal**: Extend the presence broadcast to include `opponentId` and `ruletype` **only after** a rule selection has been made.

- **Cancellation**: If the challenger leaves the lobby or cancels selection, broadcast a presence update with `opponentId: null` to clear the challenge state for the recipient.

## 3. Global Challenge Listener

In the main `Game` component (`src/pages/game.tsx`) or global presence hook:
- Update the presence listener to detect incoming challenges.
- **Detection**: If a presence message from any user has an `opponentId` matching the current user's ID:
    - Show a **Challenge Icon** (e.g., a sword or notification badge) next to the online user count.
    - If a subsequent message from the same sender has no `opponentId`, remove the icon.
- **Action**: Clicking the icon navigates the recipient to:
  `/lobby?ruletype=[incomingRuleType]&[otherParams]`

## Technical Alignment

- **Terminology**: Use `ruletype` (lowercase) for query parameters and presence fields to match existing conventions in `src/nchan/types.ts` and `GameGrid.tsx`.
- **Presence**: Update `PresenceMessage` in `src/nchan/types.ts` to include `opponentId?: string`.
- **Flow**: The lobby handles the actual table pairing; this system focuses on the signaling and navigation required to bring two players together.

## 4. External Challenge Acceptance

An external application can trigger a challenge acceptance by navigating the user to the lobby with specific query parameters. This triggers the automatic matchmaking flow.

**Endpoint**: `/lobby`

**Query Parameters**:
- `action=join` (Required): Triggers the automatic join logic in the lobby.
- `ruletype` (Required): The game type to join (`snooker`, `nineball`, or `threecushion`).
- `opponentId` (Required): The unique ID of the challenger to signal acceptance back via presence.
- `opponentName` (Optional): The display name of the challenger for UI consistency.

**Example URL**:
`/lobby?action=join&ruletype=snooker&opponentId=user-123&opponentName=Alice`
