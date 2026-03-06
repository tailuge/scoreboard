## 2025-05-15 - [Input Validation and Redis Key Injection Prevention]
**Vulnerability:** User-supplied parameters (`ruletype`, `metric`) were used directly to construct Redis keys in `ScoreTable` and `UsageService`.
**Learning:** This could lead to Redis key injection if an attacker provides specially crafted strings containing characters like `:` or `\r\n` (though Vercel KV might handle some of this, it's best practice to validate).
**Prevention:** Always validate all user-provided input against a strict whitelist or regex before using it in database keys or queries. Standardize this validation in the service layer and handle it with appropriate 400 responses in the API layer.
