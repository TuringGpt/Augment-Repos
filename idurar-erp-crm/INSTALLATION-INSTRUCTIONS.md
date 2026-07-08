## Getting started

#### Step 1: Clone the repository

```bash
git clone https://github.com/idurar/idurar-erp-crm.git
cd idurar-erp-crm
```

#### Step 2: Create your MongoDB database

- Create a MongoDB database or Atlas cluster.
- Copy the connection string for your application.
- If you are using MongoDB Atlas, add your current IP address to the network allowlist.

#### Step 3: Edit the environment files

### Environment Setup

This project uses separate env files for the backend and frontend:

- `backend/.env` for the Express + MongoDB API
- `frontend/.env` for the Vite frontend

Start by copying the included example files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

If you are on Windows, create `backend/.env` and `frontend/.env` manually from the matching `.env.example` files.

#### Frontend env vars (`frontend/.env`)

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `VITE_BACKEND_SERVER` | Yes | `http://localhost:8888/` | Base URL for the backend server used by the frontend. Keep the trailing slash. |
| `VITE_FILE_BASE_URL` | Yes | `http://localhost:8888/` | Base URL used for public file links and downloads. Usually the same as the backend URL in local development. |
| `VITE_DEV_REMOTE` | Optional | `remote` | Only needed if you want to run the frontend locally while pointing it at a remote backend. |

#### Backend env vars (`backend/.env`)

##### Required to boot the backend

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `DATABASE` | Yes | `mongodb://127.0.0.1:27017/idurar` | MongoDB connection string used when the server starts and during `npm run setup`. |
| `JWT_SECRET` | Yes | `replace-with-a-long-random-secret` | Secret used to sign and verify authentication tokens. |
| `PUBLIC_SERVER_FILE` | Yes | `http://localhost:8888/` | Public server base URL used when generating file and PDF links. Keep the trailing slash. |

##### Optional backend settings

| Variable | When needed | Example | Purpose |
| --- | --- | --- | --- |
| `PORT` | Optional | `8888` | Overrides the default backend port. |
| `NODE_ENV` | Optional | `development` | Standard Node environment flag. |
| `OPENSSL_CONF` | Optional | `/dev/null` | Existing workaround sometimes used in local environments. |
| `OPENAI_API_KEY` | Optional | `sk-...` | Only needed if you use OpenAI-powered features. |

##### S3-compatible storage settings

These are required if you want file uploads to work with the current storage middleware. The project uses DigitalOcean Spaces variables, but the API is S3-compatible.

| Variable | Required for uploads | Example | Purpose |
| --- | --- | --- | --- |
| `DO_SPACES_KEY` | Yes | `your-access-key` | Access key for the S3-compatible bucket. |
| `DO_SPACES_SECRET` | Yes | `your-secret-key` | Secret key for the S3-compatible bucket. |
| `DO_SPACES_URL` | Yes | `nyc3.digitaloceanspaces.com` | Bucket endpoint without `https://`. |
| `DO_SPACES_NAME` | Yes | `idurar-assets` | Bucket name used for uploads. |
| `REGION` | Yes | `nyc3` | Bucket region used by the S3 client. |

##### Email / Resend settings

| Variable | Required for email flows | Example | Purpose |
| --- | --- | --- | --- |
| `RESEND_API` | Yes | `re_123456789` | API key used for password reset and verification emails. |

#### Step 4: Update the MongoDB URI

Open `backend/.env` and replace the `DATABASE` value with your real MongoDB connection string.

Example:

```bash
DATABASE="mongodb+srv://<username>:<password>@cluster.mongodb.net/idurar"
```

#### Step 5: Install backend dependencies

In your terminal, navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

#### Step 6: Run setup script

While still in `backend`, execute:

```bash
npm run setup
```

This seeds the initial application data, including the default admin user.

#### Step 7: Run the backend server

In the same terminal, start the backend server:

```bash
npm run dev
```

The backend runs on `http://localhost:8888` by default unless you set `PORT`.

#### Step 8: Install frontend dependencies

Open a new terminal, then install frontend dependencies:

```bash
cd frontend
npm install
```

#### Step 9: Run the frontend server

Start the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

> If you want to use a remote backend while keeping the frontend local, set `VITE_DEV_REMOTE=remote` in `frontend/.env` and point `VITE_BACKEND_SERVER` at that backend.

:exclamation: :warning: `If you encounter an OpenSSL error while running the frontend server, follow these additional steps:`

This usually happens with older Node/OpenSSL combinations.

Try one of these options:

- Upgrade to Node.js v20.
- Enable the legacy OpenSSL provider.

On Unix-like systems (Linux, macOS, Git Bash, etc.):

```bash
export NODE_OPTIONS=--openssl-legacy-provider
```

On Windows Command Prompt:

```bash
set NODE_OPTIONS=--openssl-legacy-provider
```

On PowerShell:

```bash
$env:NODE_OPTIONS="--openssl-legacy-provider"
```

Reference: [webpack/webpack#14532](https://github.com/webpack/webpack/issues/14532#issuecomment-947012063)

After applying one of the fixes, run:

```bash
npm run dev
```

If you still have issues, this [Stack Overflow thread](https://stackoverflow.com/questions/69692842/error-message-error0308010cdigital-envelope-routinesunsupported) covers additional fixes.