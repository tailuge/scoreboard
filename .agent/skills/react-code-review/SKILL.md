---
name: React Code Review
description: Guidelines and best practices for reviewing React and Next.js code within the scoreboard project.
---

# React Code Review Guidelines

This skill provides a checklist and standards for reviewing React code in the `scoreboard` repository. Use these guidelines to ensure consistency, performance, and maintainability.

Review style: Code should be simple and readable. Avoid complex logic and unnecessary abstractions. A clear seperation of presentation and logic is preferred. Minimal error handling is preferred to keep code clean and concise.

## 1. Component Architecture
- **Functional Components**: Use functional components with Hooks exclusively.
- **Composition**: Prefer composition over large, complex components. Break down UI into smaller, reusable pieces in `src/components`.
- **Prop Types**: Use TypeScript interfaces for all component props. Ensure optional props are correctly marked (`?`).

## 2. State Management
- **Local State**: Use `useState` for simple component-level state.
- **Complex State**: Use `useReducer` for more complex state logic or when state transitions are interdependent.
- **Server State**: For global/shared state that persists, ensure proper integration with Vercel KV via the service layer (`src/services`).

## 3. Styling & Animations
- **Tailwind CSS**: Use Tailwind utility classes for all styling. Avoid custom CSS unless absolutely necessary (documented in `src/styles/globals.css`).
- **Conditional Classes**: Use the `clsx` or `tailwind-merge` pattern if available, or simple template literals for conditional styling.
- **Framer Motion**: Use `framer-motion` for animations. Ensure `AnimatePresence` is used where components are unmounting.

## 4. Next.js Patterns (Pages Router)
- **API Routes**: Ensure API routes in `src/pages/api` handle errors gracefully and follow RESTful principles.
- **Data Fetching**: Use `getStaticProps` or `getServerSideProps` appropriately. Favor client-side fetching with SWR/React Query if the data is highly dynamic (like lobby status).

## 5. Performance & Resource Management
- **Memoization**: Use `useMemo` and `useCallback` strategically to prevent unnecessary re-renders of expensive components or stable callbacks.
- **Nchan Subscriptions**: Ensure Nchan EventSource connections are properly cleaned up in `useEffect` return functions to prevent memory leaks.

## 6. Accessibility (a11y)
- Use semantic HTML tags (`<nav>`, `<main>`, `<header>`, `<footer>`).
- Ensure interactive elements have `aria-label` when text is not present.
- Verify keyboard navigability for custom components.

## 7. Testing
- New components should have associated Jest tests in `src/tests`.
- Significant user flows should be covered by Playwright E2E tests.
