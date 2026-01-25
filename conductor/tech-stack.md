# Technology Stack

## Core Framework & Language
- **Next.js 16 (Pages Router):** Primary application framework for frontend and API routes.
- **TypeScript:** Ensuring type safety and better developer experience across the codebase.
- **React 19:** Frontend library for building the user interface.

## Styling & Animation
- **Tailwind CSS 4:** Utility-first CSS framework for rapid and consistent UI development.
- **Framer Motion:** Used for creating smooth, performant animations and transitions (e.g., card hover effects, pulsing indicators).

## Infrastructure & Data
- **Vercel KV (Redis):** Low-latency, serverless key-value storage for session management, rankings, and real-time state.
- **Vercel Platform:** Deployment and hosting with integrated Analytics and Speed Insights.

## Real-time Communication
- **Nchan:** A pub/sub server used for real-time messaging and live table updates, running in a Dockerized environment.

## Testing & Quality Assurance
- **Jest & React Testing Library:** Unit and integration testing for components and services.
- **Playwright:** End-to-end testing for critical user flows.
- **ESLint & Prettier:** Standardizing code quality and formatting.
- **Oxlint & Jscpd:** Advanced linting and code duplication detection.

## Deployment & Tooling
- **Yarn:** Package management.
- **Docker:** Containerization for Nchan and potential local development parity.
