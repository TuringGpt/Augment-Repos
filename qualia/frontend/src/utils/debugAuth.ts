/**
 * Debug utility for inspecting authentication state
 * Use this to troubleshoot 403 Forbidden errors
 */

import { safeGetLocalStorage } from '@/lib/storage';
import { decodeJWT } from '@/lib/jwt';

/**
 * Debug authentication state
 * Logs detailed information about the current user's authentication
 * This helps troubleshoot 403 Forbidden errors
 *
 * ⚠️ SECURITY NOTE: This function is ONLY enabled in development mode
 * It logs sensitive information including JWT claims and should NEVER run in production
 * The development check prevents any logging in production builds
 */
export function debugAuthState(): void {
  // CRITICAL: Only run in development to avoid exposing sensitive info in production
  // This guard prevents any token/payload logging in production builds
  if (!import.meta.env.DEV) {
    return;
  }

  console.group('🔍 Authentication Debug Info');
  console.warn('⚠️ [DEV ONLY] This debug output contains sensitive JWT claims and should only be used in development');

  // Check if tokens exist
  const accessToken = safeGetLocalStorage('access_token');
  const refreshToken = safeGetLocalStorage('refresh_token');

  console.log('📦 Tokens in localStorage:');
  console.log('  - access_token:', accessToken ? '✅ Present' : '❌ Missing');
  console.log('  - refresh_token:', refreshToken ? '✅ Present' : '❌ Missing');

  if (!accessToken) {
    console.warn('⚠️  No access token found. User is not authenticated.');
    console.groupEnd();
    return;
  }

  // Decode and display token payload
  const payload = decodeJWT(accessToken);

  if (!payload) {
    console.error('❌ Failed to decode access token. Token might be malformed.');
    // Only log first 15 chars of token for debugging (minimal exposure)
    console.log('Token prefix:', accessToken.substring(0, 15) + '...');
    console.groupEnd();
    return;
  }

  // Log payload with potentially sensitive information
  // Only runs in development - see guard at function start
  console.log('\n📝 Decoded Token Payload:');
  console.log(JSON.stringify(payload, null, 2));

  // Check user identification
  console.log('\n👤 User Identification:');
  console.log('  - sub (user email):', payload.sub || '❌ Missing');

  // Check token type
  console.log('\n🔑 Token Type:');
  console.log('  - token_type:', payload.token_type || '❌ Missing');
  if (payload.token_type && payload.token_type !== 'access') {
    console.warn(`  ⚠️  Expected "access" but got "${payload.token_type}"`);
  }
  
  // Check token expiration
  console.log('\n⏰ Token Expiration:');
  if (payload.exp) {
    const expirationDate = new Date(payload.exp * 1000);
    const now = new Date();
    const isExpired = now > expirationDate;
    
    console.log('  - Expires at:', expirationDate.toLocaleString());
    console.log('  - Current time:', now.toLocaleString());
    console.log('  - Status:', isExpired ? '❌ EXPIRED' : '✅ Valid');
    
    if (isExpired) {
      console.error('  ⚠️  Token is expired! This will cause 401 Unauthorized errors.');
    } else {
      const timeLeft = expirationDate.getTime() - now.getTime();
      const minutesLeft = Math.floor(timeLeft / 1000 / 60);
      console.log(`  - Time remaining: ${minutesLeft} minutes`);
    }
  } else {
    console.warn('  ⚠️  No expiration time (exp) in token');
  }
  
  console.log('\n💡 Troubleshooting Tips for 403 Forbidden Errors:');
  console.log('  1. The JWT token does NOT contain role information');
  console.log('     - Role-based authorization is enforced via database lookup on the backend');
  console.log('     - The backend verifies user roles by querying the database with the sub (email) from the token');
  console.log('  2. If you get 403 on /forms/assigned:');
  console.log('     - Your user account in the database must have the "reviewer" role');
  console.log('     - Check the database directly or contact an admin to verify your role');
  console.log('  3. If token is expired, log out and log in again');
  console.log('  4. If sub (email) is missing or incorrect, the backend cannot identify you');
  
  console.groupEnd();
}

/**
 * NOTE: Role information is NOT available in JWT tokens.
 * The Qualia backend JWT only contains: sub (email), exp (expiration), and token_type.
 * Role-based authorization is enforced server-side via database lookup.
 *
 * If you need to check user roles, you must:
 * 1. Make an API call to a backend endpoint that returns the current user's role
 * 2. Store the role information separately (e.g., in React state or context)
 *
 * Do NOT attempt to read role information from the JWT token as it does not exist there.
 */
