# Fix Presence Channel Implementation (Consolidated)

## Problem

The user presence list only becomes fully populated when heartbeat messages arrive. New users miss prior presence messages. Additionally, `usePresenceList.ts` and `useServerStatus.ts` should be rationalized together to provide a simpler presence system.

## Proposed Changes

### 1. Nchan Utilities (`src/nchan/nchanpub.ts`)

- Add support for `/publish/presence/` endpoint.
- Add `getSubscriberCount(channelType: "lobby" | "presence")` to fetch active connections for a specific channel type.
- Update `get()` to use `getSubscriberCount("lobby")` for backward compatibility or general health.

### 2. Lobby Context (`src/contexts/LobbyContext.tsx`)

- Create two `NchanSub` instances:
  - `lobbySub` → channel type `"lobby"` (no buffering, for table/game events).
  - `presenceSub` → channel type `"presence"` (with buffering, for user listing).
- Update hooks `useLobbyMessages()` and `usePresenceMessages()` to use these separate streams.

### 3. Consolidated Hook (`src/components/hooks/usePresence.ts`) [NEW]

- Merges logic from `usePresenceList.ts` and `useServerStatus.ts`.
- Handles server health check (`fetch(STATUS_PAGE_URL)`).
- Sends heartbeats to the `presence` channel.
- Manages an internal `Map` of users with TTL-based expiration.
- Returns:
  - `users`: `PresenceUser[]`
  - `totalUsers`: `number` (list length)
  - `isOnline`: `boolean`
  - `isConnecting`: `boolean`
  - `serverStatus`: `string | null`

### 4. Cleanup

- Delete `src/components/hooks/usePresenceList.ts`.
- Delete `src/components/hooks/useServerStatus.ts`.

### 5. UI Updates

- Update `src/pages/lobby.tsx` and `src/pages/game.tsx` to use `usePresence`.
- Update `src/components/OnlineUsersPopover.tsx` to handle the new hook data if necessary.

## Verification

- Verify server health check still works.
- Verify presence list correctly populates with history upon join.
- Verify total user count is accurate (based on list length).
- Verify table/lobby messages still work on the unbuffered channel.
