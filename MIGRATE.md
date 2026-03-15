# Migration Plan: Replace Lobby/Matchmaking with @tailuge/messaging (No Lobby Page)

## Overview

This document outlines the migration from the current KV-based table system and custom WebSocket presence to the `@tailuge/messaging` library. The lobby page and auto-join flow are removed. The only real-time flows are direct challenges and accept/decline handled on the `/game` page.

## Current System Summary

The current system uses:

- **KV storage** (`tables` hash) for persistent table state
- **TableService** for matchmaking (find-or-create, join, spectate)
- **NchanPub/NchanSub** for raw WebSocket presence handling
- **LobbyContext** + custom hooks for React integration
- **~10 API routes** for table CRUD operations
- **Presence publish** done by the client (locale, UA, originUrl, timestamp)
- **Table ID** serves as join code - users share `/game?tableId=XXX`

## What the Package Provides

- `MessagingClient` - unified entry point with `start()`/`stop()`
- `Lobby` - presence + matchmaking via `challenge()`/`acceptChallenge()`/`onUsersChange()`
- `Table` - game messaging via `publish()`/`onMessage()`
- Helpers: `activeGames()`, `canChallenge()`, `canSpectate()`
- **Server-enriched metadata** in `meta` (locale, UA, origin, timestamp, etc.)

## Phase 1: Core Integration (No Lobby Page)

### 1.1 Create Messaging Context/Service (Done)

Create a new messaging context (or service + context) that:

- Instantiates a single `MessagingClient`
- Calls `start()` on client mount and `stop()` on teardown
- Calls `joinLobby()` once `userId` + `userName` are available
- Exposes:
  - `users` from `lobby.onUsersChange`
  - `activeGames` from `activeGames(users)`
  - `pendingChallenge` and `incomingChallenge` state
  - `challenge()`, `acceptChallenge()`, `declineChallenge()`, `cancelChallenge()`

### 1.2 Update Presence Mapping + Online Users UI

Stop publishing `locale`, `ua`, and `originUrl` from the client. Use `meta` from the server:

- `locale` ← `meta.country` for flags `meta.city` for city UI components (like `UserListItem` and `LogViewer`) should display flags based on ISO country codes rather than BCP 47 locales
- `ua` ← `meta.ua`
- `originUrl` ← `meta.host`

Replace presence sources across UI (no client WebSocket usage):

- Online user count: switch to `users.length` from the new messaging context (remove `usePresenceList` usage)
- Online user popover/list: render from messaging `users` (remove `usePresenceList`)
- Any user badges or list items that depend on presence data should read from messaging `users` and `meta`

Alphabetical user sorting is acceptable (library default).

### 1.3 Implement Challenge Flow in `game.tsx`

All challenge UI lives on `/game`:

- Incoming challenge banner with **Accept** / **Decline**
- Accept calls `acceptChallenge()` and opens the game **in a new tab**
- Decline calls `declineChallenge()` and clears the banner
- Outgoing challenge triggered from the online users list (same CTA)
  - `challenge()` sends an offer
  - On accept, challenger sets `tableId` in presence and opens the game **in a new tab**

### 1.4 Active Games List

Replace KV table list with `activeGames(users)`:

- `LiveMatchesPanel`, `RecentGamesList`, `MatchHistoryList` should use this derived list
- No “time started” display for live games

### 1.5 Remove Old Code + API Routes

Delete the following:

- `src/pages/lobby.tsx` (lobby page)
- `src/services/TableService.ts`
- `src/nchan/nchanpub.ts`
- `src/nchan/nchansub.ts`
- `src/contexts/LobbyContext.tsx`
- `src/components/hooks/usePresenceList.ts`
- `src/components/hooks/useLobbyTables.ts`
- `src/pages/api/tables/**` (all table CRUD endpoints)
- `src/pages/server-logs.tsx` and `src/pages/tablelogs.tsx` (depend on Nchan + table APIs)

### 1.6 Remove Table Completion

Remove `/api/tables/[id]/complete` usage and endpoint. There is no table completion in the new flow.

### 1.7 Keep Match History Intact

Do not change `/api/match-results` or `/api/match-replay`. The game project continues to upload results there.

## Key Differences & Risk Areas

### 1. Table Lifecycle & Expiration

| Current System                                                          | New System                                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Tables stored in KV with explicit expiration (1min single, 10min multi) | Tables exist only as presence data - user with `tableId` = active table              |
| Server-side cleanup via TTL                                             | No explicit table expiration - derived from presence timeout (90s TTL on heartbeats) |
| Tables can be queried independently                                     | Tables only exist when players are present                                           |

**Risk - HIGH**: No persistent table state. If both players leave, the "table" disappears entirely. This breaks:

- **Spectator links to past games**
- Any table metadata (createdAt, lastUsedAt, completed, spectators array)

**Mitigation**: Live games are derived from presence only. Match history stays in KV.

### 2. Join Code / Table Sharing

| Current System                | New System                                                   |
| ----------------------------- | ------------------------------------------------------------ |
| Table ID is the join code     | Challenge creates a table, tableId returned by library        |
| Share via `/game?tableId=XXX` | Same URL pattern, but `tableId` generated by library          |

**Risk - MEDIUM**: Ensure table IDs are compatible with the game URL and routing.

### 3. Matchmaking Behavior

| Current System                                                   | New System                                     |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| `find-or-create` auto-match                                      | **Removed**                                    |
| Direct challenge via presence `opponentId`                       | `challenge()` + `accept/decline` flow          |

**Risk - MEDIUM**: Auto-match no longer exists. Only direct challenges are supported.

### 4. Spectator Model

| Current System                                          | New System                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Dedicated API to spectate (`/api/tables/[id]/spectate`) | Spectator entry is just a user with `tableId`                                   |
| Spectators don't affect table state                     | No explicit spectator tracking in presence list                                |

**Risk - LOW**: Spectator counts are not available without extra table-level tracking.

### 5. Data Stored per User

| Current System                                                 | New System                                            |
| -------------------------------------------------------------- | ----------------------------------------------------- |
| userId, userName, locale, originUrl, ua, opponentId, ruletype  | userId, userName, ruleType, opponentId, tableId, seek |
| client sends locale/ua                                         | server sends `meta`                                  |

**Risk - LOW**: UI must use `meta` for flags and UA instead of client-sent fields.

## Testing Strategy

- **Unit tests**: Mock `MessagingClient` and `Lobby`
- Remove tests for `/api/tables`, `TableService`, and `Nchan` WebSocket utilities
- Add tests for:
  - `game.tsx` challenge banner accept/decline flow
  - `activeGames(users)` usage in live lists
  - `meta` mapping for locale/ua/origin

## Implementation Order

1. Create messaging context/service and wire into `_app.tsx`
2. Update `game.tsx` challenge flow (incoming + outgoing)
3. Replace live lists with `activeGames(users)`
4. Remove KV table routes and Nchan client code
5. Update tests and mocks
6. Run tests and lint/prettify
