/**
 * Teller Create Enrollment API
 * Returns configuration for Teller Connect widget
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicationId = process.env.TELLER_APPLICATION_ID;
    const environment = process.env.TELLER_ENVIRONMENT || 'sandbox';

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Teller not configured' },
        { status: 500 }
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
    return NextResponse.json(
      { error: 'Failed to create enrollment' },
      { status: 500 }
    );
  }
}


