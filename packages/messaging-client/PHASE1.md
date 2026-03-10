# Phase 1: Core Presence & Lobby State

## Goal
Implement a minimal `MessagingClient` that can join a lobby, broadcast its own presence, and maintain a real-time, stateful list of other online users.

## Scope

### 1. `MessagingClient` Foundation
- Initialize with `NchanClient` transport.
- Implement `start()` and `stop()` to manage the underlying transport connection.

### 2. Presence Joining
- Implement `joinLobby(user: PresenceMessage)`.
- Automatically send a `"join"` message via `nchanClient.publishPresence`.
- Subscribe to the presence channel via `nchanClient.subscribePresence`.

### 3. Stateful User Tracking
- Implement an internal `Map<userId, PresenceMessage>` to store the "State of the World."
- Handle incoming messages:
    - **"join"**: Add or update the user in the internal map.
    - **"leave"**: Remove the user from the internal map.
- Implement `onUsersChange(callback)` to emit the full list of users whenever the map changes.

### 4. Cleanup
- Implement `leave()` to send an explicit `"leave"` message and stop the subscription.

## Success Criteria

### Automated Test Scenario
1. **Client A** starts and joins the lobby.
2. **Client A** receives an `onUsersChange` update containing only themselves.
3. **Client B** starts and joins the lobby.
4. **Client A** receives an `onUsersChange` update containing **[A, B]**.
5. **Client B** receives an `onUsersChange` update containing **[A, B]**.
6. **Client B** calls `leave()`.
7. **Client A** receives an `onUsersChange` update containing only **[A]**.

## Why this is the "Minimum Slice"
This phase proves the "Stateful API" goal. It moves beyond raw pub/sub by managing an internal model of the lobby, which is the prerequisite for challenges and game tables. It purposefully excludes heartbeats and pruning to keep the initial implementation focused on the reactive data flow.
