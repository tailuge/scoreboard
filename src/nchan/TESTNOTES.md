# Nchan Test Investigation Notes

## WebSocket Handshake Failures in Production

During investigation of `testnchan.sh -p` failures against the production environment (`billiards-network.onrender.com`), the following issues were identified and resolved:

### 1. Invalid `Sec-WebSocket-Key` Length
The `Sec-WebSocket-Key` used in the initial test script was `SGVsbG8sIHdvcmxkIQ==` ("Hello, world!"), which is 13 bytes after base64 decoding.
**Requirement:** The WebSocket specification (RFC 6455) requires the decoded key to be exactly 16 bytes.
**Symptom:** Cloudflare (fronting Render) strictly enforces this and returns `HTTP/1.1 400 Bad Request` with a `Sec-Websocket-Version: 13` header if the key is invalid.
**Resolution:** Updated the key to a valid 16-byte base64 string: `dGhlIHNhbXBsZSBub25jZQ==`.

### 2. HTTP/2 vs HTTP/1.1 Upgrade
In production, `curl` often negotiates HTTP/2 via ALPN when connecting to HTTPS endpoints.
**Issue:** The traditional `Connection: Upgrade` and `Upgrade: websocket` mechanism is specific to HTTP/1.1. While RFC 8441 defines WebSockets over HTTP/2, manual `curl` commands using HTTP/1.1-style upgrade headers will fail or time out if the connection has already upgraded to HTTP/2.
**Resolution:** Added the `--http1.1` flag to the `curl` command in `testnchan.sh` to force the handshake to use the compatible protocol.

### 3. Browser Compatibility
The production TypeScript code in `nchansub.ts` uses the browser's native `WebSocket` API. Browsers automatically handle:
- Generating a valid 16-byte `Sec-WebSocket-Key`.
- Managing the protocol upgrade (including handles WebSockets over HTTP/2 or falling back to HTTP/1.1).
- Setting appropriate headers like `Origin` and `Host`.

This explains why the application works in production even when the manual `curl` tests were failing.

## Verification Command
To manually verify the production WebSocket handshake:
```bash
curl -i -N --http1.1 \
    -H "Connection: Upgrade" \
    -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    -H "Sec-WebSocket-Version: 13" \
    "https://billiards-network.onrender.com/subscribe/lobby/handshake"
```
Expect: `HTTP/1.1 101 Switching Protocols`
