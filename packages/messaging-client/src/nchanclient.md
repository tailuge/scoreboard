# NchanClient

A low-level, platform-agnostic transport layer for interacting with an Nchan-powered messaging server. It handles WebSocket subscriptions and HTTP POST publishing, with built-in support for automatic reconnection and server-enriched metadata (`_meta`).

## Browser Compatibility

`NchanClient` is designed to work in all modern browsers, including **Safari (Desktop and iOS)**.

- **Reconnection**: Includes exponential backoff logic to handle connection drops common in mobile browsers and background tabs.
- **Standards-based**: Uses standard `WebSocket`, `fetch`, and `globalThis`.
- **Requirements**: Requires a browser supporting `fetch` (Safari 10.1+) and `globalThis` (Safari 12.1+).

## Constructor

```typescript
const client = new NchanClient("your-server.com:8080");
```

- `server`: The hostname and port. The client automatically handles `http/ws` protocol prefixes.

## Publishing

All published messages are automatically enriched by the server with a `_meta` object containing timing and origin information.

### Presence

Broadcast user join/leave/heartbeat events to the global lobby.

```typescript
await client.publishPresence({
  type: "join" | "leave" | "heartbeat",
  userId: "user-123",
  userName: "Alice",
});
```

### Challenges

Broadcast a peer-to-peer game challenge.

```typescript
await client.publishChallenge({
  type: "offer" | "accept" | "decline" | "cancel",
  challengerId: "user-1",
  challengerName: "Alice",
  recipientId: "user-2",
  ruleType: "standard",
});
```

### Table Events

Publish game-specific events to a specific table.

```typescript
await client.publishTable(
  "table-xyz",
  {
    type: "MOVE",
    data: { x: 10, y: 20 },
  },
  "user-123",
); // tableId, message, senderId
```

## Subscribing

Subscription methods return a `Subscription` object. The client will automatically attempt to reconnect with exponential backoff if the connection is lost.

### Global Presence & Challenges

```typescript
const sub = client.subscribePresence((data: string) => {
  const msg = JSON.parse(data);
  // msg is either PresenceMessage or ChallengeMessage
  console.log(msg.messageType, msg._meta.ts);
});
```

### Table Events

```typescript
const sub = client.subscribeTable("table-xyz", (data: string) => {
  const msg = JSON.parse(data);
  console.log("Received move:", msg.data);
});
```

### Stopping a Subscription

```typescript
sub.stop(); // Closes the WebSocket and prevents reconnection
```

## Internal Reconnection Logic

The client uses an exponential backoff strategy for reconnections:

1.  Immediate attempt on first drop.
2.  Subsequent attempts: $2^{attempts} \times 1000$ms.
3.  Maximum delay: 30 seconds.
4.  Reset: Reconnection counter resets to 0 upon a successful `onopen`.

## Data Models

Refer to `src/types.ts` for the full TypeScript interfaces, including the `_meta` structure which provides the absolute source of truth for message timing.
