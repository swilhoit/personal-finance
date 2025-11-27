-- Fix oauth_states table RLS
-- The oauth_states table was missing RLS configuration, causing Discord OAuth to fail

-- Enable RLS on oauth_states
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for oauth_states
CREATE POLICY "Users can view own oauth states"
  ON public.oauth_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oauth states"
  ON public.oauth_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own oauth states"
  ON public.oauth_states FOR DELETE
  USING (auth.uid() = user_id);
