# Project IQ Frontend Monorepo

An NX-powered monorepo for Project IQ frontend applications with shared libraries.

## 📁 Structure

```
Cosmos/Frontend/
├── apps/
│   └── project-iq/          # Main Project IQ web application
├── libs/
│   └── shared/
│       ├── ui/              # Shared UI components
│       ├── utils/           # Shared utility functions
│       ├── types/           # Shared TypeScript types
│       ├── hooks/           # Shared React hooks
│       └── api/             # Shared API client
├── tools/                   # Custom scripts and tools
├── nx.json                  # NX workspace configuration
├── tsconfig.base.json       # Base TypeScript configuration
└── package.json             # Root package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file for the app:

```bash
cd apps/project-iq
cp .env.example .env
```

3. Configure NX Socket Directory (required for long paths):

```bash
export NX_SOCKET_DIR=/tmp/nx-tmp
```

Or add to your shell profile (~/.zshrc or ~/.bashrc):

```bash
echo 'export NX_SOCKET_DIR=/tmp/nx-tmp' >> ~/.zshrc
```

## 📝 Available Scripts

> **Note**: For all NX commands, you need to have `NX_SOCKET_DIR=/tmp/nx-tmp` set in your environment.
> You can prefix commands with it: `NX_SOCKET_DIR=/tmp/nx-tmp npx nx ...`

### Development

Start the development server for the main app:

```bash
npm run dev
# or for specific app
NX_SOCKET_DIR=/tmp/nx-tmp npx nx dev project-iq
```

### Build

Build all applications:

```bash
npm run build
# or for specific app
nx build project-iq
```

### Testing

Run tests for all projects:

```bash
npm run test
# or for specific project
nx test project-iq
```

### Linting

Lint all projects:

```bash
npm run lint
# or for specific project
nx lint project-iq
```

### Format

Format code with Prettier:

```bash
npm run format
# or check formatting
npm run format:check
```

## 📦 Shared Libraries

### @project-iq/shared/ui

Reusable UI components with consistent styling.

```tsx
import { Button, Card, Input } from '@project-iq/shared/ui';
```

### @project-iq/shared/utils

Common utility functions for string manipulation, date formatting, validation, etc.

```tsx
import { capitalize, formatDate, isValidEmail } from '@project-iq/shared/utils';
```

### @project-iq/shared/types

Shared TypeScript types and interfaces.

```tsx
import { User, ApiResponse, UserRole } from '@project-iq/shared/types';
```

### @project-iq/shared/hooks

Custom React hooks for common functionality.

```tsx
import { useDebounce, useLocalStorage } from '@project-iq/shared/hooks';
```

### @project-iq/shared/api

API client for backend communication.

```tsx
import { apiClient } from '@project-iq/shared/api';
```

## 🔧 NX Commands

### Dependency Graph

Visualize project dependencies:

```bash
npm run graph
```

### Affected Commands

Run commands only on affected projects:

```bash
npm run affected:build
npm run affected:test
npm run affected:lint
```

## 📚 Adding New Projects

### Add a new application:

```bash
nx g @nx/react:app my-new-app
```

### Add a new library:

```bash
nx g @nx/react:lib my-new-lib --directory=shared
```

## 🏗️ Tech Stack

- **Build System**: NX
- **Build Tool**: Vite
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Testing**: Vitest
- **Linting**: ESLint
- **Formatting**: Prettier

## 📖 Documentation

- [NX Documentation](https://nx.dev)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request
