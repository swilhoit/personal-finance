/**
 * Teller Create Enrollment API
 * Returns configuration for Teller Connect widget
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicationId = process.env.TELLER_APPLICATION_ID;
    const rawEnvironment = (process.env.TELLER_ENVIRONMENT || 'sandbox').trim().toLowerCase();

    // Validate environment - Teller only accepts these specific values
    const validEnvironments = ['sandbox', 'development', 'production'] as const;
    const environment = validEnvironments.includes(rawEnvironment as typeof validEnvironments[number])
      ? rawEnvironment as 'sandbox' | 'development' | 'production'
      : 'sandbox';

    console.log('[Teller] Environment config:', { rawEnvironment, environment, applicationId: applicationId ? 'set' : 'missing' });

    if (!applicationId) {
      console.error('Teller not configured: TELLER_APPLICATION_ID environment variable is missing');
      return NextResponse.json(
        {
          error: 'Teller banking integration is not configured. Please contact support or configure TELLER_APPLICATION_ID in your environment variables.',
          details: 'TELLER_APPLICATION_ID is required'
        },
        { status: 503 }
      );
    }

    // Return Teller Connect configuration
    return NextResponse.json({
      applicationId,
      environment,
      userId: user.id,
      selectAccount: 'multiple',
    });
  } catch (error) {
    console.error('Error creating Teller enrollment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create enrollment', details: errorMessage },
      { status: 500 }
    );
  }
}





