# Project Folder Structure

This document provides a detailed overview of the folder structure for the Augment Store e-commerce frontend application.

## 📂 Complete Folder Structure

```
augment-store/client/
├── public/                          # Public static assets
├── src/                             # Source code
│   ├── features/                    # Feature-based modules
│   │   │
│   │   ├── auth/                    # Authentication Feature
│   │   │   ├── login/               # Login sub-feature
│   │   │   │   ├── components/      # Login-specific components
│   │   │   │   ├── hooks/           # Login-specific hooks
│   │   │   │   ├── utils/           # Login-specific utilities
│   │   │   │   └── types/           # Login-specific types
│   │   │   ├── register/            # Registration sub-feature
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── utils/
│   │   │   │   └── types/
│   │   │   ├── forgot-password/     # Forgot password sub-feature
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── utils/
│   │   │   │   └── types/
│   │   │   ├── constants/           # Auth feature constants
│   │   │   ├── services/            # Auth feature services (if needed)
│   │   │   └── types/               # Shared auth types
│   │   │
│   │   ├── products/                # Products Feature
│   │   │   ├── product-list/        # Product listing sub-feature
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── utils/
│   │   │   │   └── types/
│   │   │   ├── product-detail/      # Product detail sub-feature
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── utils/
│   │   │   │   └── types/
│   │   │   ├── product-search/      # Product search sub-feature
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── utils/
│   │   │   │   └── types/
│   │   │   ├── constants/           # Products feature constants
│   │   │   ├── services/            # Products feature services (if needed)
│   │   │   └── types/               # Shared products types
│   │   │
│   │   ├── cart/                    # Shopping Cart Feature
│   │   │   ├── components/          # Cart components
│   │   │   ├── hooks/               # Cart hooks
│   │   │   ├── utils/               # Cart utilities
│   │   │   ├── types/               # Cart types
│   │   │   ├── constants/           # Cart constants
│   │   │   └── services/            # Cart services (if needed)
│   │   │
│   │   ├── checkout/                # Checkout Feature
│   │   │   ├── components/          # Checkout components
│   │   │   ├── hooks/               # Checkout hooks
│   │   │   ├── utils/               # Checkout utilities
│   │   │   ├── types/               # Checkout types
│   │   │   ├── constants/           # Checkout constants
│   │   │   └── services/            # Checkout services (if needed)
│   │   │
│   │   ├── orders/                  # Orders Feature
│   │   │   ├── order-list/          # Order listing sub-feature
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── utils/
│   │   │   │   └── types/
│   │   │   ├── order-detail/        # Order detail sub-feature
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── utils/
│   │   │   │   └── types/
│   │   │   ├── constants/           # Orders feature constants
│   │   │   ├── services/            # Orders feature services (if needed)
│   │   │   └── types/               # Shared orders types
│   │   │
│   │   └── user/                    # User Profile Feature
│   │       ├── profile/             # User profile sub-feature
│   │       │   ├── components/
│   │       │   ├── hooks/
│   │       │   ├── utils/
│   │       │   └── types/
│   │       ├── wishlist/            # Wishlist sub-feature
│   │       │   ├── components/
│   │       │   ├── hooks/
│   │       │   ├── utils/
│   │       │   └── types/
│   │       ├── addresses/           # Addresses sub-feature
│   │       │   ├── components/
│   │       │   ├── hooks/
│   │       │   ├── utils/
│   │       │   └── types/
│   │       ├── constants/           # User feature constants
│   │       ├── services/            # User feature services (if needed)
│   │       └── types/               # Shared user types
│   │
│   ├── components/                  # Common/Shared Components
│   │   ├── Header.tsx               # App header
│   │   ├── Footer.tsx               # App footer
│   │   └── ...                      # Other shared components
│   │
│   ├── hooks/                       # Common/Shared Hooks
│   │   ├── useLocalStorage.ts       # LocalStorage hook
│   │   ├── useDebounce.ts           # Debounce hook
│   │   └── ...                      # Other shared hooks
│   │
│   ├── utils/                       # Common/Shared Utilities
│   │   ├── formatters.ts            # Formatting utilities
│   │   ├── validators.ts            # Validation utilities
│   │   └── ...                      # Other utilities
│   │
│   ├── services/                    # API Services Layer
│   │   └── api/
│   │       ├── client.ts            # Axios client with interceptors
│   │       ├── auth/
│   │       │   └── authService.ts   # Auth API service
│   │       ├── products/
│   │       │   └── productService.ts # Products API service
│   │       ├── cart/
│   │       │   └── cartService.ts   # Cart API service
│   │       ├── checkout/
│   │       │   └── checkoutService.ts # Checkout API service
│   │       ├── orders/
│   │       │   └── orderService.ts  # Orders API service
│   │       ├── user/
│   │       │   └── userService.ts   # User API service
│   │       └── payment/
│   │           └── paymentService.ts # Payment API service
│   │
│   ├── types/                       # Common TypeScript Types
│   │   ├── common.ts                # Common type definitions
│   │   └── ...                      # Other shared types
│   │
│   ├── constants/                   # Common Constants
│   │   └── index.ts                 # App-wide constants
│   │
│   ├── assets/                      # Static Assets
│   │   ├── images/                  # Image files
│   │   ├── icons/                   # Icon files
│   │   └── fonts/                   # Font files
│   │
│   ├── styles/                      # Global Styles
│   │   └── index.css                # Global CSS
│   │
│   ├── layouts/                     # Layout Components
│   │   ├── MainLayout.tsx           # Main app layout
│   │   └── AuthLayout.tsx           # Auth pages layout
│   │
│   ├── routes/                      # Route Definitions
│   │   └── AppRoutes.tsx            # App routing configuration
│   │
│   ├── context/                     # React Context Providers
│   │   └── ...                      # Context providers
│   │
│   ├── config/                      # Configuration Files
│   │   ├── theme.ts                 # MUI theme configuration
│   │   └── api.ts                   # API endpoints configuration
│   │
│   ├── App.tsx                      # Root App component
│   └── main.tsx                     # Application entry point
│
├── .env.example                     # Environment variables example
├── .eslintrc.cjs                    # ESLint configuration
├── .gitignore                       # Git ignore rules
├── index.html                       # HTML entry point
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.node.json               # TypeScript config for Node
├── vite.config.ts                   # Vite configuration
├── README.md                        # Project documentation
└── STRUCTURE.md                     # This file
```

## 🎯 Architecture Principles

### 1. Feature-Based Organization
Each feature is self-contained with its own:
- Components
- Hooks
- Utilities
- Types
- Constants
- Services (when needed)

### 2. Sub-Features
Complex features can have sub-features (e.g., auth/login, auth/register) that follow the same structure.

### 3. Shared Resources
Common resources used across features are placed at the root level:
- `components/` - Shared UI components
- `hooks/` - Shared custom hooks
- `utils/` - Shared utility functions
- `types/` - Shared TypeScript types

### 4. API Services Layer
Centralized API communication in `services/api/`:
- One service file per feature
- Uses shared `apiClient` for all HTTP requests
- Type-safe API calls

### 5. Configuration
All configuration is centralized in `config/`:
- Theme configuration
- API endpoints
- App settings

## 📝 Naming Conventions

- **Folders**: lowercase with hyphens (e.g., `product-list`)
- **Components**: PascalCase (e.g., `ProductCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useProducts.ts`)
- **Utils**: camelCase (e.g., `formatters.ts`)
- **Types**: PascalCase for interfaces/types (e.g., `Product`, `User`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

## 🔄 Data Flow

1. **Component** → calls hook or service
2. **Hook** → uses service to fetch data
3. **Service** → uses apiClient to make HTTP request
4. **apiClient** → handles request/response with interceptors
5. **Response** → flows back through service → hook → component

## 🚀 Getting Started

Refer to the main [README.md](./README.md) for installation and development instructions.

