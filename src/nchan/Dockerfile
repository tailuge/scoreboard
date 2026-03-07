# ---------- build stage ----------
# Use BuildKit for better performance: DOCKER_BUILDKIT=1 docker build .
FROM nginx:1.27.4-alpine AS builder

# Using a stable version of Nchan
ARG NCHAN_VERSION=1.3.8

# Install build dependencies and tools
RUN apk add --no-cache \
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

# Compile the module with compatibility flags and suppress specific errors for modern GCC
RUN ./configure --with-compat --add-dynamic-module=/nchan --with-cc-opt="-Wno-error=incompatible-pointer-types" && \
    make modules

# ---------- runtime stage ----------
FROM nginx:1.27.4-alpine

# Set labels for OCI compatibility
LABEL org.opencontainers.image.source="https://github.com/tailuge/scoreboard"
LABEL org.opencontainers.image.description="Billiards Network Nchan Server"

# Copy nchan module
COPY --from=builder /nginx-src/objs/ngx_nchan_module.so /etc/nginx/modules/

# Copy configurations with correct ownership from the start
COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx nchan.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx index.html /usr/share/nginx/html/index.html

# Security hardening: Prepare directories for non-root execution
# Nginx Alpine image already has a 'nginx' user (UID 101)
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html /etc/nginx && \
    chmod -R 755 /etc/nginx && \
    # Remove default alpine nginx configs if they exist to avoid confusion
    rm -rf /etc/nginx/conf.d/default.conf.orig

# Healthcheck to ensure Nchan is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/basic_status || exit 1

EXPOSE 80

# Run as non-root user
USER nginx

# Standard Nginx entrypoint will handle the daemon off if needed, but we keep the CMD for clarity
CMD ["nginx", "-g", "daemon off;"]
