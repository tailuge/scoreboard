# Knip & Bundle Size Analysis Report

This report identifies unused files, dependencies, exports, and provides an analysis of the bundle size with recommendations for optimization.

---

## 1. Knip Findings

Using [Knip](https://knip.dev/), the following unused or unlisted items were identified:

### Unused Files
These files are not imported anywhere in the project and can safely be deleted.
- `src/tests/apiTestUtils.ts`
- `src/types/player.ts`
- `src/utils/iframe.ts`
- `public/usage.css`
- `src/utils/api.ts`

### Unused devDependencies
These packages are listed in `package.json` but are not used in source or test files.
- `jest-transform-stub`
- `eslint-config-next` (Note: Check if integrated into `eslint.config.mjs`)
- `jest-mock-extended`
- `jest-canvas-mock`
- `concurrently`
- `wait-on`

### Unlisted Dependencies
These are imported but not explicitly listed in `package.json`.
- `eslint-plugin-react-hooks` (Used in `eslint.config.mjs`)
- `eslint-plugin-import` (Used in `eslint.config.mjs`)
- `postcss-load-config` (Used in `postcss.config.mjs`)

### Unlisted Binaries
- `yarn-check` (Used in `package.json` script "deps")

### Unused Exports
- `LeaderboardTable` in `src/components/LeaderboardTable.tsx`
- `setupRouterMock` in `src/tests/testUtils.ts`
- `mockTables` in `src/tests/mockData.ts`
- `mockTable` in `src/tests/mockData.ts`
- `GameRuleType` (Type) in `src/config.ts`

### Duplicate Exports
- `LeaderboardTable` has both a named and a default export in `src/components/LeaderboardTable.tsx`.

---

## 2. Bundle Size Analysis

### Current State
A production build (`yarn build`) reveals the following significant client-side chunks:

1.  **`0f_p_iahfut4z.js` (~1.2MB)**:
    *   **Content**: This is a heavy chunk containing `swagger-ui-react` and its dependencies (like `ajv`, `js-yaml`, `braid`, etc.).
    *   **Status**: **Optimized**. This chunk is dynamically imported in `src/pages/api-doc.tsx`. It is only loaded when a user visits the API documentation page and does not affect the performance of the main application pages (`/game`, `/leaderboard`).
2.  **`0i5touvxvijek.js` (~202KB)**:
    *   **Content**: Contains core React and Next.js libraries (`react-dom`, etc.).
3.  **Other Chunks**:
    *   `@heroicons/react` is used with specific path imports (e.g., `@heroicons/react/24/solid`), which ensures only the necessary icons are bundled.
    *   `jsoncrush` and `next-swagger-doc` are used exclusively in server-side code (Edge API routes) and do not leak into the client bundle.

### Findings
*   The main application bundle is relatively lean.
*   The largest dependency (`swagger-ui-react`) is already isolated via dynamic import.
*   No significant "leaks" of server-side code into the client-side were found.

---

## 3. Recommendations & Guidance

### How to remove unused items (Guidance)

1.  **Remove Unused Files**:
    ```bash
    rm src/tests/apiTestUtils.ts src/types/player.ts src/utils/iframe.ts public/usage.css src/utils/api.ts
    ```

2.  **Remove Unused devDependencies**:
    ```bash
    yarn remove -D jest-transform-stub jest-mock-extended jest-canvas-mock concurrently wait-on
    ```
    *Note: Verify `eslint-config-next` usage before removal.*

3.  **Fix Unlisted Binaries**:
    The `yarn-check` binary is used in the `deps` script. If it's not working, you may need to install it:
    ```bash
    yarn add -D yarn-check
    ```

4.  **Fix Unlisted Dependencies**:
    Add the following to your `devDependencies` to ensure stable builds:
    ```bash
    yarn add -D eslint-plugin-react-hooks eslint-plugin-import postcss-load-config
    ```

5.  **Clean up Exports**:
    *   In `src/components/LeaderboardTable.tsx`, remove the named export if only the default export is intended (or vice-versa).
    *   Remove `export` keywords from the unused functions in `src/tests/testUtils.ts` and `src/tests/mockData.ts`.

### Suggestions for further Bundle Size Reduction

1.  **Icon Optimization**:
    While already using path imports for `@heroicons/react`, consider using a tool like `unplugin-icons` or a dedicated icon library if the number of icons grows significantly.

2.  **Dependency Review**:
    *   **`timeago.js`**: If only simple formatting is needed, a custom 10-line utility could replace this 6KB dependency.
    *   **`swagger-ui-react`**: Since this is only for internal/dev documentation, ensure it's not being accidentally included in any critical path. The current dynamic import is a good start.

3.  **Next.js Features**:
    *   Continue using `next/dynamic` for any heavy UI components that are not needed for the initial page load.
    *   Ensure all images use `next/image` for automatic optimization and lazy loading.
