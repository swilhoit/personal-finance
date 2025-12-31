/**
 * Discord Webhook API
 * Handle incoming Discord bot events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyDiscordSignature } from '@/lib/api/discord-verify';

// Lazy-load Supabase client to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseInstance;
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify Discord signature
    const signatureError = await verifyDiscordSignature(request, rawBody);
    if (signatureError) return signatureError;

    // Parse the verified body
    const body = JSON.parse(rawBody);
    const { type } = body;

    // Handle Discord interaction types
    switch (type) {
      case 1: // PING
        return NextResponse.json({ type: 1 });

      case 2: // APPLICATION_COMMAND
        return await handleCommand(body);

      case 3: // MESSAGE_COMPONENT
        return await handleComponent();

      default:
        return NextResponse.json({ type: 1 });
    }
  } catch (error) {
    console.error('Error handling Discord webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface DiscordInteraction {
  guild_id: string;
  data: {
    name: string;
    options?: Array<{ name: string; value: string | number }>;
  };
  member?: {
    user?: {
      id: string;
    };
  };
  user?: {
    id: string;
  };
}

async function handleCommand(interaction: DiscordInteraction): Promise<NextResponse> {
  const { guild_id, data, member, user } = interaction;
  const commandName = data.name;
  const discordUser = user || member?.user;

  // Resolve guild to user
  const supabase = getSupabase();
  const { data: guildData } = await supabase
    .from('discord_guilds')
    .select('user_id, settings')
    .eq('guild_id', guild_id)
    .eq('is_active', true)
    .single();

  let guild: { user_id: string; settings: Record<string, unknown> | null } | null = guildData;

  if (!guild) {
    // Check if the Discord user has a direct connection
    let userId = null;
    if (discordUser?.id) {
      const { data: connection } = await supabase
        .from('discord_connections')
        .select('user_id')
        .eq('discord_user_id', discordUser.id)
        .eq('is_active', true)
        .single();

      if (connection) {
        userId = connection.user_id;
      }
    }

    if (!userId) {
      return NextResponse.json({
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
          content: '❌ This server is not linked to a Finance AI account. Please visit the dashboard at ' +
                   (process.env.NEXT_PUBLIC_SITE_URL || 'your-app-url') +
                   '/settings/integrations to connect your Discord account and invite the bot.',
          flags: 64, // Ephemeral
        },
      });
    }

    // Use the Discord user's connection instead
    guild = { user_id: userId, settings: null };
  }

  // Handle different commands
  switch (commandName) {
    case 'balance':
      return await handleBalanceCommand(guild.user_id);

    case 'spending':
      return await handleSpendingCommand(guild.user_id, data.options);

    case 'watchlist':
      return await handleWatchlistCommand(guild.user_id);

    case 'quote':
      return await handleQuoteCommand(data.options);

    default:
      return NextResponse.json({
        type: 4,
        data: {
          content: `Unknown command: ${commandName}`,
          flags: 64,
        },
      });
  }
}

async function handleBalanceCommand(userId: string): Promise<NextResponse> {
  const supabase = getSupabase();
  const { data: accounts } = await supabase
    .from('teller_accounts')
    .select('name, type, current_balance, institution_name')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({
      type: 4,
      data: {
        content: '💳 No connected bank accounts. Visit the dashboard to connect your bank.',
      },
    });
  }

  const total = accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);
  const accountList = accounts.map(a => 
    `• **${a.name}** (${a.institution_name}): $${(a.current_balance || 0).toFixed(2)}`
  ).join('\n');

  return NextResponse.json({
    type: 4,
    data: {
      embeds: [{
        title: '💰 Account Balances',
        description: accountList,
        color: 0x57F287,
        fields: [{
          name: 'Total',
          value: `$${total.toFixed(2)}`,
          inline: false,
        }],
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleSpendingCommand(userId: string, options?: Array<{ name: string; value: string | number }>): Promise<NextResponse> {
  const daysValue = options?.find(o => o.name === 'days')?.value || 7;
  const days = typeof daysValue === 'string' ? parseInt(daysValue, 10) : daysValue;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const supabase = getSupabase();
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, category, merchant_name')
    .eq('user_id', userId)
    .gte('date', since)
    .lt('amount', 0);

  if (!transactions || transactions.length === 0) {
    return NextResponse.json({
      type: 4,
      data: {
        content: `📊 No spending in the last ${days} days.`,
      },
    });
  }

  const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const byCategory = new Map<string, number>();
  
  for (const tx of transactions) {
    const cat = tx.category || 'Uncategorized';
    byCategory.set(cat, (byCategory.get(cat) || 0) + Math.abs(tx.amount));
  }

  const topCategories = Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amount]) => `• ${cat}: $${amount.toFixed(2)}`)
    .join('\n');

  return NextResponse.json({
    type: 4,
    data: {
      embeds: [{
        title: `💳 Spending (Last ${days} Days)`,
        color: 0xF59E0B,
        fields: [
          { name: 'Total Spent', value: `$${total.toFixed(2)}`, inline: true },
          { name: 'Transactions', value: transactions.length.toString(), inline: true },
          { name: 'Top Categories', value: topCategories || 'None', inline: false },
        ],
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleWatchlistCommand(userId: string): Promise<NextResponse> {
  const supabase = getSupabase();
  const { data: watchlist } = await supabase
    .from('user_watchlists')
    .select('symbol')
    .eq('user_id', userId);

  if (!watchlist || watchlist.length === 0) {
    return NextResponse.json({
      type: 4,
      data: {
        content: '📈 Your watchlist is empty. Add stocks via the dashboard.',
      },
    });
  }

  const symbols = watchlist.map(w => w.symbol);
  const { data: marketData } = await supabase
    .from('market_data')
    .select('symbol, price, change_percent')
    .in('symbol', symbols)
    .order('date', { ascending: false })
    .limit(symbols.length);

  const watchlistText = symbols.map(symbol => {
    const data = marketData?.find(m => m.symbol === symbol);
    if (!data) return `• ${symbol}: --`;
    const emoji = data.change_percent >= 0 ? '📈' : '📉';
    const sign = data.change_percent >= 0 ? '+' : '';
    return `${emoji} **${symbol}**: $${data.price?.toFixed(2)} (${sign}${data.change_percent?.toFixed(2)}%)`;
  }).join('\n');

  return NextResponse.json({
    type: 4,
    data: {
      embeds: [{
        title: '📊 Your Watchlist',
        description: watchlistText,
        color: 0x5865F2,
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleQuoteCommand(options?: Array<{ name: string; value: string | number }>): Promise<NextResponse> {
  const symbolValue = options?.find(o => o.name === 'symbol')?.value;
  const symbol = symbolValue ? String(symbolValue).toUpperCase() : undefined;

  if (!symbol) {
    return NextResponse.json({
      type: 4,
      data: {
        content: '❌ Please provide a stock symbol.',
        flags: 64,
      },
    });
  }

  const supabase = getSupabase();
  const { data } = await supabase
    .from('market_data')
    .select('*')
    .eq('symbol', symbol)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return NextResponse.json({
      type: 4,
      data: {
        content: `❌ No data found for ${symbol}. Try a different symbol.`,
        flags: 64,
      },
    });
  }

  const emoji = data.change_percent >= 0 ? '📈' : '📉';
  const color = data.change_percent >= 0 ? 0x57F287 : 0xED4245;
  const sign = data.change_percent >= 0 ? '+' : '';

  return NextResponse.json({
    type: 4,
    data: {
      embeds: [{
        title: `${emoji} ${symbol} - ${data.name}`,
        color,
        fields: [
          { name: 'Price', value: `$${data.price?.toFixed(2)}`, inline: true },
          { name: 'Change', value: `${sign}${data.change_percent?.toFixed(2)}%`, inline: true },
          { name: '30D', value: `${data.performance_30d ? `${data.performance_30d >= 0 ? '+' : ''}${data.performance_30d.toFixed(2)}%` : '--'}`, inline: true },
        ],
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleComponent(): Promise<NextResponse> {
  return NextResponse.json({
    type: 4,
    data: {
      content: 'Component interaction received',
      flags: 64,
    },
  });
}


















