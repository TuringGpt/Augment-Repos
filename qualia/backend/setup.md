# Backend local setup

This guide starts the **current** Qualia backend locally with SQLite and seeded demo data. It documents the code as it exists today; the planned two-role Form Cycle MVP is tracked in [`../docs/MVP_PR_PLAN.md`](../docs/MVP_PR_PLAN.md).

## Prerequisites

- Python 3.11 or newer
- `pip`
- A terminal opened in this `backend` directory

Check Python:

```bash
python3 --version
```

## 1. Create and activate a virtual environment

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

Windows PowerShell:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

## 2. Install current dependencies

The repository does not yet contain a committed Python dependency manifest. Install the packages used by the current backend:

```bash
python -m pip install fastapi uvicorn sqlalchemy aiosqlite pydantic anyio pytest
```

The first implementation task is to replace this command with a versioned dependency file. Do not treat these unpinned packages as a production deployment strategy.

## 3. Create the local environment file

Copy the example file in the `backend` directory:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set the following values in `.env`:

```dotenv
# Required. Generate a different random value for every real environment.
JWT_SECRET=replace-with-a-long-random-local-secret

# SQLite for local development. This creates qualia.db inside backend/.
DATABASE_URL=sqlite+aiosqlite:///./qualia.db

# The current upload endpoint supports direct local uploads only.
STORAGE_BACKEND=local
LOCAL_STORAGE_ROOT=~/.qualia/uploads

# Optional local development settings.
DEBUG=true
CORS_ALLOW_ORIGINS=http://localhost:5173,http://localhost:3000
```

Generate a local secret if needed:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Environment variable reference

| Variable | Required | Local value | Notes |
| --- | --- | --- | --- |
| `JWT_SECRET` | Yes | A long random string | Used to sign access and refresh tokens. |
| `DATABASE_URL` | No | `sqlite+aiosqlite:///./qualia.db` | Defaults to `backend/qualia.db` when omitted. The seed script supports SQLite only. |
| `STORAGE_BACKEND` | Yes for uploads | `local` | Use `local`; `s3` is not implemented for direct uploads. |
| `LOCAL_STORAGE_ROOT` | No | `~/.qualia/uploads` | Local attachment root. The process creates it with owner-only permissions. |
| `CORS_ALLOW_ORIGINS` | No | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed browser origins for common local frontend ports, including Vite's default dev server. |
| `DEBUG` | No | `true` | Enables local debug setting only. |

Never commit `.env`, SQLite database files, or uploaded files. They can contain secrets and local data.

## 4. Seed the local database

Run this from `backend/` while the virtual environment is active:

```bash
PYTHONPATH=. python scripts/seed_sqlite.py
```

> Warning: the seed script drops and recreates every SQLite table in the configured database. It is for disposable local development data only.

It creates:

| Account | Email | Password | Current role |
| --- | --- | --- | --- |
| Admin | `admin@qualia.local` | `admin123` | `admin` |
| Reviewer | `reviewer@qualia.local` | `reviewer123` | `reviewer` |
| Viewer | `viewer@qualia.local` | `viewer123` | `viewer` |

It also creates one published sample Form Cycle assigned to the reviewer, with sample questions and a submitted response.

These roles reflect the current implementation. The planned product changes replace `reviewer` and `viewer` with one `user` role.

## 5. Run the API

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Keep this terminal open. The API is available at:

- Health check: <http://127.0.0.1:8000/health>
- Swagger UI: <http://127.0.0.1:8000/docs>
- OpenAPI JSON: <http://127.0.0.1:8000/openapi.json>
- API base: <http://127.0.0.1:8000/api/v1>

## 6. Verify the API

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"up"}
```

Log in as the seeded admin:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@qualia.local","password":"admin123"}'
```

The response contains `access_token` and `refresh_token`. Use the access token with protected endpoints:

```bash
curl http://127.0.0.1:8000/api/v1/forms/assigned \
  -H "Authorization: Bearer <access_token>"
```

Use the seeded reviewer account for `/forms/assigned`, draft autosave, and submission endpoints. The current API only allows the `reviewer` role to use reviewer submission routes.

## 7. Run tests

The current tests need the application directory on Python's import path:

```bash
PYTHONPATH=. pytest tests -q
```

On Windows PowerShell:

```powershell
$env:PYTHONPATH = "."
pytest tests -q
```

At the time of writing, the suite has one known failing assertion involving question-update defaults (`config` returns `null` instead of `{}`). This is tracked as PR-02 in the MVP plan. The command is still useful for verifying the rest of the environment.

## Common problems

### `Missing required environment variable: JWT_SECRET`

Create `backend/.env`, ensure it contains a non-empty `JWT_SECRET`, then restart Uvicorn.

### `seed_sqlite.py only supports sqlite+aiosqlite DATABASE_URL values`

Set `DATABASE_URL` to a SQLite URL, for example:

```dotenv
DATABASE_URL=sqlite+aiosqlite:///./qualia.db
```

### `Configured storage backend does not support direct attachment uploads`

Set:

```dotenv
STORAGE_BACKEND=local
```

### `Address already in use`

Choose another port:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Update the frontend API URL to `http://127.0.0.1:8001/api/v1` if you use that port.

### Reset local data

Run the seed command again. It intentionally deletes and recreates the configured SQLite database:

```bash
PYTHONPATH=. python scripts/seed_sqlite.py
```
