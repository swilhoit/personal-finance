-- OAuth States
-- Temporary storage for OAuth state parameters (CSRF protection)
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state
  ON public.oauth_states(state);

-- Cleanup expired states periodically
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires
  ON public.oauth_states(expires_at);

-- Discord User Connections
-- Links Supabase users to their Discord accounts via OAuth
CREATE TABLE IF NOT EXISTS public.discord_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_user_id TEXT NOT NULL UNIQUE,
  discord_username TEXT NOT NULL,
  discord_discriminator TEXT,
  discord_avatar TEXT,
  access_token TEXT NOT NULL, -- Encrypted in production
  refresh_token TEXT, -- Encrypted in production
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- One Discord account per user
);

-- Discord Guilds (Servers)
-- Tracks which Discord servers the bot is in and their configuration
CREATE TABLE IF NOT EXISTS public.discord_guilds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guild_id TEXT NOT NULL UNIQUE,
  guild_name TEXT NOT NULL,
  notification_channel_id TEXT,
  finance_channel_id TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teller Enrollments
-- Stores Teller Connect enrollments for bank account access
CREATE TABLE IF NOT EXISTS public.teller_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL, -- Should be encrypted in production
  institution_name TEXT,
  institution_id TEXT,
  status TEXT DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teller Accounts
-- Individual bank accounts from Teller
CREATE TABLE IF NOT EXISTS public.teller_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.teller_enrollments(id) ON DELETE CASCADE,
  teller_account_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT, -- checking, savings, credit_card, etc.
  subtype TEXT,
  institution_name TEXT,
  currency TEXT DEFAULT 'USD',
  current_balance DECIMAL(15,2),
  available_balance DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
-- Transaction history from Teller accounts
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.teller_accounts(id) ON DELETE CASCADE,
  teller_transaction_id TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  merchant_name TEXT,
  category TEXT,
  status TEXT,
  type TEXT, -- debit, credit, etc.
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Watchlists
-- Stock symbols users are watching
CREATE TABLE IF NOT EXISTS public.user_watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  alert_price_above DECIMAL(15,2),
  alert_price_below DECIMAL(15,2),
  UNIQUE(user_id, symbol)
);

-- Market Data
-- Stock market quotes and data
CREATE TABLE IF NOT EXISTS public.market_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT,
  price DECIMAL(15,2),
  change_percent DECIMAL(10,4),
  performance_30d DECIMAL(10,4),
  volume BIGINT,
  market_cap BIGINT,
  date DATE NOT NULL,
  data JSONB, -- Additional market data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, date)
);

-- Discord Notifications Log
-- Track notifications sent to Discord
CREATE TABLE IF NOT EXISTS public.discord_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guild_id TEXT,
  channel_id TEXT,
  notification_type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  data JSONB,
  delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_discord_connections_user
  ON public.discord_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_discord_connections_discord_user
  ON public.discord_connections(discord_user_id);

CREATE INDEX IF NOT EXISTS idx_discord_guilds_user
  ON public.discord_guilds(user_id);

CREATE INDEX IF NOT EXISTS idx_discord_guilds_guild
  ON public.discord_guilds(guild_id);

CREATE INDEX IF NOT EXISTS idx_teller_enrollments_user
  ON public.teller_enrollments(user_id);

CREATE INDEX IF NOT EXISTS idx_teller_accounts_user
  ON public.teller_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_teller_accounts_enrollment
  ON public.teller_accounts(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON public.transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_account
  ON public.transactions(account_id);

CREATE INDEX IF NOT EXISTS idx_watchlists_user
  ON public.user_watchlists(user_id);

CREATE INDEX IF NOT EXISTS idx_market_data_symbol_date
  ON public.market_data(symbol, date DESC);

CREATE INDEX IF NOT EXISTS idx_discord_notifications_user
  ON public.discord_notifications(user_id, created_at DESC);

-- Enable RLS (Row Level Security) on all tables
ALTER TABLE public.discord_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teller_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teller_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discord_connections
CREATE POLICY "Users can view own Discord connection"
  ON public.discord_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Discord connection"
  ON public.discord_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Discord connection"
  ON public.discord_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Discord connection"
  ON public.discord_connections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for discord_guilds
CREATE POLICY "Users can view own guilds"
  ON public.discord_guilds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own guilds"
  ON public.discord_guilds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own guilds"
  ON public.discord_guilds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own guilds"
  ON public.discord_guilds FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for teller_enrollments
CREATE POLICY "Users can view own enrollments"
  ON public.teller_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollments"
  ON public.teller_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments"
  ON public.teller_enrollments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own enrollments"
  ON public.teller_enrollments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for teller_accounts
CREATE POLICY "Users can view own accounts"
  ON public.teller_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON public.teller_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON public.teller_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON public.teller_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_watchlists
CREATE POLICY "Users can view own watchlists"
  ON public.user_watchlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist items"
  ON public.user_watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist items"
  ON public.user_watchlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist items"
  ON public.user_watchlists FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for market_data (public read access)
CREATE POLICY "Anyone can view market data"
  ON public.market_data FOR SELECT
  USING (true);

-- RLS Policies for discord_notifications
CREATE POLICY "Users can view own notifications"
  ON public.discord_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.discord_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.discord_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.discord_guilds
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.teller_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.teller_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
