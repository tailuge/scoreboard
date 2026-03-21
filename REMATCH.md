# Improved Rematch Support Design (REMATCH2.md)

## 1. Overview
This design focuses on statelessness, modularity, and enhanced messaging for a seamless rematch experience. It prioritizes explicit data structures, a clean hook-based architecture, and a phased rollout.

## 2. Messaging Contract Update (`@tailuge/messaging`) [DONE]

**Phase 1** involves updating the `ChallengeMessage` to include context about the previous game.

```typescript
export interface RematchInfo {
  readonly lastScores: { readonly userId: string; readonly score: number }[];
  readonly isRematch: boolean;
  readonly nextTurnId: string; // The ID of the player who should break/go first
}

export interface ChallengeMessage {
  // ... existing fields
  readonly rematch?: RematchInfo;
}
```

**Reasoning:** Explicitly listing scores by `userId` ensures that both the challenger and the recipient can render the scoreboard accurately without relying on positional assumptions.

## 3. URL Design & Param Handling

### Readable Rematch Parameter
Use a single `rematch` query parameter containing a compressed, but fully-named JSON object. Avoid short aliases like `oid` or `s` to maintain consistency with the rest of the application.

**Structure of `rematch` (uncompressed):**
```json
{
  "opponentId": "user-456",
  "opponentName": "Alex",
  "ruleType": "snooker",
  "lastScores": [
    { "userId": "user-123", "score": 2 },
    { "userId": "user-456", "score": 1 }
  ],
  "nextTurnId": "user-456"
}
```
**Implementation:** Use `JSONCrush` and `encodeURIComponent` to keep the URL manageable. The application logic should parse this into the `RematchInfo` interface.

## 4. Architecture: `useChallengeFlow` Hook

To keep `game.tsx` clean and "dumb," extract the complex challenge and rematch state machine into a dedicated hook.

```typescript
// src/hooks/useChallengeFlow.ts
export function useChallengeFlow() {
  // 1. Detect and parse 'rematch' URL param on mount.
  // 2. Manage 'pendingChallenge', 'incomingChallenge', and 'acceptedChallenge' state.
  // 3. Provide methods: sendRematch(), acceptRematch(), declineRematch().
  // 4. Return UI-ready state: isRematchRequest, isAutoAccepting, lastScores, opponentInfo.
}
```

## 5. Visual Design & UX

### Rematch Notification UI
When an incoming challenge contains `rematch` metadata, the UI should transform:
- **Title**: "Rematch Request" (instead of "Incoming Challenge")
- **Scoreboard**: Display the scores prominently, e.g., `You 2 - 1 Alex`.
- **Action**: "Accept Rematch" (Emerald green button).

### Auto-Challenge & Mutual Rematch Flow
If a user arrives at `/game?rematch=...`, the `useChallengeFlow` hook should:
1.  **Detect Incoming Match**: Check if an incoming challenge already exists from the specified `opponentId`.
2.  **Auto-Accept**: If an incoming challenge exists (or arrives while the user is in the "rematch pending" state), automatically trigger `acceptChallenge` and redirect to the game without requiring a second click.
3.  **Fallback**: If no incoming challenge exists, pre-populate the `ChallengeCard` for the opponent and show a "Send Rematch" button.

This ensures that if both players click "Rematch" in the game client, they are immediately reconnected.

## 6. Phased Implementation

1.  **Phase 1: Messaging Contract**: Update `@tailuge/messaging` to support the `rematch` field in `ChallengeMessage`.
2.  **Phase 2: Hook & URL Logic**: Implement `useChallengeFlow.ts` and update `GameUrl.ts` to support the new parameter.
3.  **Phase 3: UI Enhancement**: Update `ChallengeCard.tsx`, `RematchNotification` (new component), and `game.tsx` to handle the `RematchInfo` and display scores.
4.  **Phase 4: Testing & Verification**: Use a dedicated test page.

## 7. Testing Strategy

### `public/rematch-test.html`
Create a new test page based on `public/test.html` to simulate the full rematch flow between two virtual players in a single viewport.

- **Feature**: Buttons to trigger "Send Rematch with scores [X, Y]".
- **Verification**: Ensure that the "Incoming Challenge" UI on the recipient's side correctly displays the scores and the "Rematch Request" label.
- **Verification**: Ensure that accepting the rematch preserves the `nextTurnId` and `tableId` context in the final redirect.

## 8. Clean & DRY Principles
- **Explicit over Implicit**: Use full field names and unambiguous score arrays.
- **Hook-based Logic**: Components handle "what" to show; hooks handle "how" it works. This includes the auto-accept state machine logic.
- **Configuration-driven URLs**: `GameUrl.ts` uses an options object to avoid signature bloat.
- **Mutual Acceptance**: The "first one to send, second one to auto-accept" pattern resolves the race condition without additional messaging.
