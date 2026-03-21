# Improved Rematch Support Design (REMATCH2.md)

## 1. Overview
This design improves upon `REMATCH.md` by focusing on statelessness, modularity, and enhanced messaging. It aims to keep `game.tsx` clean and `GameUrl.ts` maintainable while providing a superior user experience for returning players.

## 2. URL Design & Param Handling

### Compact Rematch Parameter
Instead of multiple query parameters, use a single `r` (rematch) parameter containing a compressed JSON object.

**Structure of `r` (uncompressed):**
```json
{
  "oid": "opponent-id",
  "onm": "Opponent Name",
  "rt": "snooker",
  "s": [2, 1], // [myScore, opponentScore]
  "n": "me" // who goes next: "me" | "opp"
}
```
**Implementation:** Use `JSONCrush` (already in dependencies) and `encodeURIComponent` to keep the URL short and readable by the app.

### URL Builder in `GameUrl.ts`
To prevent `GameUrl.ts` from growing with every new feature, refactor to a configuration-based approach:

```typescript
// src/utils/GameUrl.ts
export interface GameUrlOptions {
  tableId: string;
  userName: string;
  userId: string;
  ruleType: string;
  isSpectator?: boolean;
  isCreator?: boolean;
  rematch?: {
    scores: [number, number];
    next: 'me' | 'opp';
  };
}

static create(options: GameUrlOptions): URL { ... }
```

## 3. Messaging Contract Updates (@tailuge/messaging)

Update `ChallengeMessage` to include optional rematch metadata. This allows the recipient to see the context of the challenge immediately.

```typescript
// packages/messaging-client/src/types.ts
export interface ChallengeMessage {
  // ... existing fields
  rematch?: {
    lastScores: [number, number];
    isRematch: true;
  };
}
```

**Benefit:** The "Incoming Challenge" UI can change its text to "Rematch Request" and show the previous score, making it much more engaging.

## 4. Architecture: `useChallenge` Hook

Extract the challenge and rematch logic from `game.tsx` into a dedicated hook.

```typescript
// src/hooks/useChallenge.ts
export function useChallenge() {
  // Handles:
  // 1. Parsing URL for rematch data on mount
  // 2. State for pending/incoming challenges
  // 3. Logic for auto-selecting opponent if 'r' is present
  // 4. Wrapping messaging actions (challenge, accept, etc.)
}
```

This keeps `game.tsx` focused on layout and composition.

## 5. Visual Design & UX

### Rematch Challenge Card
When a rematch is initiated (either via URL or messaging), show a specialized `RematchCard`:
- **Header**: "Rematch Request" (instead of "Incoming Challenge")
- **Scoreboard**: Display `2 - 1` prominently.
- **Context**: "Play again with [Opponent Name]?"

### Auto-Challenge Flow
If a user arrives at `/game?r=...`, the UI should:
1. Immediately show the `ChallengeCard` for the opponent specified in the URL.
2. If the opponent is online, the "Play" button should be a "Send Rematch" button.
3. If the opponent is offline, show a "Waiting for opponent to return..." status.

## 6. Implementation Steps

1.  **Refactor `GameUrl.ts`**: Switch to `GameUrlOptions` object pattern.
2.  **Update `@tailuge/messaging`**: (If possible) add `rematch` field to `ChallengeMessage`. If not immediately possible, use the `tableId` as a key to look up local rematch state.
3.  **Create `useChallenge` hook**: Migrate logic from `game.tsx`.
4.  **Enhance `ChallengeCard.tsx`**: Add support for displaying scores and "Rematch" styling.
5.  **URL Integration**: Add `JSONCrush` logic to parse the `r` parameter.

## 7. Clean & DRY Principles
- **Stateless URL**: The URL is the source of truth for the rematch context.
- **Hook-based Logic**: Components remain "dumb" and only handle display.
- **Type Safety**: Use the `GameUrlOptions` interface to ensure all required parameters are passed without bloating function signatures.
