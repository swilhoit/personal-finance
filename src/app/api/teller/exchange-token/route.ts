/**
 * Teller Exchange Token API
 * Stores the access token after Teller Connect completes
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

    const body = await request.json();
    const { accessToken, enrollmentId, institution } = body;

    if (!accessToken || !enrollmentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store enrollment in database
    // In production, encrypt the access token before storing
    const { error: insertError } = await supabase.from('teller_enrollments').insert({
      user_id: user.id,
      enrollment_id: enrollmentId,
      access_token: accessToken, // Should be encrypted in production
      institution_name: institution?.name || 'Unknown Bank',
      institution_id: institution?.id,
      status: 'active',
    });

    if (insertError) {
      console.error('Error storing enrollment:', insertError);
      // Check if it's a duplicate
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'This bank is already connected' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to store enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollmentId,
      message: 'Bank connected successfully',
    });
  } catch (error) {
    console.error('Error exchanging Teller token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    );
  }
}






