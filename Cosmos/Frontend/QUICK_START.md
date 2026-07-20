# Quick Start Guide - Project IQ Frontend

Get up and running with the Project IQ Frontend Monorepo in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- Terminal/Command line access

## Setup (First Time Only)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Set NX socket directory (add to ~/.zshrc or ~/.bashrc for permanent setup)
export NX_SOCKET_DIR=/tmp/nx-tmp

# Create environment file
cd apps/project-iq
cp .env.example .env
cd ../..
```

## Run the App

```bash
# Make sure NX_SOCKET_DIR is set
export NX_SOCKET_DIR=/tmp/nx-tmp

# Start development server
npx nx dev project-iq
```

Open http://localhost:3000 in your browser 🎉

## Common Tasks

### Build for Production
```bash
NX_SOCKET_DIR=/tmp/nx-tmp npx nx build project-iq
```

### Run Tests
```bash
NX_SOCKET_DIR=/tmp/nx-tmp npx nx test project-iq
```

### Lint Code
```bash
NX_SOCKET_DIR=/tmp/nx-tmp npx nx lint project-iq
```

### View Project Graph
```bash
NX_SOCKET_DIR=/tmp/nx-tmp npx nx graph
```

## Adding Features

### Using Shared Components
```tsx
import { Button, Card, Input } from '@project-iq/shared/ui';
import { useDebounce, useLocalStorage } from '@project-iq/shared/hooks';
import { formatDate, capitalize } from '@project-iq/shared/utils';
import { apiClient } from '@project-iq/shared/api';
import type { User, ApiResponse } from '@project-iq/shared/types';
```

### Project Structure
- `apps/project-iq/src/pages/` - Add new pages
- `apps/project-iq/src/components/` - Add app-specific components
- `libs/shared/ui/src/lib/components/` - Add reusable UI components
- `libs/shared/utils/src/lib/` - Add utility functions
- `libs/shared/types/src/lib/` - Add TypeScript types

## Need More Help?
- See [SETUP.md](./SETUP.md) for detailed setup instructions
- See [README.md](./README.md) for complete documentation
