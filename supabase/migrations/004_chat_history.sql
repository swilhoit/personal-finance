-- Create chat_history table to store conversation history
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_history_user_session 
  ON public.chat_history(user_id, session_id, created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own chat history
CREATE POLICY "Users can view own chat history" 
  ON public.chat_history FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own chat history
CREATE POLICY "Users can insert own chat history" 
  ON public.chat_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own chat history
CREATE POLICY "Users can delete own chat history" 
  ON public.chat_history FOR DELETE 
  USING (auth.uid() = user_id);