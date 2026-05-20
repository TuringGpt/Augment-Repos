# Getting Started - Augment Store

Welcome to the Augment Store e-commerce project! This guide will help you get started with the frontend development.

## 📁 Project Overview

This is a full-stack e-commerce application with:
- **Frontend**: React + TypeScript + Material-UI (in `augment-store/client/`)
- **Backend**: Node.js APIs (in `augment-store/server/` - to be developed)

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. Navigate to the client folder:
```bash
cd augment-store/client
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser at `http://localhost:3000`

## 📂 Project Structure

The frontend follows a **feature-based architecture**:

```
augment-store/client/src/
├── features/          # Each feature has its own world
│   ├── auth/         # Authentication (login, register, forgot-password)
│   ├── products/     # Products (list, detail, search)
│   ├── cart/         # Shopping cart
│   ├── checkout/     # Checkout process
│   ├── orders/       # Order management
│   └── user/         # User profile, wishlist, addresses
│
├── components/       # Shared components (Header, Footer, etc.)
├── hooks/           # Shared hooks (useLocalStorage, useDebounce)
├── utils/           # Shared utilities (formatters, validators)
├── services/api/    # API service layer
├── config/          # Configuration (theme, API endpoints)
├── layouts/         # Layout components
└── routes/          # Route definitions
```

### Feature Structure

Each feature follows this pattern:
```
features/[feature-name]/
├── [sub-feature]/
│   ├── components/   # Feature-specific components
│   ├── hooks/        # Feature-specific hooks
│   ├── utils/        # Feature-specific utilities
│   └── types/        # Feature-specific types
├── constants/        # Feature constants
├── services/         # Feature services (if needed)
└── types/           # Shared feature types
```

## 🎯 Key Concepts

### 1. Path Aliases
Use clean imports with path aliases:

```typescript
// ✅ Good
import { Header } from '@components'
import { authService } from '@services/api'
import { Product } from '@features/products/types'

// ❌ Avoid
import { Header } from '../../../components/Header'
```

### 2. API Services
All API calls go through the service layer:

```typescript
// In a component or hook
import { productService } from '@services/api'

const products = await productService.getProducts()
```

### 3. Type Safety
Everything is typed with TypeScript:

```typescript
import type { Product } from '@features/products/types'

const product: Product = {
  id: '1',
  name: 'Product Name',
  price: 99.99,
  // ... other fields
}
```

## 🛠️ Development Workflow

### Adding a New Feature

1. **Create folder structure**:
```bash
mkdir -p src/features/my-feature/{components,hooks,utils,types,constants}
```

2. **Define types** in `types/index.ts`:
```typescript
export interface MyFeatureData {
  id: string
  name: string
}
```

3. **Create API service** (if needed):
```typescript
// src/services/api/my-feature/myFeatureService.ts
import { apiClient } from '../client'

export const myFeatureService = {
  getData: async () => {
    return apiClient.get('/my-feature')
  }
}
```

4. **Create components**:
```typescript
// src/features/my-feature/components/MyFeaturePage.tsx
import { Container, Typography } from '@mui/material'

const MyFeaturePage = () => {
  return (
    <Container>
      <Typography variant="h4">My Feature</Typography>
    </Container>
  )
}

export default MyFeaturePage
```

5. **Add route**:
```typescript
// src/routes/AppRoutes.tsx
import MyFeaturePage from '@features/my-feature/components/MyFeaturePage'

// Add to routes
<Route path="/my-feature" element={<MyFeaturePage />} />
```

### Working with Material-UI

All UI components use Material-UI:

```typescript
import { 
  Button, 
  TextField, 
  Card, 
  CardContent,
  Grid,
  Container 
} from '@mui/material'

const MyComponent = () => {
  return (
    <Container>
      <Card>
        <CardContent>
          <TextField label="Name" />
          <Button variant="contained">Submit</Button>
        </CardContent>
      </Card>
    </Container>
  )
}
```

### Customizing Theme

Edit `src/config/theme.ts`:

```typescript
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Change primary color
    },
  },
})
```

## 🔌 Backend Integration

When the backend APIs are ready:

1. **Update environment**:
```bash
# .env
VITE_API_BASE_URL=http://localhost:5000/api
```

2. **Add endpoints** in `src/config/api.ts`:
```typescript
export const API_ENDPOINTS = {
  MY_FEATURE: {
    LIST: '/my-feature',
    DETAIL: (id: string) => `/my-feature/${id}`,
  },
}
```

3. **Create/update service**:
```typescript
import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'

export const myFeatureService = {
  getList: async () => {
    return apiClient.get(API_ENDPOINTS.MY_FEATURE.LIST)
  },
}
```

## 📝 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🎨 Current Features

### ✅ Implemented Structure
- Authentication (Login, Register, Forgot Password)
- Products (List, Detail, Search)
- Shopping Cart
- Checkout
- Orders (List, Detail)
- User Profile (Profile, Wishlist, Addresses)

### 🚧 To Be Implemented
- Complete UI for all pages
- Form validation
- State management (Context/Redux)
- Error handling
- Loading states
- Responsive design
- Unit tests

## 📚 Documentation

- **README.md** - Main project documentation
- **STRUCTURE.md** - Detailed folder structure
- **SETUP_SUMMARY.md** - What has been created
- **GETTING_STARTED.md** - This file

## 🔗 Useful Links

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Material-UI Components](https://mui.com/material-ui/getting-started/)
- [React Router](https://reactrouter.com/)
- [Vite Guide](https://vitejs.dev/guide/)

## 💡 Tips

1. **Use TypeScript**: Always define types for your data
2. **Follow the structure**: Keep features isolated
3. **Use path aliases**: Makes imports cleaner
4. **Material-UI first**: Use MUI components for consistency
5. **API services**: Never call axios directly in components
6. **Common utilities**: Put reusable code in `utils/` or `hooks/`

## 🤝 Collaboration

### Frontend Developer (You)
- Work in `augment-store/client/`
- Build UI components
- Integrate with backend APIs
- Implement user interactions

### Backend Developer
- Work in `augment-store/server/`
- Create REST APIs
- Handle business logic
- Manage database

### Integration Points
- API endpoints defined in `src/config/api.ts`
- Types should match backend response structure
- Use environment variables for API URL

## 🎉 You're Ready!

The project structure is complete and ready for development. Start by:

1. Running `npm install` and `npm run dev`
2. Exploring the existing code
3. Implementing your first feature (e.g., Login page)
4. Testing the application

Happy coding! 🚀

