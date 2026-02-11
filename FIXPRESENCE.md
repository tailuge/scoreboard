# Fix Presence Channel Implementation

## Problem

The user presence list only becomes fully populated when heartbeat messages arrive. New users miss prior presence messages because presence data is published to the lobby channel (no buffering) instead of the dedicated presence channel (with buffering).

## Current State

- **Publishing**: All messages (lobby + presence) go to `/publish/lobby/lobby`
- **Subscribing**: Client subscribes to `/subscribe/lobby/lobby` (no buffering)
- **Result**: New users miss all prior presence messages

## Implementation Plan

### 1. `NchanPub` (`src/nchan/nchanpub.ts`)

- Add `presencePublishUrl` → `/publish/presence/{channel}`
- Route `publishPresence()` to `presencePublishUrl`
- Replace `get()` with `getSubscriberCount()`:
  - POST to `presencePublishUrl` with `Accept: application/json`
  - Return `response.subscribers`

### 2. `LobbyContext` (`src/contexts/LobbyContext.tsx`)

- Create two `NchanSub` instances:
  - `lobbySub` → channel type `"lobby"` (no buffering, live events only)
  - `presenceSub` → channel type `"presence"` (with buffering, gets history)
- Route messages to appropriate state handlers

### 3. `useServerStatus` (`src/components/hooks/useServerStatus.ts`)

- Change `NchanPub("lobby").get()` → `NchanPub("lobby").getSubscriberCount()`

### 4. `usePresenceList` - No changes needed

- Already consumes from `usePresenceMessages()`

### 5. Tests

- Update `nchanpub.test.ts` for new URL and method
- Update mocks in `useServerStatus.test.ts`, `usePresenceList.test.ts`

### 6. Config (`src/nchan/nchan.conf`) - Already correct

- `/publish/presence/` has buffering (1000 messages, 90s timeout)
- `/subscribe/presence/` has `nchan_subscriber_first_message oldest`

## Verification

After implementation, test with:

```bash
# Should return subscriber count for presence channel
curl -X POST -H "Accept: application/json" \
  https://billiards-network.onrender.com/publish/presence/lobby
```

Expected response:

```json
{"messages": N, "subscribers": N, ...}
```

## Open Question

Should we add explicit "leave" message on page unload/visibility hidden, or keep TTL-based cleanup (90s)?

Current: TTL-based (users expire after 90s without heartbeat)
Alternative: Send "leave" on `beforeunload` or `visibilitychange` events
