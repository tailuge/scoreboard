# Plan: Rename `gameType` to `ruleType` for Consistency

## Summary

Rename all occurrences of `gameType` to `ruleType` throughout the codebase to align the lobby/table layer with the game engine layer, which already uses `ruleType`.

## Current State

### The Problem

The codebase uses two different terms for the same concept:

| Layer       | Parameter  | Files                                                                         |
| ----------- | ---------- | ----------------------------------------------------------------------------- |
| Lobby/API   | `gameType` | `useAutoJoin.ts`, `useLobbyTables.ts`, `find-or-create.ts`, `TableService.ts` |
| Game Engine | `ruletype` | `GameUrl.ts`, `test.html`, `game.tsx`                                         |

### Data Flow

```
game.tsx → ?action=join&gameType=nineball
    ↓
useAutoJoin.ts (reads router.query.gameType)
    ↓
useLobbyTables.ts (calls API with gameType)
    ↓
/api/tables/find-or-create.ts (receives gameType)
    ↓
TableService.findOrCreate(userId, userName, gameType)
    ↓
Table { ruleType: "nineball" } ← STORED AS ruleType!
    ↓
PlayModal.tsx (receives ruleType)
    ↓
GameUrl.create() → ?ruletype=ninebill ← TRANSLATED BACK!
```

**Key observation:** The `Table` type stores the value as `ruleType` (line 11 of `src/types/table.ts`), yet all API communication uses `gameType`. This creates unnecessary mental overhead and potential for confusion.

### Files Affected

| File                                     | Change                                                                                   | Phase |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- | ----- |
| `src/types/match.ts`                     | Add `ruleType?: string`, keep `gameType?: string` (Phase 1), remove `gameType` (Phase 2) | 1, 2  |
| `src/services/MatchResultService.ts`     | Add dual-read filter (Phase 1), remove `gameType` param (Phase 2)                        | 1, 2  |
| `src/pages/api/match-replay.ts`          | Dual-read `matchResult.ruleType ?? matchResult.gameType` (Phase 1), simplify (Phase 2)   | 1, 2  |
| `src/utils/game.ts`                      | Rename parameter `gameType` to `ruleType` in `getGameIcon()`                             | 2     |
| `src/services/TableService.ts`           | Rename `findPendingTable(gameType)` parameter to `ruleType`                              | 2     |
| `src/pages/api/tables/find-or-create.ts` | Rename request body field `gameType` → `ruleType`                                        | 2     |
| `src/pages/api/match-results.ts`         | Rename query param `gameType` → `ruleType`                                               | 2     |
| `src/components/hooks/useAutoJoin.ts`    | `router.query.gameType` → `router.query.ruleType`                                        | 2     |
| `src/components/hooks/useLobbyTables.ts` | Rename `gameType` → `ruleType` in `findOrCreateTable()`                                  | 2     |
| `src/pages/lobby.tsx`                    | Rename `seekingGameType` → `seekingRuleType`                                             | 2     |
| `src/pages/game.tsx`                     | URL param `gameType=${game.ruleType}` → `ruleType=${game.ruleType}`                      | 2     |
| `src/types/table.ts`                     | No change (already uses `ruleType`)                                                      | -     |
| `public/test.html`                       | No change (already uses `ruleType` correctly)                                            | -     |

## Implementation Steps

### Phase 1: Backwards Compatibility Layer ✅ COMPLETE

This phase adds support for reading `ruleType` while still accepting existing `gameType` data. Can be deployed independently.

1. **Update `src/types/match.ts`** ✅
   - Add `ruleType?: string` alongside existing `gameType?: string`
   - Both fields optional for backwards compatibility
   - Added `getRuleType()` helper function
   - See "Backwards Compatibility for KV Data" section for full type definition

2. **Update `src/services/MatchResultService.ts`** ✅
   - Add `ruleType?: string` parameter alongside `gameType`
   - Use dual-read for filtering via `getRuleType()` helper

3. **Update `src/pages/api/match-replay.ts`** ✅
   - Use `getRuleType()` for dual-read

4. **Update test files for Phase 1:** ✅
   - `src/tests/match.schema.test.ts`
   - `src/tests/MatchResultService.test.ts`
   - `src/tests/api.match-replay.test.ts`

### Phase 2: Rename Everything (deploy after Phase 1) ✅ COMPLETE

This phase renames all `gameType` references to `ruleType` across the codebase. Requires Phase 1 to be deployed first.

5. **Update `src/types/match.ts`** ✅
   - Remove `gameType` field (keep only `ruleType`)

6. **Update `src/utils/game.ts`** ✅
   - Rename parameter `gameType` to `ruleType` in `getGameIcon()`

7. **Update `src/services/TableService.ts`** ✅
   - Rename `findPendingTable(gameType)` parameter to `ruleType`

8. **Update `src/services/MatchResultService.ts`** ✅
   - Remove `gameType` parameter, keep only `ruleType`
   - Simplify filter to `r.ruleType === ruleType`

9. **Update `/api/tables/find-or-create.ts`** ✅
   - Rename request body field `gameType` → `ruleType`
   - Update Swagger documentation

10. **Update `/api/match-results.ts`** ✅
    - Rename query param `gameType` → `ruleType`
    - Update Swagger docs

11. **Update `/api/match-replay.ts`** ✅
    - Simplify to `matchResult.ruleType`

12. **Update `src/components/hooks/useAutoJoin.ts`** ✅
    - `router.query.gameType` → `router.query.ruleType`

13. **Update `src/components/hooks/useLobbyTables.ts`** ✅
    - Rename `gameType` → `ruleType` in `findOrCreateTable()` function
    - Update API call body

14. **Update `src/pages/lobby.tsx`** ✅
    - Rename `seekingGameType` → `seekingRuleType`
    - Update all references to the state variable

15. **Update `src/pages/game.tsx`** ✅
    - Change URL generation from `gameType=${game.ruleType}` to `ruleType=${game.ruleType}`

16. **Update test files for Phase 2:** ✅
    - `src/tests/api.tables.find-or-create.test.ts`
    - `src/tests/api.match-results.test.ts`
    - `src/tests/useLobbyTables.test.ts`
    - `src/tests/TableService.test.ts`
    - `src/tests/lobby.test.tsx`
    - `src/playwrite/match-results.test.ts`
    - `src/tests/match.schema.test.ts`
    - `src/tests/MatchResultService.test.ts`
    - `src/tests/api.match-replay.test.ts`
    - `src/tests/MatchResultCard.test.tsx`
    - `src/components/LiveMatchesList.tsx`
    - `src/components/MatchResultCard.tsx`

## Backwards Compatibility for KV Data

Existing `MatchResult` objects in KV store have `gameType`, not `ruleType`. New results will use `ruleType`.

### Migration Strategy: Dual-Read

The code will read both fields, preferring `ruleType` if present:

```typescript
// Helper function for backwards compatibility
function getRuleType(result: MatchResult): string {
  return result.ruleType ?? result.gameType ?? "unknown";
}
```

### Type Changes

Update `src/types/match.ts` to support both fields during transition:

```typescript
export interface MatchResult {
  id: string;
  winner: string;
  loser?: string;
  winnerScore: number;
  loserScore?: number;
  ruleType?: string; // New field (preferred)
  gameType?: string; // Legacy field (backwards compat)
  timestamp: number;
  hasReplay?: boolean;
  locationCountry?: string;
  locationRegion?: string;
  locationCity?: string;
}
```

After a sufficient transition period (e.g., 50 matches), all stored results will use `ruleType` and `gameType` can be removed.

## Breaking Changes

Phase 1 has no breaking changes - it only adds backwards-compatible support for `ruleType`.

Phase 2 breaking changes (deploy after Phase 1):

- **API Contract:** The POST `/api/tables/find-or-create` endpoint will now expect `ruleType` instead of `gameType` in the request body.
- **URL Query:** `/api/match-results?gameType=...` becomes `/api/match-results?ruleType=...`
- **Lobby URL:** `/lobby?action=join&gameType=...` becomes `/lobby?action=join&ruleType=...`

These changes only affect internal API consumers. The frontend changes ensure all callers are updated.

## Verification

### After Phase 1:

```bash
yarn test        # Run unit tests
yarn lint        # Check for any missed references
yarn build       # Verify type checking passes
```

Verify in production:

- Existing match results with `gameType` still display correctly
- New matches can be stored with `ruleType`

### After Phase 2:

```bash
yarn test        # Run unit tests
yarn lint        # Check for any missed references
yarn build       # Verify type checking passes
```

Verify in production:

- All game buttons use `ruleType` URLs
- Lobby join flow works end-to-end
- Match history filters by `ruleType`

## Rationale

1. **Single source of truth:** The `Table` type already uses `ruleType`. Using `gameType` elsewhere creates an unnecessary translation layer.

2. **Consistency with game engine:** The external billiards game (`tailuge/billiards`) uses `ruletype` as the query parameter. Aligning our internal naming reduces cognitive load when debugging.

3. **Cleaner mental model:** A single term (`ruleType`) throughout makes the codebase easier to understand and maintain.

4. **No functionality change:** This is purely a naming refactor. All logic remains identical.
