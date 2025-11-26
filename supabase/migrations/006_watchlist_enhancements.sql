-- Watchlist Enhancements
-- Add notes, target price, and alerts_enabled columns to user_watchlists

-- Add notes column for user annotations
ALTER TABLE public.user_watchlists 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add target price for tracking price targets
ALTER TABLE public.user_watchlists 
ADD COLUMN IF NOT EXISTS target_price DECIMAL(15,2);

-- Add alerts_enabled flag
ALTER TABLE public.user_watchlists 
ADD COLUMN IF NOT EXISTS alerts_enabled BOOLEAN DEFAULT false;

-- Add user_holdings table for portfolio tracking
CREATE TABLE IF NOT EXISTS public.user_holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  shares DECIMAL(15,6) NOT NULL,
  cost_basis DECIMAL(15,2),
  purchase_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Add indexes for holdings
CREATE INDEX IF NOT EXISTS idx_user_holdings_user
  ON public.user_holdings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_holdings_symbol
  ON public.user_holdings(symbol);

-- Enable RLS on holdings
ALTER TABLE public.user_holdings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_holdings
CREATE POLICY "Users can view own holdings"
  ON public.user_holdings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holdings"
  ON public.user_holdings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
  ON public.user_holdings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
  ON public.user_holdings FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger for holdings
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_holdings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add weekly_analysis table for AI-generated insights
CREATE TABLE IF NOT EXISTS public.weekly_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  analysis_type TEXT NOT NULL,
  title TEXT,
  executive_summary TEXT,
  detailed_analysis JSONB,
  recommendations TEXT[],
  key_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for weekly_analysis
CREATE INDEX IF NOT EXISTS idx_weekly_analysis_user_date
  ON public.weekly_analysis(user_id, week_start DESC);

-- Enable RLS on weekly_analysis
ALTER TABLE public.weekly_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_analysis
CREATE POLICY "Users can view own analyses"
  ON public.weekly_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.weekly_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add missing columns to market_data if they don't exist
ALTER TABLE public.market_data 
ADD COLUMN IF NOT EXISTS change_amount DECIMAL(15,4);

ALTER TABLE public.market_data 
ADD COLUMN IF NOT EXISTS performance_90d DECIMAL(10,4);

ALTER TABLE public.market_data 
ADD COLUMN IF NOT EXISTS performance_365d DECIMAL(10,4);




