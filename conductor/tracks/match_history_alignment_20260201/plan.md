# Implementation Plan: Match History Visual Alignment

Align `MatchHistoryList` and `MatchResultCard` with the high scores table style from `game.tsx`.

## Phase 1: Preparation & Testing
- [x] Task: Create a regression test for `MatchResultCard` to ensure current functionality is preserved before refactoring.
- [x] Task: Create a regression test for `MatchHistoryList` to verify the list rendering logic.
- [ ] Task: Conductor - User Manual Verification 'Preparation & Testing' (Protocol in workflow.md)

## Phase 2: Refactor MatchResultCard
- [x] Task: Replace `TrophyIcon` with 🏆 emoji in `MatchResultCard.tsx` [3b9a713]
- [ ] Task: Update `MatchResultCard` layout to use `border-b border-gray-800` and align padding with `LeaderboardTable`.
- [ ] Task: Verify `MatchResultCard` styling in both `compact` and standard modes.
- [ ] Task: Write Tests: Verify `MatchResultCard` renders the trophy emoji and has the correct border class.
- [ ] Task: Implement: Apply styling changes to `MatchResultCard.tsx`.
- [ ] Task: Conductor - User Manual Verification 'Refactor MatchResultCard' (Protocol in workflow.md)

## Phase 3: Refactor MatchHistoryList & CompactMatchHistory
- [ ] Task: Adjust `MatchHistoryList.tsx` container styling (remove `gap` if necessary to favor row borders).
- [ ] Task: Adjust `CompactMatchHistory.tsx` to ensure consistent spacing with the new row borders.
- [ ] Task: Write Tests: Verify `MatchHistoryList` renders children with proper separation.
- [ ] Task: Implement: Update `MatchHistoryList.tsx` and `CompactMatchHistory.tsx`.
- [ ] Task: Conductor - User Manual Verification 'Refactor MatchHistoryList & CompactMatchHistory' (Protocol in workflow.md)

## Phase 4: Documentation & Final Verification
- [ ] Task: Update `SCORES.md` with current `/api/match-results` usage (query params: `gameType`, `limit`).
- [ ] Task: Perform manual verification on `game.tsx` and the main lobby/match history page.
- [ ] Task: Conductor - User Manual Verification 'Final Verification' (Protocol in workflow.md)
