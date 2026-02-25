# Presence Protocol (Cross-Site)

This document defines the wire protocol another site should follow to show online presence for the billiards network.

## Purpose

- Show current online users/count.
- Publish your own client presence (`join` + `heartbeat`).
- Stay compatible with `https://scoreboard-tailuge.vercel.app`.

## Channel + Endpoints

- Presence subscribe (WebSocket): `wss://billiards-network.onrender.com/subscribe/presence/lobby`
- Presence publish (HTTP POST): `https://billiards-network.onrender.com/publish/presence/lobby`

Use channel `lobby` exactly.

## Presence Message Schema

All presence events must be JSON:

```json
{
  "messageType": "presence",
  "type": "join | heartbeat | leave",
  "userId": "string",
  "userName": "string",
  "locale": "en-US",
  "originUrl": "your-host.example",
  "timestamp": 1771915194402
}
```

### Field Rules

- Required:
  - `messageType`: must be `"presence"`
  - `type`: `"join"`, `"heartbeat"`, or `"leave"`
  - `userId`: stable identifier for one player
  - `userName`: display name
- Recommended:
  - `locale`: browser locale (example `en-US`)
  - `originUrl`: compact source marker, format `origin:<host>`
  - `timestamp`: unix epoch milliseconds from sender

## Publisher Behavior (Client)

- On connect/page load:
  - Publish one `join` after a short delay (~100ms is fine).
- While active:
  - Publish `heartbeat` every 60 seconds.
- On close/unload (best effort):
  - Publish `leave` (optional; TTL cleanup still works if missed).

## Subscriber Behavior (Online List)

- Subscribe to `wss://.../subscribe/presence/lobby`.
- Ignore messages where `messageType !== "presence"`.
- Maintain a map keyed by `userId`.
  - `join` or `heartbeat`: upsert user with `lastSeen`.
  - `leave`: remove user.
- Treat user as online for 90 seconds since `lastSeen` (TTL).
- Recompute count from non-expired entries.

## Reference Algorithm

```ts
type PresenceMessage = {
  messageType: "presence"
  type: "join" | "heartbeat" | "leave"
  userId: string
  userName: string
  locale?: string
  originUrl?: string
  timestamp?: number
}

const TTL_MS = 90_000
const users = new Map<string, { userName: string; locale?: string; lastSeen: number }>()

function onPresence(msg: PresenceMessage) {
  if (msg.messageType !== "presence") return

  const seenAt = msg.timestamp ?? Date.now()
  if (msg.type === "leave") {
    users.delete(msg.userId)
  } else {
    users.set(msg.userId, {
      userName: msg.userName,
      locale: msg.locale,
      lastSeen: seenAt,
    })
  }

  const now = Date.now()
  for (const [id, entry] of users) {
    if (now - entry.lastSeen > TTL_MS) users.delete(id)
  }
}
```

## Minimal Publish Example

```ts
async function publishPresence(event: Omit<PresenceMessage, "messageType">) {
  await fetch("https://billiards-network.onrender.com/publish/presence/lobby", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...event, messageType: "presence" }),
  })
}
```

## Interop Notes

- Presence channel may include messages from multiple clients/sites.
- Some historical publishers may omit `locale` or `originUrl`; treat them as optional.
- Do not rely on strict ordering across all senders.
