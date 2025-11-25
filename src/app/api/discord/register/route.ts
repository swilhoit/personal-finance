/**
 * Discord Register API
 * Register/link a Discord server to user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DiscordService } from '@/services/discordService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const discordService = new DiscordService(supabase);
    const guild = await discordService.getUserGuild(user.id);

    if (!guild) {
      const clientId = process.env.DISCORD_CLIENT_ID;
      return NextResponse.json({
        connected: false,
        inviteUrl: clientId ? 
          `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=3147776&scope=bot%20applications.commands` : 
          null,
      });
    }

    return NextResponse.json({
      connected: true,
      guild: {
        id: guild.guild_id,
        name: guild.guild_name,
        notificationChannel: guild.notification_channel_id,
        financeChannel: guild.finance_channel_id,
        settings: guild.settings,
      },
    });
  } catch (error) {
    console.error('Error fetching Discord registration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Discord registration' },
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
    const { guildId, guildName, notificationChannelId, financeChannelId, settings } = body;

    if (!guildId || !guildName) {
      return NextResponse.json(
        { error: 'Guild ID and name required' },
        { status: 400 }
      );
    }

    // Check if guild is already registered to another user
    const { data: existingGuild } = await supabase
      .from('discord_guilds')
      .select('user_id')
      .eq('guild_id', guildId)
      .single();

    if (existingGuild && existingGuild.user_id !== user.id) {
      return NextResponse.json(
        { error: 'This Discord server is already linked to another account' },
        { status: 409 }
      );
    }

    // Register or update guild
    const { error } = await supabase.from('discord_guilds').upsert({
      user_id: user.id,
      guild_id: guildId,
      guild_name: guildName,
      notification_channel_id: notificationChannelId,
      finance_channel_id: financeChannelId,
      settings: settings || {},
      is_active: true,
    }, { onConflict: 'guild_id' });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to register Discord server' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Discord server linked successfully',
    });
  } catch (error) {
    console.error('Error registering Discord server:', error);
    return NextResponse.json(
      { error: 'Failed to register Discord server' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('discord_guilds')
      .update({ is_active: false })
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to unlink Discord server' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Discord server unlinked',
    });
  } catch (error) {
    console.error('Error unlinking Discord server:', error);
    return NextResponse.json(
      { error: 'Failed to unlink Discord server' },
      { status: 500 }
    );
  }
}


