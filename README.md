# RikarenaTech

Project: RikarenaTech — agricultural platform (Django backend + React/Vite frontend).

This repository contains a REST API built with Django (backend) and a frontend application built with React and Vite (TypeScript). The platform manages users, agricultural products, crops, and geolocated alerts.
---

**Quick summary**
- Backend: Django 5.2 + Django REST Framework + django-allauth (Google OAuth) + djangorestframework-simplejwt
- Frontend: React + Vite + TypeScript
- Default database: SQLite (development). Supports S3/Cloudflare R2 for file storage.

---

**Estructura principal**
- `Project/backend/` — código Django (aplicaciones: `posts`, `users`, `crops`, `alerts`, `AuthenticationProject`, etc.)
- `Project/frontend/` — aplicación React (Vite + TypeScript)
- `Workshop-2/` — material complementario / mockups

---

## Prerequisites
- Python 3.8+ (3.10+ recommended)
- Node.js 18+ and `npm` or `pnpm`
- pip

Windows PowerShell example:

```powershell
# Create and activate virtual environment (backend)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r Project\backend\requirements.txt

# Install frontend dependencies
cd Project\frontend
npm install
# or with pnpm: pnpm install
```

---

## Environment configuration
- Copy `Project/backend/.env.example` to `Project/backend/.env` and update variables (SECRET_KEY, DEBUG, FRONTEND_URL, BACKEND_URL, S3/R2 credentials, DB settings for Postgres if used, etc.).

Key variables:
- `SECRET_KEY` — Django secret key
- `DEBUG` — True/False
- `FRONTEND_URL` / `BACKEND_URL`
- `DATABASE_*` — database settings (use Postgres in production)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME` — for S3/R2 storage
- `GOOGLE_OAUTH2_CLIENT_ID` / `GOOGLE_OAUTH2_CLIENT_SECRET` — for Google login (allauth)

---

## Running the application (development)

Backend (from `Project/backend` with virtualenv activated):

```powershell
cd Project\backend
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Frontend (from `Project/frontend`):

```powershell
cd Project\frontend
npm run dev
```

Access the frontend at the URL provided by Vite (default `http://localhost:5173`) and the backend at `http://localhost:8000`.

---

## Key endpoints
- `GET /api/auth/token/` — Returns `refresh` and `access` JWT tokens for the authenticated `request.user` (requires session cookie after allauth login). Uses `rest_framework_simplejwt`.
- `api/auth/` — AuthenticationProject routes that include `auth/` (allauth) and Google OAuth.
- `api/users/` — user and profile endpoints.
- `api/posts/` — product/marketplace endpoints.
- `api/crops/` — crop endpoints.
- `api/alerts/` — alert endpoints (only moderators can create/publish alerts).

API authentication: use header `Authorization: Bearer <access_token>` for endpoints requiring JWT.

---

## Notes about social authentication (Google)
- The project uses `django-allauth` for Google social login. When a user logs in via Google, their `Profile.picture_url` is created/updated with the image URL provided by Google.
- After the OAuth flow, the project exposes a `get_jwt_token` view that returns JWT tokens for the authenticated user.

Redirects and `next`:
- A custom social adapter may set the `next` parameter after login. Ensure the adapter's `next` matches `/api/auth/token/` if your frontend expects that route.

---

## Image storage
- In development images can be served from disk. For production configure AWS S3 or Cloudflare R2 using the variables in `.env`.

---

## Tests & code quality
- The project includes linters (`flake8`, `black`, `isort`) and unit tests in the apps (`tests.py`).
- Run formatters/linters locally: `black .`, `isort .`, `flake8`.

---

## Architecture (summary)
- Domain layer: models and business rules in `users`, `posts`, `crops`, `alerts`.
- Application layer: services/serializers and event handlers inside the apps.
- Interface layer: REST views in each app (`views.py`, `urls.py`) and the React frontend.
- Infrastructure layer: repositories, S3/R2 storage, and DB configuration.

---

## Development & contributions
- To contribute, create branches with `feature/` or `fix/` prefixes and open PRs against `main`.
- Run tests from `Project/backend`:

```powershell
cd Project\backend
python manage.py test
```


