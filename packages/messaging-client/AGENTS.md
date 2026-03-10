# AGENTS.md

## Commands

```bash
npm run test           # Run Jest unit & integration tests
npm run test:debug     # Run Playwright browser tests
npm run lint           # Type check + lint
npm run format         # Prettier format
npm run build:example  # Bundle the example client
npm run example        # Start local http-server for example
npm run docker:nchan   # Build and start Nchan in Docker
npm run docker:stop    # Stop the Nchan Docker container
npm run docker:restart # Rebuild and restart the container
npm run docker:build   # Build the Nchan Docker image
```

## System Setup & Deployment

The project is a stateful messaging library designed to handle presence and real-time synchronization using Nchan as the transport layer.

### Local Development
- **Transport**: Requires a running Nchan instance. Use `npm run docker:nchan` to start one locally.
- **Example**: The example client in `example/` demonstrates presence and challenge flows. Run it with `npm run example`.

### Nchan Configuration
The library interacts with the following Nchan endpoints:
- `/subscribe/presence/lobby`: Presence and challenge tracking.
- `/publish/presence/lobby`: Heartbeats, join/leave, and challenge events.
- `/subscribe/table/:tableId`: Table-specific messaging.
- `/publish/table/:tableId`: Game moves and table events.

## Project Structure

```
src/
  messagingclient.ts # Main entry point & lifecycle management
  lobby.ts           # Presence, pruning, and challenges
  table.ts           # Table-specific messaging logic
  nchanclient.ts     # Low-level Nchan pub/sub transport
  types.ts           # Shared TypeScript interfaces
  utils/             # Internal utilities (UID generation, etc.)
test/
  messagingclient.spec.ts # Integration tests for the full flow
  nchanclient.spec.ts     # Tests for the transport layer
playwright/
  debug-connection.spec.ts # Browser-level connection tests
docker/
  Dockerfile         # Nginx + Nchan + NJS image
  nginx.conf         # Nchan channel configurations
  nchan_meta.js      # NJS script for message enrichment
```

## Testing Strategy

- **Integration (Jest)**: Uses `testcontainers` to spin up a real Nchan instance for every test run. Focuses on state management (pruning, heartbeats, table joining).
- **Browser (Playwright)**: Verifies WebSocket connectivity and event handling within a real browser environment.
- **Protocol (Shell)**: `docker/testnchan.sh` verifies Nchan endpoint behavior and metadata enrichment via `curl`.

## Nchan Message Enrichment

The Docker container uses Nginx with the Nchan module and an NJS script (`nchan_meta.js`) to enrich published messages with metadata (`_meta`).

**How it works:**
1. All `/publish/*` endpoints route through `js_content nchan_meta.publish`
2. The NJS script parses the JSON payload and builds a `_meta` object containing:
   - `ts`: ISO timestamp of the request (Source of Truth for timing)
   - `origin`, `locale`, `ua`, `ip`, `host`, `path`, `method`
3. The original payload is merged with `_meta` and forwarded to the internal Nchan publisher

**Verification:**
- `npm run test` verifies that `_meta` is correctly received and parsed by the client.
- `./docker/testnchan.sh` provides 8 specific assertions for metadata enrichment.
