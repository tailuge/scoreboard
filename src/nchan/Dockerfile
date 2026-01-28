# ---------- build stage ----------
# Use BuildKit for better performance: DOCKER_BUILDKIT=1 docker build .
FROM nginx:alpine AS builder

# Using a stable version of Nchan
ARG NCHAN_VERSION=1.3.6

# Install build dependencies
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