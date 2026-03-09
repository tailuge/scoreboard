# Player Matchmaking Analysis

## Overview

This document describes how two players get matched in the scoreboard application, traces the backend calls, identifies potential race conditions, and suggests improvements.

---

## Matchmaking Flow

### Entry Point: Query Parameters

When a player enters the lobby, they may arrive with query parameters:
- `?ruletype=<type>` - The game type (e.g., "nineball", "snooker")
- `?action=join&ruletype=<type>` - Auto-join flag (triggers matchmaking)
- `?opponentId=<id>&opponentName=<name>&ruletype=<type>` - Direct challenge from another player

### Frontend: lobby.tsx

1. **Auto-Join Trigger** (`useAutoJoin` hook, line 121 in lobby.tsx)
   - If `action=join` and `ruletype` are present in the URL query
   - Calls `handleFindOrCreate(ruleType)`

2. **Handle Find or Create** (lines 84-119 in lobby.tsx)
   - Sets local state `seekingRuleType = ruleType`
   - Calls `findOrCreateTable(ruleType)` from `useLobbyTables`
   - On response:
     - If table has 2 players: Opens `PlayModal` to start the game
     - If table has 1 player: Sets `seekingTableId` to show "Seeking Card"

3. **Table State Polling** (useLobbyTables hook)
   - Fetches tables list via `/api/tables` on mount
   - Re-fetches when Nchan lobby messages are received (create/join/delete actions)

4. **Client-Side Table Monitoring** (lines 123-149 in lobby.tsx)
   - Monitors `tables` array for changes
   - When player's table reaches 2 players: Opens `PlayModal`

### Backend: API Calls

#### POST /api/tables/find-or-create

**Handler**: `src/pages/api/tables/find-or-create.ts`

```typescript
// Request body
{ userId, userName, ruleType }

// Calls TableService.findOrCreate(userId, userName, ruleType)
```

#### TableService.findOrCreate() (lines 175-195 in TableService.ts)

```typescript
async findOrCreate(userId, userName, ruleType) {
  // Step 1: Find existing pending table
  const pending = await this.findPendingTable(ruleType)
  
  if (pending) {
    // Step 2a: Join existing table
    return this.joinTable(pending.id, userId, userName)
  } else {
    // Step 2b: Create new table
    return this.createTable(userId, userName, ruleType)
  }
}
```

#### TableService.findPendingTable() (lines 161-173 in TableService.ts)

```typescript
async findPendingTable(ruleType): Promise<Table | null> {
  const tables = await this.store.hgetall(KEY)
  // Looks for table where:
  // - ruleType matches
  // - players.length === 1
  // - !completed
  return pending || null
}
```

#### TableService.joinTable() (lines 96-116 in TableService.ts)

```typescript
async joinTable(tableId, userId, userName) {
  // 1. Expire old tables
  await this.expireTables()
  
  // 2. Fetch table
  const table = await this.store.hget(KEY, tableId)
  if (!table) throw new Error("Table not found")
  
  // 3. Check capacity
  if (table.players.length >= 2) {
    throw new Error("Table is full")
  }
  
  // 4. Add player
  table.players.push(player)
  table.lastUsedAt = Date.now()
  
  // 5. Save
  await this.store.hset(KEY, { [tableId]: table })
  await this.notify({ action: "join" })  // Nchan publish
  return table
}
```

#### TableService.createTable() (lines 75-94 in TableService.ts)

```typescript
async createTable(userId, userName, ruleType) {
  const newTable = {
    id: tableId,
    creator: { id: userId, name: userName },
    players: [creator],
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    isActive: true,
    ruleType,
    completed: false,
  }
  
  await this.store.hset(KEY, { [tableId]: newTable })
  await this.notify({ action: "create" })  // Nchan publish
  return newTable
}
```

### Real-Time Updates: Nchan Pub/Sub

After each table operation, `TableService` publishes to the lobby channel:

```typescript
await new NchanPub("lobby").publishLobby({ action: "create" | "join" | "delete" })
```

Frontend subscribes via `LobbyContext`:
- When a message is received, `useLobbyTables` calls `fetchTables()` to refresh

---

## State Change Sequence Diagram

```
Player A                    Server (KV Store)                  Player B
   |                             |                              |
   |--- POST /find-or-create --->|                              |
   |  {userId: A, ruleType: 9B}  |                              |
   |                             |--- findPendingTable() ------->|
   |                             |<-- null (no pending) --------|
   |                             |                              |
   |                             |--- createTable() ------------>|
   |                             |   {players: [A]}             |
   |<-- {players: [A]} ---------|                              |
   |                             |--- Nchan: {action: create} ->|
   |                             |                              |
   |                             |--- POST /find-or-create --->|
   |                             |  {userId: B, ruleType: 9B}   |
   |                             |                              |
   |                             |--- findPendingTable() ------>|
   |                             |<-- {players: [A]} ----------|
   |                             |                              |
   |                             |--- joinTable() -------------->|
   |                             |   {players: [A,B]}           |
   |<-- {players: [A,B]} ---------|                              |
   |                             |--- Nchan: {action: join} ---->|
   |                             |                              |
   |--- GET /tables (polling) -->|                              |
   |<-- {players: [A,B]} ---------|                              |
   |                             |                              |
   |  [Open PlayModal]           |                              |
```

---

## Identified Race Conditions

### Race Condition 1: Concurrent Find-Or-Create (Most Critical)

**Scenario**: Two players call `/api/tables/find-or-create` at nearly the same time for the same rule type.

**Timeline**:
```
Time    Player A                          Player B
----    ---------                         ---------
T1      findPendingTable() → null
T2                                         findPendingTable() → null
T3      createTable() → Table-1
T4                                         createTable() → Table-2
T5      joinTable(Table-1) → OK
T6                                         joinTable(Table-2) → OK
```

**Result**: Both players create separate tables instead of being matched together. Neither gets a match.

**Root Cause**: Non-atomic check in `findOrCreate()`:
```typescript
const pending = await this.findPendingTable(ruleType)  // Check
if (pending) {
  return this.joinTable(pending.id, ...)                // Act
} else {
  return this.createTable(...)                          // Act
}
```

The check and act are not atomic. Between the check and the act, another request can also see no pending tables.

---

### Race Condition 2: Double-Join on Same Table

**Scenario**: Two players both find the same pending table and try to join simultaneously.

**Timeline**:
```
Time    Player A                          Player B
----    ---------                         ---------
T1      findPendingTable() → Table-1
T2                                         findPendingTable() → Table-1
T3      joinTable(Table-1):
          - read: players.length = 1
T4                                         joinTable(Table-1):
                                              - read: players.length = 1
T5      - write: players.push(A)
T6                                         - write: players.push(B)
```

**Result**: Depends on KV implementation. Could result in:
- Both succeed (table has 3 players if no validation)
- One fails with "Table is full" error
- Lost update (one overwrite)

**Root Cause**: Read-modify-write without atomicity in `joinTable()`:
```typescript
const table = await this.store.hget(KEY, tableId)     // Read
if (table.players.length >= 2) throw Error             // Check
table.players.push(player)                             // Modify
await this.store.hset(KEY, { [tableId]: table })       // Write
```

---

### Race Condition 3: Client-Side Stale State

**Scenario**: Player's client has stale table state after `findOrCreate` returns.

**Timeline**:
```
Time    Player A (Client)               Server                    Player B
----    --------------                  ------                    ---------
T1      POST /find-or-create
T2                                         findPendingTable() → null
T3                                         createTable() → {players: [B]}
T4      <-- {players: [B]}
T5                                         <-- POST /find-or-create
T6                                         joinTable() → {players: [A,B]}
T7                                         Nchan: {action: join}
T8      
T9      fetchTables() ← called
T10                                         
```

**Issue**: The client may see inconsistent state:
- API response shows table with only 1 player (the other player hasn't joined yet)
- Client must wait for Nchan message + fetchTables to see 2 players

**Current Mitigation**: The client polls for table changes via Nchan messages. This works but introduces delay.

---

### Race Condition 4: Timeout vs. Join Race

**Scenario**: A player creates a table, another joins just as the creator's timeout fires.

**Timeline**:
```
Time    Player A                          Server
----    ---------                         ------
T1      createTable() → Table-1
T2      [60 second timeout starts]
T3                                         [Player B finds Table-1]
T4                                         joinTable() → {players: [A,B]}
T5      [60s elapses - timeout fires]
T6      deleteTable() → succeeds (A is creator)
```

**Result**: The join might succeed, then get deleted by the timeout, leaving Player B stranded.

**Current Mitigation**: The timeout only deletes if `table.creator.id === userId && table.players.length === 1`. Once a second player joins, the timeout is extended by `MULTIPLY_TIMEOUT_FACTOR` (10x = 10 minutes).

---

### Race Condition 5: Duplicate Auto-Join

**Scenario**: User clicks "Join" multiple times or refreshes page during matchmaking.

**Timeline**:
```
Time    Client State
----    ------------
T1      User clicks "Join Game"
T2      POST /find-or-create (request 1)
T3      User clicks again before response
T4      POST /find-or-create (request 2)
T5      Response 1: Table-A (player 1)
T6      Response 2: Table-B (player 1) OR error
```

**Current Mitigation**: `useAutoJoin` uses a `hasHandledAutoJoin` ref to prevent multiple triggers from URL params. However, there's no protection against rapid manual clicks.

---

## Summary of State Changes

| Event | State Change | Triggered By |
|-------|--------------|--------------|
| Player enters lobby with action=join | None yet | Router query |
| findOrCreate called | Local: seekingRuleType = ruleType | handleFindOrCreate |
| findOrCreate returns | Local: seekingTableId = table.id (if waiting) | API response |
| Table has 2 players | Local: PlayModal opens | useEffect on tables |
| createTable called | KV: table created, Nchan published | Backend |
| joinTable called | KV: player added, Nchan published | Backend |
| Nchan message received | Local: fetchTables() triggered | WebSocket |
| 60s timeout | KV: table deleted | Backend cleanup |

---

## Suggested Improvements

### 1. Atomic Matchmaking (Critical)

Replace the check-then-act pattern with atomic operations using Redis transactions or Lua scripts.

**Option A: Atomic Find-And-Join**
```typescript
// Pseudocode - use Redis SETNX or Lua script
const result = await redis.eval(
  `for _, tableId in ipairs(ARGV) do
     local table = redis.call('HGET', KEYS[1], tableId)
     if table and table.players.length == 1 then
       redis.call('HSET', KEYS[1], tableId, updatedTable)
       return tableId
     end
   end
   return nil`,
  1, KEY, ruleType, userId, userName
)
```

**Option B: Reservation System**
- When seeking, create a "reservation" with a short TTL (e.g., 5 seconds)
- Other players atomically claim the reservation
- Eliminates the race between findPendingTable and joinTable

### 2. Optimistic Locking

Add a version field to tables and use it in updates:
```typescript
const table = await this.store.hget(KEY, tableId)
if (table.version !== requestVersion) {
  throw new Error("Table was modified, retry")
}
table.version++
await this.store.hset(KEY, { [tableId]: table })
```

### 3. Server-Initiated Match Notification

Instead of relying on client polling, have the server directly notify matched players:
```typescript
// After successful join that completes a match
await this.notifyPlayer(playerId, { 
  action: "match_found", 
  tableId, 
  opponentId 
})
```

This requires maintaining player WebSocket connections or using a push notification service.

### 4. Idempotency Keys

Include an idempotency key in findOrCreate requests to prevent duplicate table creation:
```typescript
POST /api/tables/find-or-create
{ userId, userName, ruleType, idempotencyKey }
```
Server rejects duplicate keys within a time window.

### 5. Enhanced Client State Management

Add explicit states to the matchmaking UI:
- `IDLE` - Not seeking
- `SEEKING` - Waiting for opponent
- `MATCHED` - Opponent found, starting game
- `ERROR` - Matchmaking failed

This makes race conditions visible to users and allows recovery actions.

### 6. Increase Timeout Safety

Extend the timeout grace period or add a "match in progress" flag that prevents deletion:
```typescript
if (table.matchStarted) {
  // Never delete during active game
  return
}
```

---

## Conclusion

The current matchmaking system has a significant race condition in the `findOrCreate` flow where concurrent requests can result in players creating separate tables instead of being matched together. The recommended fix is to implement atomic matchmaking operations on the backend using Redis primitives (Lua scripts or transactions).

The client-side architecture with Nchan pub/sub is sound for eventual consistency, but the critical section in `TableService.findOrCreate()` needs to be made atomic to prevent the primary race condition.
