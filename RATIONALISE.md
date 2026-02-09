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

| File                                     | Change                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/lobby.tsx`                    | `seekingGameType` → `seekingRuleType`                                                                                        |
| `src/components/hooks/useLobbyTables.ts` | `gameType` → `ruleType` param                                                                                                |
| `src/components/hooks/useAutoJoin.ts`    | `router.query.gameType` → `router.query.ruleType`                                                                            |
| `src/pages/api/tables/find-or-create.ts` | `gameType` → `ruleType` in body & comments                                                                                   |
| `src/services/TableService.ts`           | `findPendingTable(gameType)` → `findPendingTable(ruleType)`, parameter rename only (internally compares to `table.ruleType`) |
| `src/types/table.ts`                     | No change (already uses `ruleType`)                                                                                          |
| `src/pages/game.tsx`                     | URL param `gameType=${game.ruleType}` → `ruleType=${game.ruleType}`                                                          |
| `public/test.html`                       | Already uses `ruleType` correctly                                                                                            |
| `src/pages/api/match-results.ts`         | `gameType` → `ruleType` (filtering)                                                                                          |
| `src/pages/api/match-replay.ts`          | `matchResult.gameType` → `matchResult.ruleType`                                                                              |
| `src/services/MatchResultService.ts`     | `gameType?: string` → `ruleType?: string`                                                                                    |
| `src/types/match.ts`                     | `gameType: string` → `ruleType: string`                                                                                      |
| `src/utils/game.ts`                      | `getGameIcon(gameType)` → `getGameIcon(ruleType)`                                                                            |
| `src/tests/*`                            | Update all test data and assertions                                                                                          |

## Implementation Steps

### Phase 1: Core Types & Services

1. **Update `src/types/match.ts`**
   - Rename `gameType: string` to `ruleType: string`

2. **Update `src/utils/game.ts`**
   - Rename parameter `gameType` to `ruleType` in `getGameIcon()`

3. **Update `src/services/TableService.ts`**
   - Rename `findPendingTable(gameType)` parameter to `ruleType`
   - Update internal variable names for clarity

4. **Update `src/services/MatchResultService.ts`**
   - Rename `gameType` parameter to `ruleType` in `getMatchResults()`

### Phase 2: API Layer

5. **Update `/api/tables/find-or-create.ts`**
   - Rename request body field `gameType` → `ruleType`
   - Update Swagger documentation

6. **Update `/api/match-results.ts`**
   - Rename query param `gameType` → `ruleType`
   - Update Swagger docs

7. **Update `/api/match-replay.ts`**
   - Change `matchResult.gameType` to `matchResult.ruleType`

### Phase 3: React Components & Hooks

8. **Update `src/components/hooks/useAutoJoin.ts`**
   - `router.query.gameType` → `router.query.ruleType`

9. **Update `src/components/hooks/useLobbyTables.ts`**
   - Rename `gameType` → `ruleType` in `findOrCreateTable()` function
   - Update API call body

10. **Update `src/pages/lobby.tsx`**
    - Rename `seekingGameType` → `seekingRuleType`
    - Update all references to the state variable

### Phase 4: Entry Points

11. **Update `src/pages/game.tsx`**
    - Change URL generation from `gameType=${game.ruleType}` to `ruleType=${game.ruleType}`
    - This affects the `/lobby?action=join&ruleType=...` URLs for game buttons

### Phase 5: Test Updates

12. **Update all test files:**
    - `src/tests/api.tables.find-or-create.test.ts`
    - `src/tests/api.match-results.test.ts`
    - `src/tests/api.match-replay.test.ts`
    - `src/tests/useLobbyTables.test.ts`
    - `src/tests/MatchResultService.test.ts`
    - `src/tests/match.schema.test.ts`
    - `src/tests/TableService.test.ts` (if exists)

13. **Update E2E tests:**
    - `src/playwrite/match-results.test.ts`

## Breaking Changes

- **API Contract:** The POST `/api/tables/find-or-create` endpoint will now expect `ruleType` instead of `gameType` in the request body.
- **URL Query:** `/api/match-results?gameType=...` becomes `/api/match-results?ruleType=...`
- **Lobby URL:** `/lobby?action=join&gameType=...` becomes `/lobby?action=join&ruleType=...`

These changes only affect internal API consumers. The frontend changes ensure all callers are updated.

## Verification

After implementation:

```bash
yarn test        # Run unit tests
yarn lint        # Check for any missed references
yarn build       # Verify type checking passes
```

## Rationale

1. **Single source of truth:** The `Table` type already uses `ruleType`. Using `gameType` elsewhere creates an unnecessary translation layer.

2. **Consistency with game engine:** The external billiards game (`tailuge/billiards`) uses `ruletype` as the query parameter. Aligning our internal naming reduces cognitive load when debugging.

3. **Cleaner mental model:** A single term (`ruleType`) throughout makes the codebase easier to understand and maintain.

4. **No functionality change:** This is purely a naming refactor. All logic remains identical.
