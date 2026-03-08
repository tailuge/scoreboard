# Client Error Logging System

## Overview

A minimal client-side error logging system for capturing and viewing errors from client devices (especially mobile) that don't have console access.

## Architecture

### Client Side (`src/errors/ClientErrorReporter.ts`)

The `ClientErrorReporter` class intercepts console errors/warnings and uncaught exceptions:

- Patches `console.error` and `console.warn` to capture messages
- Listens for `window.onerror` and `unhandledrejection` events
- Deduplicates similar errors (max 3 per error type)
- Queues errors and flushes periodically (every 5 seconds)
- Uses `sendBeacon` on pagehide for reliable delivery

### Server Side

#### API Endpoint: `app/api/client-error/route.ts`

- **Method**: POST
- **Accepts**: JSON array of log objects
- **Headers**: Extracts `user-agent` and Vercel region info
- **Storage**: Single KV key `logs:collection`
- **TTL**: 3 days (259200 seconds)
- **Max Sessions**: 200 (oldest removed first)

#### Viewing: `app/viewlogs/page.tsx`

- Server component loads sessions from KV
- Client component `LogViewer.tsx` provides UI
- Split panel: session list (left), log viewer (right)

## Data Types

```typescript
type ClientLog = {
  type: string        // "error", "warn", "uncaught", "promise"
  message: string
  stack?: string
  url?: string
  ts: number          // Unix timestamp
  sid: string         // Session UUID
  ua?: string         // User agent (added server-side)
  region?: string     // Vercel region (added server-side)
}

type SessionEntry = {
  sid: string        // Session UUID
  ua: string         // User agent
  ts: number         // Most recent log timestamp
  logs: ClientLog[]  // All logs for this session
}
```

## Storage Format

Single KV key `logs:collection` stores an array:

```json
[
  {
    "sid": "uuid-1",
    "ua": "Chrome / Linux",
    "ts": 1710000000000,
    "logs": [
      { "type": "error", "message": "Cannot read", "ts": 1710000000000, "sid": "uuid-1" }
    ]
  }
]
```

## API Usage

```javascript
// Client sends:
fetch('/api/client-error', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify([
    {
      type: 'error',
      message: 'Cannot read properties of undefined',
      stack: 'TypeError: ...',
      url: 'https://example.com/game',
      ts: Date.now(),
      sid: sessionId
    }
  ])
})
```

## Viewing Logs

Navigate to `/viewlogs` to inspect captured errors. No authentication required.

## Limits

- Max 200 sessions stored
- Max 3 duplicate errors per session
- Logs expire after 3 days
