# API Documentation Plan (Revised)

## Executive Summary

**Goal:** Implement automatic API documentation (OpenAPI/Swagger) with **least intervention** to the existing codebase.

**Recommendation:** Use **`next-swagger-doc`** (creates OpenAPI spec from JSDoc comments) instead of `next-rest-framework`.

**Why `next-swagger-doc` is better for "Least Intervention":**
1.  **Zero Runtime Changes:** You do *not* need to rewrite your API handlers or wrap them in new functions (unlike `next-rest-framework`).
2.  **No New Validation Logic:** You don't need to adopt Zod or change how you validate requests at runtime.
3.  **Non-Invasive:** Documentation lives in JSDoc comments (`/** @swagger ... */`) above your existing code.
4.  **Flexible:** You can document as much or as little as you want, incrementally.

---

## Implementation Plan

### 1. Install Dependencies

```bash
yarn add next-swagger-doc swagger-ui-react
```

### 2. Create the Spec Generator

Create a file `src/lib/swagger.ts` (or `utils`):

```typescript
import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/pages/api', // Scans this folder
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Scoreboard API',
        version: '1.0',
      },
      security: [],
    },
  });
  return spec;
};
```

### 3. Create the API Endpoint (JSON)

Create `src/pages/api/doc.ts`:

```typescript
import { withSwagger } from 'next-swagger-doc';

const swaggerHandler = withSwagger({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Scoreboard API',
      version: '1.0',
    },
  },
  apiFolder: 'src/pages/api',
});

export default swaggerHandler();
```

### 4. Create the Documentation UI

Create `src/pages/api-doc.tsx`:

```typescript
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { createSwaggerSpec } from 'next-swagger-doc';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic<{ spec: any }>(import('swagger-ui-react'), { ssr: false });

function ApiDoc({ spec }: InferGetStaticPropsType<typeof getStaticProps>) {
  return <SwaggerUI spec={spec} />;
}

export const getStaticProps: GetStaticProps = async () => {
  const spec = createSwaggerSpec({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Scoreboard API',
        version: '1.0',
      },
    },
    apiFolder: 'src/pages/api',
  });

  return {
    props: {
      spec,
    },
  };
};

export default ApiDoc;
```

### 5. Add JSDoc to Your Routes

You can now document your API by adding JSDoc comments to your existing files in `src/pages/api/`.

**Example: `src/pages/api/match-results.ts`**

```typescript
/**
 * @swagger
 * /api/match-results:
 *   get:
 *     description: Returns a list of match results
 *     responses:
 *       200:
 *         description: Hello Match Results
 */
export default async function handler(req, res) { ... }
```

---

## Comparison: Why not Next REST Framework?

The original plan suggested `next-rest-framework`. While powerful, it requires **rewriting** your handlers:

**Next REST Framework (High Intervention):**
```typescript
// Requires changing code structure
export const GET = routeOperation({...}).handler(async (req, res) => { ... })
```

**next-swagger-doc (Least Intervention):**
```typescript
// No code change, just comments
/**
 * @swagger
 * /api/match-results:
 *   get: ...
 */
export default async function handler(req, res) { ... }
```

This approach allows you to "decorate" your existing API with documentation without risking regression bugs by refactoring the actual logic.