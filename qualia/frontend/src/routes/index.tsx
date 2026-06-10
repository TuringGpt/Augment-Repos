import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { ProtectedRoute } from "@/components/routes/ProtectedRoute";
import { PublicRoute } from "@/components/routes/PublicRoute";
import { MainLayout } from "@/components/layouts/MainLayout";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Spinner } from "@/components/ui/spinner";

// Lazy load page components for code splitting
const Home = lazy(() => import("@/pages/Home"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

/**
 * Loading fallback component
 * Displayed while lazy-loaded components are being fetched
 */
function LoadingFallback() {
  return (
    <div className='flex items-center justify-center min-h-screen'>
      <Spinner className='size-8' />
    </div>
  );
}

/**
 * Wrapper component for lazy-loaded routes
 */
function LazyRoute({ component: Component }: { component: ComponentType }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}

/**
 * AppRoutes component
 *
 * Centralized routing configuration with:
 * - Code splitting via lazy loading
 * - Protected routes for authenticated pages
 * - Public routes with redirect for auth pages
 * - Consistent layouts across route groups
 * - Proper 404 handling
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - Home */}
      <Route
        path={ROUTES.HOME}
        element={
          <MainLayout navVariant='transparent'>
            <LazyRoute component={Home} />
          </MainLayout>
        }
      />

      {/* Auth Routes - Redirect to dashboard if already authenticated */}
      <Route
        path={ROUTES.SIGN_IN}
        element={
          <PublicRoute redirectIfAuthenticated>
            <AuthLayout>
              <LazyRoute component={SignIn} />
            </AuthLayout>
          </PublicRoute>
        }
      />

      <Route
        path={ROUTES.REGISTER}
        element={
          <PublicRoute redirectIfAuthenticated>
            <AuthLayout>
              <LazyRoute component={Register} />
            </AuthLayout>
          </PublicRoute>
        }
      />

      <Route
        path={ROUTES.FORGOT_PASSWORD}
        element={
          <PublicRoute redirectIfAuthenticated>
            <AuthLayout>
              <LazyRoute component={ForgotPassword} />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Protected Routes - Require authentication */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <LazyRoute component={Dashboard} />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.DASHBOARD_SETTINGS}
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <LazyRoute component={Settings} />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* TODO: Add these dashboard sub-routes when pages are created */}
      {/*
      <Route
        path={ROUTES.DASHBOARD_FORMS}
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <LazyRoute component={Forms} />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      */}

      {/* 404 Not Found - Redirect to dedicated 404 page */}
      <Route
        path={ROUTES.NOT_FOUND}
        element={<LazyRoute component={NotFound} />}
      />

      {/* Catch all unknown routes */}
      <Route path='*' element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
    </Routes>
  );
}
