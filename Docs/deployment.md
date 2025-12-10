# Production deployment (VPS + Podman + systemd)

## Prereqs
- Podman installed on the VPS (with systemd integration). On most distros: install the `podman` package and ensure `podman info` works.

## Pull and Build images and network
1) Pull and Build backend image from repo root:
   ```bash
   podman pull docker.io/library/postgres:18
   podman build -f Project/backend/Dockerfile -t isis-backend:latest Project/backend
   ```
2) Create the internal network (ensure container files use it):
   ```bash
   podman network create swe2
   ```

## Host paths and permissions
- Choose host paths (placeholders; set your own):
  - Backend logs: `/path/to/host/isis-backend/logs`
  - Backend static: `/path/to/host/isis-backend/staticfiles`
  - Postgres data: `/path/to/host/postgres18`
- Ensure the service user can read/write these paths.

## Environment variables (prod)
- Backend (`deploy/isis-backend.container`):
  - `SECRET_KEY`: strong Django secret.
  - `DEBUG=0`
  - `ALLOWED_HOSTS`: public domains/IPs (e.g. `api.example.com`).
  - `FRONTEND_URL`: SPA URL (e.g. `https://app.example.com`).
  - `BACKEND_URL`: API URL (e.g. `https://api.example.com`).
  - `DATABASE_ENGINE=django.db.backends.postgresql`
  - `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
  - `DATABASE_HOST=postgres18`, `DATABASE_PORT=5432`
  - `LANGUAGE_CODE=es-co`, `TIME_ZONE=America/Bogota` (adjust as needed)
  - `AWS_S3_ENDPOINT_URL`, `AWS_S3_CUSTOM_DOMAIN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME` (if using S3/R2)
  - `PORT=3003`
- Postgres (`deploy/swe2-postgres.container`):
  - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

## Install systemd user services (Podman)
1) Copy files to `~/.config/containers/systemd/`:
   - `deploy/isis-backend.container`
   - `deploy/swe2-postgres.container`
2) Edit them to replace all `changeme-*`, domains, credentials, bucket, and host paths.
3) Reload and enable:
   ```bash
   systemctl --user daemon-reload
   systemctl --user start swe2-postgres.service
   systemctl --user start isis-backend.service
   ```
4) Logs:
   ```bash
   journalctl --user -u isis-backend -f
   journalctl --user -u swe2-postgres -f
   ```

## Reverse proxy and TLS
- Publish `https://api.example.com` → `127.0.0.1:3003` with Nginx/Caddy/Traefik.
- Use valid TLS certificates (Let's Encrypt or similar).
- Ensure `ALLOWED_HOSTS` includes the public domain.

## Post-deploy
- Migrations and static:
  ```bash
  podman exec isis-backend python manage.py migrate
  podman exec isis-backend python manage.py collectstatic --noinput
  ```
- Smoke tests:
  - `curl -I https://api.example.com/api/` (or health endpoint if available).
  - Confirm the Vercel SPA points to the correct backend (`BACKEND_URL`/`VITE_API_BASE_URL`).

## Quick checklist
- [ ] `DEBUG=0`, strong `SECRET_KEY`
- [ ] `ALLOWED_HOSTS` set
- [ ] Postgres not exposed publicly (only `swe2` network)
- [ ] Valid TLS on reverse proxy
- [ ] Migrations and `collectstatic` run
- [ ] Logs visible via `journalctl` and `podman logs`
