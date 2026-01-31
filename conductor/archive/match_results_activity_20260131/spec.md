# Specification: Match Results Activity Feed

## Overview
Enhance the `game.tsx` page to display recent match activity within the "2-Player Online" section, mirroring the layout of the "Highscore Challenge" section. Additionally, upgrade the `MatchResultService` to support recording and displaying 1-player (solo) results.

## Functional Requirements
1.  **Data Model Update:**
    *   Update the `MatchResult` interface to make `loser` and `loserScore` optional.
    *   A 1-player result is identified by the absence of a `loser`.
2.  **Service & API Enhancements:**
    *   `MatchResultService` must handle saving and retrieving results with optional loser fields.
    *   `/api/match-results` should support filtering by `gameType` to facilitate per-game feeds.
3.  **UI Enhancements (`game.tsx`):**
    *   Add a compact match history feed below each game icon in the "2-Player Online" section.
    *   Display the last 3 matches for the specific game type.
    *   Maintain a 30-second polling interval for updates.
4.  **UI Enhancements (`MatchResultCard`):**
    *   **Solo Mode Display:** If no loser is present, display the player name, their score, and the game type.
    *   **Compact Mode:** Ensure the card fits within the small allocated space under game icons (approx. 84px height for the container).

## Non-Functional Requirements
*   **Visual Consistency:** Follow the existing "vibe" and color schemes (green for online/matches).
*   **Performance:** Efficient polling that doesn't lag the UI.

## Acceptance Criteria
*   Users can see the last 3 match results for Snooker, Nine Ball, and Three Cushion under the "2-Player Online" buttons.
*   The system correctly records and displays solo game results when no opponent is provided.
*   The UI updates automatically without page refreshes.

## Out of Scope
*   Real-time push notifications (Nchan integration).
*   Filtering match history by player name.
