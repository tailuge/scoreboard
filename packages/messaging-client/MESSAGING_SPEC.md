# Multi-User Messaging Library Specification

## Overview

This document outlines the requirements and contract for a unified messaging library designed to handle presence and real-time synchronization. The library uses the existing `NchanClient` as a transport layer (WebSockets for subscribe, POST for publish) and provides a semantic, stateful API for turn-based multi-user applications.

## Goals

- **Zero WebSocket Dependencies**: The consumer project should not interact with WebSockets directly.
- **Unified Client**: A single entry point for both global presence (lobby) and specific table messaging.
- **Stateful Presence**: Internal management of online users, including heartbeats and stale user pruning.
- **Semantic API**: Interaction through high-level methods rather than raw channel/URL manipulation.
- **Platform Agnostic**: Compatible with both Browser and Node.js environments.
- **Transport Reuse**: Leverages existing `NchanClient` from `src/lobby/nchanclient.ts` as the underlying transport.

---

## Core API Contract

### `MessagingClient`

The main class exposed by the library. Uses `NchanClient` internally for all transport operations.

```typescript
interface MessagingClient {
  /**
   * Initialize and start the client.
   * Handles initial connection and automatic reconnection logic.
   * In browser environments, attaches lifecycle event listeners.
   */
  start(): Promise<void>;

  /**
   * Stop all connections, timers (heartbeats), and clean up resources.
   */
  stop(): Promise<void>;

  /**
   * Joins the global lobby to broadcast presence and see other online users.
   */
  joinLobby(user: PresenceMessage, options?: LobbyOptions): Promise<Lobby>;

  /**
   * Joins a specific table (game room) for 2-player/spectator communication.
   */
  joinTable<T = any>(tableId: string, userId: string): Promise<Table<T>>;
}
```

### `Lobby`

Represents the global presence state and matchmaking.

```typescript
interface Lobby {
  /**
   * Stream of the current online users.
   * Emits the full list or patches whenever users join, leave, or time out.
   */
  onUsersChange(callback: (users: PresenceMessage[]) => void): void;

  /**
   * Update the current user's presence information (e.g., change name).
   */
  updatePresence(update: Partial<PresenceMessage>): Promise<void>;

  /**
   * Challenge another user to a game.
   * Returns the ID of the table created for the challenge.
   */
  challenge(userId: string, ruleType: string): Promise<string>;

  /**
   * Accept an incoming challenge.
   * Returns the Table instance for the accepted game.
   */
  acceptChallenge(userId: string, ruleType: string, tableId: string): Promise<Table>;

  /**
   * Decline an incoming challenge.
   */
  declineChallenge(userId: string, ruleType: string): Promise<void>;

  /**
   * Cancel an outgoing challenge.
   */
  cancelChallenge(userId: string, ruleType: string): Promise<void>;

  /**
   * Subscribe to incoming challenges directed at the current user.
   */
  onChallenge(callback: (challenge: ChallengeMessage) => void): void;

  /**
   * Leave the lobby.
   */
  leave(): Promise<void>;
}
```

### `Table`

Represents a specific communication channel for a 2-player/spectator scenario at a table.

```typescript
interface Table<T = any> {
  /**
   * Broadcast an event to all participants at the table.
   */
  publish(type: string, data: T): Promise<void>;

  /**
   * Subscribe to events published by other participants.
   */
  onMessage(callback: (event: TableMessage<T>) => void): void;

  /**
   * Subscribe to changes in the spectator list.
   */
  onSpectatorChange(callback: (spectators: PresenceMessage[]) => void): void;

  /**
   * Leave the table.
   */
  leave(): Promise<void>;
}
```

---

## Data Models

### `_meta` (Server-Enriched Metadata)

All messages published through the transport layer are automatically enriched by the server with metadata from HTTP headers and connection info. This `_meta` object is **added by the server** and should be used by clients as the absolute source of truth for timing (`ts`) and origin.

```typescript
interface _Meta {
  ts: string; // ISO timestamp of the request (Source of Truth for time)
  locale: string; // Accept-Language header (use for flag rendering)
  ua: string; // User-Agent header
  ip: string; // Client remote address
  origin: string; // Origin header value
  host: string; // Host header value
  path: string; // Request URI path
  method: string; // HTTP method (always POST for publish)
}
```

**Note**: The client should NOT include `locale` or `ua` in published messages — the server adds these automatically from HTTP headers. This ensures reliable, tamper-resistant metadata for UI features like flag rendering.

### `PresenceMessage`

Information about a user in the lobby. The `locale` and `ua` fields are **not** set by the client — they are provided by the server via `_meta`.

```typescript
interface PresenceMessage {
  messageType: "presence";
  type: "join" | "heartbeat" | "leave";
  userId: string;
  userName: string;
  ruleType?: string;
  opponentId?: string | null;
  seek?: Seek;
  lastSeen?: number; // Managed internally for pruning (derived from _meta.ts)
  _meta?: _Meta; // Server-enriched metadata (received messages only)

  // Current game state:
  // - If present: user is playing or spectating at that table (available for spectating)
  // - If absent: user is available for new games
  tableId?: string;
}
```

### `ChallengeMessage`

Represents a peer-to-peer challenge request.

```typescript
interface ChallengeMessage {
  messageType: "challenge";
  type: "offer" | "accept" | "decline" | "cancel";
  challengerId: string;
  challengerName: string;
  recipientId: string;
  ruleType: string;
  tableId?: string; // Optional: table created by challenger
  _meta?: _Meta; // Server-enriched metadata (received messages only)
}
```

### `TableInfo`

Lobby-level information about an active game table.

```typescript
interface TableInfo {
  tableId: string;
  ruleType: string;
  players: { id: string; name: string }[];
  spectatorCount: number;
  status: "waiting" | "playing" | "finished";
  createdAt: number;
}
```

### `TableMessage`

A generic structure for table/game events. Replaces raw payloads with a structured, meta-aware event.

```typescript
interface TableMessage<T = any> {
  type: string;
  senderId: string;
  data: T; // Application-specific payload
  _meta?: _Meta; // Server-enriched metadata (received messages only)
}
```

---

## Internal Requirements

### 1. Presence Management

- **Heartbeat**: The library must automatically send periodic "heartbeat" messages (e.g., every 60 seconds) to the lobby while active.
- **Pruning**: The library must maintain an internal map of users and automatically remove users who haven't sent a heartbeat within a specific TTL (e.g., 90 seconds).
- **Unload Handling**: In browser environments, the library should attempt to send a "leave" message on `beforeunload` or `pagehide`.

### 2. Transport & Reconnection

- **Transport Layer**: Uses `NchanClient` from `src/lobby/nchanclient.ts` as the underlying transport. The WebSocket/POST abstraction is handled internally. `NchanClient` remains transport-agnostic and platform-neutral (Browser + Node.js).
- **Resilience**:
  - Automatic exponential backoff for reconnection on WebSocket failure.
  - Transparently handle transition between online/offline states.
- **Concurrency**: Ensure multiple `Table` instances can coexist if needed (though typically one game at a time).

### 3. Page Visibility & Browser Lifecycle

Page visibility handling (`pagehide`, `pageshow`, `visibilitychange`) is the responsibility of `MessagingClient` (application layer), **not** `NchanClient` (transport layer). This keeps the transport layer platform-agnostic.

`MessagingClient` should:

- Listen for `pagehide` to close connections and send a "leave" presence message
- Listen for `pageshow` (with `event.persisted`) to restore connections from bfcache
- Track `document.hidden` state to pause/resume heartbeats

```typescript
// Example pattern for MessagingClient
// Note: MessagingClient does NOT have direct socket access.
// It calls stop() on subscriptions returned by NchanClient, or exposes its own stop() method.

private handlePageHide = (): void => {
  this.stop(); // Stops all subscriptions and sends "leave" presence
};

private handlePageShow = (event: PageTransitionEvent): void => {
  if (event.persisted) {
    this.start().then(() => this.joinLobby(this.currentUser));
  }
};
```

### 3. State Synchronization

- The library should ensure that when a user joins a lobby, they receive the current "state of the world" or quickly populate it via incoming heartbeats.
- For tables, it should provide a reliable pipe for sequence-sensitive events (optionally implementing sequence numbering if required by the transport).

---

## Accepted Concerns

### 1. Race Conditions in Matchmaking

### 2. Presence Scaling ($O(N^2)$)

### 3. State Reconstruction

Since the transport is primarily pub/sub, a new client joining the lobby won't immediately know about existing tables or users until the next heartbeat.

---

## Usage Example (Conceptual)

```typescript
const client = new MessagingClient({
  baseUrl: "billiards-network.onrender.com",
});

await client.start();

// Lobby interaction
const lobby = await client.joinLobby({
  messageType: "presence",
  type: "join",
  userId: "user-123",
  userName: "Alice",
});

lobby.onUsersChange((users) => {
  console.log("Online users:", users.length);
});

lobby.onChallenge((challenge) => {
  if (confirm(`Accept challenge from ${challenge.challengerName}?`)) {
    lobby.acceptChallenge(challenge.challengerId, challenge.ruleType, challenge.tableId);
  }
});

// Table interaction with a generic move type
interface Move { x: number; y: number }
const table = await client.joinTable<Move>("table-xyz", "user-123");

table.onMessage((msg) => {
  if (msg.type === "MOVE") {
    // msg.data is typed as Move
    applyMove(msg.data);
    console.log("Move received at:", msg._meta?.ts);
  }
});

table.publish("MOVE", { x: 10, y: 20 });
```
