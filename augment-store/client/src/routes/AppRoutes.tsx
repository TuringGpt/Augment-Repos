import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@layouts/MainLayout'
import AuthLayout from '@layouts/AuthLayout'

// Placeholder pages - to be implemented
import HomePage from '@features/products/product-list/components/HomePage'
import LoginPage from '@features/auth/login/components/LoginPage'
import RegisterPage from '@features/auth/register/components/RegisterPage'
import ProductListPage from '@features/products/product-list/components/ProductListPage'
import ProductDetailPage from '@features/products/product-detail/components/ProductDetailPage'
import CartPage from '@features/cart/components/CartPage'
import CheckoutPage from '@features/checkout/components/CheckoutPage'
import OrdersPage from '@features/orders/order-list/components/OrdersPage'
import OrderDetailPage from '@features/orders/order-detail/components/OrderDetailPage'
import ProfilePage from '@features/user/profile/components/ProfilePage'
import WishlistPage from '@features/user/wishlist/components/WishlistPage'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes with main layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
      </Route>

      {/* Auth routes with auth layout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected routes with main layout */}
      <Route element={<MainLayout />}>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
