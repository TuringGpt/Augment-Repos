# Augment Repos Workspace

This repository is a **multi-project workspace** that currently contains several independently runnable applications and codebases under one Git repository.

If you are new here, the most important thing to know is:

- there is **no single root application** to install or run;
- each top-level directory has its **own stack, dependencies, and commands**;
- most active product work in the recent commit history appears to be happening in **`qualia/`**.

## Repository layout

| Directory | What it contains | Primary stack | Key docs |
| --- | --- | --- | --- |
| `qualia/` | Internal QA form-cycle application for creating, assigning, completing, and reviewing form cycles | FastAPI backend + React/TypeScript frontend | [Overview](qualia/README.md), [Backend setup](qualia/backend/setup.md) |
| `augment-store/` | E-commerce application workspace with a React frontend and Django backend | React/Vite + TypeScript, Django | [Getting started](augment-store/GETTING_STARTED.md), [Client README](augment-store/client/README.md) |
| `idurar-erp-crm/` | Open-source ERP/CRM application | MERN stack | [Overview](idurar-erp-crm/README.md), [Install guide](idurar-erp-crm/INSTALLATION-INSTRUCTIONS.md) |
| `vyper/` | Vyper compiler codebase for the EVM | Python 3.11+ | [README](vyper/README.md), [Contributor guide](vyper/CLAUDE.md) |

## How to work in this repository

### 1. Pick a project first

All setup, development, testing, and build commands should be run from the relevant project directory, not from the repository root.

### 2. Use project-specific dependency management

- `qualia/backend/` uses a Python virtual environment and currently documents package installation directly in `setup.md`.
- `qualia/frontend/` uses `npm`.
- `augment-store/client/` uses `npm`.
- `augment-store/server/` is a Django app and should be managed from that subdirectory.
- `idurar-erp-crm/` has separate frontend/backend setup instructions in its installation guide.
- `vyper/` recommends `uv` for environment setup and development workflows.

### 3. Expect isolated workflows

This repository is best treated as a **workspace of separate projects**, not as a traditional monorepo with shared tooling.

## Quick start by project

### `qualia/`

`qualia` is a form-cycle application where admins and users manage QA-style workflows.

#### Backend

From `qualia/backend/`:

1. Create and activate a virtual environment.
2. Install the currently documented backend packages.
3. Copy `.env.example` to `.env` and set `JWT_SECRET`.
4. Seed the local SQLite database.
5. Start the API with Uvicorn.

Common commands:

- `python -m pip install fastapi uvicorn sqlalchemy aiosqlite pydantic anyio pytest`
- `cp .env.example .env`
- `PYTHONPATH=. python scripts/seed_sqlite.py`
- `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
- `pytest tests -q`

#### Frontend

From `qualia/frontend/`:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test:run`

The frontend uses Vite, React, TypeScript, React Router, React Query, Vitest, and ESLint.

### `augment-store/`

`augment-store` is an e-commerce workspace with a React storefront and a Django backend.

#### Client

From `augment-store/client/`:

- `npm install`
- `cp .env.example .env`
- `npm run dev`
- `npm run build`
- `npm run lint`

The client uses React 18, TypeScript, Vite, Material UI, Axios, i18next, and Zustand.

#### Server

`augment-store/server/` is a Django project (see `manage.py` and `core/settings.py`). Run Django management commands from that directory after setting up the Python environment for the server.

### `idurar-erp-crm/`

`idurar-erp-crm` is a full ERP/CRM application based on the MERN stack.

Start with:

1. [`idurar-erp-crm/README.md`](idurar-erp-crm/README.md)
2. [`idurar-erp-crm/INSTALLATION-INSTRUCTIONS.md`](idurar-erp-crm/INSTALLATION-INSTRUCTIONS.md)

Those docs cover MongoDB setup, environment configuration, backend dependency installation, setup scripts, and frontend startup.

### `vyper/`

`vyper` is the Pythonic smart contract language and compiler targeting the EVM.

From `vyper/` the recommended setup is:

- `uv sync --extra dev`
- `uv run vyper --version`
- `uv run ./quicktest.sh -m "not fuzzing"`
- `uv run make lint`

For deeper contributor guidance, use [`vyper/CLAUDE.md`](vyper/CLAUDE.md) and the documents in [`vyper/skills/`](vyper/skills).

## Recommended documentation map

If you are trying to get productive quickly, use these entry points:

- **Workspace overview:** [this `README.md`](README.md)
- **Qualia product direction:** [`qualia/README.md`](qualia/README.md)
- **Qualia local backend setup:** [`qualia/backend/setup.md`](qualia/backend/setup.md)
- **Augment Store onboarding:** [`augment-store/GETTING_STARTED.md`](augment-store/GETTING_STARTED.md)
- **Augment Store client architecture:** [`augment-store/client/README.md`](augment-store/client/README.md)
- **IDURAR installation:** [`idurar-erp-crm/INSTALLATION-INSTRUCTIONS.md`](idurar-erp-crm/INSTALLATION-INSTRUCTIONS.md)
- **Vyper contributor setup:** [`vyper/README.md`](vyper/README.md) and [`vyper/CLAUDE.md`](vyper/CLAUDE.md)

## Notes for contributors

- Run commands from the **correct subdirectory**.
- Keep dependency changes scoped to the project you are modifying.
- Prefer updating the closest project-specific documentation when you change setup, architecture, or workflow.
- When opening a PR, mention **which top-level project(s)** your change affects.

## Current limitation at the root

The repository root intentionally does **not** provide:

- a shared `package.json`
- a shared Python environment
- a single root test command
- a unified application entry point

That is expected based on the current workspace layout.