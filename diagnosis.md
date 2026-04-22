# Performance Diagnosis: /elo page

## The "Why"
The `/elo` page consistently takes 1–2 seconds to load primarily due to an architectural anti-pattern often called **"Internal Fetching"** combined with **"Request Multiplication."**

### 1. Internal HTTP Overhead (The "Double Jump")
The `getServerSideProps` function in `src/pages/elo.tsx` uses `fetch()` to call its own internal API routes (`/api/elo`).
- **Network Latency:** Even though the server is calling itself, it performs a full HTTP/HTTPS request. In a serverless environment like Vercel, this may route through the public internet, incurring TLS handshake and routing overhead.
- **Runtime Bootstrapping:** Each fetch to `/api/elo` triggers an execution of an Edge Function. If these functions are cold, you pay a startup penalty. Even if warm, you are spawning three separate execution contexts to fulfill one page request.

Every time `/api/elo` is called, it:
1. Instantiates a new `PlayerRatingStore`.
2. Establishes a connection to Vercel KV.
3. Performs an `HGETALL` operation on the KV store.
4. Processes and sorts the data.

Doing this three times per page load (once per game type) is inefficient when there are only 10 players.

---

## Suggested Solutions

### Solution A: Direct Service Access (Recommended)
Instead of fetching via HTTP, `getServerSideProps` should import the `PlayerRatingStore` and query the data directly.
- **Why it works:** It eliminates the HTTP stack, network latency, and Edge Function overhead entirely. It's a direct function call to your database.
- **Impact:** Reduces load time to the raw speed of the KV query (usually < 100ms).

### Solution C: Client-Side Fetching (No SSR)
Remove `getServerSideProps` and fetch the data in a `useEffect` hook or using a library like SWR/React Query.
- **Why it works:** The user sees the page layout immediately (Instant perceived performance). The data loads in with a loading spinner.
- **Impact:** Aligns with the project's goal of reducing Server CPU usage (Fluid Active CPU) and makes the site feel snappier.

### Solution D: KV Batching
In the `PlayerRatingStore`, use a single pipeline or `MGET` (if keys are structured differently) to fetch all ELO data in one trip to the KV store. Currently, `getTopN` uses `HGETALL`, which is fine for 10 players, but doing it three times in three different function calls is the bottleneck.