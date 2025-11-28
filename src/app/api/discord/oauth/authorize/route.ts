/**
 * Discord OAuth Authorization
 * Initiates the OAuth flow to connect user's Discord account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized&redirect=/settings/integrations', request.url)
      );
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/oauth/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Discord OAuth not configured' },
        { status: 500 }
      );
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7)
    })).toString('base64url');

    // Store state in session or database for validation
    // Use admin client to bypass RLS for temporary CSRF tokens
    const adminClient = createSupabaseAdminClient();
    await adminClient.from('oauth_states').insert({
      user_id: user.id,
      state,
      provider: 'discord',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

    // Build Discord OAuth URL
    const scopes = ['identify', 'guilds'];
    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating Discord OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Discord authorization' },
      { status: 500 }
    );
  }
}
