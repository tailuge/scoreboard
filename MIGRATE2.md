# Migration Plan V2: Direct Messaging & Presence (No Lobby)

## Overview
This document simplifies the migration to `@tailuge/messaging` by removing the dedicated lobby page and auto-matchmaking. All interactions are now transient and driven by direct challenges within the game view or global presence list.

## 1. Immediate Cleanup
- **Remove `src/pages/lobby.tsx`**: The dedicated lobby route is discontinued.
- **Remove Matchmaking Hooks**: Delete `useAutoJoin.ts` and `useLobbyTables.ts`.
- **Remove Table CRUD APIs**: Delete `/api/tables/**` (except match history).

## 2. Core Transitions

### From Locale to Country
- **Legacy**: Client sends `navigator.language` as `locale`.
- **New**: Use `_meta.country` from the server-enriched metadata provided by the messaging library.
- **Update Components**: UI components (like `UserListItem` and `LogViewer`) should display flags based on ISO country codes rather than BCP 47 locales.

### Transient Presence Model
- **No Persistent Tables**: Tables exist only as presence state (e.g., `tableId` property on a user).
- **Match History Only**: KV storage is reserved exclusively for completed match results (`/api/match-results`).

## 3. Implementation Steps

### 3.1 Messaging Service
- Initialize `MessagingClient` at the application root.
- Map `_meta.country` to the user's regional flag.

### 3.2 Challenge Flow in Game View
- **Incoming**: Show "Accept/Decline" banner on `/game`.
- **Outgoing**: Initiate via "Challenge" button in the `OnlineUsersPopover`.
- **Navigation**: Challenges result in a direct redirect to `/game?tableId=...`.

## 4. Key Benefits
- **Zero KV Latency**: Eliminates API calls to Vercel KV for matchmaking.
- **Reduced Complexity**: No "seeking" states or table expiration logic.
- **Server-Side Truth**: Geographic data is sourced from server headers, not client-side reporting.
