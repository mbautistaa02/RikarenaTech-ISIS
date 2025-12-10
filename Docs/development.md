# Development guide (frontend and backend)

## Environment variables (`.env.example`)
### Backend (`Project/backend/.env.example`)
- `SECRET_KEY`: Django secret; use a different strong value in prod.
- `DEBUG`: `True` in dev, `0` in prod.
- `ALLOWED_HOSTS`: comma-separated list; in dev `localhost,127.0.0.1`.
- `FRONTEND_URL`: frontend URL (dev: `http://localhost:5173`).
- `BACKEND_URL`: backend URL (dev: `http://localhost:8000`).
- `DATABASE_ENGINE`: `django.db.backends.sqlite3` in dev; `django.db.backends.postgresql` in prod.
- `DATABASE_NAME`: SQLite file or Postgres database name.
- `DATABASE_USER` / `DATABASE_PASSWORD` / `DATABASE_HOST` / `DATABASE_PORT`: DB credentials/host/port (leave empty for SQLite).
- `LANGUAGE_CODE`: e.g. `en-us` or `es-co`.
- `TIME_ZONE`: e.g. `UTC` or `America/Bogota`.
- `AWS_*`: credentials/endpoint/bucket for S3 or R2 (optional in dev; required if serving media from cloud).

### Frontend (`Project/frontend/.env.example`)
- `VITE_API_BASE_URL`: backend base URL, e.g. `http://localhost:8000/api` in dev or `https://api.example.com/api` in prod.

## Backend (Django)
- Requirements: Python 3.11+, pip, virtualenv.
- Setup:
  ```bash
  cd Project/backend
  python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  cp .env.example .env  # adjust if using Postgres locally
  ```
- Local database:
  - Default SQLite (`DATABASE_ENGINE=django.db.backends.sqlite3`).
  - For local Postgres, change `DATABASE_ENGINE`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_PORT`.
- Migrations and run:
  ```bash
  python manage.py migrate
  python manage.py runserver 0.0.0.0:8000
  ```
- Tests:
  ```bash
  python manage.py test
  ```
- Static/media:
  - Served by Django in dev.
  - To use S3/R2 in dev, fill `AWS_*` (optional).

## Frontend (Vite)
- Requirements: Node 18+, npm.
- Setup:
  ```bash
  cd Project/frontend
  npm install
  cp .env.example .env
  # set VITE_API_BASE_URL (e.g. http://localhost:8000/api)
  ```
- Run:
  ```bash
  npm run dev -- --host --port 5173
  ```
- Build:
  ```bash
  npm run build
  ```

## Local frontend-backend integration
- Backend `.env`: `BACKEND_URL=http://localhost:8000`, `FRONTEND_URL=http://localhost:5173`, `ALLOWED_HOSTS=localhost,127.0.0.1`.
- Frontend `.env`: `VITE_API_BASE_URL=http://localhost:8000/api`.
- If accessing from another LAN IP, add that host to `ALLOWED_HOSTS` and point `VITE_API_BASE_URL` to that IP.

## Good practices
- Keep secrets out of the repo; use local `.env` or a secret manager.
- `DEBUG=True` only in dev; `DEBUG=0` in prod.
- Run migrations and tests before pushing changes.
- When adding dependencies, update `requirements.txt` (backend) or `package.json` (frontend).
