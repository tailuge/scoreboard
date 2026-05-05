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
2.  **Auto-Challenge**: If a `rematchParam` is present and the opponent is online, the lobby automatically sends a challenge to that opponent.
3.  **Auto-Accept**: If both players have the `rematch` parameter for each other, they will both auto-send challenges. The lobby includes logic to detect an incoming challenge that matches the active `rematchParam` and auto-accepts it.
    - This creates a "mutual handshake" where the first one to send is accepted by the second.

## Game URL Integration

When a rematch challenge is accepted, the `rematchParam` is passed to `GameUrl.create`. This ensures that if the game ends and the players return to the lobby again, the cycle can continue (often with `nextTurnId` toggled by the game engine).

### Determining the First Player

In a rematch, the "first" player (the one who starts the game) is determined by `nextTurnId` in the `rematch` data:

- If `nextTurnId` matches the current `userId`, the player is marked as the creator/first player (`first=true` in the game URL).
- If `nextTurnId` is not present, it defaults to the challenger being the first player.
