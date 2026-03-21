# Rematch Support Implementation Plan

## Overview

Add rematch support that allows players to initiate a rematch from an external app by passing query parameters. The rematch will reuse the existing challenge flow but pass rematch-specific data through query parameters to the game client.

## Key Requirements

1. Rematch triggered via external app with query parameters: `rematch={opponentId,opponentName,score,opponentScore}`
2. Use existing challenge accept flow for messaging
3. Pass rematch data back to game client via URL parameters
4. On acceptance, launch game with rematch parameters appended
5. On decline, return to game.tsx
6. Handle potential conflicts when both players rematch simultaneously
7. Minimal changes to existing logic

## Implementation Approach

### 1. URL Parameter Handling

Extend GameUrl.create() to accept optional rematch parameter:

```typescript
static create({
  tableId,
  userName,
  userId,
  ruleType,
  isSpectator = false,
  isCreator = false,
  rematchData?: string // URL-encoded JSON
}: {
  // ... existing params
}): URL {
  // ... existing logic
  if (rematchData) {
    target.searchParams.append("rematch", rematchData)
  }
  return target
}
```

### 2. Game Page Updates (game.tsx)

- Parse rematch parameter from URL on initial load
- Store rematch data in state/local state
- When sending a challenge, include rematch data if present
- Modify openGameWindow to pass rematch data when creating game URL
- Update challenge acceptance logic to preserve rematch data

### 3. Messaging Context Updates

No changes needed - rematch data flows through URL parameters only
Existing challenge messages remain unchanged

### 4. Challenge Flow Integration

When a rematch is detected:

1. On initial load, detect `rematch` query parameter
2. Parse and store rematch data (opponentId, opponentName, score, opponentScore)
3. Auto-populate challenge UI with rematch opponent data
4. When challenge is sent, include rematch data in URL generation
5. On challenge acceptance, redirect to game with rematch parameter preserved

### 5. Handling Simultaneous Rematches

Scenario: Both players send rematch requests simultaneously
Solution:

- Treat as independent challenge flows
- First acceptance wins (existing logic handles this via outgoing challenge tracking)
- Second player sees "pending challenge" UI and can cancel if desired
- No additional messaging needed - relies on existing challenge state

### 6. Determining Who Goes Next

Option 1: Include in rematch data

```json
{
  "opponentId": "user123",
  "opponentName": "John",
  "score": 1,
  "opponentScore": 0,
  "next": "opponent" // or "me"
}
```

Option 2: Derive from scores (higher score goes next)
Option 3: Always let challenger go first (existing behavior)

Recommended: Include explicit "next" field in rematch data for clarity.

### 7. Implementation Steps

1. Update GameUrl.create() to accept rematchData parameter
2. Modify game.tsx to:
   - Parse rematch parameter on load
   - Store rematch data in state
   - Auto-select rematch opponent in UI
   - Pass rematch data when sending challenges
   - Preserve rematch data in openGameWindow
3. Test scenarios:
   - Normal challenge (no rematch data)
   - Rematch challenge (with data)
   - Simultaneous rematches
   - Decline behavior
4. Verify existing functionality unaffected

### 8. Files to Modify

- `/src/utils/GameUrl.ts` - Add rematch parameter support
- `/src/pages/game.tsx` - Parse and handle rematch data

### 9. No Changes To

- Messaging context (rematch data travels via URL only)
- Challenge message types
- Existing challenge acceptance/decline logic
