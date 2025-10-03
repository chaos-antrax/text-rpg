-- Create table to track which world changes a player has seen
CREATE TABLE IF NOT EXISTS public.seen_world_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  world_change_id UUID NOT NULL REFERENCES public.world_changes(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, world_change_id)
);

-- Enable Row Level Security
ALTER TABLE public.seen_world_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own seen changes" ON public.seen_world_changes
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own seen changes" ON public.seen_world_changes
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Create index for performance
CREATE INDEX idx_seen_world_changes_player ON public.seen_world_changes(player_id, world_change_id);
