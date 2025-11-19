# Augment Store - E-commerce Frontend

A modern, scalable e-commerce frontend application built with React, TypeScript, and Material-UI.

## 🚀 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **React Router** - Routing
- **Axios** - HTTP client
- **i18next** - Internationalization
- **Zustand** - State management

## 📁 Project Structure

```
src/
├── features/              # Feature-based modules
│   ├── auth/             # Authentication feature
│   │   ├── login/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── constants/
│   │   └── services/
│   ├── products/         # Products feature
│   │   ├── product-list/
│   │   ├── product-detail/
│   │   ├── product-search/
│   │   ├── constants/
│   │   ├── services/
│   │   └── types/
│   ├── cart/             # Shopping cart feature
│   ├── checkout/         # Checkout feature
│   ├── orders/           # Orders feature
│   └── user/             # User profile feature
│       ├── profile/
│       ├── wishlist/
│       └── addresses/
├── components/           # Common/shared components
├── hooks/               # Common/shared hooks
├── utils/               # Common utility functions
├── services/            # API services
│   └── api/
│       ├── client.ts    # Axios client with interceptors
│       ├── auth/
│       ├── products/
│       ├── cart/
│       ├── orders/
│       ├── user/
│       └── payment/
├── types/               # Common TypeScript types
├── constants/           # Common constants
├── assets/              # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
├── styles/              # Global styles
├── layouts/             # Layout components
├── routes/              # Route definitions
├── context/             # React context providers
└── config/              # Configuration files
    ├── theme.ts         # MUI theme configuration
    └── api.ts           # API endpoints configuration
```

## 🎯 Key Features

### Feature-Based Architecture

Each feature has its own isolated world with:

- **components/** - Feature-specific components
- **hooks/** - Feature-specific custom hooks
- **utils/** - Feature-specific utility functions
- **types/** - Feature-specific TypeScript types
- **constants/** - Feature-specific constants
- **services/** - Feature-specific API services (when needed)

### Common/Shared Resources

- **components/** - Reusable components across features (Header, Footer, etc.)
- **hooks/** - Reusable hooks (useLocalStorage, useDebounce, etc.)
- **utils/** - Reusable utilities (formatters, validators, etc.)
- **types/** - Common TypeScript interfaces and types

### API Services Layer

Centralized API communication with:

- Axios client with request/response interceptors
- Automatic token refresh
- Error handling
- Type-safe API calls

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Update the `.env` file with your API base URL:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

### Linting

Run ESLint:

```bash
npm run lint
```

## 🔧 Configuration

### Path Aliases

The project uses path aliases for cleaner imports:

```typescript
import Header from '@components/Header'
import { authService } from '@services/api/auth/authService'
import { Product } from '@features/products/types'
import { formatCurrency } from '@utils/formatters'
```

Available aliases:

- `@/*` - src/
- `@components/*` - src/components/
- `@features/*` - src/features/
- `@hooks/*` - src/hooks/
- `@utils/*` - src/utils/
- `@services/*` - src/services/
- `@types/*` - src/types/
- `@constants/*` - src/constants/
- `@assets/*` - src/assets/
- `@styles/*` - src/styles/
- `@layouts/*` - src/layouts/
- `@routes/*` - src/routes/
- `@context/*` - src/context/
- `@config/*` - src/config/

### Theme Customization

Customize the Material-UI theme in `src/config/theme.ts`

### API Configuration

Configure API endpoints in `src/config/api.ts`

## 📝 Development Guidelines

### Adding a New Feature

1. Create feature folder structure:

```
src/features/my-feature/
├── components/
├── hooks/
├── utils/
├── types/
├── constants/
└── services/
```

2. Create types in `types/index.ts`
3. Create API service if needed
4. Create components
5. Add routes in `src/routes/AppRoutes.tsx`

### Creating API Services

1. Define types in feature's `types/index.ts`
2. Create service in `src/services/api/[feature]/[feature]Service.ts`
3. Use the `apiClient` for all HTTP requests
4. Export service functions

Example:

```typescript
import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type { MyType } from '@features/my-feature/types'

export const myService = {
  getData: async (): Promise<MyType> => {
    return apiClient.get<MyType>(API_ENDPOINTS.MY_ENDPOINT)
  },
}
```

## 🔐 Authentication

The application uses JWT-based authentication with automatic token refresh:

- Access tokens are stored in localStorage
- Refresh tokens are used to obtain new access tokens
- Axios interceptors handle token injection and refresh

## 🌍 Internationalization (i18n)

The application supports multiple languages using react-i18next:

- **Supported Languages**: English, Spanish, French, German
- **Language Detection**: Automatic detection from browser/localStorage
- **Language Switcher**: Available in the header
- **Translation Files**: Located in `src/locales/`

For detailed information, see [I18N_SETUP.md](./I18N_SETUP.md)

### Quick Usage

```typescript
import { useTranslation } from '@hooks/useTranslation'

function MyComponent() {
  const { t } = useTranslation()
  return <h1>{t('common.welcome')}</h1>
}
```

## 🤝 Working with Backend

The backend developer will create APIs in `augment-store/server/`.

To integrate:

1. Update `VITE_API_BASE_URL` in `.env`
2. Add new endpoints in `src/config/api.ts`
3. Create/update service files in `src/services/api/`
4. Update TypeScript types to match API responses

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 UI Components

This project uses Material-UI (MUI) components. Refer to the [MUI documentation](https://mui.com/) for available components and customization options.

## 📄 License

This project is part of the Augment Store application.
