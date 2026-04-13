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

## Changes Required

### 1. External: `@tailuge/messaging` Package

**File**: `@tailuge/messaging` (external dependency)

**Change**: Extend `lobby.challenge()` signature:
```typescript
// Before
lobby.challenge(targetUserId: string, ruleType: string, rematch?: RematchInfo)

// After
lobby.challenge(
  targetUserId: string,
  ruleType: string,
  options?: Record<string, string>,  // NEW
  rematch?: RematchInfo
)
```

**Change**: Extend `ChallengeMessage` type:
```typescript
interface ChallengeMessage {
  messageType: "challenge"
  type: "offer" | "accept" | "decline" | "cancel"
  challengerId: string
  challengerName: string
  recipientId: string
  ruleType: string
  tableId: string
  options?: Record<string, string>  // NEW
  rematch?: RematchInfo
}
```

### 2. `MessagingContext.tsx` - Pass Options in Challenge

**File**: `src/contexts/MessagingContext.tsx`

**Change**: Update `challenge` callback:
```typescript
const challenge = useCallback(
    async (
      targetUserId: string,
      ruleType: string,
      options?: Record<string, string>,  // NEW
      rematch?: RematchInfo
    ) => {
      const tableId = await lobby.challenge(targetUserId, ruleType, options, rematch)
      setPendingChallenge({
        messageType: "challenge",
        type: "offer",
        challengerId: userId,
        challengerName: userName,
        recipientId: targetUserId,
        ruleType,
        options,    // NEW
        tableId,
        rematch,
      })
      return tableId
    },
    [userId, userName]
)
```

### 3. `game.tsx` - Build Options from Selected Game Variant

**File**: `src/pages/game.tsx`

**Change**: In `handleSelectRuleType`, build options object:
```typescript
const handleSelectRuleType = useCallback(
    async (ruleType: string) => {
      if (!selectedOpponent) return
      setChallengeBusy(true)
      setChallengeError(null)
      try {
        // NEW: Build options based on ruleType and current state
        const options: Record<string, string> = {}
        if (ruleType === "snooker") {
          options.reds = String(snookerReds)       // 3, 6, or 15
        } else if (ruleType === "threecushion") {
          options.raceTo = String(threecushionRaceTo)  // 3 or 5
        } else if (ruleType === "nineball") {
          if (nineballOption === "Free") {
            options.practice = "true"
          }
        }

        // Pass options to challenge
        const tableId = await challenge(
          selectedOpponent.userId,
          ruleType,
          Object.keys(options).length > 0 ? options : undefined
        )
        // ... rest of flow
```

**Note**: The `game.tsx` page already tracks these states:
```typescript
const [snookerReds, setSnookerReds] = useState(6)
const [threecushionRaceTo, setThreecushionRaceTo] = useState(3)
const [nineballOption, setNineballOption] = useState("1->9")
```

### 4. `GameUrl.ts` - Add Options to Multiplayer URLs

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
    rematch?: RematchInfo
    options?: Record<string, string>  // NEW
}): URL {
    const target = new URL(GAME_BASE_URL)
    target.searchParams.append("websocketserver", "wss://billiards.onrender.com/ws")
    target.searchParams.append("tableId", tableId)
    target.searchParams.append("userName", userName)
    target.searchParams.append("userId", userId)
    target.searchParams.append("ruletype", ruleType)
    if (isSpectator) target.searchParams.append("spectator", "true")
    if (isCreator) target.searchParams.append("first", "true")
    if (rematch) target.searchParams.append("rematch", serializeRematch(rematch))

    // NEW: Append options as query params
    if (options) {
      for (const [key, value] of Object.entries(options)) {
        target.searchParams.append(key, value)
      }
    }

    return target
}
```

### 5. Challenge Acceptance Flow - Propagate Options

**File**: `src/pages/game.tsx` (or relevant accept flow)

When a recipient accepts a challenge, the game URL must include the options from the offer:
```typescript
// When accepting a challenge
const gameUrl = GameUrl.create({
  tableId: challenge.tableId,
  userName: currentUserName,
  userId: currentUserId,
  ruleType: challenge.ruleType,
  isCreator: false,
  options: challenge.options,  // NEW: propagate from offer
})
```

### 6. Game Page - Read Options from URL on Load

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

## Testing Checklist

- [ ] Challenge offer includes `options` in `ChallengeMessage`
- [ ] Challenge accept propagates `options` to `GameUrl.create()`
- [ ] Generated URL contains correct query params (e.g., `?raceTo=5`)
- [ ] Snooker challenge with `reds=15` produces URL with `?reds=15`
- [ ] Nineball "Free" challenge includes `?practice=true`
- [ ] Challenge without options still works (backward compat)
- [ ] Game engine reads options from URL params
- [ ] `yarn test` passes
- [ ] `yarn lint` passes
- [ ] `yarn prettify` applied

## Dependencies

1. **`@tailuge/messaging`** - Must be updated to support `options` parameter in challenge protocol
2. **`billiards.tailuge.workers.dev`** - Must read `?reds=`, `?raceTo=`, `?practice=` from URL (verify existing support)

## Rollout Order

1. Update `@tailuge/messaging` package (external)
2. Update `MessagingContext.tsx` to pass options
3. Update `game.tsx` to build options from state
4. Update `GameUrl.ts` to append options to URLs
5. Update challenge acceptance flow to propagate options
6. Test end-to-end with both game types
