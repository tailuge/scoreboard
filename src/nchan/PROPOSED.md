# Proposed Nchan Deployment Strategy

## Status: [COMPLETED]
- **Strategy Selection**: Official `nginx:alpine` with dynamic Nchan module. [DONE]
- **Dockerfile Implementation**: Multi-stage build with security hardening and GCC 15 compatibility. [DONE]
- **Nginx Configuration**: `nginx.conf` updated for non-root execution and module loading. [DONE]
- **Local Verification**: Image successfully built as `scoreboard-nchan:latest`. [DONE]
- **Tooling**: `package.json` updated with efficient build scripts. [DONE]

---

## Strategy (what we’ve do)

1.  **Use official nginx:alpine**: Small, secure, and regularly maintained. [DONE]
2.  **Build Nchan as a dynamic module**: This allows us to use the official image without re-building all of Nginx. [DONE]
3.  **Load it with `load_module`**: Standard Nginx way for dynamic modules. [DONE]
4.  **Drop in existing configuration**: Maintain compatibility with current `nchan.conf`. [DONE]

## Implementation Details

### Tagging and Versioning Strategy [NEW]
To maintain compatibility with `render.com` (which pulls `latest`) and adhere to code review best practices (which require explicit versions), the following dual-tagging strategy is adopted:

- **Immutable Tags**: Every build is tagged with the version from `package.json` (e.g., `1.0.0`).
- **Rolling Tags**: Every build is also tagged as `latest` to trigger automated deployments.

#### Updated Scripts in `package.json`:
```bash
# Build with dual tags
docker build -t tailuge/billiards-network:$(node -p "require('./package.json').version") -t tailuge/billiards-network:latest src/nchan

# Push both tags
docker push tailuge/billiards-network:$(node -p "require('./package.json').version")
docker push tailuge/billiards-network:latest
```

## Benefits
- **Smaller Image**: Alpine-based images are significantly smaller than Debian/Ubuntu ones.
- **Security**: Official images receive faster security updates and run as non-root.
- **Traceability**: Explicit version tags allow for easy rollbacks and auditing.
- **Automation**: Maintains "push-to-deploy" workflow on Render.