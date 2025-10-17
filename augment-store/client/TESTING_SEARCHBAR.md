# Testing the SearchBar Component

This guide explains how to test the SearchBar component with dummy product data.

## Option 1: Mock the API Service (Recommended for Frontend Testing)

You can temporarily mock the `productService.searchProducts` function to return dummy data.

### Step 1: Create a Mock Service

Create a file `src/services/api/products/mockProductService.ts`:

```typescript
import type { Product, ProductListResponse, ProductSearchParams } from '@features/products/types'
import dummyProducts from '@data/dummyProducts.json'

export const mockProductService = {
  searchProducts: async (
    query: string,
    params?: ProductSearchParams
  ): Promise<ProductListResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))

    // Filter products by query
    const filteredProducts = (dummyProducts as Product[]).filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase())
    )

    // Apply limit
    const limit = params?.limit || 5
    const products = filteredProducts.slice(0, limit)

    return {
      products,
      total: filteredProducts.length,
      page: 1,
      limit,
      totalPages: Math.ceil(filteredProducts.length / limit),
    }
  },
}
```

### Step 2: Update SearchBar to Use Mock Service

In `src/components/common/SearchBar.tsx`, temporarily replace the import:

```typescript
// Comment out the real service
// import { productService } from '@services/api'

// Import the mock service
import { mockProductService as productService } from '@services/api/products/mockProductService'
```

### Step 3: Test the SearchBar

1. Start the development server: `npm run dev`
2. Navigate to any page with the header
3. Type in the search bar:
   - "iPhone" - should show iPhone 15 Pro Max
   - "MacBook" - should show MacBook Pro
   - "Sony" - should show Sony headphones and camera
   - "Samsung" - should show Samsung products
   - "Logitech" - should show Logitech accessories

## Option 2: Use Browser DevTools to Mock API Response

1. Open Chrome DevTools (F12)
2. Go to the Network tab
3. Find the search API request
4. Right-click → "Override content"
5. Replace the response with data from `dummyProducts.json`

## Option 3: Backend Integration

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

