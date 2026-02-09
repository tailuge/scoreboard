# Online Users List Plan

## Summary
Add a username list of online users without Vercel KV by using a presence channel in Nchan. Clients publish join + heartbeat events and maintain a local TTL map. Nchan buffers presence messages long enough for new subscribers to reconstruct the list from recent heartbeats.

## Options Outline
1. Client heartbeat over Nchan (Recommended)
- Publish `join` + periodic `heartbeat` events to a presence channel.
- Each client keeps an in-memory map keyed by `userId` with `lastSeen`.
- TTL pruning (e.g., 90s) determines “online”.
- Requires Nchan message buffering + timeout for presence channel so newcomers can replay recent heartbeats.
- No KV usage; approximate but robust enough.

2. Server hooks + store
- Configure `nchan_subscribe_request` / `nchan_unsubscribe_request` to call an app endpoint.
- Endpoint persists online list in a store (Redis or similar).
- More accurate; adds infra and operational cost.
- Not Vercel KV, but still a store to run.

3. Hybrid snapshot
- Clients send heartbeats; a lightweight worker periodically publishes a snapshot to a channel with `message_buffer_length 1`.
- Fast initial load plus regular client updates.
- More moving parts; still no KV if snapshot lives in Nchan.

## Chosen Approach
Client heartbeat over Nchan with TTL 90s (heartbeat every 30s), lobby sidebar list, limit to 50 users, and show “+N more” if overflow.

## Public API / Interface Changes
- Presence event schema (client-side):
  - `type`: `"join" | "heartbeat" | "leave"`
  - `userId`: string
  - `userName`: string
  - `ts`: number (ms epoch)
- Presence subscription channel:
  - `wss://{host}/subscribe/presence/presence`
  - `https://{host}/publish/presence/presence`
- No changes to existing lobby API routes.

## Nchan Config Changes
Update `src/nchan/nchan.conf` to add presence endpoints with buffering and timeout:
- `location ~ ^/publish/presence/(?<channel>\w+)$`
  - `nchan_publisher`
  - `nchan_message_buffer_length 1000`
  - `nchan_message_timeout 2m`
- `location ~ ^/subscribe/presence/(?<channel>\w+)$`
  - `nchan_subscriber`
  - `nchan_message_buffer_length 1000`
  - `nchan_message_timeout 2m`
  - `nchan_subscriber_first_message oldest`
  - `nchan_subscriber_timeout 0`

## Client Implementation Plan
1. Extend Nchan Pub/Sub helpers
- Update `src/nchan/nchanpub.ts` to accept a `channelType` (default `"lobby"`).
- Reuse `NchanSub` (already supports `channelType`) for presence.

2. Presence hook
- Add `src/components/hooks/usePresenceList.ts`.
- Responsibilities:
  - Publish `join` on mount and `leave` on unmount.
  - Publish `heartbeat` every 30s.
  - Subscribe to presence channel; update a `Map<userId, { userName, lastSeen }>` on any event.
  - Prune entries older than 90s (interval every 10s).
  - Expose `users: Array<{ userId, userName }>` sorted by `lastSeen` desc (limit 50).

3. UI Integration
- Add a simple list component (new or inline) in lobby right badge area or panel.
- Display top 50 usernames and “+N more” when overflow.
- Keep existing `OnlineCount` derived from `basic_status` for cross-check (optional: also display count from presence list).

## Test Cases and Scenarios
- Unit tests for presence reducer/processor logic (pure function):
  - `join` adds user.
  - `heartbeat` updates `lastSeen` and `userName`.
  - `leave` removes user.
  - TTL pruning removes stale users.
- Jest test for hook behavior can mock `NchanSub` and `NchanPub` to verify publish calls and event handling.

## Edge Cases
- Multiple tabs: use `userId` as key so duplicates collapse.
- Disconnected tabs: TTL pruning handles stale sessions.
- New user list on first load: buffered presence heartbeats ensure list builds quickly.
- Username changes: heartbeat event updates `userName` for same `userId`.

## Assumptions / Defaults
- Heartbeat interval: 30s
- TTL: 90s
- Presence channel message timeout: 2m
- Buffer length: 1000
- List location: Lobby sidebar
- Max list size: 50 entries
