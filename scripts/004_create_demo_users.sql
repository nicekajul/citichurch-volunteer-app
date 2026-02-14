-- Create demo users for testing
-- Note: These users need to be created through Supabase Auth
-- This script shows how to manually update profiles after users are created

-- Instructions:
-- 1. Users must first sign up through the app or Supabase Dashboard
-- 2. Then run these updates to assign roles and teams

-- Update admin user
-- UPDATE public.profiles 
-- SET role = 'admin', team_id = null 
-- WHERE email = 'admin@citichurch.com';

-- Update team leader user
-- UPDATE public.profiles 
-- SET role = 'leader', team_id = '11111111-1111-1111-1111-111111111111' 
-- WHERE email = 'leader@citichurch.com';

-- Update volunteer user
-- UPDATE public.profiles 
-- SET role = 'volunteer', team_id = '11111111-1111-1111-1111-111111111111' 
-- WHERE email = 'volunteer@citichurch.com';

-- Also update teams to set leaders
-- UPDATE public.teams 
-- SET leader_id = (SELECT id FROM public.profiles WHERE email = 'leader@citichurch.com' LIMIT 1)
-- WHERE id = '11111111-1111-1111-1111-111111111111';

-- For production: Create your first admin user through signup,
-- then manually promote them to admin in the database:
SELECT 'Demo users need to be created through Supabase Auth first' as note;
