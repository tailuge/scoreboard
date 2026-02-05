# Repository Guidelines

## Project Structure & Module Organization
- `src/pages`: Next.js Pages Router entry points and API routes in `src/pages/api`.
- `src/components`: Reusable React UI components.
- `src/services`: Business logic and KV/Nchan integrations.
- `src/nchan`: Nchan configuration and pub/sub helpers.
- `src/utils`: Shared utilities.
- `src/tests`: Jest unit/integration tests and test utilities.
- `public`: Static assets and standalone HTML pages (for example `public/leaderboard.html`).

## Build, Test, and Development Commands
- `yarn dev`: Start Next.js dev server (Turbo).
- `yarn build`: Production build.
- `yarn start`: Run the built app.
- `yarn lint`: Type-check and lint the codebase.
- `yarn lint:smells`: Run oxlint and duplication checks.
- `yarn prettify`: Format `src` and `public` files.
- `yarn test`: Jest suite (`src/tests/jest.config.js`).
- `yarn coverage`: Jest with coverage.
- `yarn e2e`: Playwright E2E tests.

## Coding Style & Naming Conventions
- Language: TypeScript with Next.js pages router.
- Formatting: Prettier (no semicolons, trailing commas in ES5). Run `yarn prettify` before PRs.
- Linting: ESLint plus TypeScript checks via `yarn lint`.
- Naming: Prefer descriptive component and test names; API route tests use `api.*.test.ts` (see `src/tests`).
- Portability: Use `globalThis` instead of `window`, `global`, or `self`.

## Testing Guidelines
- Frameworks: Jest for unit/integration tests and Playwright for E2E.
- Location: Add tests under `src/tests` and colocate fixtures there.
- Naming: `*.test.ts` or `*.test.tsx` (for example `src/tests/TableService.test.ts`).
- Recommended local run: `yarn test` after changes; add `yarn e2e` for UI flows.

## Commit & Pull Request Guidelines
- Commit style is mixed in history (conventional `feat:`/`docs:`, emoji prefixes, and short labels). Keep messages concise and imperative, and include a scope when helpful.
- PRs should include a clear summary, test evidence (commands run), and screenshots for UI changes. Link related issues when applicable.

## Configuration & Ops Notes
- KV and Nchan are required for full functionality; local tests may use mocks.
- Static pages in `public` are deployed alongside Next.js pages; update both when touching the lobby/leaderboard flows.
