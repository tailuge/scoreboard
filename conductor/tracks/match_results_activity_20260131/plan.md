# Implementation Plan: Match Results Activity Feed

## Phase 1: Data Model and Service Enhancements [checkpoint: 41f7805]
- [x] Task: Update `MatchResult` interface to support solo results (8749ef5)
    - [x] Modify `src/types/match.ts` to make `loser` and `loserScore` optional
- [x] Task: Update `MatchResultService` tests for solo results (f22f1b4)
    - [x] Add tests to `src/tests/MatchResultService.test.ts` for saving/retrieving matches without a loser
- [x] Task: Implement solo result support in `MatchResultService` (f22f1b4)
    - [x] Ensure `addMatchResult` and `getMatchResults` handle optional fields correctly
- [x] Task: Update Match Results API tests for solo results and filtering (b68ba29)
    - [x] Modify `src/tests/api.match-results.test.ts` to include solo result cases and `gameType` filtering
- [x] Task: Enhance Match Results API with filtering (b68ba29)
    - [x] Update `src/pages/api/match-results.ts` to support `gameType` query parameter
- [x] Task: Conductor - User Manual Verification 'Phase 1: Data Model and Service Enhancements' (Protocol in workflow.md)

## Phase 2: UI Component Updates
- [x] Task: Update `MatchResultCard` for Solo and Compact display (5688c52)
    - [x] Write tests for `MatchResultCard` solo display in `src/tests/MatchResultCard.test.tsx`
    - [x] Update `src/components/MatchResultCard.tsx` to handle missing `loser`
    - [x] Add `compact` prop to `MatchResultCard` for use in game grids
- [x] Task: Create `CompactMatchHistory` component (2b0cd98)
    - [x] Create `src/components/CompactMatchHistory.tsx` that fetches results for a specific `gameType`
    - [x] Add tests for `CompactMatchHistory` in `src/tests/CompactMatchHistory.test.tsx`
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Component Updates' (Protocol in workflow.md)

## Phase 3: Integration into game.tsx
- [ ] Task: Update `game.tsx` to include match activity
    - [ ] Modify `src/pages/game.tsx` to include `CompactMatchHistory` under game buttons in the "2-Player Online" section
    - [ ] Ensure polling is set to 30 seconds (as per spec)
- [ ] Task: Verify overall visual consistency and responsiveness
    - [ ] Run end-to-end tests or manual checks to ensure the layout remains stable on mobile and desktop
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Integration into game.tsx' (Protocol in workflow.md)
