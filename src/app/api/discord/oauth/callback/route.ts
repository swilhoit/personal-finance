/**
 * Discord OAuth Callback
 * Handles the OAuth callback and stores the user's Discord connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Discord OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=discord_${error}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=invalid_callback', request.url)
      );
    }

    const supabase = await createClient();

    // Verify state parameter
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    const { data: storedState } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'discord')
      .single();

    if (!storedState || new Date(storedState.expires_at) < new Date()) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=invalid_state', request.url)
      );
    }

    // Delete used state
    await supabase.from('oauth_states').delete().eq('state', state);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== stateData.userId) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI ||
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/oauth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Discord token exchange failed:', errorText);
      return NextResponse.redirect(
        new URL('/settings/integrations?error=token_exchange_failed', request.url)
      );
    }

    const tokens: DiscordTokenResponse = await tokenResponse.json();

    // Fetch Discord user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=user_fetch_failed', request.url)
      );
    }

    const discordUser: DiscordUser = await userResponse.json();

    // Store Discord connection
    // NOTE: In production, encrypt access_token and refresh_token
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { error: upsertError } = await supabase
      .from('discord_connections')
      .upsert({
        user_id: user.id,
        discord_user_id: discordUser.id,
        discord_username: discordUser.username,
        discord_discriminator: discordUser.discriminator,
        discord_avatar: discordUser.avatar,
        access_token: tokens.access_token, // Encrypt in production
        refresh_token: tokens.refresh_token, // Encrypt in production
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error storing Discord connection:', upsertError);
      return NextResponse.redirect(
        new URL('/settings/integrations?error=connection_failed', request.url)
      );
    }

    // Success! Redirect to integrations page
    return NextResponse.redirect(
      new URL('/settings/integrations?success=discord_connected', request.url)
    );
  } catch (error) {
    console.error('Error handling Discord OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/settings/integrations?error=callback_failed', request.url)
    );
  }
}
