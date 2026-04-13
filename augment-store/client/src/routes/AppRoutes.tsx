import { Routes, Route } from 'react-router-dom'
import MainLayout from '@layouts/MainLayout'
import AuthLayout from '@layouts/AuthLayout'
import AdminLayout from '@layouts/AdminLayout'
import ProtectedRoute from '@components/ProtectedRoute'
import PublicRoute from '@components/PublicRoute'
import AdminRoute from '@components/AdminRoute'
import { ROUTES } from '@constants/index'

// Placeholder pages - to be implemented
import HomePage from '@features/products/product-list/components/HomePage'
import LoginPage from '@features/auth/login/components/LoginPage'
import RegisterPage from '@features/auth/register/components/RegisterPage'
import ForgotPasswordPage from '@features/auth/forgot-password/components/ForgotPasswordPage'
import ResetPasswordPage from '@features/auth/forgot-password/components/ResetPasswordPage'
import VerifyEmailPage from '@features/auth/verify-email/components/VerifyEmailPage'
import ShopPage from '@features/products/product-list/components/ShopPage'
import ProductDetailPage from '@features/products/product-detail/components/ProductDetailPage'
import CartPage from '@features/cart/components/CartPage'
import CheckoutPage from '@features/checkout/components/CheckoutPage'
import OrdersPage from '@features/orders/order-list/components/OrdersPage'
import OrderDetailPage from '@features/orders/order-detail/components/OrderDetailPage'
import ProfilePage from '@features/user/profile/components/ProfilePage'
import WishlistPage from '@features/user/wishlist/components/WishlistPage'
import SearchPage from '@features/products/search/components/SearchPage'
import CategoriesPage from '@features/products/categories/components/CategoriesPage'
import BrandsPage from '@features/products/brands/components/BrandsPage'

// Support pages
import TicketDetailPage from '@features/support/ticket-detail/components/TicketDetailPage'
import CreateTicketPage from '@features/support/create-ticket/components/CreateTicketPage'
import TicketsPage from '@features/support/ticket-list/components/TicketsPage'

// Notification pages
import NotificationsPage from '@features/notifications/pages/NotificationsPage'

// Newsletter pages
import NewslettersPage from '@features/newsletter/pages/NewslettersPage'
import UnsubscribePage from '@features/newsletter/pages/UnsubscribePage'

// Admin Dashboard pages
import { AdminDashboardPage, AdminProductsPage, AdminAllProductsPage, AdminUsersPage, AdminCategoriesPage, AdminBrandsPage, AdminOrdersPage, AdminReportsPage, ProductStatisticsViewPage, AdminContactMessagesPage, AdminSettingsPage, AdminTicketsPage, AdminCurrencyPage } from '@features/admin-dashboard/pages'

// Product Statistics Detail page
import ProductStatisticsDetailPage from '@features/products/product-statistics-detail/components/ProductStatisticsDetailPage'

// Info pages
import AboutPage from '@features/info/about/components/AboutPage'
import ContactPage from '@features/info/contact/components/ContactPage'
import HelpPage from '@features/info/help/components/HelpPage'
import ReturnsPage from '@features/info/returns/components/ReturnsPage'
import ShippingPage from '@features/info/shipping/components/ShippingPage'
import TermsPage from '@features/info/terms/components/TermsPage'
import PrivacyPage from '@features/info/privacy/components/PrivacyPage'
import NotFoundPage from '@features/info/not-found/components/NotFoundPage'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes with main layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/products" element={<ShopPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />

        {/* Info pages */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/shipping" element={<ShippingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* Newsletter pages */}
        <Route path="/newsletter/unsubscribe" element={<UnsubscribePage />} />
      </Route>

      {/* Auth routes with auth layout - redirect to home if already logged in */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>
      </Route>

      {/* Protected routes with main layout - require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/support/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/support/create" element={<CreateTicketPage />} />
          <Route path="/support/tickets" element={<TicketsPage />} />
        </Route>
      </Route>

      {/* Admin routes - require authentication and admin role */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/products/all" element={<AdminAllProductsPage />} />
          <Route path="/admin/products/statistics" element={<ProductStatisticsViewPage />} />
          <Route path={ROUTES.ADMIN_PRODUCTS_STATISTICS_DETAIL} element={<ProductStatisticsDetailPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/brands" element={<AdminBrandsPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/contact-messages" element={<AdminContactMessagesPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/tickets" element={<AdminTicketsPage />} />
          <Route path="/admin/currency" element={<AdminCurrencyPage />} />
          <Route path="/newsletters" element={<NewslettersPage />} />
        </Route>
      </Route>
      
      {/* Catch all - 404 Not Found */}
      <Route element={<MainLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
