/**
 * localStorage utility functions
 * Provides safe access to localStorage with proper error handling
 * Extracted to a separate module to avoid circular dependencies
 */

/**
 * Safely retrieves a value from localStorage.
 * Returns null if localStorage is unavailable (SSR, tests, or blocked by browser).
 */
export function safeGetLocalStorage(key: string): string | null {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(key);
  } catch {
    // localStorage access can throw when disabled/blocked
    return null;
  }
}

/**
 * Safely sets a value in localStorage.
 * Returns true if the operation succeeded, false otherwise.
 * @returns boolean indicating whether the value was successfully stored
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem(key, value);
      // Verify the value was actually stored by reading it back
      return window.localStorage.getItem(key) === value;
    }
    return false;
  } catch {
    // localStorage access can throw when disabled/blocked
    return false;
  }
}

/**
 * Safely removes a value from localStorage.
 * Silently fails if localStorage is unavailable.
 */
export function safeRemoveLocalStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Silently fail if localStorage is blocked
  }
}
