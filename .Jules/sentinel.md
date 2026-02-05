# Sentinel's Journal

## 2025-05-14 - Standard Security Headers Implementation
**Vulnerability:** Missing standard security headers (X-Frame-Options, X-Content-Type-Options, etc.).
**Learning:** The application is embedded by `https://tailuge.github.io`, making `X-Frame-Options: SAMEORIGIN` too restrictive for production. Replaced it with `Content-Security-Policy: frame-ancestors 'self' https://tailuge.github.io` to allow legitimate cross-origin embedding while preventing clickjacking.
**Prevention:** Always verify iframing requirements across all supported domains before applying restrictive frame-protection headers. Prefer `Content-Security-Policy: frame-ancestors` for modern, flexible control.
