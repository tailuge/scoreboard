# Phase 3: Presence Reliability (Heartbeats & Pruning)

## Goal
Ensure the lobby state remains accurate by automatically broadcasting heartbeats and pruning users who haven't been seen within a specific TTL, using the server's `_meta.ts` as the absolute source of truth.

## Scope

### 1. Automatic Heartbeats in `Lobby`
- Implement a periodic timer (e.g., every 30 seconds) that calls `nchan.publishPresence` with type `"heartbeat"`.
- Ensure the timer starts on `join()` and stops on `leave()`.

### 2. Stale User Pruning
- Maintain a `lastSeen` timestamp for every user in the internal `Map`.
- **Source of Truth**: Update `lastSeen` using the `ts` field from the incoming message's `_meta` object.
- Implement a pruning check (e.g., every 10 seconds) that removes users whose `lastSeen` is older than the TTL (e.g., 90 seconds).

### 3. Page Visibility Support (Browser-friendly)
- Ensure the heartbeat timer is resilient to being paused/resumed if the `MessagingClient` is notified of visibility changes (to be handled by the consumer, but the library must provide the hooks).

## Success Criteria

### Automated Test Scenario: Silent Disconnect
1. **Client A** and **Client B** join the lobby.
2. **Client B** "crashes" (manually stop its heartbeat and don't call `leave()`).
3. **Client A** initially sees **Client B** in the list.
4. **Client A** waits for the TTL (90s).
5. **Client A** receives an `onUsersChange` update where **Client B** is gone.

### Automated Test Scenario: Heartbeat Persistence
1. **Client A** and **Client B** join.
2. Both stay idle for several minutes.
3. Both remain in each other's user lists due to successful heartbeat exchanges.

## Why this is Phase 3
This completes the "Stateful" mandate of the specification. It handles the "unreliable network" reality of web applications and ensures that the `onUsersChange` stream provides a high-integrity view of truly active users.
