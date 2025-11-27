/**
 * Cron Job Authentication Utility
 *
 * Verifies that cron requests come from Vercel's cron system
 * using the CRON_SECRET environment variable.
 *
 * Usage:
 *   const authError = verifyCronRequest(request);
 *   if (authError) return authError;
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Verifies that a request is authorized to trigger a cron job.
 *
 * Checks for either:
 * 1. Vercel's cron Authorization header (production)
 * 2. CRON_SECRET in Authorization header (manual trigger)
 *
 * @param request - The incoming request
 * @returns NextResponse with 401 error if unauthorized, null if authorized
 */
export function verifyCronRequest(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow requests without auth if no secret is configured
  if (process.env.NODE_ENV === 'development' && !cronSecret) {
    return null;
  }

  // Check if CRON_SECRET is configured
  if (!cronSecret) {
    console.error('[Cron Auth] CRON_SECRET environment variable is not set');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Verify the authorization header
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron Auth] Unauthorized cron request attempted');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Creates the Authorization header for manually triggering cron jobs
 *
 * @returns Headers object with Authorization
 */
export function createCronAuthHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${process.env.CRON_SECRET}`,
  };
}
