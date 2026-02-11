# Online Users List Plan

## Summary

Add a username list of online users without Vercel KV by using a presence channel in Nchan. Clients publish heartbeat events and maintain a local TTL map. Nchan buffers presence messages long enough for new subscribers to reconstruct the list from recent heartbeats.

## Chosen Approach

Client heartbeat over Nchan with message timeout 90s (heartbeat every 60s), client-side TTL 90s, lobby sidebar list, limit to 50 users, and show "+N more" if overflow.

## Public API / Interface Changes

- Presence event schema (client-side):
  - `type`: `"join" | "heartbeat" | "leave"`
  - `userId`: string
  - `userName`: string
- Presence subscription channel:
  - `wss://{host}/subscribe/presence/presence`
  - `https://{host}/publish/presence/presence`
- No changes to existing lobby API routes.

## Nchan Config Changes

Update `src/nchan/nchan.conf` to add presence endpoints with buffering and timeout:

- `location ~ ^/publish/presence/(?<channel>\w+)$`
  - `nchan_publisher`
  - `nchan_message_buffer_length 1000`
  - `nchan_message_timeout 90s`
- `location ~ ^/subscribe/presence/(?<channel>\w+)$`
  - `nchan_subscriber`
  - `nchan_message_buffer_length 1000`
  - `nchan_message_timeout 90s`
  - `nchan_subscriber_first_message oldest`
  - `nchan_subscriber_timeout 0`

## Implementation Phases

### Phase 0: Refactor Lobby Connection for Message Multiplexing [NEW - Required First]

**Problem Identified:** The current `LobbyProvider` creates a single WebSocket connection to the lobby channel. Adding a separate presence channel subscription (as originally planned in Phase 2) would create a second WebSocket connection per client, which is inefficient.

**Solution:** Refactor to use a single WebSocket connection that handles multiple message types.

#### Option A: Multiplex via Lobby Channel (Recommended - Simpler)
- Update lobby channel messages to include a `messageType` field (`"lobby" | "presence"`)
- Presence messages published to `/publish/lobby/lobby` with `messageType: "presence"`
- Refactor `LobbyContext.tsx`:
  - Add message routing based on `messageType`
  - Expose separate observables/hooks for lobby vs presence messages
  - Create `usePresenceMessages()` hook that filters for presence messages
  - Keep existing `useLobbyContext()` for lobby messages
- **Pros:** Single connection, no nchan config changes needed
- **Cons:** Mixes concerns in one channel (acceptable tradeoff)

#### Option B: WebSocket Multiplexing with Message Router (More Complex)
- Create `src/nchan/NchanMultiplexer.ts`:
  - Single WebSocket connection
  - Message router that dispatches to multiple subscribers based on message type
  - Registry pattern for subscribing to specific message types
- Refactor `LobbyContext` to use multiplexer
- **Pros:** Cleaner separation of concerns
- **Cons:** More complex refactoring, harder to test

**Decision Required:** Recommend **Option A** for simplicity unless you prefer architectural purity.

#### Refactoring Steps (Option A):
1. Create `src/nchan/types.ts`:
   - Define message type discriminators
   - `LobbyMessage` and `PresenceMessage` interfaces
2. Update `LobbyContext.tsx`:
   - Add message type routing
   - Create `usePresenceMessages()` hook
   - Maintain backward compatibility for existing lobby message consumers
3. Update `nchanpub.ts`:
   - Add helper to publish typed messages with `messageType` field
4. Add tests for message routing

### Phase 1: Nchan Config and Tests [Completed]

- Update `src/nchan/nchan.conf` with presence endpoints
- Add tests to existing nchan test script for:
  - Publishing to presence channel
  - Subscribing and receiving buffered messages
  - Message expiry after 90s

### Phase 2: Presence Hook Implementation (Updated)

- Update `src/nchan/nchanpub.ts`:
  - Add `publishPresence(event)` helper that publishes to lobby with `messageType: "presence"`
  - Reuse existing lobby channel endpoint
- Add `src/components/hooks/usePresenceList.ts`:
  - Use `usePresenceMessages()` from refactored LobbyContext
  - Publish `join` on mount, `leave` on unmount via `publishPresence()`
  - Publish `heartbeat` every 60s
  - Maintain `Map<userId, { userName, lastSeen }>` from received presence messages
  - Prune entries older than 90s (interval every 10s)
  - Expose `users: Array<{ userId, userName }>` sorted by `lastSeen` desc (limit 50)

### Phase 3: UI Integration

- Add list component in lobby (right badge area or panel)
- Display top 50 usernames with "+N more" for overflow
- Optional: cross-check with `OnlineCount` from `basic_status`

## Test Cases and Scenarios

- Unit tests for presence reducer/processor logic (pure function):
  - `join` adds user
  - `heartbeat` updates `lastSeen` and `userName`
  - `leave` removes user
  - TTL pruning removes stale users
- Jest test for hook behavior with mocked `NchanSub` and `NchanPub`

## Edge Cases

- Multiple tabs: use `userId` as key so duplicates collapse
- Disconnected tabs: TTL pruning handles stale sessions
- New user list on first load: buffered presence heartbeats ensure list builds quickly
- Username changes: heartbeat event updates `userName` for same `userId`

## Configuration

- Heartbeat interval: 60s
- Client-side TTL: 90s
- Nchan message timeout: 90s
- Buffer length: 1000
- List location: Lobby sidebar
- Max list size: 50 entries
