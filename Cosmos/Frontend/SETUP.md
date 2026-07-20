# Project IQ Frontend Monorepo - Setup Guide

This guide provides detailed instructions for setting up the Project IQ Frontend NX monorepo.

## Prerequisites

- **Node.js**: Version 18.x or higher (20.9.0 recommended - see .nvmrc)
- **npm**: Version 10.x or higher
- **Git**: For version control

## Initial Setup

### 1. Install Node.js

If using nvm (Node Version Manager):

```bash
nvm install
nvm use
```

Or install Node.js 20.9.0 manually from [nodejs.org](https://nodejs.org).

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- NX workspace tools
- React and React Router
- Vite build tool
- TypeScript
- Tailwind CSS
- ESLint and Prettier
- Testing libraries (Vitest)

### 3. Configure NX Socket Directory

Due to long workspace paths, you need to configure the NX socket directory:

**For current session:**
```bash
export NX_SOCKET_DIR=/tmp/nx-tmp
```

**For permanent configuration (recommended):**

Add to your shell profile (~/.zshrc for zsh or ~/.bashrc for bash):
```bash
echo 'export NX_SOCKET_DIR=/tmp/nx-tmp' >> ~/.zshrc
source ~/.zshrc
```

### 4. Setup Environment Variables

Create environment file for the main application:

```bash
cd apps/project-iq
cp .env.example .env
```

Edit `.env` and configure:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Verify Installation

### 1. List Projects

```bash
NX_SOCKET_DIR=/tmp/nx-tmp npx nx show projects
```

Expected output:
```
shared-hooks
shared-types
shared-utils
project-iq
shared-api
shared-ui
cosmos-monorepo
```

### 2. Build the Application

```bash
NX_SOCKET_DIR=/tmp/nx-tmp npx nx build project-iq
```

Successful build will create `dist/apps/project-iq` directory.

### 3. Run Development Server

```bash
NX_SOCKET_DIR=/tmp/nx-tmp npx nx dev project-iq
```

The application should be available at http://localhost:3000

## Project Structure Overview

```
cosmos-frontend/
├── apps/
│   └── project-iq/              # Main Cosmos web application
│       ├── src/
│       │   ├── app/            # Application components
│       │   ├── pages/          # Page components
│       │   ├── components/     # UI components
│       │   └── styles/         # Global styles
│       ├── index.html          # HTML entry point
│       ├── vite.config.ts      # Vite configuration
│       └── project.json        # NX project configuration
│
├── libs/
│   └── shared/
│       ├── ui/                 # Shared UI components (Button, Card, Input)
│       ├── utils/              # Utility functions (string, date, validation)
│       ├── types/              # TypeScript types and interfaces
│       ├── hooks/              # Custom React hooks
│       └── api/                # API client and configuration
│
├── tools/                      # Custom scripts and tooling
├── nx.json                     # NX workspace configuration
├── tsconfig.base.json          # Base TypeScript config
└── package.json                # Root dependencies
```

## Common Commands

All commands should be prefixed with `NX_SOCKET_DIR=/tmp/nx-tmp` or have the environment variable set.

### Development
```bash
npx nx dev project-iq
```

### Build
```bash
npx nx build project-iq
```

### Test
```bash
npx nx test project-iq
```

### Lint
```bash
npx nx lint project-iq
```

### Format Code
```bash
npm run format
```

### View Dependency Graph
```bash
npx nx graph
```

## Troubleshooting

### NX Socket Path Error

If you see an error about socket path length:
```
Error: Attempted to open socket that exceeds the maximum socket length.
```

**Solution**: Set the `NX_SOCKET_DIR` environment variable:
```bash
export NX_SOCKET_DIR=/tmp/nx-tmp
```

### Port Already in Use

If port 3000 is already in use, you can change it in `apps/project-iq/vite.config.ts`.

## Next Steps

1. Read the [README.md](./README.md) for usage documentation
2. Explore the shared libraries in `libs/shared/`
3. Add new features to `apps/project-iq/src/`
4. Create reusable components in shared libraries
5. Run tests and ensure code quality before committing

## Additional Resources

- [NX Documentation](https://nx.dev)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
