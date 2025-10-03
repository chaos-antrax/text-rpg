-- Create messages table for persistent conversation history
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Create index for performance
CREATE INDEX idx_messages_session_id ON public.messages(session_id, created_at ASC);
CREATE INDEX idx_messages_player_id ON public.messages(player_id, created_at DESC);

-- Migrate existing messages from game_sessions to messages table
DO $$
DECLARE
  session_record RECORD;
  message_record JSONB;
BEGIN
  FOR session_record IN SELECT id, player_id, messages FROM public.game_sessions WHERE messages IS NOT NULL AND jsonb_array_length(messages) > 0
  LOOP
    FOR message_record IN SELECT * FROM jsonb_array_elements(session_record.messages)
    LOOP
      INSERT INTO public.messages (player_id, session_id, role, content, created_at)
      VALUES (
        session_record.player_id,
        session_record.id,
        message_record->>'role',
        message_record->>'content',
        COALESCE((message_record->>'timestamp')::TIMESTAMPTZ, NOW())
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
