# Color System Documentation

## Overview

The Augment Store application uses a centralized color system defined in the `Colors` class. This provides a single source of truth for all colors used throughout the application, ensuring consistency and making it easy to update the color scheme.

## Location

```
src/config/colors.ts
```

## Usage

### Basic Import

```typescript
import { Colors } from '@config/colors'
```

### In Components

```typescript
// Using in sx prop
<Box sx={{ backgroundColor: Colors.primary.main }}>
  Content
</Box>

// Using in styled components
const StyledBox = styled(Box)({
  backgroundColor: Colors.primary.main,
  color: Colors.text.white,
})

// Using gradients
<Box sx={{ background: Colors.gradient.purpleViolet }}>
  Gradient Background
</Box>

// Using overlays
<Box sx={{ backgroundColor: Colors.overlay.dark30 }}>
  Semi-transparent overlay
</Box>
```

## Color Categories

### 1. Primary Colors

Used for main brand colors and primary actions.

```typescript
Colors.primary.main        // #1976d2
Colors.primary.light       // #42a5f5
Colors.primary.dark        // #1565c0
Colors.primary.contrastText // #fff
```

**Usage**: Buttons, links, headers, active states

### 2. Secondary Colors

Used for secondary actions and accents.

```typescript
Colors.secondary.main        // #9c27b0
Colors.secondary.light       // #ba68c8
Colors.secondary.dark        // #7b1fa2
Colors.secondary.contrastText // #fff
```

**Usage**: Secondary buttons, badges, highlights

### 3. Semantic Colors

#### Error

```typescript
Colors.error.main        // #d32f2f
Colors.error.light       // #ef5350
Colors.error.dark        // #c62828
Colors.error.contrastText // #fff
```

**Usage**: Error messages, validation errors, destructive actions

#### Warning

```typescript
Colors.warning.main        // #ed6c02
Colors.warning.light       // #ff9800
Colors.warning.dark        // #e65100
Colors.warning.contrastText // #fff
```

**Usage**: Warning messages, caution states

#### Info

```typescript
Colors.info.main        // #0288d1
Colors.info.light       // #03a9f4
Colors.info.dark        // #01579b
Colors.info.contrastText // #fff
```

**Usage**: Informational messages, tips, help text

#### Success

```typescript
Colors.success.main        // #2e7d32
Colors.success.light       // #4caf50
Colors.success.dark        // #1b5e20
Colors.success.contrastText // #fff
```

**Usage**: Success messages, confirmations, completed states

### 4. Neutral Colors

Grayscale colors for backgrounds, borders, and text.

```typescript
Colors.neutral.white   // #ffffff
Colors.neutral.black   // #000000
Colors.neutral.gray50  // #fafafa
Colors.neutral.gray100 // #f5f5f5
Colors.neutral.gray200 // #eeeeee
Colors.neutral.gray300 // #e0e0e0
Colors.neutral.gray400 // #bdbdbd
Colors.neutral.gray500 // #9e9e9e
Colors.neutral.gray600 // #757575
Colors.neutral.gray700 // #616161
Colors.neutral.gray800 // #424242
Colors.neutral.gray900 // #212121
```

**Usage**: Backgrounds, dividers, disabled states, text

### 5. Background Colors

```typescript
Colors.background.default // #ffffff
Colors.background.paper   // #ffffff
Colors.background.light   // #f5f5f5
Colors.background.dark    // #212121
```

**Usage**: Page backgrounds, card backgrounds

### 6. Text Colors

```typescript
Colors.text.primary   // rgba(0, 0, 0, 0.87)
Colors.text.secondary // rgba(0, 0, 0, 0.6)
Colors.text.disabled  // rgba(0, 0, 0, 0.38)
Colors.text.hint      // rgba(0, 0, 0, 0.38)
Colors.text.white     // #ffffff
```

**Usage**: Text content with different emphasis levels

### 7. Gradient Colors

Pre-defined gradients for special effects.

```typescript
Colors.gradient.purpleViolet // linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Colors.gradient.blueIndigo   // linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Colors.gradient.oceanBlue    // linear-gradient(135deg, #2e3192 0%, #1bffff 100%)
Colors.gradient.sunset       // linear-gradient(135deg, #fa709a 0%, #fee140 100%)
Colors.gradient.greenTeal    // linear-gradient(135deg, #0ba360 0%, #3cba92 100%)
Colors.gradient.orangeRed    // linear-gradient(135deg, #f83600 0%, #f9d423 100%)
```

**Usage**: Hero sections, special cards, decorative elements

### 8. Overlay Colors

Semi-transparent colors for overlays and backdrops.

```typescript
// Light overlays
Colors.overlay.light10 // rgba(255, 255, 255, 0.1)
Colors.overlay.light15 // rgba(255, 255, 255, 0.15)
Colors.overlay.light20 // rgba(255, 255, 255, 0.2)
Colors.overlay.light30 // rgba(255, 255, 255, 0.3)
Colors.overlay.light50 // rgba(255, 255, 255, 0.5)

// Dark overlays
Colors.overlay.dark10 // rgba(0, 0, 0, 0.1)
Colors.overlay.dark15 // rgba(0, 0, 0, 0.15)
Colors.overlay.dark20 // rgba(0, 0, 0, 0.2)
Colors.overlay.dark30 // rgba(0, 0, 0, 0.3)
Colors.overlay.dark50 // rgba(0, 0, 0, 0.5)
Colors.overlay.dark87 // rgba(0, 0, 0, 0.87)
```

**Usage**: Modal backdrops, hover effects, image overlays

### 9. Shadow Colors

Pre-defined box shadows.

```typescript
Colors.shadow.light  // 0 2px 4px rgba(0, 0, 0, 0.1)
Colors.shadow.medium // 0 4px 8px rgba(0, 0, 0, 0.15)
Colors.shadow.heavy  // 0 10px 40px rgba(0, 0, 0, 0.3)
Colors.shadow.card   // 0 2px 8px rgba(0, 0, 0, 0.1)
```

**Usage**: Box shadows for cards, modals, elevated elements

### 10. Border Colors

```typescript
Colors.border.light  // rgba(0, 0, 0, 0.12)
Colors.border.medium // rgba(0, 0, 0, 0.23)
Colors.border.dark   // rgba(0, 0, 0, 0.42)
Colors.border.white  // rgba(255, 255, 255, 0.2)
```

**Usage**: Borders, dividers, outlines

### 11. Brand Colors

Feature-specific color schemes.

```typescript
// Sidebar
Colors.brand.sidebar.gradient         // Sidebar gradient background
Colors.brand.sidebar.text             // Sidebar text color
Colors.brand.sidebar.hover            // Sidebar hover effect
Colors.brand.sidebar.subcategoryBg    // Subcategory background
Colors.brand.sidebar.subcategoryHover // Subcategory hover
Colors.brand.sidebar.divider          // Sidebar divider

// Header
Colors.brand.header.background // Header background
Colors.brand.header.text       // Header text

// Footer
Colors.brand.footer.background    // Footer background
Colors.brand.footer.text          // Footer text
Colors.brand.footer.textSecondary // Footer secondary text
```

**Usage**: Component-specific styling

## Utility Methods

### rgba()

Create a custom rgba color.

```typescript
Colors.rgba(255, 0, 0, 0.5) // rgba(255, 0, 0, 0.5)
```

### hexWithAlpha()

Add transparency to a hex color.

```typescript
Colors.hexWithAlpha('#1976d2', 0.5) // rgba(25, 118, 210, 0.5)
```

### linearGradient()

Create a custom linear gradient.

```typescript
Colors.linearGradient(135, '#667eea', '#764ba2')
// linear-gradient(135deg, #667eea 0%, #764ba2 100%)
```

### boxShadow()

Create a custom box shadow.

```typescript
Colors.boxShadow(0, 4, 8, 'rgba(0, 0, 0, 0.15)')
// 0px 4px 8px rgba(0, 0, 0, 0.15)
```

## Best Practices

### ✅ DO

- Use the Colors class for all color values
- Use semantic colors (error, warning, success, info) for their intended purposes
- Use neutral colors for backgrounds and text
- Use brand colors for feature-specific styling
- Use utility methods for custom variations

### ❌ DON'T

- Hardcode hex colors directly in components
- Use inline color values
- Create custom colors without adding them to the Colors class
- Mix hardcoded colors with Colors class usage

## Examples

### Button with Primary Color

```typescript
<Button
  sx={{
    backgroundColor: Colors.primary.main,
    color: Colors.primary.contrastText,
    '&:hover': {
      backgroundColor: Colors.primary.dark,
    },
  }}
>
  Click Me
</Button>
```

### Card with Shadow

```typescript
<Card
  sx={{
    backgroundColor: Colors.background.paper,
    boxShadow: Colors.shadow.card,
    borderRadius: 2,
  }}
>
  Card Content
</Card>
```

### Gradient Background

```typescript
<Box
  sx={{
    background: Colors.gradient.purpleViolet,
    color: Colors.text.white,
    padding: 4,
  }}
>
  Gradient Section
</Box>
```

### Semi-transparent Overlay

```typescript
<Box
  sx={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay.dark50,
  }}
>
  Overlay Content
</Box>
```

## Integration with Material-UI Theme

The Colors class is integrated with the Material-UI theme in `src/config/theme.ts`. This ensures that Material-UI components automatically use the correct colors.

```typescript
import { Colors } from './colors'

export const theme = createTheme({
  palette: {
    primary: Colors.primary,
    secondary: Colors.secondary,
    error: Colors.error,
    // ... etc
  },
})
```

## Updating Colors

To update the color scheme:

1. Modify the values in `src/config/colors.ts`
2. All components using the Colors class will automatically update
3. No need to search and replace throughout the codebase

## Type Safety

The Colors class is fully typed with TypeScript, providing autocomplete and type checking:

```typescript
// TypeScript will autocomplete available colors
const color = Colors.primary.main

// Type exports available
import type { PrimaryColor, GradientColor } from '@config/colors'
```

## Migration Guide

If you have hardcoded colors in your components:

**Before:**
```typescript
<Box sx={{ backgroundColor: '#1976d2' }}>
```

**After:**
```typescript
import { Colors } from '@config/colors'

<Box sx={{ backgroundColor: Colors.primary.main }}>
```

---

**Last Updated**: 2025-10-10
**Version**: 1.0.0

