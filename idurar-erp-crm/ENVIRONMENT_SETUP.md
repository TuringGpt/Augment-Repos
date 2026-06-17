# Environment Setup

This guide covers every environment variable required to run IDURAR ERP/CRM locally or in production. There are two separate `.env` files — one for the **backend** (Node.js / Express) and one for the **frontend** (Vite / React).

---

## Backend — `backend/.env`

Copy the example and fill in your values:

```bash
cp backend/.env.example backend/.env
```

### MongoDB

| Variable | Required | Description |
|---|---|---|
| `DATABASE` | ✅ | Full MongoDB connection URI, e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/idurar` |

**How to get it:** Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com), click *Connect → Drivers*, copy the URI, and replace `<password>` with your database user's password.

---

### Authentication

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Long, random string used to sign JSON Web Tokens. Generate one with `openssl rand -hex 64` |

---

### Server

| Variable | Required | Description |
|---|---|---|
| `PORT` | ❌ | HTTP port the API listens on. Defaults to `8888` if omitted |
| `NODE_ENV` | ❌ | Runtime mode. Use `development` locally, `production` in deployments |
| `PUBLIC_SERVER_FILE` | ✅ | Public base URL where uploaded files are served from, e.g. `http://localhost:8888/` |
| `OPENSSL_CONF` | ❌ | Set to `/dev/null` to suppress OpenSSL config warnings on some systems |

---

### File Storage — DigitalOcean Spaces (S3-compatible)

File uploads (invoice PDFs, attachments, logos) are stored in [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces), which is S3-compatible. Any S3-compatible provider (AWS S3, MinIO, Backblaze B2) works by adjusting `DO_SPACES_URL`.

| Variable | Required | Description |
|---|---|---|
| `DO_SPACES_KEY` | ✅ | Spaces / S3 access key ID |
| `DO_SPACES_SECRET` | ✅ | Spaces / S3 secret access key |
| `DO_SPACES_NAME` | ✅ | Bucket (Space) name |
| `DO_SPACES_URL` | ✅ | Endpoint URL, e.g. `https://nyc3.digitaloceanspaces.com` |
| `REGION` | ✅ | Bucket region, e.g. `nyc3` |

**How to get it:** In the DigitalOcean console go to *Spaces → Create a Space*, then *API → Spaces Keys* to generate a key pair.

---

### Email — Resend

Transactional emails (password resets, invoice delivery) are sent via [Resend](https://resend.com).

| Variable | Required | Description |
|---|---|---|
| `RESEND_API` | ✅ | Resend API key, starting with `re_` |

**How to get it:** Sign in at [resend.com](https://resend.com), go to *API Keys → Create API Key*.

---

### AI Features — OpenAI

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ❌ | OpenAI API key for AI-powered features. Omit if not using AI capabilities |

---

## Frontend — `frontend/.env`

Copy the example and fill in your values:

```bash
cp frontend/.env.example frontend/.env
```

All frontend variables **must** be prefixed with `VITE_` — Vite only exposes variables with this prefix to browser code.

| Variable | Required | Description |
|---|---|---|
| `VITE_BACKEND_SERVER` | ✅ | Full URL of the running backend API, including trailing slash. E.g. `http://localhost:8888/` |
| `VITE_FILE_BASE_URL` | ✅ | Base URL where uploaded files are publicly accessible. Matches `PUBLIC_SERVER_FILE` on the backend. E.g. `http://localhost:8888/` |
| `VITE_DEV_REMOTE` | ❌ | Set to `true` to point the local Vite dev server at a remote backend instead of localhost |

---

## Security Notes

- **Never commit real secrets to version control.** Both `.env` files are listed in `.gitignore`.
- Rotate `JWT_SECRET` immediately if it is ever exposed — all existing sessions will be invalidated.
- Restrict MongoDB IP whitelist to your server's IP in production.
- Use environment-specific Resend API keys (one for staging, one for production).

---

## Quick-start checklist

- [ ] `backend/.env` created from `backend/.env.example`
- [ ] `DATABASE` set to a valid MongoDB URI
- [ ] `JWT_SECRET` set to a securely generated random string
- [ ] `PUBLIC_SERVER_FILE` set to the backend's public URL
- [ ] Storage variables (`DO_SPACES_*`, `REGION`) configured
- [ ] `RESEND_API` set
- [ ] `frontend/.env` created from `frontend/.env.example`
- [ ] `VITE_BACKEND_SERVER` pointing at the backend
- [ ] `VITE_FILE_BASE_URL` matching `PUBLIC_SERVER_FILE`
