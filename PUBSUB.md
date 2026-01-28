# Nchan Usage Investigation (COMPLETED)

## Findings: Duplicate Connections to "lobby" (RESOLVED)

The investigation into `nchansub.ts` usage revealed that the application was opening **two concurrent WebSocket connections** to the "lobby" channel for every user on the Lobby page.

### Root Cause (FIXED)
The `src/pages/lobby.tsx` component used two custom hooks, both of which instantiated their own `NchanSub` for the same channel ("lobby").

### Solution
1.  **LobbyContext**: A new React Context was created to manage a single `NchanSub` instance for the "lobby" channel.
2.  **Hook Refactoring**: `useLobbyTables` and `useServerStatus` were refactored to consume `lastMessage` from `LobbyContext`.
3.  **Global Provider**: `LobbyProvider` was added to `src/pages/_app.tsx` to ensure availability across the application.

## General Review of Nchan Code

### `src/nchan/nchansub.ts`

*   **Pros:**
    *   **Cleanup:** The class correctly implements a `stop()` method that clears timeouts and closes the socket.
    *   **Resilience:** Contains logic for automatic reconnection (`shouldReconnect`, `reconnectTimeout`).
    *   **Lifecycle:** Usages in hooks correctly utilize the cleanup function in `useEffect`.

*   **Cons / Risks:**
    *   **Externalized Configuration:** Fixed. Now uses `process.env.NEXT_PUBLIC_WEBSOCKET_HOST`.
    *   **Architecture:** Improved via `LobbyContext`.

## Implementation Status

- [x] Centralize Lobby Subscription via `LobbyContext`
- [x] Refactor `useLobbyTables` to use context
- [x] Refactor `useServerStatus` to use context
- [x] Externalize WebSocket host configuration
- [x] Fix and verify tests
