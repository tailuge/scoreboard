# Match History Replay Badge Plan

## Objective
Add a small blue 'replay' badge to the Match History list for games that have associated replay data. Clicking the badge should redirect the user to the game replay viewer.

## Analysis
- **Data Source**: `MatchResult` has a `hasReplay` boolean field.
- **Data Retrieval**: `MatchResultService` retrieves the raw replay blob using `getMatchReplay(id)`.
- **Viewer URL**: The external viewer is located at `https://tailuge.github.io/billiards/dist/`. The replay blob is appended to this URL.
- **Current State**: `src/pages/api/match-replay.ts` currently returns the raw text of the replay data. It needs to be updated to redirect to the viewer instead, mimicking the behavior of the `Shortener` service.

## Implementation Steps

### 1. Backend Changes (`src/pages/api/match-replay.ts`) (Completed)
Modify the endpoint to redirect to the viewer instead of returning the raw data.
- **Action**: Update the handler to:
  1. Retrieve `replayData` using `MatchResultService.getMatchReplay(id)`.
  2. If found, construct the redirect URL: `https://tailuge.github.io/billiards/dist/` + `replayData`.
  3. Return `Response.redirect(url)`.
  4. If not found, return a 404 response (or redirect to a generic Not Found page if preferred, but 404 is standard for APIs).
- **Note**: This changes the API contract from returning data to returning a redirect. This is intended as the badge is a direct link for the user.

### 2. Frontend Changes (`src/components/MatchResultCard.tsx`) (Completed)
Add the visual badge to the match card.
- **Action**:
  - In `MatchResultCardComponent`, check if `result.hasReplay` is true.
  - If true, render a "REPLAY" badge.
  - **Link Destination**: `/api/match-replay?id=${result.id}`.
  - **Styling**:
    - Blue background (`bg-blue-600`), white text (`text-white`).
    - Small text (`text-[10px]` or `text-xs`), rounded (`rounded`), padding (`px-1.5 py-0.5`).
    - Place it near the timestamp or scores.

### 3. Test Updates (`src/tests/api.match-replay.test.ts`) (Completed)
Update the tests to reflect the new redirect behavior.
- **Action**:
  - Modify "should return replay data on GET request" to "should redirect to viewer on GET request".
  - Verify that the response status is 307 (Temporary Redirect) or 302.
  - Verify the `Location` header contains the correct viewer URL with the blob.

## Verification
1.  **Run Tests**: Execute `yarn jest src/tests/api.match-replay.test.ts` to ensure the API behaves as expected.
2.  **Manual Check**:
    -   Start the dev server.
    -   Ensure a match with replay data exists (or seed one).
    -   Go to the Lobby.
    -   Click the "REPLAY" badge.
    -   Verify redirection to `tailuge.github.io`.

## Live Badge Implementation Plan

### Objective
Display currently active games ("Live") prominently in the Lobby, separate from historical match results, allowing users to easily spectate ongoing matches.

### Strategy
Use a **Two-Component Approach**:
1.  **`LiveMatchesList`**: A new component dedicated to showing active games (`Table` objects).
2.  **`MatchHistoryList`**: The existing component for completed games (`MatchResult` objects).

These will be stacked vertically in the Lobby's right-hand column, with Live Games on top.

### Implementation Stages

#### Stage 1: Create `LiveMatchesList` Component
-   **File**: `src/components/LiveMatchesList.tsx`
-   **Props**:
    -   `tables`: `Table[]` (Active tables from `useLobbyTables`)
    -   `onSpectate`: `(tableId: string) => void`
-   **Logic**:
    -   Filter `tables` to show only active games (e.g., 2 players, not completed).
    -   Map each table to a card/row that **identically matches** the structure and styling of `MatchResultCard`.
    -   **Visuals**:
        -   **Layout**: Reuse the exact classes and layout from `MatchResultCard` (flex container, border, spacing, font sizes).
        -   **Content**:
            -   Player 1 vs Player 2 (instead of Winner vs Loser).
            -   Timestamp formatting identical to history.
        -   **Badge**:
            -   Show a **small red "LIVE" badge**.
            -   **Style**: `bg-red-600 text-white uppercase font-semibold tracking-wide leading-none rounded-sm`.
            -   **Dimensions**: Match existing badge: `text-[9px] px-1.5 py-0.5`.
    -   **Action**: Clicking the badge (or the card) triggers `onSpectate`.
    -   **Empty State**: If no active games, render nothing.

#### Stage 2: Integrate into Lobby
-   **File**: `src/pages/lobby.tsx`
-   **Action**:
    -   Import `LiveMatchesList`.
    -   Pass the existing `tables` data from `useLobbyTables` hook to the new component.
    -   Pass the existing `handleSpectate` function.
    -   Render `<LiveMatchesList />` **above** `<MatchHistoryList />` in the layout.

#### Stage 3: Visual Polish & Verification
-   **Styling**:
    -   Ensure the "LIVE" badge visually balances with the "REPLAY" badge.
    -   Confirm that `LiveMatchesList` and `MatchHistoryList` look like a cohesive unit when stacked.
-   **Verification**:
    -   Create a game in a separate tab/window.
    -   Verify it appears in the `LiveMatchesList` of the main window.
    -   Click "LIVE" badge and verify it opens the game in spectator mode.
