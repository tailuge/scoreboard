# Phase 2: Peer-to-Peer Challenges

## Goal
Implement the full challenge lifecycle (Offer, Accept, Decline, Cancel) within the `Lobby` and provide a bridge to the `Table` interface.

## Scope

### 1. Challenge Actions in `Lobby`
- `challenge(userId: string, ruleType: string)`:
    - Generates a unique `tableId`.
    - Publishes a `"challenge"` message of type `"offer"`.
    - Returns the `tableId`.
- `acceptChallenge(userId: string, ruleType: string)`:
    - Publishes a `"challenge"` message of type `"accept"`.
    - Returns a `Table` instance for the given `tableId`.
- `onChallenge(callback)`:
    - Subscribes to incoming `"challenge"` messages on the presence channel.
    - Filters messages directed at the current user (`recipientId`).

### 2. Basic `Table` Interface
- Implement a skeleton `Table` class in `src/table.ts`.
- Implement `join()` (subscription) and `leave()` (cleanup).
- For Phase 2, this can just be the transport bridge without full game logic.

### 3. MessagingClient Integration
- Implement `joinTable(tableId: string)` in `MessagingClient` to allow direct joining (e.g., for spectators or challengers).

## Success Criteria

### Automated Test Scenario: Successful Match
1. **Client A** challenges **Client B**.
2. **Client B** receives the `"offer"` via `onChallenge`.
3. **Client B** calls `acceptChallenge`.
4. **Client A** receives the `"accept"` (can be tracked via `onChallenge` or presence).
5. Both clients now have a `Table` instance with the same `tableId`.

### Automated Test Scenario: Decline/Cancel
1. **Client A** challenges **Client B**.
2. **Client B** calls a decline (type: `"decline"`).
3. **Client A** receives the notification and can clean up.
4. OR: **Client A** cancels (type: `"cancel"`) before B responds.

## Why this is Phase 2
This phase introduces targeted messaging (Point-to-Point) over the pub/sub bus. It also sets up the transition from the "Lobby" (many users) to a "Table" (private group), which is the final piece of the core specification.
