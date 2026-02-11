# Phase 2: Presence Hook Implementation

## Summary

Create a tested `usePresenceList` hook that tracks online users via presence messages. This is a standalone addition that doesn't modify existing app behavior.

## Files to Create

- `src/components/hooks/usePresenceList.ts` - The hook
- `src/tests/usePresenceList.test.ts` - Unit tests

## Hook Specification

```typescript
interface PresenceUser {
  userId: string;
  userName: string;
}

function usePresenceList(
  userId: string,
  userName?: string,
): { users: PresenceUser[] };
```

## Implementation Details

### State Management

- Use `useRef<Map<string, { userName: string; lastSeen: number }>>` for presence state
- Use `useReducer` or state counter to trigger re-renders after map updates

### Message Reception

- Use `usePresenceMessages()` from `LobbyContext` to receive incoming presence messages
- On each message, update the map:
  - `join` / `heartbeat`: add/update entry with current timestamp
  - `leave`: remove entry (optional, TTL handles this)

### Publishing

- Create `NchanPub` instance in hook via `useRef`
- Publish `join` on mount with `userId`, `userName` (default "Anonymous")
- Set up 60s interval for `heartbeat` messages
- Clean up interval on unmount

### Derived List

- Use `useMemo` to derive `users` array from map:
  1. Prune entries where `Date.now() - lastSeen > 90000`
  2. Sort by `lastSeen` descending (most recent first)
  3. Limit to 50 entries
  4. Return as `PresenceUser[]`

### Lifecycle

```
Mount → publish join → start 60s heartbeat interval → listen for messages
Unmount → clear interval (no leave message needed)
```

## Test Cases

### Pure Logic Tests (optional helper function)

- `join` message adds user to map
- `heartbeat` message updates `lastSeen` and `userName`
- `leave` message removes user from map
- TTL pruning removes users older than 90s
- List sorted by `lastSeen` descending
- List limited to 50 users

### Hook Tests

- Returns empty array initially
- Updates users when presence messages arrive
- Publishes join on mount
- Publishes heartbeat every 60s (use fake timers)
- Cleans up interval on unmount
- Handles missing userName (defaults to "Anonymous")

## Test Mocking Strategy

```typescript
// Mock usePresenceMessages
jest.mock("@/contexts/LobbyContext", () => ({
  usePresenceMessages: () => ({ lastMessage: mockLastMessage }),
}));

// Mock NchanPub
jest.mock("@/nchan/nchanpub", () => ({
  NchanPub: jest.fn().mockImplementation(() => ({
    publishPresence: mockPublishPresence,
  })),
}));
```

## No Changes to Existing Code

This phase is additive only:

- No changes to `LobbyContext.tsx`
- No changes to `nchanpub.ts`
- No changes to existing components
- Hook can be integrated into UI in Phase 3

## Acceptance Criteria

- [ ] `usePresenceList.ts` created with full implementation
- [ ] Tests pass with `yarn test`
- [ ] Lint passes with `yarn lint`
- [ ] No changes to existing files
