# Refactor Plan: MatchResultCard & LiveMatchesList

This document outlines the plan to update the visual style and structure of `MatchResultCard` and `LiveMatchesList`.

## Goals
1.  **Icons**: Replace unicode characters with PNG assets for game types.
2.  **Layout**: Right-justify the metadata section (Flag, Time, Replay/Live badge).
3.  **Consistency**: Refactor `LiveMatchesList` to use the `MatchResultCard` component.

## 1. Icon Updates
The following assets in `public/assets/` will be used:
- `eightball` -> `eightball.png`
- `nineball` -> `nineball.png`
- `snooker` -> `snooker.png`
- `threecushion` -> `threecushion.png`

### `src/components/MatchResultCard.tsx`
- **Modify `getGameIcon`**: Update this function to return the asset path (string) instead of a unicode character.
- **Update Component**: Change the rendering of the icon from a `<span>` to an `<img>`.
- **Styling**: Ensure the `<img>` has dimensions similar to the current text icon (approx `w-5 h-5` or `20px`), ensuring it doesn't look too big.

## 2. Layout Changes (Right Justification)
The user requested that the "text section... that has the flag and time and replay badge" be right-justified.

### `src/components/MatchResultCard.tsx`
- **Structure Update**:
  - Currently, the card groups the Icon, Players, and Metadata (Location/Time) all on the left side in a flex row/col structure.
  - **New Structure**:
    - **Left**: Icon + Player Names.
    - **Right**: Location, Time, and Badge (Replay/Live).
- **Implementation**:
  - Move `<LocationTimeBadge />` out of the left-side flex column.
  - Place it as a direct child of the main card flex container (which already has `justify-between`).
  - Ensure the Player names remain vertically centered or aligned with the icon.
  - `LocationTimeBadge` will need to be styled to align its content to the right (e.g., `justify-end`, `text-right`).

## 3. Refactor `LiveMatchesList`
Refactor `LiveMatchesList` to render `MatchResultCard` components instead of its own ad-hoc markup.

### `src/components/MatchResultCard.tsx`
- **Props Update**: Extend `MatchResultCardProps` to support "Live" mode:
  - Add `onClick?: () => void` (to handle the spectate action).
  - Add `isLive?: boolean` (to toggle the "LIVE" badge vs "REPLAY" badge).
  - Alternatively, allow passing a `customBadge` or `actionLabel`.
  - *Proposal*: Add `variant` prop (`'result' | 'live'`) or specific optional props.
    - If `isLive` is true:
      - Show "LIVE" badge (Red).
      - Make the card clickable via `onClick`.
      - Hide "Replay" badge.

### `src/components/LiveMatchesList.tsx`
- **Implementation**:
  - Import `MatchResultCard`.
  - Map over `activeGames`.
  - construct a "virtual" `MatchResult` object from the `Table` data to pass to `MatchResultCard`.
    - `winner` -> Player 1 Name
    - `loser` -> Player 2 Name
    - `gameType` -> `table.ruleType`
    - `timestamp` -> `table.createdAt`
  - Pass `isLive={true}` and `onClick={handleSpectate}`.

## Execution Steps
1.  **Refactor Icons**: Update `getGameIcon` and `MatchResultCard` image rendering.
2.  **Update Layout**: CSS/Flexbox changes in `MatchResultCard` to move metadata to the right.
3.  **Enhance MatchResultCard**: Add props for `isLive` / `onClick`.
4.  **Refactor LiveMatchesList**: Switch to using `MatchResultCard`.
