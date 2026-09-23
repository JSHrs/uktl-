# Private CV scanner gateway

Dependency-free Node 24 service implementing the application's scan protocol against a private ClamAV `clamd` daemon. Files are buffered in bounded memory, never persisted by the gateway or logged. Only exact `stream: OK` is accepted as clean. Engine errors, limits, encrypted/unscannable files (configure alerts), interrupted responses and timeouts must fail closed.

Provision ClamAV under the owner's approved infrastructure/data-handling arrangement. Keep its TCP socket on loopback/private network, never public: the protocol is unauthenticated. Update official signatures with freshclam; monitor signature freshness and engine health. Configure `StreamMaxLength` and `MaxFileSize` at least 10 MiB, sensible archive/decompression limits and `AlertExceedsMax`, `AlertEncrypted`, and heuristic alerts so skipped/encrypted/over-limit content is not silently treated as clean. Verify options against the deployed ClamAV version. Pin the approved engine/container version; retain engine/signature evidence.

Set `CV_SCAN_TOKEN` securely (at least 32 characters), optional `CLAMD_HOST`/`CLAMD_PORT` for an isolated daemon, and run:

```sh
node services/cv-scanner/server.mjs
```

Default gateway bind is `127.0.0.1:8080`. Expose only `/scan` through a trusted HTTPS reverse proxy, cap requests at 10 MiB, rate-limit and restrict access to the application infrastructure. Do not log authorization headers or bodies. Set application `CV_SCAN_URL` to the exact HTTPS `/scan` URL and `CV_SCAN_TOKEN` to the same secret. Keep TLS termination within the approved private boundary.

Acceptance: a clean synthetic CV, approved antivirus test fixture, encrypted and over-limit documents, wrong hash/token, daemon down, timeout and signature-update failure. Unit tests exercise protocol and HTTP failure paths with synthetic fixtures; they are not evidence that a deployed engine detects malware. No gateway has been deployed by this code.

Official protocol/operation reference: https://docs.clamav.net/manual/Usage/Scanning.html (checked 23 September 2026).
