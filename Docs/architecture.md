# Architecture and deployment

## High-level view (aligned with the diagram)
- **Frontend**: React + TypeScript (Vite), deployed on Vercel (public HTTPS).
- **Backend**: Django REST + Gunicorn running on a VPS inside a Podman container (`isis-backend`), reachable via the VPS reverse proxy over HTTPS.
- **Database**: PostgreSQL on the same VPS, container `postgres18`, internal network `swe2` (private segment).
- **External services**: S3/R2 for media; Google OAuth2 (if enabled).
- **Backend layers**: Presentation (API Views/Serializers/Middleware), Business (services/validators), Data (ORM models), Infrastructure (logs/config/security).

## Request flow
1) User consumes the SPA from Vercel.  
2) SPA calls the backend (`/api/...`) at the public domain configured in `BACKEND_URL`.  
3) The VPS reverse proxy routes to the `isis-backend` container bound to `127.0.0.1:3003`.  
4) Django serves APIs and talks to PostgreSQL via `DATABASE_HOST=postgres18` on the `swe2` network.  
5) Media goes to S3/R2 if `AWS_*` is set; otherwise served locally.  
6) (Optional) External auth via Google OAuth2 over HTTPS.

## Key components
- **Django API**: JWT auth (SimpleJWT), users/profiles/departments/municipalities, services and validators.
- **Middleware**: unified error handling and real client IP capture (`X-Forwarded-For`, `X-Real-IP`, `Forwarded`).
- **Gunicorn**: WSGI process inside the container exposing `PORT`.
- **PostgreSQL**: persistent data on its own volume.
- **Internal network `swe2`**: backend ↔ DB by container name (not exposed publicly).

## Production deployment (VPS + Podman)
1) **Backend image build/push**  
   - Build from repo root:  
     ```bash
     podman build -f Project/backend/Dockerfile -t isis-backend:preview Project/backend
     # podman push isis-backend:preview <your-registry>/<namespace>/isis-backend:tag
     ```
2) **Create internal network**  
   - `podman network create swe2` (if it does not exist) to isolate backend and Postgres.
3) **Prepare env vars and volumes**  
   - Set real secrets for `SECRET_KEY`, `ALLOWED_HOSTS`, `DATABASE_*`, `AWS_*` (if using S3/R2).  
   - Host paths (choose your own):  
     - Logs: `/path/to/host/isis-backend/logs`  
     - Static files: `/path/to/host/isis-backend/staticfiles`  
     - Postgres data: `/path/to/host/postgres18`
4) **Install Podman systemd units**  
   - Copy `deploy/isis-backend.container` and `deploy/swe2-postgres.container` to `~/.config/containers/systemd/`.  
   - Replace mock values (`changeme-*`, domains, credentials, bucket).  
   - Reload and enable:  
     ```bash
     systemctl --user daemon-reload
     systemctl --user enable --now swe2-postgres.service
     systemctl --user enable --now isis-backend.service
     ```
5) **Reverse proxy / TLS**  
   - Publish `https://api.example.com` → `127.0.0.1:3003` (Nginx/Caddy/Traefik) with valid certificates.  
   - Ensure `ALLOWED_HOSTS` includes the public domain.
6) **Migrations and staticfiles**  
   - Inside backend container:  
     ```bash
     podman exec isis-backend python manage.py migrate
     podman exec isis-backend python manage.py collectstatic --noinput
     ```
7) **Verification**  
   - Health/smoke: `curl -I https://api.example.com/api/` (or a health endpoint).  
   - Logs: `journalctl --user -u isis-backend -f` and `podman logs isis-backend`.

## Security notes
- Keep `DEBUG=0` in production and use a strong `SECRET_KEY`.
- Restrict `ALLOWED_HOSTS` to your public domains/IPs.
- Postgres only on the `swe2` network (do not publish the port).
- Keep secrets out of the repo (env vars or a secret manager).
