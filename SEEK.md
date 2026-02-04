### Investigation of `action=join` query parameter

**1. Summary of the issue:**

The user reported that when two players try to join a game at the same time using the `action=join` query parameter, they both end up creating new tables instead of being paired in the same one. This suggests a race condition.

**2. Code Analysis:**

-   **`src/pages/lobby.tsx`**: This component is the entry point for the lobby. It uses the `useAutoJoin` custom hook to handle the `action=join` logic.

-   **`src/components/hooks/useAutoJoin.ts`**: This hook contains the core logic for the "auto-join" feature.
    -   It checks for the `action=join` query parameter.
    -   It then checks a `tables` array (passed as a prop) to see if there is an existing, non-completed table of the requested `gameType`.
    -   **If a table is found, it calls `handleJoin`.**
    -   **If no table is found, it calls `createTable`.**

-   **`src/components/hooks/useLobbyTables.ts`**: This hook is responsible for fetching the list of tables from the `/api/tables` endpoint and providing it to the `Lobby` component. It also provides the `createTable` and `tableAction` (which includes `join`) functions.

-   **`src/pages/api/tables/index.ts`**: This API route handles:
    -   `GET /api/tables`: Fetches and returns a list of all tables from `TableService`.
    -   `POST /api/tables`: Creates a new table using `TableService`.

-   **`src/services/TableService.ts`**: This service class interacts with a Vercel KV (Redis) store. It has methods to `getTables`, `createTable`, `joinTable`, etc. The tables are stored in a single hash.

**3. Root Cause of the Race Condition:**

The current implementation has a classic race condition because the decision to create a new table is made on the **client-side**.

Here is the sequence of events for two users trying to join simultaneously:

1.  **User A** and **User B** both load the lobby page with `?action=join&gameType=nineball`.
2.  Both of their clients call the `useLobbyTables` hook, which fetches tables from `/api/tables`.
3.  Since no one has created a table yet, the API returns an empty list of tables to both **User A** and **User B**.
4.  The `useAutoJoin` hook on both clients receives an empty `tables` array.
5.  The condition `existingTable` is false for both users, so both clients proceed to call the `createTable` function.
6.  This results in two separate `POST` requests to `/api/tables`, and two different tables are created in the database.

**4. Recommended Solution:**

To fix this, the logic for finding an available table or creating a new one should be moved to a single, atomic operation on the **server-side**.

A new API endpoint, for example `POST /api/tables/find-or-create`, should be created to handle this logic. This endpoint would perform the following steps atomically:

1.  Receive the user's information and desired `gameType`.
2.  Lock the table store to prevent race conditions (if the underlying storage requires it - a simple get/check/set might be sufficient and Redis is single-threaded).
3.  Query the list of tables to find one that matches the `gameType` and has only one player.
4.  **If a suitable table is found:** Add the user to that table as the second player.
5.  **If no suitable table is found:** Create a new table with the user as the first player.
6.  Unlock the store.
7.  Return the resulting table (either the one they joined or the new one they created) to the client.

The client-side `useAutoJoin` hook should be updated to call this new endpoint instead of performing the logic itself.

This server-centric approach ensures that the process of finding and joining a table is an atomic transaction, eliminating the race condition and ensuring that players are correctly paired.

### 5. Implementation Tasks

Please follow these steps to implement the server-side matchmaking.

- [ ] **Step 1: Create the API Endpoint Shell**
    - Create a new file: `src/pages/api/tables/find-or-create.ts`.
    - Set up a standard Next.js API handler that accepts `POST` requests.
    - Validate that the request body contains `gameType` and a user identifier (or use the session).

- [ ] **Step 2: Implement TableService Logic**
    - Open `src/services/TableService.ts`.
    - Add a new method `findPendingTable(gameType: string): Promise<Table | null>`.
        - This should iterate through existing tables and find one where:
            - `gameType` matches.
            - `players` array has exactly 1 entry.
            - `status` is not 'COMPLETED' or 'in-progress' (depending on definitions).
    - Add a new method `findOrCreate(userId: string, userName: string, gameType: string): Promise<Table>`.
        - logic:
            ```typescript
            const pending = await this.findPendingTable(gameType);
            if (pending) {
                return this.joinTable(pending.id, userId, userName); // Reuse existing join logic
            } else {
                return this.createTable(userId, userName, gameType); // Reuse existing create logic
            }
            ```
    - *Note: For this initial implementation, we will accept the small race condition window between find and join to get the feature working, before optimizing for Redis atomicity.*

- [ ] **Step 3: Unit Testing**
    - Create or update `src/tests/TableService.test.ts`.
    - Test `findPendingTable`:
        - Should return null if no tables exist.
        - Should return null if only full tables exist.
        - Should return a table if a valid pending table exists.
    - Test `findOrCreate`:
        - Should create a new table if none exist.
        - Should join an existing table if one is pending.

- [ ] **Step 3: Connect API to Service**
    - In `src/pages/api/tables/find-or-create.ts`, import `TableService`.
    - Call `TableService.findOrCreate` with the data from the request.
    - Return the resulting table JSON.

- [ ] **Step 4: Update Frontend Hook**
    - Open `src/components/hooks/useAutoJoin.ts`.
    - Remove the logic that fetches *all* tables and filters them client-side.
    - Instead, make a single `POST` request to `/api/tables/find-or-create` when `action=join`.
    - Use the response to redirect the user to the table or show the game room.

- [ ] **Step 5: Cleanup**
    - Verify `useLobbyTables.ts` does not contain unused logic if we moved it.
    - Ensure `src/pages/lobby.tsx` still works for "Create New Table" manual actions (if any).
