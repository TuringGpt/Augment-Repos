# Internationalization (i18n) Setup

This document describes the internationalization setup for the Augment Store application.

## 📦 Installed Packages

- `react-i18next` - React bindings for i18next
- `i18next` - Core i18n framework
- `i18next-browser-languagedetector` - Language detection plugin
- `i18next-http-backend` - Backend plugin for loading translations

## 🌍 Supported Languages

The application currently supports the following languages:

- **English (en)** - Default language
- **Spanish (es)** - Español
- **French (fr)** - Français
- **German (de)** - Deutsch

## 📁 Project Structure

```
src/
├── config/
│   └── i18n.ts                    # i18n configuration
├── locales/
│   ├── en/
│   │   └── translation.json       # English translations
│   ├── es/
│   │   └── translation.json       # Spanish translations
│   ├── fr/
│   │   └── translation.json       # French translations
│   └── de/
│       └── translation.json       # German translations
├── components/
│   └── LanguageSwitcher.tsx       # Language switcher component
├── hooks/
│   └── useTranslation.ts          # Custom translation hook
└── types/
    └── i18next.d.ts               # TypeScript type definitions
```

## 🔧 Configuration

### i18n Configuration (`src/config/i18n.ts`)

The i18n configuration includes:
- Language detection (localStorage, browser, HTML tag)
- Fallback language (English)
- Translation resources for all supported languages
- React-specific options

### TypeScript Support

Type definitions are provided in `src/types/i18next.d.ts` for full TypeScript support and autocomplete.

## 🎯 Usage

### Using the Translation Hook

```typescript
import { useTranslation } from '@hooks/useTranslation'

function MyComponent() {
  const { t, i18n } = useTranslation()

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('nav.home')}</p>
      <button onClick={() => i18n.changeLanguage('es')}>
        Switch to Spanish
      </button>
    </div>
  )
}
```

### Translation Keys Structure

Translations are organized into namespaces:

- `common.*` - Common UI elements (buttons, labels, etc.)
- `nav.*` - Navigation items
- `auth.*` - Authentication related
- `product.*` - Product related
- `cart.*` - Shopping cart
- `checkout.*` - Checkout process
- `order.*` - Orders
- `user.*` - User profile and settings
- `footer.*` - Footer content

### Examples

```typescript
// Common translations
t('common.loading')        // "Loading..."
t('common.save')           // "Save"
t('common.cancel')         // "Cancel"

// Navigation
t('nav.home')              // "Home"
t('nav.products')          // "Products"
t('nav.cart')              // "Cart"

// Product
t('product.addToCart')     // "Add to Cart"
t('product.price')         // "Price"

// With pluralization (uses itemsInCart and itemsInCart_other keys)
t('cart.itemsInCart', { count: 1 })    // "1 item in cart"
t('cart.itemsInCart', { count: 5 })    // "5 items in cart"
```

### Pluralization

i18next uses the `_other` suffix pattern for pluralization:

```json
{
  "cart": {
    "itemsInCart": "{{count}} item in cart",      // Singular (count === 1)
    "itemsInCart_other": "{{count}} items in cart" // Plural (count !== 1)
  }
}
```

When you call `t('cart.itemsInCart', { count: n })`, i18next automatically selects the correct form based on the count value.

## 🎨 Language Switcher Component

The `LanguageSwitcher` component is already integrated into the Header and provides:
- Icon button with language icon
- Dropdown menu with all available languages
- Visual indicator for the current language
- Native language names for better UX

## 🔄 Language Detection

The application automatically detects the user's language preference in this order:
1. **localStorage** - Previously selected language
2. **Browser** - Browser's language setting
3. **HTML tag** - HTML lang attribute
4. **Fallback** - English (default)

## ➕ Adding a New Language

To add a new language:

1. Create a new translation file:
   ```bash
   mkdir -p src/locales/[language-code]
   touch src/locales/[language-code]/translation.json
   ```

2. Copy the structure from `src/locales/en/translation.json` and translate

3. Update `src/config/i18n.ts`:
   ```typescript
   import newLangTranslation from '@locales/[language-code]/translation.json'

   export const LANGUAGES = {
     // ... existing languages
     [languageCode]: { name: 'Language Name', nativeName: 'Native Name' },
   }

   const resources = {
     // ... existing resources
     [languageCode]: { translation: newLangTranslation },
   }
   ```

## 🎯 Best Practices

1. **Always use translation keys** instead of hardcoded strings
2. **Keep keys organized** by feature/section
3. **Use descriptive key names** that indicate the context
4. **Maintain consistency** across all language files
5. **Test with different languages** to ensure UI layout works
6. **Use pluralization** for countable items
7. **Use interpolation** for dynamic values

## 🧪 Testing

To test different languages:

1. Use the Language Switcher in the header
2. Or programmatically change language:
   ```typescript
   i18n.changeLanguage('es')
   ```
3. Check localStorage to see the saved preference:
   ```javascript
   localStorage.getItem('i18nextLng')
   ```

## 📝 Notes

- Language preference is persisted in localStorage
- The application will remember the user's language choice
- All translation files must have the same structure
- Missing translations will fall back to English

## 🚀 Next Steps

To fully internationalize the application:

1. Replace hardcoded strings in components with `t()` calls
2. Add more specific translations for each feature
3. Consider adding date/time formatting per locale
4. Add currency formatting per locale
5. Test RTL (Right-to-Left) languages if needed

