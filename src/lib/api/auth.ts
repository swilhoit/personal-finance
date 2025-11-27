/**
 * API Authentication Utilities
 *
 * Provides reusable authentication middleware for API routes.
 * Reduces duplication of auth checks across 30+ routes.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Result of authentication check
 */
export interface AuthResult {
  user: User;
  supabase: SupabaseClient;
}

/**
 * Error response for unauthorized requests
 */
export interface AuthError {
  error: NextResponse;
}

/**
 * Authenticates the current request and returns user + supabase client.
 *
 * @returns AuthResult if authenticated, AuthError if not
 *
 * @example
 * ```ts
 * export async function GET() {
 *   const auth = await requireAuth();
 *   if ('error' in auth) return auth.error;
 *
 *   const { user, supabase } = auth;
 *   // ... use authenticated user
 * }
 * ```
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      };
    }

    return { user, supabase };
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Type guard to check if auth result is an error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'error' in result;
}
