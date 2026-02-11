# Online Users List Plan

## Summary

Add a username list of online users without Vercel KV by using presence messages multiplexed over the lobby WebSocket connection. Clients publish heartbeat events and maintain a local TTL map. Nchan buffers presence messages long enough for new subscribers to reconstruct the list from recent heartbeats.

## Chosen Approach

Client heartbeat over Nchan with message timeout 90s (heartbeat every 60s), client-side TTL 90s, lobby sidebar list, limit to 50 users, and show "+N more" if overflow.

## Message Multiplexing Architecture

All messages (lobby and presence) flow through a single WebSocket connection to the lobby channel, using a `messageType` discriminator field for routing.

### Message Flow

1. **Publishing**: Code publishes using `publishLobby()` or `publishPresence()` methods on `NchanPub`
2. **Transport**: Messages sent to `/publish/lobby/{channel}` with `messageType` discriminator
3. **Reception**: `LobbyProvider` receives all messages on single WebSocket
4. **Routing**: `parseNchanMessage()` parses and routes based on `messageType`
5. **Distribution**: Messages routed to appropriate state (lobby or presence)
6. **Consumption**: Components use `useLobbyMessages()` or `usePresenceMessages()`

### Type Definitions (`src/nchan/types.ts`)

- `MessageType`: `"lobby" | "presence"` - discriminator
- `LobbyMessage`: Match events, table updates
- `PresenceMessage`: User join/leave/heartbeat with `userId`, `userName`, `type`
- Type guards: `isLobbyMessage()`, `isPresenceMessage()`
- `parseNchanMessage()`: Parses with backward compatibility for legacy messages

### Publishing (`src/nchan/nchanpub.ts`)

- `publishLobby(event)`: Publishes with `messageType: "lobby"`
- `publishPresence(event)`: Publishes with `messageType: "presence"`
- Legacy `post()` method maintained for compatibility

### Context & Hooks (`src/contexts/LobbyContext.tsx`)

- `LobbyProvider`: Single WebSocket, routes messages by type
- `useLobbyMessages()`: Access lobby messages
- `usePresenceMessages()`: Access presence messages
- `useLobbyContext()`: Legacy hook (deprecated)

## Nchan Config Changes

Presence endpoints in `src/nchan/nchan.conf` for buffered message delivery:

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

### Phase 0: Message Multiplexing Infrastructure [COMPLETED]

**Files Created:**

- `src/nchan/types.ts` - Type definitions, guards, and parser
- `src/tests/nchan/types.test.ts` - Tests for message parsing

**Files Modified:**

- `src/nchan/nchanpub.ts` - Added `publishLobby()` and `publishPresence()` methods
- `src/contexts/LobbyContext.tsx` - Message routing, `useLobbyMessages()`, `usePresenceMessages()`
- `src/tests/nchan/nchanpub.test.ts` - Tests for typed publishing

**Backward Compatibility:**

- Legacy messages (without `messageType`) treated as lobby messages
- Existing `useLobbyContext()` continues to work

### Phase 1: Nchan Config and Tests [COMPLETED]

- Updated `src/nchan/nchan.conf` with presence endpoints
- Updated `src/nchan/testnchan.sh` with presence channel tests:
  - Publishing to presence channel
  - Subscribing and receiving buffered messages

### Phase 2: Presence Hook Implementation

Add `src/components/hooks/usePresenceList.ts`:

- Use `usePresenceMessages()` from LobbyContext
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
