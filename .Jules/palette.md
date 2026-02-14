## 2024-07-26 - Keyboard Focus and Clean Commits

**Learning:** Adding a `focus-visible` style with a distinct ring is a high-impact, low-effort way to significantly improve keyboard navigation accessibility. Additionally, it's critical to avoid committing temporary development files (like `dev.log`) or auto-generated configuration files (`next-env.d.ts`), as they can cause repository bloat and conflicts.

**Action:** Always check for focus states on interactive elements as a primary accessibility enhancement. Before committing, review the changed files list to ensure no unintended files are included.

## 2025-05-15 - Nested Interactive Elements and ARIA Labels

**Learning:** Nesting an `<input>` inside a `<button>` is a major accessibility violation that prevents screen readers from correctly interacting with the input. Using ARIA labels like `aria-label` on icon-only buttons or interactive pills provides much-needed context for assistive technologies.

**Action:** Avoid nesting interactive elements (button, a, input, etc.). Use conditional rendering to switch between different semantic containers (e.g., `button` for view mode, `div` for edit mode with an internal `input`). Always add `aria-label` to buttons that don't have clear text content.

## 2025-05-15 - Proper ARIA Roles for Read-Only Lists

**Learning:** Using interactive ARIA roles like `role="listbox"` and `role="option"` for read-only lists is semantically incorrect and confuses screen reader users who expect selection capabilities. Non-interactive lists should use semantic `<ul>` and `<li>` elements, with descriptive labels provided via `aria-label`.

**Action:** Audit popovers and dropdowns that only display information to ensure they don't use interactive roles if no selection or action is possible on the items.
