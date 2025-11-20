# i18n Quick Start Guide

## 🚀 Getting Started with Translations

### Basic Usage

```typescript
import { useTranslation } from '@hooks/useTranslation'

function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.save')}</button>
    </div>
  )
}
```

### With Interpolation

```typescript
const { t } = useTranslation()

// In your translation file: "greeting": "Hello, {{name}}!"
<p>{t('common.greeting', { name: user.name })}</p>
```

### With Pluralization

i18next automatically handles pluralization using the `_other` suffix pattern:

```json
// In translation.json
{
  "cart": {
    "itemsInCart": "{{count}} item in cart",
    "itemsInCart_other": "{{count}} items in cart"
  }
}
```

```typescript
const { t } = useTranslation()

// i18next automatically selects the correct form based on count
<p>{t('cart.itemsInCart', { count: cartItems.length })}</p>
// count: 0 → "0 items in cart" (uses _other)
// count: 1 → "1 item in cart"  (uses base key)
// count: 5 → "5 items in cart" (uses _other)
```

### Changing Language Programmatically

```typescript
const { i18n } = useTranslation()

// Change to Spanish
i18n.changeLanguage('es')

// Get current language
const currentLang = i18n.language
```

## 📝 Available Translation Keys

### Common
- `common.appName` - "Augment Store"
- `common.welcome` - "Welcome"
- `common.loading` - "Loading..."
- `common.save` - "Save"
- `common.cancel` - "Cancel"
- `common.submit` - "Submit"

### Navigation
- `nav.home` - "Home"
- `nav.products` - "Products"
- `nav.cart` - "Cart"
- `nav.profile` - "Profile"
- `nav.login` - "Login"
- `nav.logout` - "Logout"

### Products
- `product.addToCart` - "Add to Cart"
- `product.price` - "Price"
- `product.inStock` - "In Stock"
- `product.outOfStock` - "Out of Stock"

### Cart
- `cart.shoppingCart` - "Shopping Cart"
- `cart.emptyCart` - "Your cart is empty"
- `cart.proceedToCheckout` - "Proceed to Checkout"
- `cart.itemsInCart` - Uses pluralization (singular: "{{count}} item in cart", plural: "{{count}} items in cart")

### Authentication
- `auth.login` - "Login"
- `auth.register` - "Register"
- `auth.email` - "Email"
- `auth.password` - "Password"
- `auth.forgotPassword` - "Forgot Password?"

## 🎨 Real-World Examples

### Product Card Component

```typescript
import { useTranslation } from '@hooks/useTranslation'
import { Button, Card, Typography } from '@mui/material'

function ProductCard({ product }) {
  const { t } = useTranslation()
  
  return (
    <Card>
      <Typography variant="h6">{product.name}</Typography>
      <Typography>
        {t('product.price')}: ${product.price}
      </Typography>
      <Typography color={product.inStock ? 'success' : 'error'}>
        {product.inStock ? t('product.inStock') : t('product.outOfStock')}
      </Typography>
      <Button variant="contained">
        {t('product.addToCart')}
      </Button>
    </Card>
  )
}
```

### Login Form

```typescript
import { useTranslation } from '@hooks/useTranslation'
import { TextField, Button } from '@mui/material'

function LoginForm() {
  const { t } = useTranslation()
  
  return (
    <form>
      <TextField
        label={t('auth.email')}
        type="email"
      />
      <TextField
        label={t('auth.password')}
        type="password"
      />
      <Button type="submit">
        {t('auth.login')}
      </Button>
    </form>
  )
}
```

### Cart Summary

```typescript
import { useTranslation } from '@hooks/useTranslation'
import { Typography, Button } from '@mui/material'

function CartSummary({ items }) {
  const { t } = useTranslation()
  
  return (
    <div>
      <Typography variant="h6">
        {t('cart.shoppingCart')}
      </Typography>
      <Typography>
        {t('cart.itemsInCart', { count: items.length })}
      </Typography>
      <Button variant="contained">
        {t('cart.proceedToCheckout')}
      </Button>
    </div>
  )
}
```

## 🌍 Supported Languages

- 🇬🇧 English (en) - Default
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)

## 💡 Tips

1. **Always use translation keys** instead of hardcoded text
2. **Check existing keys** before adding new ones
3. **Use descriptive key names** that indicate context
4. **Test with different languages** to ensure UI doesn't break
5. **Keep translations consistent** across all language files

## 📚 More Information

- Full documentation: [I18N_SETUP.md](./I18N_SETUP.md)
- Implementation details: [I18N_IMPLEMENTATION_SUMMARY.md](./I18N_IMPLEMENTATION_SUMMARY.md)