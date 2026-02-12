# Nchan Usage: Live Online User Count (Presence-Based)

This document describes how to integrate a real-time online user count using the Nchan presence channel.

## Overview

The online count is derived from presence messages (join/heartbeat/leave). The presence channel is buffered and replays recent messages so new subscribers can build a full list.

## Endpoints

- **Presence WebSocket URL:** `wss://billiards-network.onrender.com/subscribe/presence/lobby`

## Implementation Guide

The following TypeScript code can be used in a plain HTML/TS environment. It updates an element with the current number of online users based on presence.

### 1. Live Updates

Subscribe to the presence channel and track unique users by `userId`. Consider a user online if a `heartbeat` or `join` was seen in the last 90 seconds.

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

### 3. Usage in HTML

Ensure your element exists in the DOM:

```html
<a href="https://scoreboard-tailuge.vercel.app/lobby" id="lobbycount">0</a>

<script>
  // Assuming the TS is compiled or included
  connectLobbyCount("lobbycount");
</script>
```

## Considerations

- **Quiet Failures:** The implementation handles connection errors silently and attempts to reconnect every 30 seconds.
- **CORS:** The Nchan server is configured to allow CORS requests from all origins.
