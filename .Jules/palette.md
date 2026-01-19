# Palette's Journal - CRITICAL LEARNINGS ONLY

This journal is for recording critical UX and accessibility learnings that are specific to this application or represent a significant pattern.

## 2024-07-25 - Redundant onKeyDown Handler on Buttons
**Learning:** I discovered a button component using both `onClick` and a redundant `onKeyDown={handleClick}` prop. Native `<button>` elements automatically trigger their `onClick` handler when activated via the keyboard ("Enter" or "Space"). Adding an `onKeyDown` handler for the same action is not only unnecessary but can be harmful, as it may fire on *any* key press, violating standard keyboard accessibility patterns.
**Action:** When modifying components, always check for and remove redundant `onKeyDown` handlers on button elements. Rely on the browser's native `onClick` behavior for keyboard accessibility.
