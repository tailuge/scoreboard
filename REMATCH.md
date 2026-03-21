# Simplified Rematch Support Design

## 1. Overview
This design focuses on statelessness and simplicity by reusing the existing challenge flow. It leverages a `rematch` query parameter to carry session context and enables automatic acceptance when both players initiate a rematch.

## 2. URL Design & Param Handling

### Rematch Parameter
Use a single `rematch` query parameter containing a compressed JSON object.

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
**Implementation:** Use `JSONCrush` to keep the URL manageable. The `GameUrl` utility should handle serialization and deserialization.

## 3. Rematch Flow

### P1 (Challenger) initiates rematch
1.  P1 clicks "Rematch" in the game client.
2.  Redirected to `/game?rematch={...}`.
3.  `game.tsx` parses the `rematch` param and automatically sends a `challenge` message to P2 including the `RematchInfo`.
4.  P1 sees the existing "Challenge Sent" dialog.

### P2 (Recipient) receives rematch
- **Scenario A: P2 is already on `/game?rematch={...}` (Mutual Rematch)**
  1. Both players have the `rematch` info in their URL.
  2. When P2 receives the `challenge` from P1, and it matches the `opponentId` and `ruleType` in P2's URL, P2 **automatically accepts**.
  3. Both players are redirected to the new game.

- **Scenario B: P2 has no rematch info in query param**
  1. P2 receives the `challenge` from P1 containing `RematchInfo`.
  2. `game.tsx` shows the existing "Incoming Challenge" dialog but with refined labels:
     - Title: "Incoming Rematch"
     - Subtitle: Shows scores if available (e.g., "You 1 - 2 Alex").
  3. P2 clicks "Accept" to join.

## 4. Implementation Details

- **`MessagingContext`**: Update `challenge` to accept optional `RematchInfo`.
- **`GameUrl`**: Add `parseRematch(url: URL)` to extract and validate `rematch` metadata.
- **`game.tsx`**:
  - `useEffect` to trigger auto-challenge if `rematch` param exists on mount.
  - `useEffect` to trigger auto-accept if incoming challenge matches `rematch` param.
  - Update "Incoming Challenge" UI block to handle `rematch` metadata.
