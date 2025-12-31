-- Manual Accounts
-- For accounts not connected via Teller (user-created)
CREATE TABLE IF NOT EXISTS public.manual_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL UNIQUE, -- Format: 'manual_<uuid>'
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit')),
  current_balance DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for manual_accounts
CREATE INDEX IF NOT EXISTS idx_manual_accounts_user ON public.manual_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_accounts_account_id ON public.manual_accounts(account_id);

-- CSV Import History
-- Track imports for audit trail and potential rollback
CREATE TABLE IF NOT EXISTS public.csv_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL, -- Can reference manual_accounts.id or teller_accounts.id
  account_type TEXT NOT NULL CHECK (account_type IN ('manual', 'teller')),
  filename TEXT,
  detected_format TEXT, -- 'chase', 'amex', 'capital_one', 'generic', etc.
  rows_imported INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0, -- Duplicates
  import_status TEXT DEFAULT 'pending' CHECK (import_status IN ('pending', 'completed', 'failed', 'rolled_back')),
  error_message TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for csv_imports
CREATE INDEX IF NOT EXISTS idx_csv_imports_user ON public.csv_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_csv_imports_account ON public.csv_imports(account_id);

-- Enable RLS
ALTER TABLE public.manual_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual_accounts
CREATE POLICY "Users can view own manual accounts"
  ON public.manual_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own manual accounts"
  ON public.manual_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own manual accounts"
  ON public.manual_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own manual accounts"
  ON public.manual_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for csv_imports
CREATE POLICY "Users can view own imports"
  ON public.csv_imports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own imports"
  ON public.csv_imports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own imports"
  ON public.csv_imports FOR UPDATE USING (auth.uid() = user_id);

-- Updated_at trigger for manual_accounts
CREATE TRIGGER set_manual_accounts_updated_at
  BEFORE UPDATE ON public.manual_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add manual_account_id column to transactions for linking
-- This allows transactions to be linked to either teller_accounts or manual_accounts
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS manual_account_id UUID REFERENCES public.manual_accounts(id) ON DELETE CASCADE;

-- Add index for manual_account_id
CREATE INDEX IF NOT EXISTS idx_transactions_manual_account ON public.transactions(manual_account_id);

-- Add csv_import_id to track which import a transaction came from
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS csv_import_id UUID REFERENCES public.csv_imports(id) ON DELETE SET NULL;
