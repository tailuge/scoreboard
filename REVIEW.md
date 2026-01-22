# Code Review Findings

## Overview
The codebase utilizes Next.js (Pages Router), React 19, and Tailwind CSS. While the core logic works, there are several opportunities to improve performance, navigation experience, and maintainability.

## Findings

### 1. Client-Side Navigation
**File:** `src/pages/game.tsx`
**Issue:** The game selection buttons use standard `<a>` tags for internal navigation (`/lobby`).
**Impact:** This causes a full page reload, defeating the purpose of a Single Page Application (SPA) and resetting client state (like Redux or Context if used later).
**Recommendation:** Use `Link` from `next/link`.

### 2. Hardcoded Configuration
**Files:** `src/pages/lobby.tsx`, `src/components/hooks/useServerStatus.ts`
**Issue:** The `statusPage` URL (`https://billiards-network.onrender.com/basic_status`) is hardcoded.
**Impact:** Changing environments (dev, staging, prod) requires code changes.
**Recommendation:** Move this to `process.env.NEXT_PUBLIC_STATUS_PAGE`.

### 3. State Management & Race Conditions
**File:** `src/pages/lobby.tsx`
**Issue:** `fetchTables` is called multiple times and sets state. If network responses arrive out of order, the UI might show stale data.
**Recommendation:** Implement an abort controller or use a data fetching library like SWR or TanStack Query which handles this out-of-the-box.

### 4. Router Usage
**File:** `src/pages/lobby.tsx`
**Issue:** Uses `useSearchParams` from `next/navigation` inside the Pages Router (`src/pages`).
**Impact:** While strictly possible, it is idiomatic to use `useRouter` from `next/router` in the Pages directory to ensure consistent behavior and hydration.

### 5. Performance
**File:** `src/components/tablelist.tsx`
**Issue:** The table list is sorted on every render.
**Recommendation:** Memoize the sorted list using `useMemo`.

---

# Tasks for Junior Engineer

Please work through the following tasks in order. Create a separate branch for these changes.

## Task 1: Fix Navigation in Game Selection
- [ ] Open `src/pages/game.tsx`.
- [ ] Import `Link` from `next/link`.
- [ ] Update `GameButton` to use `Link` for internal URLs (those starting with `/`).
- [ ] Ensure external links still use `<a>` with `target="_blank"`.

## Task 2: Externalize Configuration
- [ ] Create or update `.env.local` (and `.env.example`).
- [ ] Add `NEXT_PUBLIC_STATUS_PAGE=https://billiards-network.onrender.com/basic_status`.
- [ ] Replace the hardcoded string in `src/pages/lobby.tsx` and `src/components/hooks/useServerStatus.ts` with the environment variable.

## Task 3: Optimize Table List Rendering
- [ ] Open `src/components/tablelist.tsx`.
- [ ] Wrap the `sortedTables` logic in a `useMemo` hook.
  ```typescript
  const sortedTables = useMemo(() => {
    return [...tables].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [tables]);
  ```

## Task 4: Standardize Router Usage
- [ ] Open `src/pages/lobby.tsx`.
- [ ] Replace `useSearchParams` with `useRouter` from `next/router`.
- [ ] Update the logic to read query params from `router.query` (handle the case where `router.isReady` might be false initially).

## Task 5: Cleanup UseEffect Dependencies
- [ ] Open `src/pages/lobby.tsx`.
- [ ] Identify the `useEffect` handling `handleJoin`.
- [ ] Wrap `handleJoin` and `createTable` in `useCallback` to stabilize their references, or move the function definitions inside the `useEffect` if they are only used there.

---

# Configuration Review (2026-01-22)

## Findings

### 1. TypeScript Configuration
**File:** `tsconfig.json`
**Issue:** Strict mode is disabled (`"strict": false`, `"strictNullChecks": false`).
**Impact:** Significantly increases the risk of runtime errors (null pointers) and reduces the effectiveness of TypeScript.
**Recommendation:** Enable `"strict": true` and remove `"strictNullChecks": false`.

**Issue:** Path aliases are incorrect.
**Impact:** Imports using `@lib` or `@components` will fail to resolve because they point to non-existent root directories instead of `src/`.
**Recommendation:** Update paths to point to `src/components/*` or remove unused aliases.

### 2. Dependencies
**File:** `package.json`
**Issue:** `cross-fetch` is included but likely redundant given Next.js 16's built-in fetch.
**Recommendation:** Verify usage and remove if unnecessary.

### 3. Documentation Accuracy
**File:** `AGENTS.md`
**Issue:** References missing `tailwind.config.ts`.
**Recommendation:** Update to reference `postcss.config.mjs` or the current Tailwind setup.