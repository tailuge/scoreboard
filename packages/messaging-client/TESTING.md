# Testing Strategy

## Current Test Suite

### 1. Shell Integration Tests (`docker/testnchan.sh`)

Bash script that runs against Docker Nchan container (or production). Tests HTTP/WebSocket endpoints directly.

**Coverage:**

- Health check, stats, index
- Publish to lobby/presence/table channels
- Pub/Sub for all channels
- WebSocket handshake
- **Meta enrichment** (8 assertions for `_meta` fields: ts, origin, method, path, etc.)

**Run:**

```bash
bash docker/testnchan.sh        # Docker (default)
bash docker/testnchan.sh -p     # Production
```

### 2. Jest Unit/Integration Tests (`test/nchanclient.spec.ts`)

Uses `testcontainers` to spin up the Docker image, tests `NchanClient` transport class.

**Coverage:**

- `publishPresence`, `publishChallenge`, `publishTable`
- `subscribePresence`, `subscribeTable`
- Message receipt verification
- `_meta` enrichment validation
- Reconnection logic (exponential backoff)
- Raw WebSocket connection

**Run:**

```bash
npm run test
```

**Note:** These tests require Docker running. They use the real Nchan server, not mocks.

---

## Testing the MessagingClient

The MessagingClient is a **library**, not UI. It is platform-agnostic (Browser + Node.js) and can be fully tested with Jest.

### Approach: Jest + Docker

Tests run against the real Docker Nchan container, same as existing `nchanclient.spec.ts`. No mocks — true integration testing.

### Test Cycles

#### 1. Join/Leave Lobby & User Count

```
1. Lobby is empty
2. Client A joins lobby
3. Client A sees user count = 1 (themselves)
4. Client B joins lobby
5. Client A sees user count = 2
6. Client B sees user count = 2
7. Client A leaves
8. Client B sees user count = 1
```

**Assertions:**

- `onUsersChange` callback fires with correct user list
- User count increments/decrements correctly
- User objects contain expected fields (`userId`, `userName`, `_meta`)
- User who leaves is removed from list

#### 2. Update Presence (Username / Playing Status)

```
1. Client A joins lobby as "Alice"
2. Client B joins lobby, sees "Alice"
3. Client A calls updatePresence({ userName: "Alice Updated" })
4. Client B sees updated name in user list
5. Client A calls updatePresence({ tableId: "table-123" })
6. Client B sees Client A has tableId set (playing)
7. Client A calls updatePresence({ tableId: undefined })
8. Client B sees Client A is available again
```

**Assertions:**

- `updatePresence` broadcasts the updated fields.
- `onUsersChange` fires with updated user data.
- `tableId` field correctly reflects playing/spectating status.

#### 3. Challenge Flow

```
1. Client A and Client B in lobby
2. Client A challenges Client B (type: "offer")
3. Client B receives challenge via onChallenge callback
4. Client B accepts (type: "accept")
5. Client A receives acceptance
6. Both join table
7. (Optional) Client B declines instead
8. (Optional) Client A cancels before response
```

**Assertions:**

- Challenge message structure (`ChallengeMessage`)
- `onChallenge` callback fires with correct data
- `tableId` returned on challenge creation
- Decline/cancel handled correctly

#### 4. Challenge Decline/Cancel

```
1. Client A challenges Client B
2. Client B declines (type: "decline")
3. Client A receives decline notification
4. (Alternative) Client A cancels before response
5. Client B receives cancel notification
```

#### 5. Table Messaging (Generic & Concurrent)

```
1. Client A and Client B join Table 1 (Type: Move {x, y})
2. Client C joins Table 2 (Type: Chat {text})
3. Client A publishes Move to Table 1
4. Client B receives TableMessage<Move> with correct data
5. Client C does NOT receive Client A's message (isolation)
6. Client B receives _meta.ts from server, confirms it matches receipt time
```

**Assertions:**

- `onMessage` callback fires with generic `data` payload.
- `TableMessage` structure correct (`type`, `senderId`, `data`, `_meta`).
- Messages are strictly isolated by `tableId`.
- **Source of Truth**: Assert that timing is derived from `_meta.ts`.

#### 6. Heartbeat & Pruning (Time Synchronized)

```
1. Client A joins lobby
2. Client A stays connected (heartbeat fires every 60s)
3. Client B joins, sees Client A
4. Client A disconnects (no leave, just timeout)
5. Client B's stale timer removes Client A after 90s
```

**Assertions:**

- Periodic heartbeat messages sent to presence channel.
- Users without heartbeat pruned after TTL.
- **Source of Truth**: `lastSeen` must be derived from `_meta.ts` of the last received message, protecting against client clock drift.

#### 7. Multiple Concurrent Users

```
1. 5 clients join lobby
2. All see user count = 5
3. One client leaves
4. All see user count = 4
5. Heartbeat keeps all alive
6. Simulate network partition (one client stops heartbeating)
7. After TTL, others prune that client
```

**Assertions:**

- O(N) scaling works (each client tracks all users)
- No memory leaks from internal user map
- Pruning consistent across all clients

#### 8. Seek / Queue System

```
1. Client A creates seek (ruleType: "8-ball")
2. Client B receives seek broadcast
3. Client B responds to seek
4. Table created, both join
5. Seek removed from list
```

#### 9. Reconnection

```
1. Client A joins lobby
2. Network disconnects (WebSocket closes)
3. Client A reconnects automatically
4. Client A re-sends join
5. Client B sees Client A still in lobby
```

**Assertions:**

- Reconnection with exponential backoff
- No duplicate entries in user list
- Heartbeat resumes after reconnect

#### 10. State Reconstruction

```
1. Clients A, B, C already in lobby
2. Client D joins late
3. Client D receives current user list (state of the world)
4. Or: Client D populates via incoming heartbeats
```

**Assertions:**

- New client learns existing users
- No empty state on join (or quick population)

#### 11. Page Visibility (Browser Only)

```
1. Client A in lobby
2. User navigates away (pagehide)
3. Client A sends "leave" message
4. User returns (pageshow with persisted)
5. Client A reconnects and rejoins
```

**Note:** This requires browser environment. Can be mocked in Jest or tested via Playwright.

### Test Structure

```
test/
  nchanclient.spec.ts      # Existing transport tests
  messagingclient.spec.ts  # NEW: MessagingClient tests break into groups
```

### Test Scenarios Summary

| #   | Scenario                  | Key Assertions                         |
| --- | ------------------------- | -------------------------------------- |
| 1   | Join/Leave & User Count   | `onUsersChange`, user count correct    |
| 2   | Update Presence           | `updatePresence`, username, `tableId`  |
| 3   | Challenge Offer/Accept    | `onChallenge`, table created           |
| 4   | Challenge Decline/Cancel  | Decline/cancel received                |
| 5   | Table Messaging           | `onMessage`, `TableMessage`, Isolation |
| 6   | Spectators                | `onSpectatorChange`                    |
| 7   | Heartbeat & Pruning       | Heartbeat sent, stale removed          |
| 8   | Multiple Users            | O(N) scaling, consistent pruning       |
| 9   | Seek / Queue              | Seek broadcast, table created          |
| 10  | Reconnection              | Auto-reconnect, no duplicates          |
| 11  | State Reconstruction      | Late joiner gets user list             |
| 12  | Page Visibility (Browser) | `pagehide`/`pageshow` handlers         |

Each test file uses `testcontainers` to spawn the Docker container:

```typescript
let container: StartedTestContainer;
let server: string;

beforeAll(async () => {
  container = await new GenericContainer("tailuge/billiards-network:latest")
    .withExposedPorts(8080)
    .start();
  server = `localhost:${container.getMappedPort(8080)}`;
});

afterAll(async () => {
  await container.stop();
});
```

### Running Tests

```bash
# Start Docker Nchan manually (optional - Jest can handle it)
npm run docker:nchan start

# Run all tests (Jest spawns container via testcontainers)
npm run test

# Run only MessagingClient tests
npm run test -- --testPathPattern=messagingclient
```

---

## Why Not Playwright?

Playwright is **not required** for MessagingClient testing:

| Reason              | Explanation                                              |
| ------------------- | -------------------------------------------------------- |
| Platform-agnostic   | MessagingClient works identically in Node.js and Browser |
| Transport is tested | NchanClient already tested via Jest + Docker             |
| Library, not UI     | Pure TypeScript — no DOM/React dependencies              |
| Faster iteration    | Jest runs in seconds, Playwright minutes                 |

### When Playwright IS Needed

Playwright should be used for **Next.js page testing** (separate from library tests):

- Testing UI components that use `MessagingClient`
- Verifying React integration
- Testing page visibility handlers (`pagehide`/`pageshow`)
- End-to-end user flows in the browser

These are **application-level** tests, not library tests.

---

## CI / Development Workflow

1. **Local development:**

   ```bash
   npm run docker:nchan start   # Start Nchan
   npm run test                 # Run Jest (spawns container if needed)
   ```

2. **CI pipeline:**
   - `npm run test` — Jest tests against Docker
   - (Optional) `npm run e2e` — Playwright for app-level tests

3. **Production verification:**
   ```bash
   bash docker/testnchan.sh -p  # Run shell tests against production
   ```

---

## Summary

| Layer                     | Test Tool     | Target                    |
| ------------------------- | ------------- | ------------------------- |
| Transport (NchanClient)   | Jest + Docker | `nchanclient.spec.ts`     |
| Library (MessagingClient) | Jest + Docker | `messagingclient.spec.ts` |
| App UI (Next.js pages)    | Playwright    | `e2e/*.spec.ts`           |

All integration tests (Jest) run against the real Docker container for true end-to-end verification.
