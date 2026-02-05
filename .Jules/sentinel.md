# Sentinel's Journal

## 2025-05-14 - Standard Security Headers Implementation
**Vulnerability:** Missing standard security headers (X-Frame-Options, X-Content-Type-Options, etc.).
**Learning:** The application self-iframes for testing purposes (e.g., in `test.html`), which makes `X-Frame-Options: SAMEORIGIN` both necessary and correct.
**Prevention:** Always verify iframing requirements before applying restrictive frame-ancestors or X-Frame-Options headers.
