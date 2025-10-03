-- Add adventure_summary column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS adventure_summary TEXT DEFAULT NULL;

-- Add last_summary_at column to track when the summary was last generated
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_summary_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_last_summary ON public.profiles(last_summary_at);
