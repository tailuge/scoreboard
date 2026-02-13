# Nchan Usage: Channels and Presence

This document describes how to integrate with the Nchan pub/sub system for real-time updates.

## Channels Overview

The system uses two separate Nchan channels:

| Channel      | Purpose                     | Messages                                           |
| ------------ | --------------------------- | -------------------------------------------------- |
| **Lobby**    | Match events, table updates | `create`, `join`, `spectate`, `complete`, `delete` |
| **Presence** | User presence tracking      | `join`, `heartbeat`, `leave`                       |

## Endpoints

### Lobby Channel

- **Subscribe:** `wss://billiards-network.onrender.com/subscribe/lobby/lobby`
- **Publish:** `https://billiards-network.onrender.com/publish/lobby/lobby`

### Presence Channel

- **Subscribe:** `wss://billiards-network.onrender.com/subscribe/presence/lobby`
- **Publish:** `https://billiards-network.onrender.com/publish/presence/lobby`

## Message Types

All messages include a `messageType` field for multiplexing:

```typescript
type MessageType = "lobby" | "presence";

// Lobby messages
interface LobbyMessage {
  messageType: "lobby";
  type?: "create" | "join" | "spectate" | "complete" | "delete";
  // ...additional fields
}

// Presence messages
interface PresenceMessage {
  messageType: "presence";
  type: "join" | "heartbeat" | "leave";
  userId: string;
  userName: string;
  timestamp?: number;
}
```

## External App Integration: Online User Count

To display the online user count in an external application, subscribe to the presence channel and track unique users.

### Implementation Guide

The following TypeScript code tracks online users by `userId`. A user is considered online if a `heartbeat` or `join` was seen in the last 90 seconds.

```typescript
type PresenceMessage = {
  messageType: "presence";
  type: "join" | "heartbeat" | "leave";
  userId: string;
  userName: string;
  timestamp?: number;
};

const TTL_MS = 90_000;

function connectLobbyCount(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const users = new Map<string, number>();
  const wsUrl = "wss://billiards-network.onrender.com/subscribe/presence/lobby";
  let socket: WebSocket | null = null;

  const connect = () => {
    socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as PresenceMessage;
        if (data.messageType !== "presence") return;
        const lastSeen = data.timestamp ?? Date.now();
        if (data.type === "leave") {
          users.delete(data.userId);
        } else {
          users.set(data.userId, lastSeen);
        }

        const now = Date.now();
        for (const [userId, seenAt] of users) {
          if (now - seenAt > TTL_MS) {
            users.delete(userId);
          }
        }

        element.textContent = users.size.toString();
      } catch {
        // Ignore non-JSON messages
      }
    };

    socket.onclose = () => {
      // Reconnect after 30 seconds if connection is lost
      setTimeout(connect, 30000);
    };

    socket.onerror = () => {
      socket?.close();
    };
  };

  connect();
}
```

### Usage in HTML

```html
<a href="https://scoreboard-tailuge.vercel.app/lobby" id="lobbycount">0</a>

<script>
  // Assuming the TS is compiled or included
  connectLobbyCount("lobbycount");
</script>
```

## Lobby Events Integration

For applications that need to react to match events, subscribe to the lobby channel:

```typescript
type LobbyMessage = {
  messageType: "lobby";
  type?: "create" | "join" | "spectate" | "complete" | "delete";
  matchId?: string;
  tableId?: string;
  [key: string]: any;
};

function connectLobbyEvents(onEvent: (msg: LobbyMessage) => void) {
  const wsUrl = "wss://billiards-network.onrender.com/subscribe/lobby/lobby";
  const socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.messageType === "lobby") {
        onEvent(data);
      }
    } catch {
      // Ignore parse errors
    }
  };

  return socket;
}
```

## Considerations

- **Quiet Failures:** The implementation handles connection errors silently and attempts to reconnect every 30 seconds.
- **CORS:** The Nchan server is configured to allow CORS requests from all origins.
- **Buffer Replay:** The presence channel is buffered and replays recent messages so new subscribers can build a full user list.
