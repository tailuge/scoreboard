# Rematch Flow Documentation

The rematch system allows players to quickly start a new game with the same opponent after a match concludes. This flow is managed using a `rematch` query parameter in the URL when the user returns to the lobby.

## The `rematch` Query Parameter

When a player returns to the lobby (`/game`) with a `rematch` parameter, the lobby automatically attempts to initiate a rematch.

### Serialization

The `rematch` parameter is a JSON-serialized object, which is then URL-encoded.

```typescript
// Example serialization using GameUrl utility
const serialized = GameUrl.serializeRematch(rematchParam);
```

### Interface: `RematchParam`

Defined in `src/utils/GameUrl.ts`:

```typescript
export interface RematchParam {
  readonly opponentId: string;      // The userId of the opponent
  readonly opponentName: string;    // The userName of the opponent
  readonly ruleType: string;        // The game mode (e.g., "nineball", "snooker")
  readonly lastScores: {            // Scores from the previous game
    readonly userId: string;
    readonly score: number;
  }[];
  readonly nextTurnId: string;      // Who should go first in the next game
  readonly options?: Record<string, string>; // Game-specific options (e.g., number of reds)
}
```

## Lobby Logic (`src/pages/game.tsx`)

The lobby handles the `rematch` parameter through several `useEffect` hooks:

1.  **Parsing**: On mount, the lobby parses the `rematch` parameter from the URL using `GameUrl.parseRematch`.
2.  **Auto-Challenge**: If a `rematchParam` is present and the opponent is online, the lobby automatically sends a challenge to that opponent (with `RematchInfo` embedded).
3.  **Auto-Accept**: If both players have the `rematch` parameter for each other, they will both auto-send challenges. The lobby includes logic to detect an incoming challenge that matches the active `rematchParam` and auto-accepts it.
    - This creates a "mutual handshake" where the first one to send is accepted by the second.

## Scenario: One Player Has Rematch, Other Does Not

Player A arrives with `rematch` in the URL; Player B arrives at `/game` with no rematch parameter.

1. Player A's lobby detects B is online and auto-sends a challenge to B with `RematchInfo` embedded (scores, `nextTurnId`, `isRematch: true`).
2. Player B sees an **"Incoming Rematch"** challenge card (the UI labels it differently from a normal challenge) and must **manually click Accept**.
3. On accept, `handleAcceptChallenge` runs:
   - `resolveIsFirstPlayer` reads `incomingChallenge.rematch.nextTurnId` to set `first=true/false` in the game URL.
   - Both players navigate to the game with the correct `first` param and a `rematch` query for the next cycle.

## Scenario: Both Players Have Rematch

Both players arrive at `/game` with matching `rematch` parameters (each naming the other as `opponentId`).

1. Both lobbies detect the opponent is online and each auto-sends a challenge to the other.
2. Whichever challenge arrives second at a player's lobby triggers the **auto-accept** `useEffect`:
   ```
   incomingChallenge.rematch &&
   incomingChallenge.challengerId === rematchParam.opponentId &&
   incomingChallenge.ruleType === rematchParam.ruleType
   ```
3. That player auto-accepts without any user interaction. The other player receives the `acceptedChallenge` event and navigates.
4. **No manual interaction is required from either player** — the game starts automatically.
5. There is a timing race: whichever challenge arrives first at the opponent gets auto-accepted. In practice this is benign because both challenges carry the same `nextTurnId` and game options.

## Game URL Integration

When a rematch challenge is accepted, the `rematchParam` is passed to `GameUrl.create`. This ensures that if the game ends and the players return to the lobby again, the cycle can continue (often with `nextTurnId` toggled by the game engine).

### Determining the First Player

In a rematch, the "first" player (the one who starts the game) is determined by `nextTurnId` in the `rematch` data:

- If `nextTurnId` matches the current `userId`, the player is marked as the creator/first player (`first=true` in the game URL).
- If `nextTurnId` is not present, it defaults to the challenger being the first player.

## Test Coverage

### E2E (Playwright) — `src/playwright/rematch-acceptance.test.ts`

Two tests cover the main scenarios end-to-end against the live lobby:

| Test | Scenario | What is verified |
|------|----------|-----------------|
| `one-way rematch should honor nextTurnId` | Alice has rematch URL, Bob does not | Bob sees Accept button; after clicking, Alice gets `first=true`, both game URLs carry `rematch` data with correct `lastScores` |
| `mutual rematch should auto-accept and honor nextTurnId` | Both Alice and Bob have matching rematch URLs | No manual interaction; both navigate automatically; `nextTurnId=bobId` → Bob gets `first=true`, Alice does not |

### Unit Tests (Jest)

There are **no Jest unit tests** for the rematch flow in `src/tests`. The logic lives in `game.tsx` `useEffect` hooks and is only covered by the Playwright E2E suite. Adding unit tests for `GameUrl.parseRematch`/`serializeRematch` and for the `resolveIsFirstPlayer` helper would improve confidence without requiring a live server.
