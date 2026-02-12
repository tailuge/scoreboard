# Presence-Only Online Count + Dual Nchan Subscriptions

  ## Summary

  Move presence publishing/subscribing to the dedicated Nchan presence channel (with replay), and derive online counts directly from presence
  messages. Keep lobby channel subscription intact for table-join/live events. This adds a second WebSocket subscription in LobbyContext and
  removes the separate ServerStatus-based active user count.

  ## Changes (Decision-Complete)

  ### 1) Nchan publishing: split lobby vs presence endpoints

  - Update NchanPub in src/nchan/nchanpub.ts:
      - Keep lobby publishes on /publish/lobby/{channel}.
      - Add a presence publish URL /publish/presence/{channel}.
      - publishPresence() posts to the presence URL (not lobby).
      - Keep get() method for now but it’s no longer used by UI; optionally mark deprecated in a comment.
  - Channel id for presence remains "lobby" (per your choice), so all presence traffic goes through /publish/presence/lobby and /subscribe/
    presence/lobby.

  ### 2) Dual subscriptions in LobbyContext

  - In src/contexts/LobbyContext.tsx:
      - Create two NchanSub instances:
          - lobbySub = new NchanSub("lobby", ..., "lobby") (existing behavior).
          - presenceSub = new NchanSub("lobby", ..., "presence") (new).
      - Lobby sub routes to lastLobbyMessage + legacy lastMessage.
      - Presence sub routes to lastPresenceMessage.
      - Keep existing hooks useLobbyMessages() and usePresenceMessages() unchanged.
      - Ensure both subs are started and stopped in the same useEffect.

  ### 3) Presence list owns the online count

  - In src/components/hooks/usePresenceList.ts:
      - Continue to publish join/heartbeat via NchanPub("lobby"), now hitting /publish/presence/lobby.
      - Extend hook return shape to { users, count }.
      - Compute count as the number of active (TTL-valid) unique users before slicing to MAX_USERS.
      - Keep users limited to 50 for the popover list.
      - (Optional cleanup) Prune expired entries from the map as part of the computation to avoid long-lived stale keys.

### 4) UI reads count from presence list

  - Update src/pages/lobby.tsx and src/pages/game.tsx:
      - Remove useServerStatus usage for activeUsers.
      - Use const { users: presenceUsers, count: presenceCount } = usePresenceList(...).
      - Pass count={presenceCount} and totalCount={presenceCount} to OnlineUsersPopover.
  - Keep useServerStatus only where it’s still needed (e.g. CreateTable for isOnline).

  ### 5) Simplify useServerStatus

  - In src/components/hooks/useServerStatus.ts:
      - Remove activeUsers from state and return shape.
      - Remove fetchActiveUsers and the /api/connected broadcast (no longer needed for count).
      - Keep health check semantics (isOnline, isConnecting, serverStatus) intact.

  ### 6) Docs + scripts

  - Update src/nchan/NCHANUSAGE.md to describe presence-based count:
      - Replace basic_status + connected flow with presence WebSocket.
      - Example should show subscribing to wss://.../subscribe/presence/lobby and counting unique users.
  - Update src/nchan/testnchan.sh to publish/subscribe on /presence/lobby.

  ## Public API/Interface Changes

  - usePresenceList() will now return { users, count } (new count field).
  - useServerStatus() will no longer return activeUsers or fetchActiveUsers.

  ## Test Plan

  - Update tests to reflect new behavior:
      - src/tests/usePresenceList.test.ts: assert count is correct; ensure count > 50 still reports total even if list is capped.
      - src/tests/useServerStatus.test.ts: remove activeUsers assertions and NchanPub mocks.
      - src/tests/nchan/nchanpub.test.ts: verify publishPresence posts to /publish/presence/{channel}.
      - src/tests/lobby.test.tsx and src/tests/game.test.tsx: remove useServerStatus mocks; update usePresenceList mocks to include count.
  - No changes to table-join logic tests (useLobbyTables.test.ts) expected.

  ## Edge Cases & Behavioral Notes

  - Online count will now reflect unique users by userId within TTL, not raw socket connections.
  - If user opens multiple tabs with the same userId, count remains 1 (latest heartbeat wins).
  - UI will show 0 when no presence messages have arrived yet.

  ## Assumptions

  - Presence channel id is "lobby" across all presence pub/sub.
  - Online count should be TTL-based unique users from presence messages (not Nchan subscriber count).
  - It’s acceptable to remove activeUsers from useServerStatus and update internal callers accordingly.
