/**
 * Centralized routing configuration
 * This file contains all route paths and metadata for the application
 */

/**
 * Route path constants
 * Use these constants throughout the app instead of hardcoded strings
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  SIGN_IN: '/signin',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  DASHBOARD_FORMS: '/dashboard/forms',
  DASHBOARD_ANALYTICS: '/dashboard/analytics',
  DASHBOARD_SETTINGS: '/dashboard/settings',
  
  // Error routes
  NOT_FOUND: '/404',
} as const;

/**
 * Route metadata for enhanced route management
 */
export interface RouteMetadata {
  path: string;
  title: string;
  requiresAuth: boolean;
  redirectIfAuthenticated?: boolean;
}

/**
 * Route configuration with metadata
 */
export const ROUTE_CONFIG: Record<string, RouteMetadata> = {
  HOME: {
    path: ROUTES.HOME,
    title: 'Home',
    requiresAuth: false,
  },
  SIGN_IN: {
    path: ROUTES.SIGN_IN,
    title: 'Sign In',
    requiresAuth: false,
    redirectIfAuthenticated: true,
  },
  REGISTER: {
    path: ROUTES.REGISTER,
    title: 'Register',
    requiresAuth: false,
    redirectIfAuthenticated: true,
  },
  FORGOT_PASSWORD: {
    path: ROUTES.FORGOT_PASSWORD,
    title: 'Forgot Password',
    requiresAuth: false,
    redirectIfAuthenticated: true,
  },
  DASHBOARD: {
    path: ROUTES.DASHBOARD,
    title: 'Dashboard',
    requiresAuth: true,
  },
  DASHBOARD_FORMS: {
    path: ROUTES.DASHBOARD_FORMS,
    title: 'Forms',
    requiresAuth: true,
  },
  DASHBOARD_ANALYTICS: {
    path: ROUTES.DASHBOARD_ANALYTICS,
    title: 'Analytics',
    requiresAuth: true,
  },
  DASHBOARD_SETTINGS: {
    path: ROUTES.DASHBOARD_SETTINGS,
    title: 'Settings',
    requiresAuth: true,
  },
  NOT_FOUND: {
    path: ROUTES.NOT_FOUND,
    title: 'Page Not Found',
    requiresAuth: false,
  },
} as const;

/**
 * Helper function to get route metadata
 */
export const getRouteMetadata = (path: string): RouteMetadata | undefined => {
  return Object.values(ROUTE_CONFIG).find((route) => route.path === path);
};
