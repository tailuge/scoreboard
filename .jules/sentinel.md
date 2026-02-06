## 2025-05-15 - [Security Header Modernization]
**Vulnerability:** Use of deprecated X-XSS-Protection header and missing security headers (HSTS, X-Frame-Options).
**Learning:** X-XSS-Protection "1; mode=block" is largely obsolete and can sometimes be used to create side-channel leaks; setting it to "0" and relying on a strong CSP is the modern standard.
**Prevention:** Regularly audit vercel.json for modern security best practices and ensure defense-in-depth headers are present.
