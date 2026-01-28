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
- **Error Handling**: WebSocket reconnection logic in `nchansub.ts` has a very long timeout (30s). Consider an exponential backoff strategy.

╰──────────────────────────────────────────────────────╯
✦ Change summary: Comprehensive review and enhancement
  of the Nchan Docker setup and configuration for
    production readiness.
      The current setup provides a solid baseline for a
        pub/sub system but requires improvements in security,
          reliability (health checks), and configuration
            consistency to be truly production-grade. The
              inclusion of a detailed findings report in
                src/nchan/NCHAN.md provides a roadmap for these
                  improvements.

                    File: src/nchan/Dockerfile
                      L1: [HIGH] Avoid using the latest tag for base images.
                        Pinning to a specific version ensures deterministic
                          builds and prevents unexpected breakage from upstream
                            updates.

                              Suggested change:

                                 1 -FROM darkflib/nginx-nchan:latest
                                    2 +FROM darkflib/nginx-nchan:1.3

                                      L5: [MEDIUM] Missing HEALTHCHECK for service
                                        reliability.
                                          Adding a healthcheck allows container orchestrators to
                                            detect and restart unhealthy instances.

                                              Suggested change:

                                                 1  COPY index.html /etc/nginx/html/index.html
                                                    2 +
                                                       3 +HEALTHCHECK --interval=30s --timeout=5s
                                                            --start-period=5s --retries=3 \
                                                               4 +  CMD curl -f http://localhost/basic_status || exi
                                                                    1
                                                                       5 +
                                                                          6  EXPOSE 80

                                                                            File: src/nchan/nchan.conf
                                                                              L30: [HIGH] Inconsistent buffer length disables
                                                                                history retrieval.
                                                                                  Setting nchan_message_buffer_length 0 in the
                                                                                    subscriber location conflicts with
                                                                                      nchan_subscriber_first_message oldest.

                                                                                        Suggested change:

                                                                                           1      # Subscriber endpoint table
                                                                                              2      location ~ ^/subscribe/table/(?<channel>\w+)$
                                                                                                 3          nchan_subscriber;
                                                                                                    4          nchan_channel_id $channel; # Extract chann
                                                                                                         name from the path
                                                                                                            5
                                                                                                               6          # Send all messages from the beginning
                                                                                                                  7 -        nchan_message_buffer_length 0;
                                                                                                                     8 +        nchan_message_buffer_length 1000;
                                                                                                                        9          nchan_message_timeout 0;

                                                                                                                          L31: [MEDIUM] Risk of memory exhaustion with
                                                                                                                            indefinite message timeout.
                                                                                                                              A timeout of 0 keeps messages in memory forever unless
                                                                                                                                the buffer limit is hit. Use a reasonable TTL instead.

                                                                                                                                  Suggested change:

                                                                                                                                     1          # Send all messages from the beginning
                                                                                                                                        2          nchan_message_buffer_length 1000;
                                                                                                                                           3 -        nchan_message_timeout 0;
                                                                                                                                              4 +        nchan_message_timeout 1h;
                                                                                                                                                 5          nchan_subscriber_first_message oldest;

                                                                                                                                                   L71: [HIGH] Metrics endpoints are publicly exposed.
                                                                                                                                                     Internal server status and Nchan metrics should be
                                                                                                                                                       restricted to authorized IPs or local access only.

                                                                                                                                                         Suggested change:
                                                                                                                                                            1      # Extended stats
                                                                                                                                                               2      location /nchan_stats {
                                                                                                                                                                  3 +        allow 127.0.0.1;
                                                                                                                                                                     4 +        deny all;
                                                                                                                                                                        5          nchan_stub_status;
                                                                                                                                                                           6      }

                                                                                                                                                                             File: src/nchan/nchanpub.ts
                                                                                                                                                                               L4: [MEDIUM] Hardcoded hostname limits portability.
                                                                                                                                                                                 The hostname should be configurable via environment
                                                                                                                                                                                   variables, similar to the implementation in
                                                                                                                                                                                     nchansub.ts.

                                                                                                                                                                                       Suggested change:

                                                                                                                                                                                          1  export class NchanPub {
                                                                                                                                                                                             2    private readonly publishUrl: string
                                                                                                                                                                                                3 -  private readonly base =
                                                                                                                                                                                                     "billiards-network.onrender.com"
                                                                                                                                                                                                        4 +  private readonly base =
                                                                                                                                                                                                             process.env.NEXT_PUBLIC_NCHAN_HOST ||
                                                                                                                                                                                                                  "billiards-network.onrender.com"
                                                                                                                                                                                                                     5    private readonly channel: string