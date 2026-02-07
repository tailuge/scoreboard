## 2025-05-15 - [Security Header Modernization]
**Vulnerability:** Use of deprecated X-XSS-Protection header and missing security headers (HSTS, X-Frame-Options).
**Learning:** X-XSS-Protection "1; mode=block" is largely obsolete and can sometimes be used to create side-channel leaks; setting it to "0" and relying on a strong CSP is the modern standard.
**Prevention:** Regularly audit vercel.json for modern security best practices and ensure defense-in-depth headers are present.

## 2025-05-16 - [Open Redirect Prevention and Input Validation]
**Vulnerability:** Open Redirect via user-controlled URL paths and lack of input validation in high-score submissions.
**Learning:** Appending user-provided data directly to a base URL for redirection (e.g., `this.replayUrl + data.input`) can lead to open redirects if the input is a protocol-relative (`//`) or absolute URL.
**Prevention:** Always validate that user-provided segments for URL construction do not contain protocols or start with `//`. Centralize game type validation and enforce string length limits on all user-controlled inputs (e.g., 50 chars for names, 2000 for paths).
