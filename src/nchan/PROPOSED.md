# Proposed Nchan Deployment Strategy

## Strategy (what we’ll do)

1.  **Use official nginx:alpine**: Small, secure, and regularly maintained.
2.  **Build Nchan as a dynamic module**: This allows us to use the official image without re-building all of Nginx.
3.  **Load it with `load_module`**: Standard Nginx way for dynamic modules.
4.  **Drop in existing configuration**: Maintain compatibility with current `nchan.conf`.

## Implementation

### Dockerfile

```dockerfile
# ---------- build stage ----------
# Use BuildKit for better performance: DOCKER_BUILDKIT=1 docker build .
FROM nginx:alpine AS builder

# Using a stable version of Nchan
ARG NCHAN_VERSION=1.3.6

# Install build dependencies with cache mounting
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache \
    build-base \
    pcre2-dev \
    zlib-dev \
    openssl-dev \
    linux-headers \
    git \
    wget

# Get nginx source that MATCHES the binary version exactly
RUN VERSION=$(nginx -v 2>&1 | cut -d '/' -f 2) && \
    wget http://nginx.org/download/nginx-${VERSION}.tar.gz && \
    tar zxvf nginx-${VERSION}.tar.gz && \
    mv nginx-${VERSION} /nginx-src

# Get nchan source
RUN git clone --branch v${NCHAN_VERSION} https://github.com/slact/nchan.git /nchan

WORKDIR /nginx-src

# Compile the module with compatibility flags
RUN ./configure --with-compat --add-dynamic-module=/nchan && \
    make modules

# ---------- runtime stage ----------
FROM nginx:alpine

# Copy nchan module
COPY --from=builder /nginx-src/objs/ngx_nchan_module.so /etc/nginx/modules/

# Copy custom nginx.conf to load the module
COPY nginx.conf /etc/nginx/nginx.conf

# Copy site-specific configuration and assets
# Note: we copy nchan.conf to default.conf to replace the default server block
COPY nchan.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html

# Security hardening: ensure nginx has permissions for its files without needing root
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html /etc/nginx

# Healthcheck to ensure Nchan is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/basic_status || exit 1

EXPOSE 80

# Run as non-root user
USER nginx

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
# Load Nchan dynamic module
load_module modules/ngx_nchan_module.so;

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" ' 
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    keepalive_timeout  65;

    # Nchan shared memory configuration (optional, adjust as needed)
    # nchan_shared_memory_size 128M;

    # Include all configs from conf.d
    include /etc/nginx/conf.d/*.conf;
}
```

## Benefits
- **Smaller Image**: Alpine-based images are significantly smaller than Debian/Ubuntu ones.
- **Security**: Official images receive faster security updates.
- **Up-to-date**: We can easily bump Nginx or Nchan versions by updating the `ARG` or the base image tag.
- **Dynamic**: No need to compile all of Nginx, only the Nchan module.
