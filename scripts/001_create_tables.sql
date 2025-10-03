-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  current_location TEXT DEFAULT 'Rivershade',
  current_region TEXT DEFAULT 'Eryndor',
  skill_slots INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create equipment table
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'headgear', 'armor', 'gauntlets', 'shoes', 'accessories'
  tier INTEGER DEFAULT 1,
  stat_modifiers JSONB DEFAULT '{}', -- e.g., {"damage": 5, "defense": 10}
  unlock_level INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create player_inventory table
CREATE TABLE IF NOT EXISTS public.player_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  is_equipped BOOLEAN DEFAULT FALSE,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, equipment_id)
);

-- Create skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  element TEXT NOT NULL, -- 'fire', 'water', 'earth', 'air', 'lightning', 'ice', 'light', 'dark'
  base_damage INTEGER DEFAULT 10,
  slot_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, slot_number)
);

-- Create NPCs table
CREATE TABLE IF NOT EXISTS public.npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  importance_level TEXT DEFAULT 'minor', -- 'major', 'minor', 'quest'
  is_initial BOOLEAN DEFAULT FALSE, -- true for the 10 initial NPCs
  created_by_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, location)
);

-- Create world_context table
CREATE TABLE IF NOT EXISTS public.world_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  location TEXT NOT NULL,
  context_data JSONB NOT NULL, -- stores the current state of the location
  version INTEGER DEFAULT 1,
  last_modified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(region, location)
);

-- Create world_changes table (for tracking and alerting)
CREATE TABLE IF NOT EXISTS public.world_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  location TEXT NOT NULL,
  change_summary TEXT NOT NULL, -- AI-generated summary
  changed_by_player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  changed_by_player_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create player_actions table (for tracking significant actions)
CREATE TABLE IF NOT EXISTS public.player_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'exploration', 'combat', 'interaction', 'world_change'
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  action_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_sessions table (for tracking player journey)
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]', -- stores conversation history
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for player_inventory
CREATE POLICY "Users can view their own inventory" ON public.player_inventory
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert into their own inventory" ON public.player_inventory
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own inventory" ON public.player_inventory
  FOR UPDATE USING (auth.uid() = player_id);

CREATE POLICY "Users can delete from their own inventory" ON public.player_inventory
  FOR DELETE USING (auth.uid() = player_id);

-- RLS Policies for skills
CREATE POLICY "Users can view their own skills" ON public.skills
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own skills" ON public.skills
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own skills" ON public.skills
  FOR UPDATE USING (auth.uid() = player_id);

CREATE POLICY "Users can delete their own skills" ON public.skills
  FOR DELETE USING (auth.uid() = player_id);

-- RLS Policies for player_actions
CREATE POLICY "Users can view their own actions" ON public.player_actions
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own actions" ON public.player_actions
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- RLS Policies for game_sessions
CREATE POLICY "Users can view their own sessions" ON public.game_sessions
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own sessions" ON public.game_sessions
  FOR UPDATE USING (auth.uid() = player_id);

-- Public read access for equipment, npcs, world_context, world_changes
CREATE POLICY "Anyone can view equipment" ON public.equipment
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view NPCs" ON public.npcs
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view world context" ON public.world_context
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view world changes" ON public.world_changes
  FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_player_inventory_player_id ON public.player_inventory(player_id);
CREATE INDEX idx_skills_player_id ON public.skills(player_id);
CREATE INDEX idx_npcs_location ON public.npcs(location, region);
CREATE INDEX idx_world_context_location ON public.world_context(region, location);
CREATE INDEX idx_world_changes_region ON public.world_changes(region, created_at DESC);
CREATE INDEX idx_player_actions_player_id ON public.player_actions(player_id, created_at DESC);
CREATE INDEX idx_game_sessions_player_id ON public.game_sessions(player_id, last_activity_at DESC);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
