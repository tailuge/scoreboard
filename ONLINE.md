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

### Phase 1: Nchan Config and Tests

- Update `src/nchan/nchan.conf` with presence endpoints
- Add tests to existing nchan test script for:
  - Publishing to presence channel
  - Subscribing and receiving buffered messages
  - Message expiry after 90s

### Phase 2: Publishing and Subscribe

- Update `src/nchan/nchanpub.ts` to support `channelType: "presence"`
- Ensure `NchanSub` supports presence channel type
- Add `src/components/hooks/usePresenceList.ts`:
  - Subscribe to presence channel
  - Publish `join` on mount, `leave` on unmount
  - Publish `heartbeat` every 60s
  - Maintain `Map<userId, { userName, lastSeen }>` from received messages
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
