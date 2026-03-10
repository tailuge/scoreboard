# Multi-User Messaging Library Specification

## Overview
This document outlines the requirements and contract for a unified messaging library designed to handle presence and real-time synchronization. The library uses the existing `NchanClient` as a transport layer (WebSockets for subscribe, POST for publish) and provides a semantic, stateful API for turn-based multi-user applications.

## Goals
- **Zero WebSocket Dependencies**: The consumer project should not interact with WebSockets directly.
- **Unified Client**: A single entry point for both global presence (lobby) and specific table messaging.
- **Stateful Presence**: Internal management of online users, including heartbeats and stale user pruning.
- **Semantic API**: Interaction through high-level methods rather than raw channel/URL manipulation.
- **Platform Agnostic**: Compatible with both Browser and Node.js environments.
- **Transport Reuse**: Leverages existing `NchanClient` from `src/lobby/nchan.ts` as the underlying transport.

---

## Core API Contract

### `MessagingClient`

The main class exposed by the library. Uses `NchanClient` internally for all transport operations.

```typescript
interface MessagingClient {
  /**
   * Initialize and start the client.
   * Handles initial connection and automatic reconnection logic.
   */
  start(): Promise<void>;

  /**
   * Stop all connections, timers (heartbeats), and clean up resources.
   */
  stop(): void;

  /**
   * Joins the global lobby to broadcast presence and see other online users.
   */
  joinLobby(user: PresenceMessage): Promise<Lobby>;

  /**
   * Joins a specific table (game room) for 2-player/spectator communication.
   */
  joinTable(tableId: string): Promise<Table>;
}
```

### `Lobby`

Represents the global presence state.

```typescript
interface Lobby {
  /**
   * Stream of the current online users.
   * Emits the full list or patches whenever users join, leave, or time out.
   */
  onUsersChange(callback: (users: PresenceMessage[]) => void): void;

  /**
   * Broadcast a metadata update for the current user.
   */
  updateProfile(metadata: Record<string, any>): void;

  /**
   * Leave the lobby.
   */
  leave(): void;
}
```

### `Table`

Represents a specific communication channel for a 2-player/spectator scenario at a table.

```typescript
interface Table {
  /**
   * Broadcast an event to all participants at the table.
   */
  publish(event: MessagePayload): void;

  /**
   * Subscribe to events published by other participants.
   */
  onMessage(callback: (event: MessagePayload) => void): void;

  /**
   * Leave the table.
   */
  leave(): void;
}
```

---

## Data Models

### `PresenceMessage`
Information about a user in the lobby, matching the transport layer format from `src/lobby/types.ts`.

```typescript
interface PresenceMessage {
  messageType: "presence";
  type: "join" | "heartbeat" | "leave";
  userId: string;
  userName: string;
  locale?: string;
  originUrl?: string;
  timestamp?: number;
  isBot?: boolean;
  ruletype?: string;
  ua?: string;
  opponentId?: string | null;
  seek?: Seek;
  lastSeen?: number; // Managed internally for pruning
}
```

### `MessagePayload`
A generic structure for table/game events.

```typescript
interface MessagePayload {
  type: string;
  senderId: string;
  timestamp: number;
  payload: any; // Generic data specific to the application logic
}
```

---

## Internal Requirements

### 1. Presence Management
- **Heartbeat**: The library must automatically send periodic "heartbeat" messages (e.g., every 60 seconds) to the lobby while active.
- **Pruning**: The library must maintain an internal map of users and automatically remove users who haven't sent a heartbeat within a specific TTL (e.g., 90 seconds).
- **Unload Handling**: In browser environments, the library should attempt to send a "leave" message on `beforeunload` or `pagehide`.

### 2. Transport & Reconnection
- **Transport Layer**: Uses `NchanClient` from `src/lobby/nchan.ts` as the underlying transport. The WebSocket/POST abstraction is handled internally.
- **Resilience**:
  - Automatic exponential backoff for reconnection on WebSocket failure.
  - Transparently handle transition between online/offline states.
- **Concurrency**: Ensure multiple `Table` instances can coexist if needed (though typically one game at a time).

### 3. State Synchronization
- The library should ensure that when a user joins a lobby, they receive the current "state of the world" or quickly populate it via incoming heartbeats.
- For tables, it should provide a reliable pipe for sequence-sensitive events (optionally implementing sequence numbering if required by the transport).

## Usage Example (Conceptual)

```typescript
const client = new MessagingClient({
  baseUrl: "messaging.example.com",
});

await client.start();

// Lobby interaction
const lobby = await client.joinLobby({
  messageType: "presence",
  type: "join",
  userId: "user-123",
  userName: "Alice",
  locale: "en-US",
});

lobby.onUsersChange((users) => {
  console.log("Online users:", users.length);
});

// Table interaction
const table = await client.joinTable("table-xyz");

table.onMessage((msg) => {
  if (msg.type === "MOVE") {
    applyMove(msg.payload);
  }
});

table.publish({
  type: "MOVE",
  senderId: "user-123",
  timestamp: Date.now(),
  payload: { x: 10, y: 20 }
});
```
