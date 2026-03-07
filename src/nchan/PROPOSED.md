# Nchan Deployment Strategy

## Status: [OPTIMIZED]
- **Strategy Selection**: Official `nginx:1.27.4-alpine` with dynamic Nchan 1.3.8 module. [DONE]
- **Dockerfile Implementation**: Multi-stage build with security hardening, non-root user (`nginx`), and `--chown` optimization. [DONE]
- **Nginx Configuration**: `nginx.conf` and `nchan.conf` updated for native CORS, performance, and metadata enrichment. [DONE]
- **Local Verification**: Image successfully built and optimized for size and startup. [DONE]

---

## Strategy

1.  **Use pinned nginx:alpine**: Small, secure, and predictable. [DONE]
2.  **Build Nchan as a dynamic module**: Allows using the official image without re-building all of Nginx. [DONE]
3.  **Optimize startup**: Use `--chown` in Docker layers to avoid heavy runtime filesystem operations. [DONE]
4.  **Native Nchan CORS**: Replaced manual `if` blocks with native `nchan_access_control_allow_origin "*"` and `nchan_access_control_allow_credentials off;` for better performance and reliability. [DONE]
5.  **Data Enrichment**: Added `X-Server-Time`, `X-User-Agent`, and `X-Client-Country` headers to provide metadata to publishers and subscribers without message body overhead. [DONE]

## Implementation Details

### Tagging and Versioning Strategy
To maintain compatibility with `render.com` (which pulls `latest`) and adhere to code review best practices (which require explicit versions), the following dual-tagging strategy is adopted:

- **Immutable Tags**: Every build is tagged with the version from `package.json` (e.g., `1.0.0`).
- **Rolling Tags**: Every build is also tagged as `latest` to trigger automated deployments.

#### Scripts in `package.json`:
```bash
# Build with dual tags
docker build -t tailuge/billiards-network:$(node -p "require('./package.json').version") -t tailuge/billiards-network:latest src/nchan

# Push both tags
docker push tailuge/billiards-network:$(node -p "require('./package.json').version")
docker push tailuge/billiards-network:latest
```

## Benefits
- **Smaller Image**: Alpine-based images are significantly smaller than Debian/Ubuntu ones.
- **Faster Startup**: Elimination of runtime `chown -R` on large directories ensures immediate startup.
- **Security**: Official images receive faster security updates and run as non-root user (UID 101).
- **Native CORS**: Better handling of OPTIONS preflight and origin verification.
- **Metadata**: Real-time server and client information via standard HTTP headers.
- **Automation**: Maintains "push-to-deploy" workflow on Render.
