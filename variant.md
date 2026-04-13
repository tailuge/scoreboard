# Variant: Send Game Options in Challenge Offers

## Problem

When a player sends a challenge offer (e.g., threecushion, snooker, nineball), only `ruleType` is transmitted. Game-specific options like:
- **Three Cushion**: `raceTo` (3 or 5)
- **Snooker**: `reds` (3, 6, or 15)
- **Nineball**: `practice` mode ("Free")

...are currently **only** used for single-player/vs-bot URLs in `GameGrid`. The recipient of a challenge has no way to know the challenger's selected options, nor can they propagate those options when launching the game URL.

## Current State

### Challenge Flow
```
game.tsx::handleSelectRuleType(ruleType)
  → challenge(targetUserId, ruleType)         // only ruleType sent
    → lobby.challenge(targetUserId, ruleType) // external @tailuge/messaging
      → ChallengeMessage { ruleType, ... }    // no extras/options
```

### Single-Player Flow (has extras)
```
GameGrid.tsx::extras
  → { reds: "6" } or { raceTo: "3" } or { practice: "true" }
    → GameUrl.createSinglePlayer({ extras })
      → URL params: ?reds=6 or ?raceTo=3
```

### Challenge URL (no extras)
```
GameUrl.create({ ruleType, tableId, ... })
  → URL: ?ruletype=threecushion&tableId=...&userName=...
  // ❌ no raceTo, reds, or practice params
```

## Proposed Solution

### Goal
Send a generic `options` object in challenge offers, allowing the recipient to:
1. See the challenger's selected game variant
2. Append those options to the game launch URL
3. Initialize the game with the correct rules/parameters

### Design Principle
Use a **generic `options` key** (not rule-specific names like `RACE_TO_OPTIONS` or `RED_BALL_OPTIONS`). This keeps the challenge protocol uniform across game types and lets each game type interpret its own options.

### Consolidation Strategy
**Extract option-building logic into a single utility function** to avoid duplication between:
- Single-player URL generation (`GameGrid.tsx`)
- Challenge offer generation (`game.tsx`)

This ensures consistency and makes future option additions trivial.

## Changes Required

### 1. New Utility: `buildGameOptions()` Function

**File**: `src/utils/GameOptions.ts` (NEW)

**Purpose**: Centralize the logic for building game options from UI state

```typescript
/**
 * Build game options from current UI state
 * Used by both single-player URLs and challenge offers
 */
export function buildGameOptions(params: {
  ruleType: string
  snookerReds?: number
  threecushionRaceTo?: number
  nineballOption?: string
}): Record<string, string> {
  const options: Record<string, string> = {}

  if (params.ruleType === "snooker" && params.snookerReds !== undefined) {
    options.reds = String(params.snookerReds)
  } else if (params.ruleType === "threecushion" && params.threecushionRaceTo !== undefined) {
    options.raceTo = String(params.threecushionRaceTo)
  } else if (params.ruleType === "nineball" && params.nineballOption === "Free") {
    options.practice = "true"
  }

  return options
}
```

**Benefits**:
- Single source of truth for option mapping
- Type-safe parameter handling
- Reusable across single-player and challenge flows
- Easy to extend with new game types or options

### 2. `GameUrl.ts` - Add Options to Multiplayer URLs

**File**: `src/utils/GameUrl.ts`

**Change**: Update `GameUrl.create()` to accept and append options:
```typescript
static create({
    tableId,
    userName,
    userId,
    ruleType,
    isSpectator,
    isCreator,
    rematch,
    options,  // NEW
}: {
    tableId: string
    userName: string
    userId: string
    ruleType: string
    isSpectator?: boolean
    isCreator?: boolean
    rematch?: RematchParam
    options?: Record<string, string>  // NEW
}): URL {
    const target = new URL(GAME_BASE_URL)
    target.searchParams.append("websocketserver", WEBSOCKET_SERVER)
    target.searchParams.append("tableId", tableId)
    this.addUserParams(target, userName, userId)
    target.searchParams.append("ruletype", ruleType)
    if (isSpectator) target.searchParams.append("spectator", "true")
    if (isCreator) target.searchParams.append("first", "true")
    if (rematch) target.searchParams.append("rematch", this.serializeRematch(rematch))

    // NEW: Append options as query params
    if (options && Object.keys(options).length > 0) {
      for (const [key, value] of Object.entries(options)) {
        target.searchParams.append(key, value)
      }
    }

    return target
}
```

### 3. `GameGrid.tsx` - Use Consolidated Utility

**File**: `src/components/GameGrid.tsx`

**Change**: Replace inline extras construction with `buildGameOptions()`:
```typescript
import { buildGameOptions } from "@/utils/GameOptions"

// Inside the GAMES.map callback, replace:
// const extras: Record<string, string> = {}
// if (game.ruleType === "snooker") {
//   extras.reds = String(snookerReds)
// } else if (game.ruleType === "nineball") {
//   if (nineballOption === "Free") {
//     extras.practice = "true"
//   }
// } else if (game.ruleType === "threecushion") {
//   extras.raceTo = String(threecushionRaceTo)
// }

// With:
const extras = buildGameOptions({
  ruleType: game.ruleType,
  snookerReds,
  threecushionRaceTo,
  nineballOption,
})
```

### 4. `game.tsx` - Build Options from Selected Game Variant

**File**: `src/pages/game.tsx`

**Change**: Import and use `buildGameOptions()` in `handleSelectRuleType`:
```typescript
import { buildGameOptions } from "@/utils/GameOptions"

const handleSelectRuleType = useCallback(
    async (ruleType: string) => {
      if (!selectedOpponent) return
      setChallengeBusy(true)
      setChallengeError(null)
      try {
        // Build options from current UI state
        const options = buildGameOptions({
          ruleType,
          snookerReds,
          threecushionRaceTo,
          nineballOption,
        })

        // Pass options to challenge
        const tableId = await challenge(
          selectedOpponent.userId,
          ruleType,
          Object.keys(options).length > 0 ? options : undefined
        )
        // ... rest of flow unchanged
```

### 5. `MessagingContext.tsx` - Pass Options in Challenge

**File**: `src/contexts/MessagingContext.tsx`

**Change**: Update `challenge` callback signature to accept options:
```typescript
const challenge = useCallback(
    async (
      targetUserId: string,
      ruleType: string,
      options?: Record<string, string>,  // NEW parameter
      rematch?: RematchInfo
    ) => {
      const lobby = lobbyRef.current
      if (!lobby) {
        throw new Error("Lobby not initialized")
      }
      // Pass options to external library
      const tableId = await lobby.challenge(targetUserId, ruleType, options, rematch)
      setPendingChallenge({
        messageType: "challenge",
        type: "offer",
        challengerId: userId,
        challengerName: userName,
        recipientId: targetUserId,
        ruleType,
        options,  // NEW: store in pending challenge
        tableId,
        rematch,
      })
      return tableId
    },
    [userId, userName]
  )
```

**Update TypeScript interface**:
```typescript
interface MessagingContextType {
  // ... existing fields
  challenge: (
    userId: string,
    ruleType: string,
    options?: Record<string, string>,  // NEW
    rematch?: RematchInfo
  ) => Promise<string>
  // ... rest
}
```

### 6. Challenge Acceptance Flow - Propagate Options

**File**: `src/pages/game.tsx`

When a recipient accepts a challenge, the game URL must include the options from the offer:

**Change**: In `handleAcceptChallenge`, propagate options to URL:
```typescript
const handleAcceptChallenge = useCallback(async () => {
    if (!incomingChallenge) return
    if (!incomingChallenge.tableId) {
      setChallengeError("Challenge is missing table information.")
      return
    }
    setChallengeBusy(true)
    setChallengeError(null)
    try {
      await acceptChallenge(
        incomingChallenge.challengerId,
        incomingChallenge.ruleType,
        incomingChallenge.tableId
      )
      markUsage("joinTable")
      await updatePresenceForTable(
        incomingChallenge.tableId,
        incomingChallenge.ruleType,
        incomingChallenge.challengerId
      )
      // If it's a rematch, check if we should go first
      const isFirst = resolveIsFirstPlayer(
        incomingChallenge.rematch,
        incomingChallenge.challengerId
      )
      const rematchParam: RematchParam | undefined = incomingChallenge.rematch
        ? {
            opponentId: incomingChallenge.challengerId,
            opponentName: incomingChallenge.challengerName,
            ruleType: incomingChallenge.ruleType,
            lastScores: incomingChallenge.rematch.lastScores,
            nextTurnId: incomingChallenge.rematch.nextTurnId,
          }
        : undefined
      
      // NEW: Propagate options from challenge
      openGameWindow(
        incomingChallenge.tableId,
        incomingChallenge.ruleType,
        isFirst,
        rematchParam,
        incomingChallenge.options  // NEW: pass options
      )
    } catch (error) {
      // ... error handling unchanged
```

**Change**: Update `openGameWindow` to accept and use options:
```typescript
const openGameWindow = useCallback(
    (
      tableId: string,
      ruleType: string,
      shouldStartFirst: boolean,
      rematch?: RematchParam,
      options?: Record<string, string>  // NEW
    ) => {
      if (!userId || !userName) {
        console.log("[challenge] open blocked: missing user identity", {
          userId,
          userName,
        })
        return
      }
      const target = GameUrl.create({
        tableId,
        userName,
        userId,
        ruleType,
        isCreator: shouldStartFirst,
        rematch,
        options,  // NEW: include in URL
      })
      console.log("[challenge] redirecting to game", {
        tableId,
        ruleType,
        shouldStartFirst,
        target: target.toString(),
      })
      navigateTo(target.toString())
    },
    [userId, userName]
  )
```

### 7. Game Page - Read Options from URL on Load

**File**: `src/pages/game.tsx` (or the scoreboard game engine)

The game engine (external: `billiards.tailuge.workers.dev`) should already read query params like `reds`, `raceTo`, `practice` from the URL. Since we're now appending them as generic query params, no change is needed on the consumer side **if** the game engine already supports them.

**Verify**: Check that `billiards.tailuge.workers.dev` reads `?reds=`, `?raceTo=`, `?practice=` from URL params.

## Options Mapping by Game Type

| Game Type | Option Key | Values | Source State |
|-----------|-----------|--------|--------------|
| `snooker` | `reds` | `"3"`, `"6"`, `"15"` | `snookerReds` |
| `threecushion` | `raceTo` | `"3"`, `"5"` | `threecushionRaceTo` |
| `nineball` | `practice` | `"true"` | `nineballOption === "Free"` |

## URL Examples

### Before (current)
```
https://billiards.tailuge.workers.dev/?websocketserver=...&tableId=abc&userName=alice&userId=123&ruletype=threecushion&first=true
```

### After (with options)
```
https://billiards.tailuge.workers.dev/?websocketserver=...&tableId=abc&userName=alice&userId=123&ruletype=threecushion&first=true&raceTo=5
```

```
https://billiards.tailuge.workers.dev/?websocketserver=...&tableId=abc&userName=alice&userId=123&ruletype=snooker&first=true&reds=15
```

## Backward Compatibility

- `options` is optional (`Record<string, string> | undefined`)
- Old clients sending challenges without `options` will still work; recipients will see no extra params
- Old clients receiving challenges with `options` will ignore unknown fields in the message
- URL params are additive; game engines that don't recognize `raceTo`/`reds` will simply ignore them
- The `@tailuge/messaging` library already supports the options parameter (dependency resolved)

## Testing Checklist

- [ ] Challenge offer includes `options` in `ChallengeMessage`
- [ ] Challenge accept propagates `options` to `GameUrl.create()`
- [ ] Generated URL contains correct query params (e.g., `?raceTo=5`)
- [ ] Snooker challenge with `reds=15` produces URL with `?reds=15`
- [ ] Nineball "Free" challenge includes `?practice=true`
- [ ] Challenge without options still works (backward compat)
- [ ] Single-player URLs still work with consolidated `buildGameOptions()`
- [ ] Game engine reads options from URL params
- [ ] `yarn test` passes
- [ ] `yarn lint` passes
- [ ] `yarn prettify` applied

## Dependencies

1. ~~**`@tailuge/messaging`** - Must be updated to support `options` parameter in challenge protocol~~ ✅ **Already updated**
2. **`billiards.tailuge.workers.dev`** - Must read `?reds=`, `?raceTo=`, `?practice=` from URL (verify existing support) ✅ Already checked

## Rollout Order

1. ✅ ~~Update `@tailuge/messaging` package (external)~~ **Already done**
2. Create `GameOptions.ts` utility with `buildGameOptions()` function
3. Update `GameGrid.tsx` to use consolidated `buildGameOptions()`
4. Update `GameUrl.ts` to accept and append options to multiplayer URLs
5. Update `MessagingContext.tsx` challenge signature to accept options
6. Update `game.tsx` to build options from state and pass to challenge
7. Update `game.tsx` acceptance flow to propagate options to URL
8. Test end-to-end with both single-player and challenge flows
