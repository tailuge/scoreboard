## 2024-07-26 - Keyboard Focus and Clean Commits

**Learning:** Adding a `focus-visible` style with a distinct ring is a high-impact, low-effort way to significantly improve keyboard navigation accessibility. Additionally, it's critical to avoid committing temporary development files (like `dev.log`) or auto-generated configuration files (`next-env.d.ts`), as they can cause repository bloat and conflicts.

**Action:** Always check for focus states on interactive elements as a primary accessibility enhancement. Before committing, review the changed files list to ensure no unintended files are included.

## 2025-05-15 - Nested Interactive Elements and ARIA Labels

**Learning:** Nesting an `<input>` inside a `<button>` is a major accessibility violation that prevents screen readers from correctly interacting with the input. Using ARIA labels like `aria-label` on icon-only buttons or interactive pills provides much-needed context for assistive technologies.

**Action:** Avoid nesting interactive elements (button, a, input, etc.). Use conditional rendering to switch between different semantic containers (e.g., `button` for view mode, `div` for edit mode with an internal `input`). Always add `aria-label` to buttons that don't have clear text content.

## 2025-05-15 - Matchmaking Feedback and Status Roles

**Learning:** When a user is in a "waiting" state (like matchmaking), providing a clear countdown timer significantly reduces perceived wait time and manages expectations about timeouts. Combining this with proper `role="status"` and `aria-live="polite"` ensures that all users, including those using screen readers, are kept informed of the process status.

**Action:** For any long-running or timed processes, include a visual countdown and use ARIA status roles to provide real-time updates to assistive technologies. Be mindful that multiple elements (like `<output>`) can have implicit status roles, so ensure tests use specific queries to identify the correct status region.
