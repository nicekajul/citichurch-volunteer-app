-- This script seeds initial data for testing
-- Note: In production, the first admin should be created through sign-up with admin role in metadata

-- Insert teams (check if table exists first)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'teams') then
    insert into public.teams (id, name, description, icon, color) values
      ('11111111-1111-1111-1111-111111111111', 'Broadcast', 'Live streaming and video production team', 'Radio', '#EF4444'),
      ('22222222-2222-2222-2222-222222222222', 'Lights', 'Stage lighting and visual effects team', 'Lightbulb', '#F59E0B'),
      ('33333333-3333-3333-3333-333333333333', 'Media', 'Graphics, slides, and multimedia content team', 'Monitor', '#10B981'),
      ('44444444-4444-4444-4444-444444444444', 'Sounds', 'Audio engineering and sound mixing team', 'Volume2', '#3B82F6'),
      ('55555555-5555-5555-5555-555555555555', 'Stage Design', 'Set design and stage management team', 'Palette', '#8B5CF6'),
      ('66666666-6666-6666-6666-666666666666', 'Cameras', 'Camera operation and video capture team', 'Camera', '#EC4899')
    on conflict (id) do nothing;
  end if;
end $$;

-- Note: Users must be created through Supabase Auth first
-- After users sign up, you can update their profiles with:
-- UPDATE public.profiles SET role = 'admin', team_id = null WHERE email = 'admin@citichurch.com';
-- UPDATE public.profiles SET role = 'leader', team_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'leader@citichurch.com';
