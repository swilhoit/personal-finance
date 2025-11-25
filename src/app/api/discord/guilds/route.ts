/**
 * Discord Guilds API
 * Fetches the user's Discord servers to allow linking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Discord connection with access token
    const { data: connection, error: connError } = await supabase
      .from('discord_connections')
      .select('access_token, token_expires_at, refresh_token, discord_user_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'Discord not connected' },
        { status: 404 }
      );
    }

    // Check if token is expired
    const tokenExpired = new Date(connection.token_expires_at) < new Date();
    let accessToken = connection.access_token;

    if (tokenExpired && connection.refresh_token) {
      // Refresh the token
      const refreshResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID!,
          client_secret: process.env.DISCORD_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
        }),
      });

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to refresh Discord token. Please reconnect.' },
          { status: 401 }
        );
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;

      // Update stored tokens
      await supabase
        .from('discord_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('user_id', user.id);
    }

    // Fetch user's guilds from Discord
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!guildsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Discord servers' },
        { status: 500 }
      );
    }

    const discordGuilds: DiscordGuild[] = await guildsResponse.json();

    // Get already linked guilds
    const { data: linkedGuilds } = await supabase
      .from('discord_guilds')
      .select('guild_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const linkedGuildIds = new Set(linkedGuilds?.map(g => g.guild_id) || []);

    // Filter to guilds where user has admin permissions (manage server)
    const MANAGE_GUILD_PERMISSION = 0x00000020;
    const adminGuilds = discordGuilds.filter(guild => {
      const permissions = BigInt(guild.permissions);
      const hasManageGuild = (permissions & BigInt(MANAGE_GUILD_PERMISSION)) !== BigInt(0);
      const isOwner = guild.owner;
      return isOwner || hasManageGuild;
    });

    // Map guilds with link status
    const guildsWithStatus = adminGuilds.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon
        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
        : null,
      isLinked: linkedGuildIds.has(guild.id),
    }));

    return NextResponse.json({
      guilds: guildsWithStatus,
    });
  } catch (error) {
    console.error('Error fetching Discord guilds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Discord servers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { guildId, guildName } = body;

    if (!guildId || !guildName) {
      return NextResponse.json(
        { error: 'Guild ID and name required' },
        { status: 400 }
      );
    }

    // Verify user has Discord connected
    const { data: connection } = await supabase
      .from('discord_connections')
      .select('discord_user_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'Discord not connected' },
        { status: 404 }
      );
    }

    // Check if guild is already linked to another user
    const { data: existingGuild } = await supabase
      .from('discord_guilds')
      .select('user_id')
      .eq('guild_id', guildId)
      .eq('is_active', true)
      .single();

    if (existingGuild && existingGuild.user_id !== user.id) {
      return NextResponse.json(
        { error: 'This Discord server is already linked to another account' },
        { status: 409 }
      );
    }

    // Link the guild
    const { error } = await supabase.from('discord_guilds').upsert({
      user_id: user.id,
      guild_id: guildId,
      guild_name: guildName,
      is_active: true,
    }, { onConflict: 'guild_id' });

    if (error) {
      console.error('Error linking guild:', error);
      return NextResponse.json(
        { error: 'Failed to link Discord server' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Discord server linked successfully',
    });
  } catch (error) {
    console.error('Error linking Discord guild:', error);
    return NextResponse.json(
      { error: 'Failed to link Discord server' },
      { status: 500 }
    );
  }
}
