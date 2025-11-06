# Testing the SearchBar Component

This guide explains how to test the SearchBar component with the backend API.

## Current Setup: Real Backend Service (Default)

**The SearchBar component is configured to use the real backend service.** This means it will search products from your Django backend API.

In `src/components/common/SearchBar.tsx`, you'll see:

```typescript
import { productService } from '@services/api/products/productService'
```

### Testing with Backend API

The SearchBar uses the backend search API with debouncing (500ms delay by default):

1. Ensure your backend server is running
2. Start the development server: `npm run dev`
3. Navigate to any page with the header
4. Type in the search bar - it will search products by name, description, brand name, and category name
5. Results will appear in a dropdown below the search bar (max 5 results by default)

### How It Works

- **Debouncing**: Uses lodash debounce with 500ms delay to prevent excessive API calls
- **Search Query Parameter**: Sends `search` query param to `/api/v1/products?search=query`
- **Backend Search Fields**: Searches in product name, description, brand name, and category name
- **No Impact on /products Route**: The main products page is unaffected by search functionality

## Switching to Mock Service (For Testing Without Backend)

If you want to test without a backend connection:

1. In `src/components/common/SearchBar.tsx`, replace the import:

```typescript
// Remove this line:
// import { productService } from '@services/api/products/productService'

// Add this line instead:
import { mockProductService as productService } from '@services/api/products/mockProductService'
```

2. The mock service will use dummy data from `src/data/dummyProducts.json`

## Alternative Testing Options

### Option 1: Use Browser DevTools to Override Responses

If you want to test with different data without modifying code:

1. Open Chrome DevTools (F12)
2. Go to the Network tab
3. Find the search API request
4. Right-click → "Override content"
5. Replace the response with custom data

### Option 2: Backend Integration

If you have access to the backend, you can add products through the Django admin or API:

1. Start the Django server
2. Access the admin panel
3. Create brands, categories, and products manually
4. Or use the Django shell to import the dummy data

## Dummy Products Included

The `dummyProducts.json` file includes 15 products:

### Smartphones (3)

- iPhone 15 Pro Max
- Samsung Galaxy S24 Ultra
- Google Pixel 8 Pro

### Laptops (2)

- MacBook Pro 16-inch M3
- Dell XPS 15

### Headphones (3)

- Sony WH-1000XM5
- Bose QuietComfort 45
- Apple AirPods Pro (2nd Gen)

### Cameras (2)

- Canon EOS R6 Mark II
- Sony Alpha a7 IV

### Accessories (5)

- Logitech MX Master 3S
- Samsung Galaxy Tab S9
- Logitech C920 HD Pro Webcam
- Apple Magic Keyboard
- iPad Air M2

## Performance Testing

The SearchBar has been optimized to prevent unnecessary re-renders:

1. **Memoized Components**: SearchIcon, ClearButton, and LoadingSpinner are memoized
2. **Debounced Search**: 500ms delay before API call
3. **Conditional Rendering**: endAdornment only renders when needed

### To Verify Performance:

1. Open React DevTools
2. Enable "Highlight updates when components render"
3. Type in the search bar
4. You should see that only the TextField re-renders, not the icons

## Features to Test

- ✅ Debounced search (waits 500ms after typing stops)
- ✅ Loading spinner while searching
- ✅ Clear button (X icon) appears when text is entered
- ✅ Results dropdown with product images, names, and prices
- ✅ Discount prices shown when available
- ✅ Stock status (In Stock / Out of Stock)
- ✅ Click on result navigates to product detail page
- ✅ Click away to close dropdown
- ✅ Empty state when no results found
- ✅ Error handling for failed searches

## Troubleshooting

### Images not loading?

The dummy data uses Unsplash images. If they don't load:

1. Check your internet connection
2. Replace image URLs with local images
3. Or use placeholder images

### Search not working?

1. Check browser console for errors
2. Verify the API endpoint is correct
3. Check if the backend is running
4. Try using the mock service (Option 1)

### Icons re-rendering?

If you see icons flickering on every keystroke:

1. Check that you're using the latest version of SearchBar.tsx
2. Verify that memo and useMemo are imported
3. Check React DevTools to see which components are re-rendering
