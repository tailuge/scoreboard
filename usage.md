# Usage Tracking Documentation

This document describes how usage metrics are tracked, stored in Vercel KV (Redis), and visualized in this application.

## Overview

The usage tracking system is designed to be lightweight, efficient, and compatible with Vercel's Edge runtime. It provides a simple way to track daily counts for various events (e.g., lobby visits, game starts, challenges).

### Architecture

1.  **Frontend/Client**: Calls `markUsage(metric)` which performs a `PUT` request to `/api/usage/${metric}`.
2.  **Edge API**: `/src/pages/api/usage/[metric].ts` handles the request and uses `UsageService`.
3.  **Service Layer**: `src/services/usageservice.ts` interacts with Vercel KV.
4.  **Database**: Vercel KV (Redis) stores the data in a Sorted Set.

---

## Data Structure (Vercel KV / Redis)

Each metric is stored in a **Sorted Set** (`ZSET`).

### Key Format
The key is derived from the metric name:
`{metricName}Usage`

Example: `lobbyUsage`, `gameUsage`.

### Storage Strategy
Instead of storing a simple counter, we store daily counts by using an object representing the date as the **member** of the sorted set, and the count as the **score**.

-   **Member**: `{ "date": "YYYY-MM-DD" }`
-   **Score**: Total count for that day.

We use the `ZINCRBY` command, which increments the score of a member by a specified value. If the member doesn't exist, it is added with the increment as its initial score. @vercel/kv automatically handles serialization of the member object.

```typescript
// From src/services/usageservice.ts
async incrementCount(date): Promise<void> {
  const day = { date: new Date(date).toISOString().split("T")[0] }

  // Use zincrby to perform the increment in a single roundtrip
  await this.store.zincrby!(this.fullKey(), 1, day)
}
```

---

## Implementation Details

### 1. UsageService (`src/services/usageservice.ts`)

The core service that handles KV operations. It includes validation to ensure the metric name only contains alphanumeric characters, underscores, or hyphens.

```typescript
import { kv, VercelKV } from "@vercel/kv"

export class UsageService {
  constructor(
    private readonly key: string,
    private readonly store: VercelKV | Partial<VercelKV> = kv
  ) {
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      throw new Error("Invalid metric name")
    }
  }

  fullKey(): string {
    return this.key + "Usage"
  }

  async incrementCount(date): Promise<void> {
    const day = { date: new Date(date).toISOString().split("T")[0] }
    await this.store.zincrby!(this.fullKey(), 1, day)
  }

  async getAllCounts(): Promise<unknown[]> {
    // Returns [member1, score1, member2, score2, ...]
    return await this.store.zrange(this.fullKey(), 0, -1, {
      withScores: true,
    })
  }
}
```

### 2. API Handler (`src/pages/api/usage/[metric].ts`)

An Edge Function that exposes the usage tracking via HTTP.

-   **PUT `/api/usage/[metric]`**: Increments the counter for the current day.
-   **GET `/api/usage/[metric]`**: Retrieves all daily counts for the metric.

The handler uses `corsJson` and `corsResponse` to handle cross-origin requests.

### 3. Client Utilities (`src/utils/usage.ts`)

-   `markUsage(metric)`: For client-side tracking. Performs a fire-and-forget `fetch` with a `.catch()` block to prevent unhandled rejections.
-   `markUsageFromServer(metric)`: For server-side tracking (e.g., in other API handlers like `summary.ts`).

---

## Usage in Another App

To implement this pattern in another application:

1.  **Define a Naming Convention**: Use a consistent prefix or suffix for your KV keys.
2.  **Use Sorted Sets**: Leverage `ZINCRBY` to handle atomic increments of daily buckets.
3.  **Member Format**: Store the date as an object `{ "date": "YYYY-MM-DD" }`.
4.  **Sampling**: If you have high traffic, sample the tracking calls to stay within KV limits. For example, the `lobby` metric in this app is sampled at 10%.
5.  **Background Processing**: Use `event.waitUntil` (in Vercel Edge/Middleware) to perform the KV increment without blocking the main response.

---

## Visualization

The data is visualized in `public/usage.html` using **Plotly**.

### Data Retrieval & Parsing
The Redis `ZRANGE ... WITHSCORES` command returns an interleaved array: `[member1, score1, member2, score2, ...]`.

The client parses this into an array of objects for Plotly:
```javascript
const rawData = await getData(url) // e.g. [{date: "2023-01-01"}, 10, {date: "2023-01-02"}, 15]
const data = []

for (let i = 0; i < rawData.length; i += 2) {
  data.push({ date: rawData[i].date, clicks: rawData[i + 1] })
}

data.sort((a, b) => new Date(a.date) - new Date(b.date))
```
