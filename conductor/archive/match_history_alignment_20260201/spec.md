# Specification: Match History Visual Alignment

## Overview
Align the visual style of the `MatchHistoryList` and `MatchResultCard` components with the high scores table found in `game.tsx`. This includes adopting the trophy emojis for icons and adding separator lines between entries to match the `LeaderboardTable` appearance.

## Functional Requirements
- **MatchResultCard Refactor:**
    - Replace the `TrophyIcon` (Heroicons) with the trophy emoji (🏆).
    - Implement a `border-b border-gray-800` separation for each row to match the table-row style of the leaderboard.
    - Ensure the row layout (padding, alignment) mimics the `LeaderboardTable` rows while maintaining the existing match information (Winner, Loser, Scores, Game Type, Timestamp).
- **MatchHistoryList Refactor:**
    - Adjust the container and item spacing to accommodate the new row-based separation.
- **Documentation:**
    - Update `SCORES.md` to accurately reflect how the match results API is called, specifically highlighting the `gameType` and `limit` query parameters as used in the current codebase.

## Non-Functional Requirements
- **Visual Consistency:** The match history should look like a natural extension of the project's high score tables.
- **No API Changes:** The underlying API endpoints and data structures must remain unchanged.
- **Responsiveness:** Maintain existing mobile-friendly layouts while applying the new styles.

## Acceptance Criteria
- [ ] Match results display the 🏆 emoji instead of the SVG icon.
- [ ] Each match result entry is separated by a subtle horizontal line (`border-gray-800`).
- [ ] The style (font sizes, colors, spacing) is consistent with the `LeaderboardTable` in `game.tsx`.
- [ ] `SCORES.md` updated with the correct API usage examples.

## Out of Scope
- Changing match result data persistence or retrieval logic.
- Adding new features to the match history (e.g., likes, replays) unless already present.
