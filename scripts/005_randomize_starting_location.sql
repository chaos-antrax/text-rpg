-- Update the trigger to randomize starting location
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  random_location TEXT;
  random_region TEXT;
  starting_locations TEXT[][] := ARRAY[
    ARRAY['Rivershade', 'Eryndor'],
    ARRAY['Aurelia', 'Eryndor'],
    ARRAY['Frosthelm', 'Skaldor Peaks'],
    ARRAY['Blackroot', 'Valtheris Marshes'],
    ARRAY['Kethra', 'Ashen Wastes'],
    ARRAY['Moonveil Port', 'Nytheris Isles']
  ];
  random_index INTEGER;
BEGIN
  -- Pick a random starting location
  random_index := floor(random() * 6 + 1)::INTEGER;
  random_location := starting_locations[random_index][1];
  random_region := starting_locations[random_index][2];
  
  INSERT INTO public.profiles (id, display_name, current_location, current_region)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    random_location,
    random_region
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
