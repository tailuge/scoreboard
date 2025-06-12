# Protocol Documentation

This document outlines the API and notification protocols used in this application.

## Current System

### API Overview

The current API primarily revolves around managing game tables. Key interactions are handled by serverless functions located under `/pages/api/`. The `TableService` (found in `src/services/TableService.ts`) is central to table operations, interacting with a persistent KV store.

Key API endpoints related to multiplayer functionality include:

*   `POST /api/tables`: Creates a new game table.
    *   Body: `{ userId: string, userName: string, ruleType: string }`
    *   Response: The created table object.
*   `GET /api/tables`: Lists all active game tables.
*   `GET /api/tables/{tableId}`: Retrieves details for a specific table.
*   `PUT /api/tables/{tableId}/join`: Allows a user to join an existing table.
    *   Body: `{ userId: string, userName: string }`
    *   Response: The updated table object.
*   `POST /api/tables/{tableId}/spectate`: Allows a user to spectate a table.
    *   Body: `{ userId: string, userName: string }`
    *   Response: The updated table object.
*   `POST /api/tables/{tableId}/complete`: Marks a table as complete.
    *   Response: The updated table object.

### Multiplayer Notifications (Nchan)

The system uses Nchan for real-time notifications, primarily for lobby-level updates about table activities.

*   **Nchan Publisher:** The `NchanPub` class (in `src/nchan/nchanpub.ts`) is used by the `TableService` to send messages.
*   **Nchan Subscriber:** The `NchanSub` class (in `src/nchan/nchansub.ts`) is used by clients to connect to Nchan channels via WebSockets.
*   **Nchan Server Configuration (`src/nchan/nchan.conf`):**
    *   Defines publisher endpoints: `/publish/table/{channel_id}` and `/publish/lobby/{channel_id}`.
    *   Defines subscriber endpoints: `/subscribe/table/{channel_id}` and `/subscribe/lobby/{channel_id}`.
    *   The "lobby" channel type has `nchan_message_buffer_length 0`, meaning it's for live, non-persistent messages. Subscribers only get new messages.
    *   The "table" channel type has `nchan_message_buffer_length 1000` and `nchan_subscriber_first_message oldest`, suggesting it can be used for more persistent event streams or replays, though current general notifications use the "lobby" type.

*   **Channel Structure:**
    *   A single, general Nchan channel named `"lobby"` is used for all primary table-related notifications.
    *   The `TableService` publishes to this "lobby" channel. For example, `new NchanPub("lobby").post(event)`.

*   **Message Format:**
    *   Notifications are simple JSON objects indicating the type of action that occurred.
    *   Examples:
        *   `{ "action": "create" }` (when a new table is created)
        *   `{ "action": "join" }` (when a player joins a table)
        *   `{ "action": "spectate" }` (when a user starts spectating)
        *   `{ "action": "complete" }` (when a table is marked complete)
        *   `{ "action": "expired table" }` (when an attempt is made to interact with an expired table)
    *   These messages are generic and do not contain specific data like the `tableId`.

*   **Notification Flow:**
    1.  A client initiates an action (e.g., joining a table) by calling a relevant API endpoint.
    2.  The API handler invokes the appropriate method in `TableService`.
    3.  `TableService` updates the table state in the KV store.
    4.  `TableService` then publishes an action-specific message (e.g., `{ "action": "join" }`) to the `"lobby"` Nchan channel.
    5.  Clients subscribed to the `"lobby"` channel receive this generic notification.
    6.  Upon receiving a notification, clients typically need to re-fetch data from the API (e.g., call `GET /api/tables` or `GET /api/tables/{tableId}`) to get the detailed updated state, as the Nchan message itself is minimal.

## Proposed Pool Pairing System

This section outlines a proposal for a pool pairing system to match players for games. This system is designed with the serverless architecture and persistent KV store in mind.

### 1. User Stories

*   **Join Pool:** As a user, I want to join a matchmaking pool for a specific game type (e.g., "1v1 ranked 8-ball", "casual 9-ball").
*   **Status Check:** As a user, I want to be able to check my current status in the matchmaking pool (e.g., "searching for match", "match found").
*   **Notification:** As a user, I want to be notified in real-time when a suitable match is found and receive details about the game/table and opponent.
*   **Leave Pool:** As a user, I want to be able to leave a matchmaking pool if I no longer wish to wait for a match.

### 2. API Endpoints

The following new API endpoints would be introduced:

*   **`POST /api/pairing/join`**
    *   **Purpose:** Adds a user to a specified matchmaking pool and attempts to find a match.
    *   **Request Body:**
        ```json
        {
          "userId": "string",       // Unique identifier for the user
          "userName": "string",     // Display name for the user
          "poolType": "string",     // Identifier for the pool (e.g., "1v1_ranked_8ball", "casual_ffa")
          "preferences": {          // Optional: User-defined criteria for matching
            // Example: "minRank": 1000, "maxRank": 1200
          }
        }
        ```
    *   **Response:**
        *   If a match is immediately found:
            ```json
            {
              "status": "matched",
              "matchDetails": {
                "tableId": "string",    // ID of the newly created game table
                "opponent": { /* Player object for the opponent */ },
                "poolType": "string"
              }
            }
            ```
        *   If no immediate match, user is added to the queue:
            ```json
            {
              "status": "searching",
              "poolType": "string"
            }
            ```
    *   **Error Responses:** `400` for bad request (e.g., invalid poolType), `500` for server errors.

*   **`GET /api/pairing/status`**
    *   **Purpose:** Allows a user to check their current matchmaking status.
    *   **Query Parameters:** `userId={userId}&poolType={poolType}`
    *   **Response:**
        ```json
        {
          "status": "searching" | "matched" | "not_in_pool",
          "poolType": "string",
          "matchDetails": { // Present if status is "matched"
            "tableId": "string",
            "opponent": { /* Player object */ }
          }
        }
        ```

*   **`POST /api/pairing/leave`**
    *   **Purpose:** Removes a user from a specified matchmaking pool.
    *   **Request Body:**
        ```json
        {
          "userId": "string",
          "poolType": "string"
        }
        ```
    *   **Response:**
        ```json
        {
          "status": "removed" | "not_in_pool" // Confirms removal or if user wasn't in the pool
        }
        ```

### 3. KV Store Usage

The persistent KV store will be central to managing player pools and the matchmaking process.

*   **Pool Storage:**
    *   For each `poolType`, a list or sorted set of waiting players will be stored. Example key: `pairing_pool:1v1_ranked_8ball`.
    *   Each entry in the list will be an object containing:
        ```json
        {
          "userId": "string",
          "userName": "string",
          "joinTime": "timestamp", // Time the user joined the pool
          "preferences": { /* user's preferences */ }
        }
        ```
*   **Matching Logic (executed within API calls like `/api/pairing/join`):**
    1.  When a user joins via `POST /api/pairing/join`:
        a.  The user is added to the appropriate `poolType` list in the KV store.
        b.  The system then scans this list for a suitable match based on `preferences` and potentially `joinTime` (to prioritize players who have waited longer).
    2.  If a match is found:
        a.  Both matched players are removed from the `poolType` list in the KV store.
        b.  A new game table is created using the existing `TableService`. This service handles its own KV store updates for table data and publishes a standard table creation event to the `"lobby"` Nchan channel.
        c.  A notification of the match is sent to both players (see Nchan Usage below).
    3.  If no match is found, the user remains in the pool list.
*   **State Management & Atomicity:**
    *   Care must be taken when removing players and creating a table to handle potential race conditions or failures. Operations should be designed to be as idempotent as possible.
    *   For instance, if a match is made but notification fails, players should ideally not be stuck in a limbo state. A temporary match record (e.g., `match_status:{userId}`) with a short TTL could be used to allow users to confirm their match via `GET /api/pairing/status` if a direct notification is missed.

### 4. Nchan Usage for Pairing Notifications

Direct, real-time notification is preferred for informing users about a successful match.

*   **User-Specific Channels:** When a match is made, a notification will be published to a user-specific Nchan channel.
    *   Channel Name Pattern: `user_pairing_{userId}` (e.g., `user_pairing_abc123xyz`)
    *   The `NchanSub` class on the client-side would subscribe to this channel upon joining a pool: `new NchanSub(\`user_pairing_\${userId}\`, handleMatchNotification, "user_pairing")`.
*   **Message Format:**
    ```json
    {
      "event": "match_found",
      "poolType": "string", // The pool in which the match was found
      "tableId": "string",  // ID of the game table created for the match
      "opponent": {
        "id": "string",
        "name": "string"
        // Other relevant opponent details
      }
    }
    ```
*   **Nchan Configuration (`nchan.conf` modification required):**
    *   A new subscriber location would need to be added to the Nchan configuration to support these dynamic user-specific channels. This would be similar to existing subscriber setups but tailored for these channels.
    *   Example addition to `nchan.conf`:
      ```nginx
      # Subscriber endpoint for user-specific pairing notifications
      location ~ ^/subscribe/user_pairing/(?<channel_id>[^/]+)$ {
          nchan_subscriber;
          nchan_channel_id $channel_id;
          nchan_message_buffer_length 5; # Small buffer for recent messages
          nchan_message_timeout 0; # No timeout for messages, rely on client reconnect
          nchan_subscriber_first_message new; # Only new messages
          nchan_subscriber_timeout 0; # No timeout for subscriber
      }
      ```
    *   A corresponding publisher location might also be defined if publishing is restricted, or existing publisher endpoints could be used if they allow arbitrary channel IDs. For instance, if the existing `/publish/lobby/(?<channel_id>\w+)$` publisher endpoint is used, `NchanPub` would be called with the dynamic channel ID (e.g., `new NchanPub(\"user_pairing_userIdA\")`). This would subject these pairing notifications to the 'lobby' publisher's settings (like no message buffering), which is likely acceptable. Alternatively, a dedicated `/publish/user_pairing/(?<channel_id>[^/]+)$` location could be added to `nchan.conf` for more specific control if needed. For simplicity, we assume the existing `/publish/lobby/...` or a new `/publish/user_pairing/...` endpoint could target these dynamic `user_pairing_{userId}` channel IDs. The `NchanPub` class already takes a channel name, so it can be adapted.

### 5. Flow Diagram (Conceptual)

```
User A (Client)                                 API Server (Serverless Functions)                         KV Store                                     Nchan Server
------------------                              ------------------------------------                      ----------                                   -------------
1. Client Subscribes to Nchan channel `user_pairing_userIdA`

2. Join Pool (poolType: X) ------------------> POST /api/pairing/join
                                                { userIdA, userNameA, poolType: X }
                                                                                      3. Add UserA to `pairing_pool:X`
                                                4. Scan `pairing_pool:X` for match.
                                                   (No match yet)
                                                5. Respond to User A:
                                                   { status: "searching" } <--------------------

User B (Client)
------------------
6. Client Subscribes to Nchan channel `user_pairing_userIdB`

7. Join Pool (poolType: X) ------------------> POST /api/pairing/join
                                                { userIdB, userNameB, poolType: X }
                                                                                      8. Add UserB to `pairing_pool:X`
                                                9. Scan `pairing_pool:X` for match.
                                                   (Match found: UserA, UserB!)
                                                                                      10. Remove UserA, UserB from `pairing_pool:X`
                                                11. Call TableService.createTable(...)
                                                    (TableService creates table, stores in KV,
                                                     publishes to "lobby" Nchan channel) -------------> (Nchan "lobby" channel)
                                                12. Prepare match details (tableId, opponents)

                                                13. Publish to Nchan `user_pairing_userIdA`:
                                                    { event: "match_found", ... } ---------------------> (Nchan `user_pairing_userIdA`) --> To User A
                                                14. Publish to Nchan `user_pairing_userIdB`:
                                                    { event: "match_found", ... } ---------------------> (Nchan `user_pairing_userIdB`) --> To User B

                                                15. Respond to User B:
                                                    { status: "matched", matchDetails: {...} } <---------

User A (Client)
------------------
16. Receives Nchan message on `user_pairing_userIdA`.
    UI updates, navigates to table.

User B (Client)
------------------
17. Receives API response for join (or Nchan message).
    UI updates, navigates to table.
```

This proposal aims to provide a robust and scalable pairing system leveraging the existing Nchan infrastructure for real-time updates and the KV store for state management in a serverless environment.
