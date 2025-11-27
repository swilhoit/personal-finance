/**
 * Discord Connection API
 * Get or disconnect user's Discord connection
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Discord connection
    const { data: connection, error } = await supabase
      .from('discord_connections')
      .select('discord_user_id, discord_username, discord_discriminator, discord_avatar, is_active, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !connection) {
      return NextResponse.json({
        connected: false,
        connection: null,
      });
    }

    // Get linked guilds
    const { data: guilds } = await supabase
      .from('discord_guilds')
      .select('guild_id, guild_name, notification_channel_id, finance_channel_id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);

    return NextResponse.json({
      connected: true,
      connection: {
        discordUserId: connection.discord_user_id,
        username: connection.discord_username,
        discriminator: connection.discord_discriminator,
        avatar: connection.discord_avatar,
        connectedAt: connection.created_at,
      },
      guilds: guilds || [],
      botInviteUrl: process.env.DISCORD_CLIENT_ID
        ? `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=3147776&scope=bot%20applications.commands`
        : null,
    });
  } catch (error) {
    console.error('Error fetching Discord connection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Discord connection' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Deactivate Discord connection
    const { error: connectionError } = await supabase
      .from('discord_connections')
      .update({ is_active: false })
      .eq('user_id', user.id);

    // Deactivate all guilds
    const { error: guildsError } = await supabase
      .from('discord_guilds')
      .update({ is_active: false })
      .eq('user_id', user.id);

    if (connectionError || guildsError) {
      return NextResponse.json(
        { error: 'Failed to disconnect Discord' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Discord disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting Discord:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Discord' },
      { status: 500 }
    );
  }
}
