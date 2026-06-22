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
  DASHBOARD_FORM_DETAILS: '/dashboard/forms/:id',
  DASHBOARD_FORM_EDIT: '/dashboard/forms/id/edit',
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
  DASHBOARD_FORM_DETAILS: {
    path: ROUTES.DASHBOARD_FORM_DETAILS,
    title: 'Form Details',
    requiresAuth: true,
  },
  DASHBOARD_FORM_EDIT: {
    path: ROUTES.DASHBOARD_FORM_EDIT,
    title: 'Edit Form',
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
 * Helper function to match a pathname against a route pattern
 * Supports parameterized routes like /dashboard/forms/:id
 * @param pattern - The route pattern (e.g., "/dashboard/forms/:id")
 * @param pathname - The actual pathname (e.g., "/dashboard/forms/123")
 * @returns true if the pathname matches the pattern
 */
const matchRoute = (pattern: string, pathname: string): boolean => {
  // Exact match for non-parameterized routes
  if (pattern === pathname) {
    return true;
  }

  // Convert route pattern to regex pattern
  // First, escape regex metacharacters in the static parts
  // Then replace :param with a regex that matches any non-slash characters
  const regexPattern = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex metacharacters
    .replace(/:[^/]+/g, '[^/]+'); // Replace :param patterns
  const regex = new RegExp(`^${regexPattern}$`);

  return regex.test(pathname);
};

/**
 * Helper function to get route metadata
 * Supports both exact paths and parameterized routes (e.g., /dashboard/forms/:id)
 * @param path - The pathname to get metadata for (e.g., "/dashboard/forms/123")
 * @returns The route metadata if a matching route is found, otherwise undefined
 */
export const getRouteMetadata = (path: string): RouteMetadata | undefined => {
  return Object.values(ROUTE_CONFIG).find((route) => matchRoute(route.path, path));
};

/**
 * Helper function to generate form cycle details route
 * @param formCycleId - The ID of the form cycle
 * @returns The route path with the ID substituted and URL-encoded
 */
export const getFormCycleDetailsRoute = (formCycleId: string): string => {
  return ROUTES.DASHBOARD_FORM_DETAILS.replace(':id', encodeURIComponent(formCycleId));
};

/**
 * Helper function to generate form cycle edit route
 * @param formCycleId - The ID of the form cycle
 * @returns The route path with the ID substituted and URL-encoded
 */
export const getFormCycleEditRoute = (formCycleId: string): string => {
  return ROUTES.DASHBOARD_FORM_EDIT.replace(':id', encodeURLComponent(formCycleId));
};
