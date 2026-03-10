NCHAN LOBBY + TABLE PAIRING PROTOCOL (MINIMAL)

## Goal

Provide:

1. Online user list
2. Seek / create table
3. Join table

Pairing completes when both players know the same tableId.
No server state or database required.

## CHANNELS

Presence (lobby)
publish: /publish/presence/lobby
subscribe: /subscribe/presence/lobby

Table channel
publish: /publish/table/{tableId}
subscribe: /subscribe/table/{tableId}

Some minor adjustments to nchan config for this, but keep the state of the world replay on tables as spectators can use that.

## MESSAGE TYPES

PresenceMessage
Used for lobby presence, heartbeats, and seeks.

Fields:
type : "join" | "heartbeat" | "leave"
userId : string
userName : string
timestamp : nchan adds a header with timestamp, websocket listener can copy that in
seek : optional object

seek object:
tableId : string
ruleType : optional string
created : number (unix ms timestamp when seek was created)

Example (join lobby)
{
"type": "join",
"userId": "p1",
"userName": "Luke"
}

Example (heartbeat with seek)
{
"type": "heartbeat",
"userId": "p1",
"userName": "Luke",
"seek": {
"tableId": "t123",
"ruleType": "3c",
"created": 1710000000000
}
}

Example (leave lobby)
{
"type": "leave",
"userId": "p1",
"userName": "Luke"
}

TableJoinMessage
Used for accepting a table.

Fields:
type : "accept"
tableId : string
userId : string
userName : string

Example
{
"type": "accept",
"tableId": "t123",
"userId": "p2",
"userName": "Alice"
}

## CLIENT STATE

Clients maintain a lobby user map:

users[userId] = {
userName
lastHeartbeat
seek?
}

A user is considered online if:

now - lastHeartbeat < 15 seconds

## SEEKING A GAME

1. Player generates tableId.

2. Player begins sending heartbeat messages including:

seek.tableId
seek.created

3. Heartbeat interval recommended:

5 seconds

4. Other clients show seek entries from presence messages.

## HIDING STALE SEEKS

Clients ignore seeks where:

now - seek.created > 30 seconds

(or any chosen threshold)

## JOINING A TABLE

1. Player clicks a seek.

2. Player subscribes to the table channel:

/subscribe/table/{tableId}

3. Player publishes accept message:

/publish/table/{tableId}

Example:
{
"type": "accept",
"tableId": "t123",
"userId": "p2",
"userName": "Alice"
}

## PAIRING

The table creator subscribes to:

/subscribe/table/{tableId}

When the creator receives the first "accept" message:

- opponent is set
- pairing complete

Both players now know the tableId.

## RACE CONDITION RULE

If multiple accept messages arrive:

only the first accept is used
additional accepts are ignored

## TABLE HANDOFF

After pairing:

Both players navigate to:

/table/{tableId}

Game communication happens on the table channel.

## SUMMARY

Channels used:
presence/lobby
table/{tableId}

Messages used:
PresenceMessage
TableJoinMessage

Pairing trigger:
first "accept" message on table channel

No database required.
Presence heartbeat doubles as seek advertisement.

## TESTING STRATEGY

This client-side code uses WebSockets (nchan pub/sub) for real-time communication. Testing
requires Docker to run the nchan server.

Option 1: Testcontainers (Recommended)
Install: npm install --save-dev testcontainers

- Industry standard for "disposable" infrastructure in tests
- Self-cleaning (handles container lifecycle even on crash)
- Dynamic port mapping (avoids collisions when running parallel tests)
- Faster for single-container setups

Implementation pattern:
import { GenericContainer } from "testcontainers";
import WebSocket from 'ws';

    let container;
    let port;

    beforeAll(async () => {
      container = await new GenericContainer("slact/nchan")
        .withExposedPorts(80)
        .start();
      port = container.getMappedPort(80);
    }, 30000);

    afterAll(async () => {
      await container.stop();
    });

Option 2: Global Teardown (docker-compose)

- Uses globalSetup/globalTeardown hooks in test runner
- Better for complex multi-service stacks
- Static port mapping (fixed in YAML)

Create setup.js and teardown.js that run docker-compose up/down.

Node.js WebSocket Testing for Browser Code
The nchan client code is designed for browser use, but tests run in Node.js.
This works because:

- The WebSocket API is nearly identical in Node.js (ws library) and browsers
- Test against the same nchan server container
- Use the ws library in tests instead of native browser WebSocket

Dependencies for Node testing:
npm install --save-dev ws

## ROADMAP

1. Set up testcontainers in test suite for nchan container lifecycle
2. Create WebSocket test utilities that work in Node.js
3. Write integration tests for lobby presence and table pairing
4. Ensure tests clean up containers after each test run
