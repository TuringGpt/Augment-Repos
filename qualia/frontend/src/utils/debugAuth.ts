/**
 * Debug utility for inspecting authentication state
 * Use this to troubleshoot 403 Forbidden errors
 */

import { safeGetLocalStorage } from '@/lib/axios';
import { decodeJWT, getUserFromToken } from '@/lib/jwt';

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
  
  // Check for role
  console.log('\n🔑 Role Information:');
  if (payload.role) {
    console.log(`  - Role: "${payload.role}"`);
    if (payload.role !== 'reviewer') {
      console.warn(`  ⚠️  Expected role "reviewer" but got "${payload.role}"`);
      console.warn('  This might cause 403 Forbidden on /forms/assigned endpoint');
    } else {
      console.log('  ✅ Role is "reviewer" (correct for /forms/assigned)');
    }
  } else {
    console.error('  ❌ No "role" field in token!');
    console.warn('  This will likely cause 403 Forbidden errors');
  }
  
  // Check user ID
  console.log('\n👤 User Identification:');
  console.log('  - sub (user ID):', payload.sub || '❌ Missing');
  console.log('  - email:', payload.email || '❌ Missing');
  console.log('  - name:', payload.name || '❌ Missing');
  
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
  
  // Check issued at
  if (payload.iat) {
    const issuedDate = new Date(payload.iat * 1000);
    console.log('  - Issued at:', issuedDate.toLocaleString());
  }
  
  console.log('\n💡 Troubleshooting Tips:');
  console.log('  1. If role is not "reviewer", you need to:');
  console.log('     - Register/login as a reviewer user, OR');
  console.log('     - Update your user role in the database');
  console.log('  2. If token is expired, try logging out and logging in again');
  console.log('  3. If role field is missing, the backend might not be including it in the token');
  
  console.groupEnd();
}

/**
 * Quick check for reviewer role
 * Returns true if current user has reviewer role
 */
export function isReviewer(): boolean {
  const user = getUserFromToken();
  return user?.role === 'reviewer';
}

/**
 * Get current user role
 */
export function getCurrentUserRole(): string | null {
  const user = getUserFromToken();
  return typeof user?.role === 'string' ? user.role : null;
}
