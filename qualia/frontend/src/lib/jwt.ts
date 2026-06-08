/**
 * JWT utility functions
 * Provides JWT token decoding without external dependencies
 */

export interface JWTPayload {
  sub?: string;  // Subject (typically user ID or email)
  email?: string;
  name?: string;
  exp?: number;  // Expiration time
  iat?: number;  // Issued at
  [key: string]: unknown;
}

/**
 * Decode a JWT token without verification
 *
 * ⚠️ SECURITY WARNING: This function does NOT verify the token signature.
 * It is ONLY safe for UI display purposes (e.g., showing usernames, email).
 * DO NOT use this for authorization or security decisions, as localStorage
 * tokens can be tampered with on the client side.
 *
 * All authorization must be handled server-side using the token sent in
 * HTTP headers, where the backend verifies the signature.
 *
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode the payload (second part)
    const payload = parts[1];

    // Base64url decode
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed (base64 strings must be multiple of 4)
    const padLength = (4 - (base64.length % 4)) % 4;
    base64 += '='.repeat(padLength);

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Get user information from access token stored in localStorage
 * 
 * @returns User payload or null if no valid token
 */
export function getUserFromToken(): JWTPayload | null {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return null;
    }
    
    return decodeJWT(token);
  } catch (error) {
    console.error('Failed to get user from token:', error);
    return null;
  }
}

/**
 * Extract user's display name from token
 * Falls back to email username if no name is present
 * 
 * @returns User's display name or 'User' as fallback
 */
export function getUserDisplayName(): string {
  const user = getUserFromToken();
  
  if (!user) {
    return 'User';
  }
  
  // Try to get name from token
  if (user.name && typeof user.name === 'string') {
    return user.name;
  }
  
  // Try to get email and extract username
  const email = user.email || user.sub;
  if (email && typeof email === 'string') {
    // Extract username from email (part before @)
    const username = email.split('@')[0];
    // Capitalize first letter
    return username.charAt(0).toUpperCase() + username.slice(1);
  }
  
  return 'User';
}
