# Implementation Plan: Match Results Activity Feed

## Phase 1: Data Model and Service Enhancements
- [x] Task: Update `MatchResult` interface to support solo results (8749ef5)
    - [x] Modify `src/types/match.ts` to make `loser` and `loserScore` optional
- [ ] Task: Update `MatchResultService` tests for solo results
    - [ ] Add tests to `src/tests/MatchResultService.test.ts` for saving/retrieving matches without a loser
- [ ] Task: Implement solo result support in `MatchResultService`
    - [ ] Ensure `addMatchResult` and `getMatchResults` handle optional fields correctly
- [ ] Task: Update Match Results API tests for solo results and filtering
    - [ ] Modify `src/tests/api.match-results.test.ts` to include solo result cases and `gameType` filtering
- [ ] Task: Enhance Match Results API with filtering
    - [ ] Update `src/pages/api/match-results.ts` to support `gameType` query parameter
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Data Model and Service Enhancements' (Protocol in workflow.md)

## Phase 2: UI Component Updates
- [ ] Task: Update `MatchResultCard` for Solo and Compact display
    - [ ] Write tests for `MatchResultCard` solo display in `src/tests/MatchResultCard.test.tsx`
    - [ ] Update `src/components/MatchResultCard.tsx` to handle missing `loser`
    - [ ] Add `compact` prop to `MatchResultCard` for use in game grids
- [ ] Task: Create `CompactMatchHistory` component
    - [ ] Create `src/components/CompactMatchHistory.tsx` that fetches results for a specific `gameType`
    - [ ] Add tests for `CompactMatchHistory` in `src/tests/CompactMatchHistory.test.tsx`
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Component Updates' (Protocol in workflow.md)

## Phase 3: Integration into game.tsx
- [ ] Task: Update `game.tsx` to include match activity
    - [ ] Modify `src/pages/game.tsx` to include `CompactMatchHistory` under game buttons in the "2-Player Online" section
    - [ ] Ensure polling is set to 30 seconds (as per spec)
- [ ] Task: Verify overall visual consistency and responsiveness
    - [ ] Run end-to-end tests or manual checks to ensure the layout remains stable on mobile and desktop
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Integration into game.tsx' (Protocol in workflow.md)
