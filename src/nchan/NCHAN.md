# Nchan & Docker Setup Review

## Dockerfile
- **Image Versioning**: Currently uses `latest` tag (`darkflib/nginx-nchan:latest`). This can lead to unpredictable builds. It's recommended to pin a specific version or digest.
- **Security**: Nginx runs as `root` by default in most images. Consider switching to a non-privileged user.
- **Reliability**: No `HEALTHCHECK` defined. Adding one ensures that the container orchestrator (like Render or Docker Compose) knows when the service is truly ready and healthy.

## Nchan Configuration (`nchan.conf`)
- **Consistency**: The `table` publisher has `nchan_message_buffer_length 1000`, while the subscriber has `nchan_message_buffer_length 0`. This may cause issues with message retrieval if the subscriber location overrides the channel's buffer settings.
- **Resource Management**: `nchan_message_timeout 0` is used in some locations. This means messages stay in memory indefinitely unless the buffer length is reached. Setting a reasonable timeout (e.g., `1h` or `24h`) is safer.
- **Monitoring Security**: `/basic_status` and `/nchan_stats` are exposed to the public. These should be restricted (e.g., `allow 127.0.0.1; deny all;` if accessed via a proxy, or protected by a secret).
- **CORS**: Manual CORS handling with `if ($request_method = 'OPTIONS')` is used. Nchan provides native directives like `nchan_access_control_allow_origin` which are cleaner.

## Code Integration
- **Hardcoded URLs**: `nchanpub.ts` and `nchansub.ts` have hardcoded hostnames (`billiards-network.onrender.com`). These should be configurable via environment variables.
