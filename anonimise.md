# Plan: Refactor to Anonymous/Stateless

This plan outlines the steps to remove `UserProvider` and `MessagingProvider` to transform the application into a purely anonymous, stateless viewer.

## Objectives
- Remove all user identity tracking (no local storage, no URL param parsing).
- Remove all messaging infrastructure.
- Ensure the app functions correctly as a read-only viewer of statistics.

## Impacted Files & Actions

### 1. Context Removal
- **`src/pages/_app.tsx`**: Remove `UserProvider` and `MessagingProvider` wrappers.
- **`src/contexts/UserContext.tsx`**: Delete file.
- **`src/contexts/MessagingContext.tsx`**: Delete file.

### 2. Dependency Cleanup
- **Components/Hooks**: Audit and remove `useUser()` or `useMessaging()` imports.
    - Check for any functional side effects (like API calls that might have relied on `userId`).
- **Tests**:
    - **`src/tests/pages._app.test.tsx`**: Update tests to remove dependencies on `MessagingProvider`.
    - **`src/tests/testUtils.ts`**: Remove mock setups for `useUser`.

### 3. Cleanup of Residual Storage/URL Logic
- **`src/contexts/UserContext.tsx`**: Ensure the logic that writes/reads `userId`/`userName` to/from `localStorage`/`sessionStorage` is completely gone (it will be deleted with the file).
- **Backend API Routes**: Review routes like `api/match-results.ts` to ensure they don't depend on missing parameters. Based on initial review, they appear to handle missing params gracefully.

## Verification
- Run build and lint.
- Verify `leaderboard` and `elo` pages load without identity-related console errors.
- Ensure no lingering user-related query params appear in the URL.
