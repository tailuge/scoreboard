# Nchan Usage Investigation

## Findings: Duplicate Connections to "lobby"

The investigation into `nchansub.ts` usage reveals that the application opens **two concurrent WebSocket connections** to the "lobby" channel for every user on the Lobby page. This explains the "higher user numbers than expected".

### Root Cause
The `src/pages/lobby.tsx` component uses two custom hooks, both of which instantiate their own `NchanSub` for the same channel ("lobby").

1.  **`src/components/hooks/useLobbyTables.ts`**:
    ```typescript
    useEffect(() => {
      fetchTables()
      const client = new NchanSub("lobby", (e) => { ... })
      client.start()
      return () => client.stop()
    }, [fetchTables])
    ```

2.  **`src/components/hooks/useServerStatus.ts`**:
    ```typescript
    useEffect(() => {
      const sub = new NchanSub("lobby", (e) => { ... })
      sub.start()
      return () => sub.stop()
    }, [fetchActiveUsers])
    ```

When `Lobby` renders, it calls both hooks, establishing two independent WebSockets.

## General Review of Nchan Code

### `src/nchan/nchansub.ts`

*   **Pros:**
    *   **Cleanup:** The class correctly implements a `stop()` method that clears timeouts and closes the socket.
    *   **Resilience:** Contains logic for automatic reconnection (`shouldReconnect`, `reconnectTimeout`).
    *   **Lifecycle:** Usages in hooks correctly utilize the cleanup function in `useEffect` (returning `sub.stop()`).

*   **Cons / Risks:**
    *   **Hardcoded Domain:** The base URL `billiards-network.onrender.com` is hardcoded. This makes local testing or environment switching difficult. It should be moved to an environment variable or configuration file.
    *   **Error Handling:** `JSON.parse` is used inside callbacks. While wrapped in try-catch in the hooks, it's safer to have the transport layer handle basic validation or expose a safer interface.
    *   **Architecture:** The current design encourages "one connection per concern" rather than "one connection per channel".

## Recommendations

1.  **Centralize Lobby Subscription:**
    Create a React Context (e.g., `LobbyContext`) that manages a *single* `NchanSub` instance for the "lobby" channel.
    *   This context can expose the latest message or specific data points (e.g., `activeUsers`, `tablesChanged`).
    *   Both `useLobbyTables` and `useServerStatus` (when used in the lobby) should consume this context instead of opening new connections.

2.  **Externalize Configuration:**
    Move the `base` URL in `NchanSub` to `process.env.NEXT_PUBLIC_WEBSOCKET_URL` or similar.
Suggested change:

   1 -  private readonly base = "billiards-network.onrender.com"
   2 +  private readonly base = process.env.NEXT_PUBLIC_WEBSOCKET_HOST || "billiards-network.onrender.com"
