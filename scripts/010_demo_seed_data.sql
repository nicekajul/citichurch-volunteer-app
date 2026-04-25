-- =============================================================================
-- DEMO SEED DATA — Citichurch Volunteer Training App
-- =============================================================================
-- Covers: Users (admin/leader/volunteer), Teams, Training Modules, Documents,
--         Quiz Questions, Training Progress, Announcements, Service Schedules,
--         Assignments (confirmed/declined/pending), Certificates, Ministry Apps
--
-- Password for ALL demo accounts: Demo@1234
--
-- Demo Accounts:
--   admin@citichurch.com             (Admin)
--   leader.broadcast@citichurch.com  (Leader — Broadcast)
--   leader.media@citichurch.com      (Leader — Media)
--   leader.sounds@citichurch.com     (Leader — Sounds)
--   vol.broadcast1@citichurch.com    (Volunteer — Broadcast)
--   vol.broadcast2@citichurch.com    (Volunteer — Broadcast)
--   vol.media1@citichurch.com        (Volunteer — Media)
--   vol.media2@citichurch.com        (Volunteer — Media)
--   vol.sounds1@citichurch.com       (Volunteer — Sounds)
--   vol.lights1@citichurch.com       (Volunteer — Lights)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- STEP 1: AUTH USERS
-- Plain INSERT with ON CONFLICT — avoids DO $$ blocks swallowing errors.
-- Includes all NOT NULL fields required by Supabase's auth.users schema.
-- =============================================================================
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user, is_anonymous,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change_token_new, email_change,
  email_change_token_current, email_change_confirm_status,
  phone_change, phone_change_token
) VALUES
  -- Admin
  ('aaaaaaaa-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'admin@citichurch.com',
   crypt('Demo@1234', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Pastor Admin","role":"admin"}',
   false, false, false,
   now(), now(),
   '', '', '', '', '', 0, '', ''),

  -- Leader — Broadcast
  ('bbbbbbbb-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'leader.broadcast@citichurch.com',
   crypt('Demo@1234', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Marcus Rivera","role":"leader"}',
   false, false, false,
   now(), now(),
   '', '', '', '', '', 0, '', ''),

  -- Leader — Media
  ('bbbbbbbb-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'leader.media@citichurch.com',
   crypt('Demo@1234', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Sofia Chen","role":"leader"}',
   false, false, false,
   now(), now(),
   '', '', '', '', '', 0, '', ''),

  -- Leader — Sounds
  ('bbbbbbbb-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'leader.sounds@citichurch.com',
   crypt('Demo@1234', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"David Kim","role":"leader"}',
   false, false, false,
   now(), now(),
   '', '', '', '', '', 0, '', ''),

  -- Volunteer — Broadcast 1
  ('cccccccc-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'vol.broadcast1@citichurch.com',
   crypt('Demo@1234', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"James Torres","role":"volunteer"}',
   false, false, false,
   now(), now(),
   '', '', '', '', '', 0, '', ''),

  -- Volunteer — Broadcast 2
  ('cccccccc-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'vol.broadcast2@citichurch.com',
   crypt('Demo@1234', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Priya Patel","role":"volunteer"}',
   false, false, false,
   now(), now(),
   '', '', '', '', '', 0, '', ''),

  -- Volunteer — Media 1
  ('cccccccc-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'vol.media1@citichurch.com',
   crypt('Demo@1234', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Anna Nguyen","role":"volunteer"}',
   false, false, false,
   now(), now(),
   '', '', '', '', '', 0, '', ''),

  -- Volunteer — Media 2
  ('cccccccc-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'vol.media2@citichurch.com',
   crypt('Demo@1234', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Liam Johnson","role":"volunteer"}',
   false, false, false,
   now(), now(),
   '', '', '', '', '', 0, '', ''),

  -- Volunteer — Sounds 1
  ('cccccccc-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'vol.sounds1@citichurch.com',
   crypt('Demo@1234', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Rachel Adams","role":"volunteer"}',
   false, false, false,
   now(), now(),
   '', '', '', '', '', 0, '', ''),

  -- Volunteer — Lights 1
  ('cccccccc-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'vol.lights1@citichurch.com',
   crypt('Demo@1234', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Ethan Brooks","role":"volunteer"}',
   false, false, false,
   now(), now(),
   '', '', '', '', '', 0, '', '')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 2: AUTH IDENTITIES (required for email/password login to work)
-- =============================================================================
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'aaaaaaaa-0000-0000-0000-000000000001', 'admin@citichurch.com',
   '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","email":"admin@citichurch.com"}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'bbbbbbbb-0000-0000-0000-000000000001', 'leader.broadcast@citichurch.com',
   '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","email":"leader.broadcast@citichurch.com"}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'bbbbbbbb-0000-0000-0000-000000000002', 'leader.media@citichurch.com',
   '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","email":"leader.media@citichurch.com"}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'bbbbbbbb-0000-0000-0000-000000000003', 'leader.sounds@citichurch.com',
   '{"sub":"bbbbbbbb-0000-0000-0000-000000000003","email":"leader.sounds@citichurch.com"}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'cccccccc-0000-0000-0000-000000000001', 'vol.broadcast1@citichurch.com',
   '{"sub":"cccccccc-0000-0000-0000-000000000001","email":"vol.broadcast1@citichurch.com"}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'cccccccc-0000-0000-0000-000000000002', 'vol.broadcast2@citichurch.com',
   '{"sub":"cccccccc-0000-0000-0000-000000000002","email":"vol.broadcast2@citichurch.com"}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'cccccccc-0000-0000-0000-000000000003', 'vol.media1@citichurch.com',
   '{"sub":"cccccccc-0000-0000-0000-000000000003","email":"vol.media1@citichurch.com"}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'cccccccc-0000-0000-0000-000000000004', 'vol.media2@citichurch.com',
   '{"sub":"cccccccc-0000-0000-0000-000000000004","email":"vol.media2@citichurch.com"}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'cccccccc-0000-0000-0000-000000000005', 'vol.sounds1@citichurch.com',
   '{"sub":"cccccccc-0000-0000-0000-000000000005","email":"vol.sounds1@citichurch.com"}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'cccccccc-0000-0000-0000-000000000006', 'vol.lights1@citichurch.com',
   '{"sub":"cccccccc-0000-0000-0000-000000000006","email":"vol.lights1@citichurch.com"}',
   'email', now(), now(), now())
ON CONFLICT (provider, provider_id) DO NOTHING;

-- =============================================================================
-- STEP 3: PROFILES
-- =============================================================================
INSERT INTO public.profiles (id, email, name, role, team_id, phone, join_date, status) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'admin@citichurch.com',            'Pastor Admin',  'admin',     NULL,                                  '+1 (555) 100-0001', '2024-01-01 00:00:00+00', 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'leader.broadcast@citichurch.com', 'Marcus Rivera', 'leader',    '11111111-1111-1111-1111-111111111111', '+1 (555) 200-0001', '2024-02-15 00:00:00+00', 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'leader.media@citichurch.com',     'Sofia Chen',    'leader',    '33333333-3333-3333-3333-333333333333', '+1 (555) 200-0002', '2024-02-20 00:00:00+00', 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'leader.sounds@citichurch.com',    'David Kim',     'leader',    '44444444-4444-4444-4444-444444444444', '+1 (555) 200-0003', '2024-03-01 00:00:00+00', 'active'),
  ('cccccccc-0000-0000-0000-000000000001', 'vol.broadcast1@citichurch.com',   'James Torres',  'volunteer', '11111111-1111-1111-1111-111111111111', '+1 (555) 300-0001', '2024-04-10 00:00:00+00', 'active'),
  ('cccccccc-0000-0000-0000-000000000002', 'vol.broadcast2@citichurch.com',   'Priya Patel',   'volunteer', '11111111-1111-1111-1111-111111111111', '+1 (555) 300-0002', '2024-05-05 00:00:00+00', 'active'),
  ('cccccccc-0000-0000-0000-000000000003', 'vol.media1@citichurch.com',       'Anna Nguyen',   'volunteer', '33333333-3333-3333-3333-333333333333', '+1 (555) 300-0003', '2024-06-01 00:00:00+00', 'active'),
  ('cccccccc-0000-0000-0000-000000000004', 'vol.media2@citichurch.com',       'Liam Johnson',  'volunteer', '33333333-3333-3333-3333-333333333333', '+1 (555) 300-0004', '2024-07-20 00:00:00+00', 'active'),
  ('cccccccc-0000-0000-0000-000000000005', 'vol.sounds1@citichurch.com',      'Rachel Adams',  'volunteer', '44444444-4444-4444-4444-444444444444', '+1 (555) 300-0005', '2024-08-15 00:00:00+00', 'active'),
  ('cccccccc-0000-0000-0000-000000000006', 'vol.lights1@citichurch.com',      'Ethan Brooks',  'volunteer', '22222222-2222-2222-2222-222222222222', '+1 (555) 300-0006', '2024-09-01 00:00:00+00', 'active')
ON CONFLICT (id) DO UPDATE SET
  name    = EXCLUDED.name,
  role    = EXCLUDED.role,
  team_id = EXCLUDED.team_id,
  phone   = EXCLUDED.phone,
  status  = EXCLUDED.status;

-- =============================================================================
-- STEP 4: UPDATE TEAMS WITH LEADER IDs
-- =============================================================================
UPDATE public.teams SET leader_id = 'bbbbbbbb-0000-0000-0000-000000000001' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE public.teams SET leader_id = 'bbbbbbbb-0000-0000-0000-000000000002' WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE public.teams SET leader_id = 'bbbbbbbb-0000-0000-0000-000000000003' WHERE id = '44444444-4444-4444-4444-444444444444';

-- =============================================================================
-- STEP 5: TRAINING MODULES
-- =============================================================================
INSERT INTO public.training_modules (id, title, description, video_url, duration, team_id, required, quiz_enabled, created_by) VALUES
  -- Global modules (team_id = NULL — visible to all roles)
  ('dddddddd-0000-0000-0000-000000000001',
   'Volunteer Orientation',
   'Welcome to Citichurch! This module covers our mission, values, code of conduct, and what it means to serve on a ministry team.',
   'https://www.youtube.com/embed/dQw4w9WgXcQ',
   20, NULL, true, true,
   'aaaaaaaa-0000-0000-0000-000000000001'),

  ('dddddddd-0000-0000-0000-000000000002',
   'Safety & Emergency Procedures',
   'Learn emergency exit locations, first-aid kit placements, fire drill procedures, and how to handle medical emergencies during service.',
   'https://www.youtube.com/embed/dQw4w9WgXcQ',
   15, NULL, true, true,
   'aaaaaaaa-0000-0000-0000-000000000001'),

  -- Broadcast team modules
  ('dddddddd-0000-0000-0000-000000000003',
   'Broadcast Fundamentals',
   'Introduction to live streaming equipment, OBS Studio setup, camera switching basics, and stream quality management.',
   'https://www.youtube.com/embed/dQw4w9WgXcQ',
   35, '11111111-1111-1111-1111-111111111111', true, true,
   'bbbbbbbb-0000-0000-0000-000000000001'),

  ('dddddddd-0000-0000-0000-000000000004',
   'Advanced Live Streaming',
   'Deep dive into multi-camera production, stream encoding settings, backup systems, and handling on-air technical issues.',
   'https://www.youtube.com/embed/dQw4w9WgXcQ',
   45, '11111111-1111-1111-1111-111111111111', false, true,
   'bbbbbbbb-0000-0000-0000-000000000001'),

  -- Media team modules
  ('dddddddd-0000-0000-0000-000000000005',
   'ProPresenter Essentials',
   'Master slide control for worship lyrics, sermon outlines, and announcements using ProPresenter 7.',
   'https://www.youtube.com/embed/dQw4w9WgXcQ',
   30, '33333333-3333-3333-3333-333333333333', true, true,
   'bbbbbbbb-0000-0000-0000-000000000002'),

  ('dddddddd-0000-0000-0000-000000000006',
   'Graphics & Branding',
   'Creating on-brand graphics for Sunday service, social media templates, and lower-third animations.',
   'https://www.youtube.com/embed/dQw4w9WgXcQ',
   25, '33333333-3333-3333-3333-333333333333', false, false,
   'bbbbbbbb-0000-0000-0000-000000000002'),

  -- Sounds team modules
  ('dddddddd-0000-0000-0000-000000000007',
   'Sound Engineering 101',
   'Fundamentals of audio mixing, microphone placement, gain staging, and EQ for live worship.',
   'https://www.youtube.com/embed/dQw4w9WgXcQ',
   40, '44444444-4444-4444-4444-444444444444', true, true,
   'bbbbbbbb-0000-0000-0000-000000000003'),

  ('dddddddd-0000-0000-0000-000000000008',
   'In-Ear Monitor Mixing',
   'Setting up and mixing personal monitor mixes for musicians using the Aviom or Shure PSM systems.',
   'https://www.youtube.com/embed/dQw4w9WgXcQ',
   30, '44444444-4444-4444-4444-444444444444', false, true,
   'bbbbbbbb-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 6: TRAINING DOCUMENTS
-- =============================================================================
INSERT INTO public.training_documents (training_module_id, name, url, file_type) VALUES
  ('dddddddd-0000-0000-0000-000000000001', 'Volunteer Handbook 2024',        'https://example.com/docs/volunteer-handbook.pdf',      'pdf'),
  ('dddddddd-0000-0000-0000-000000000001', 'Code of Conduct Agreement',      'https://example.com/docs/code-of-conduct.pdf',          'pdf'),
  ('dddddddd-0000-0000-0000-000000000002', 'Emergency Procedures Checklist', 'https://example.com/docs/emergency-checklist.pdf',       'pdf'),
  ('dddddddd-0000-0000-0000-000000000003', 'OBS Studio Setup Guide',         'https://example.com/docs/obs-setup-guide.pdf',           'pdf'),
  ('dddddddd-0000-0000-0000-000000000003', 'Broadcast Equipment Cheatsheet', 'https://example.com/docs/broadcast-cheatsheet.pdf',      'pdf'),
  ('dddddddd-0000-0000-0000-000000000004', 'Stream Encoding Settings',       'https://example.com/docs/stream-encoding.pdf',           'pdf'),
  ('dddddddd-0000-0000-0000-000000000005', 'ProPresenter Quick Start',       'https://example.com/docs/propresenter-quickstart.pdf',   'pdf'),
  ('dddddddd-0000-0000-0000-000000000005', 'Slide Template Library',         'https://example.com/docs/slide-templates.zip',           'zip'),
  ('dddddddd-0000-0000-0000-000000000007', 'Mixing Board Layout Map',        'https://example.com/docs/mixing-board-map.pdf',          'pdf'),
  ('dddddddd-0000-0000-0000-000000000007', 'Audio Signal Flow Diagram',      'https://example.com/docs/signal-flow.pdf',               'pdf')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 7: QUIZ QUESTIONS
-- =============================================================================
INSERT INTO public.quiz_questions (training_module_id, question, options, correct_answer, order_index) VALUES
  -- Volunteer Orientation
  ('dddddddd-0000-0000-0000-000000000001',
   'What is the primary mission of Citichurch''s volunteer ministry?',
   '["To put on the best production possible","To serve others and glorify God through our gifts","To gain technical skills for a career","To earn community service hours"]',
   'To serve others and glorify God through our gifts', 1),
  ('dddddddd-0000-0000-0000-000000000001',
   'How early should volunteers arrive before Sunday service?',
   '["15 minutes","30 minutes","45 minutes","1 hour"]',
   '45 minutes', 2),
  ('dddddddd-0000-0000-0000-000000000001',
   'What should you do if you cannot make your scheduled service?',
   '["Just don''t show up","Post in the team group chat","Notify your team leader at least 48 hours in advance","Email the church office"]',
   'Notify your team leader at least 48 hours in advance', 3),

  -- Safety & Emergency Procedures
  ('dddddddd-0000-0000-0000-000000000002',
   'Where is the nearest first-aid kit located in the tech booth?',
   '["Under the mixing desk","In the top-left cabinet","In the hallway outside the booth","In the senior pastor''s office"]',
   'In the top-left cabinet', 1),
  ('dddddddd-0000-0000-0000-000000000002',
   'During a fire drill, what is the correct procedure for volunteers?',
   '["Stay at your post until the pastor signals","Immediately leave equipment and proceed to the nearest exit","Power down all equipment before leaving","Wait for an usher to escort you"]',
   'Immediately leave equipment and proceed to the nearest exit', 2),

  -- Broadcast Fundamentals
  ('dddddddd-0000-0000-0000-000000000003',
   'Which software is primarily used for live streaming at Citichurch?',
   '["Wirecast","vMix","OBS Studio","Streamlabs"]',
   'OBS Studio', 1),
  ('dddddddd-0000-0000-0000-000000000003',
   'What is the recommended bitrate for our Sunday live stream?',
   '["1000 kbps","3000 kbps","6000 kbps","10000 kbps"]',
   '6000 kbps', 2),
  ('dddddddd-0000-0000-0000-000000000003',
   'If the stream drops mid-service, what is the first step?',
   '["Panic and call the IT team","Check the internet connection and restart the stream","Switch to a phone backup immediately","Announce it to the congregation"]',
   'Check the internet connection and restart the stream', 3),

  -- ProPresenter Essentials
  ('dddddddd-0000-0000-0000-000000000005',
   'What keyboard shortcut clears the screen (black) in ProPresenter?',
   '["Escape","F1","Ctrl+B","Spacebar"]',
   'Escape', 1),
  ('dddddddd-0000-0000-0000-000000000005',
   'How do you advance to the next slide during worship?',
   '["Click with the mouse","Press the Right Arrow or Page Down key","Press Enter","Press Spacebar"]',
   'Press the Right Arrow or Page Down key', 2),

  -- Sound Engineering 101
  ('dddddddd-0000-0000-0000-000000000007',
   'What does "gain staging" refer to in audio mixing?',
   '["Adjusting the master volume fader","Setting proper signal levels at each point in the signal chain","Adding reverb to vocals","Tuning the equalizer frequencies"]',
   'Setting proper signal levels at each point in the signal chain', 1),
  ('dddddddd-0000-0000-0000-000000000007',
   'Which frequency range is most important for vocal clarity?',
   '["20-200 Hz (sub-bass)","200-800 Hz (bass/warmth)","2-5 kHz (presence/clarity)","10-20 kHz (air)"]',
   '2-5 kHz (presence/clarity)', 2),
  ('dddddddd-0000-0000-0000-000000000007',
   'What is the purpose of a noise gate on a microphone channel?',
   '["Boost the microphone signal","Reduce background noise when the mic is not in use","Add reverb automatically","Protect the speakers from feedback"]',
   'Reduce background noise when the mic is not in use', 3),

  -- In-Ear Monitor Mixing
  ('dddddddd-0000-0000-0000-000000000008',
   'What is the primary risk of improper in-ear monitor levels?',
   '["Feedback in the main speakers","Permanent hearing damage to the musician","Poor sound quality for the congregation","Monitor signal bleeding into the microphone"]',
   'Permanent hearing damage to the musician', 1)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 8: TRAINING PROGRESS (varied statuses for demo)
-- =============================================================================
INSERT INTO public.training_progress (user_id, training_module_id, status, progress, quiz_score, quiz_attempts, completed_at) VALUES
  -- James Torres — completed orientation + broadcast basics, in progress advanced
  ('cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', 'completed',  100, 100, 1, '2024-04-15 10:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000002', 'completed',  100,  87, 2, '2024-04-16 11:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000003', 'completed',  100,  93, 1, '2024-05-01 14:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000004', 'in_progress', 60, NULL, 0, NULL),

  -- Priya Patel — orientation done, broadcast in progress
  ('cccccccc-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000001', 'completed',  100,  80, 1, '2024-05-08 09:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000002', 'completed',  100,  93, 1, '2024-05-09 10:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000003', 'in_progress', 40, NULL, 0, NULL),

  -- Anna Nguyen — completed everything for media team
  ('cccccccc-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000001', 'completed',  100, 100, 1, '2024-06-05 08:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000002', 'completed',  100,  93, 1, '2024-06-06 09:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000005', 'completed',  100,  87, 1, '2024-06-10 14:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000006', 'completed',  100, NULL, 0, '2024-06-20 16:00:00+00'),

  -- Liam Johnson — orientation done, media modules in progress
  ('cccccccc-0000-0000-0000-000000000004', 'dddddddd-0000-0000-0000-000000000001', 'completed',  100,  73, 2, '2024-07-25 10:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000004', 'dddddddd-0000-0000-0000-000000000002', 'in_progress', 50, NULL, 0, NULL),
  ('cccccccc-0000-0000-0000-000000000004', 'dddddddd-0000-0000-0000-000000000005', 'in_progress', 25, NULL, 0, NULL),

  -- Rachel Adams — completed orientation + sound module, in progress IEM
  ('cccccccc-0000-0000-0000-000000000005', 'dddddddd-0000-0000-0000-000000000001', 'completed',  100,  87, 1, '2024-08-18 09:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000005', 'dddddddd-0000-0000-0000-000000000002', 'completed',  100, 100, 1, '2024-08-19 10:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000005', 'dddddddd-0000-0000-0000-000000000007', 'completed',  100,  80, 1, '2024-09-01 14:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000005', 'dddddddd-0000-0000-0000-000000000008', 'in_progress', 70, NULL, 0, NULL),

  -- Ethan Brooks — just started orientation
  ('cccccccc-0000-0000-0000-000000000006', 'dddddddd-0000-0000-0000-000000000001', 'in_progress', 30, NULL, 0, NULL)
ON CONFLICT (user_id, training_module_id) DO UPDATE SET
  status        = EXCLUDED.status,
  progress      = EXCLUDED.progress,
  quiz_score    = EXCLUDED.quiz_score,
  quiz_attempts = EXCLUDED.quiz_attempts,
  completed_at  = EXCLUDED.completed_at;

-- =============================================================================
-- STEP 9: ANNOUNCEMENTS
-- =============================================================================
INSERT INTO public.announcements (id, title, content, priority, author_id, team_id, created_at) VALUES
  ('ffffffff-0000-0000-0000-000000000001',
   'Easter Sunday — All Hands on Deck',
   'Easter Sunday (April 20) is our biggest service of the year. ALL volunteers are required to arrive by 7:00 AM. This is a mandatory service — please confirm your attendance with your team leader by Wednesday.',
   'urgent', 'aaaaaaaa-0000-0000-0000-000000000001', NULL, NOW() - INTERVAL '2 days'),

  ('ffffffff-0000-0000-0000-000000000002',
   'New Volunteer Orientation This Saturday',
   'We have 4 new volunteers joining the team this Saturday at 10 AM. Please make them feel welcome! Team leaders, ensure your onboarding materials are ready.',
   'high', 'aaaaaaaa-0000-0000-0000-000000000001', NULL, NOW() - INTERVAL '4 days'),

  ('ffffffff-0000-0000-0000-000000000003',
   'OBS Studio Updated to v31',
   'The broadcast laptop has been updated to OBS Studio v31. The interface has minor changes — please review the updated setup guide in the Training section before your next service.',
   'normal', 'bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '6 days'),

  ('ffffffff-0000-0000-0000-000000000004',
   'New Sermon Series Slide Templates Ready',
   'The new "Rooted" sermon series templates are now available in the shared Google Drive. Please use these starting May 4. Link is in the team resources folder.',
   'normal', 'bbbbbbbb-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '8 days'),

  ('ffffffff-0000-0000-0000-000000000005',
   'New Wireless Mic System Installed',
   'We have upgraded to the Shure Axient Digital system. David will conduct a brief training session this Friday at 6 PM in the auditorium. All sounds team members should attend.',
   'high', 'bbbbbbbb-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '3 days'),

  ('ffffffff-0000-0000-0000-000000000006',
   'Volunteer Appreciation Dinner — May 17',
   'You''re invited! Our annual Volunteer Appreciation Dinner will be held on Friday, May 17 at 6:30 PM in the fellowship hall. RSVP to the church office by May 10.',
   'low', 'aaaaaaaa-0000-0000-0000-000000000001', NULL, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 10: SERVICE SCHEDULES
-- =============================================================================
INSERT INTO public.service_schedules (id, service_name, service_date, notes, created_by) VALUES
  -- Past service (completed)
  ('eeeeeeee-0000-0000-0000-000000000001',
   'Sunday Morning Service',
   '2026-04-05 09:00:00+00',
   'Regular Sunday service. Guest speaker: Pastor John. Worship set: 4 songs.',
   'aaaaaaaa-0000-0000-0000-000000000001'),

  -- This week (mix of confirmed and pending)
  ('eeeeeeee-0000-0000-0000-000000000002',
   'Sunday Morning Service',
   '2026-04-13 09:00:00+00',
   'Regular Sunday service. Easter week warm-up.',
   'aaaaaaaa-0000-0000-0000-000000000001'),

  -- Easter Sunday (big event)
  ('eeeeeeee-0000-0000-0000-000000000003',
   'Easter Sunday Service',
   '2026-04-20 07:00:00+00',
   'Easter Sunday — Early call time 7 AM. Full production. All teams required. Two services: 9 AM and 11 AM.',
   'aaaaaaaa-0000-0000-0000-000000000001'),

  -- Two weeks out
  ('eeeeeeee-0000-0000-0000-000000000004',
   'Sunday Morning Service',
   '2026-04-27 09:00:00+00',
   'Regular Sunday service. First week of new "Rooted" sermon series.',
   'aaaaaaaa-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 11: SCHEDULE ASSIGNMENTS
-- =============================================================================
INSERT INTO public.schedule_assignments (schedule_id, user_id, team_id, role, status) VALUES
  -- Past service (April 5) — all completed
  ('eeeeeeee-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Live Stream Operator',    'completed'),
  ('eeeeeeee-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Camera Switcher',         'completed'),
  ('eeeeeeee-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Slides Operator',         'completed'),
  ('eeeeeeee-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 'Front of House Engineer', 'completed'),
  ('eeeeeeee-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Lighting Operator',       'completed'),

  -- This week (April 13) — confirmed, assigned, confirmed, confirmed, assigned
  ('eeeeeeee-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Live Stream Operator',    'confirmed'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Camera Switcher',         'assigned'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Slides Operator',         'confirmed'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 'Front of House Engineer', 'confirmed'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Lighting Operator',       'assigned'),

  -- Easter Sunday (April 20) — mix of confirmed and pending
  ('eeeeeeee-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Lead Stream Operator',    'confirmed'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Backup Stream Operator',  'assigned'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Lead Slides Operator',    'confirmed'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'Graphics Support',        'assigned'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 'Front of House Engineer', 'assigned'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Lighting Operator',       'assigned'),

  -- Two weeks out (April 27) — one declined with reason
  ('eeeeeeee-0000-0000-0000-000000000004', 'cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Live Stream Operator',    'assigned'),
  ('eeeeeeee-0000-0000-0000-000000000004', 'cccccccc-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Camera Switcher',         'declined'),
  ('eeeeeeee-0000-0000-0000-000000000004', 'cccccccc-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Slides Operator',         'assigned'),
  ('eeeeeeee-0000-0000-0000-000000000004', 'cccccccc-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 'Front of House Engineer', 'confirmed')
ON CONFLICT (schedule_id, user_id) DO NOTHING;

-- Add rejection reason for Priya's decline on April 27
UPDATE public.schedule_assignments
SET rejection_reason = 'I will be out of town that weekend for a family event. Sorry for the inconvenience!'
WHERE schedule_id = 'eeeeeeee-0000-0000-0000-000000000004'
  AND user_id     = 'cccccccc-0000-0000-0000-000000000002';

-- =============================================================================
-- STEP 12: CERTIFICATES
-- =============================================================================
INSERT INTO public.certificates (user_id, training_module_id, certificate_number, issued_date) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', 'CERT-2024-VOL-001', '2024-04-15 10:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000003', 'CERT-2024-BRD-001', '2024-05-01 14:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000001', 'CERT-2024-VOL-002', '2024-05-08 09:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000001', 'CERT-2024-VOL-003', '2024-06-05 08:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000005', 'CERT-2024-MED-001', '2024-06-10 14:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000004', 'dddddddd-0000-0000-0000-000000000001', 'CERT-2024-VOL-004', '2024-07-25 10:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000005', 'dddddddd-0000-0000-0000-000000000001', 'CERT-2024-VOL-005', '2024-08-18 09:00:00+00'),
  ('cccccccc-0000-0000-0000-000000000005', 'dddddddd-0000-0000-0000-000000000007', 'CERT-2024-SND-001', '2024-09-01 14:00:00+00')
ON CONFLICT (certificate_number) DO NOTHING;

-- =============================================================================
-- STEP 13: MINISTRY APPLICATIONS (public non-member submissions)
-- =============================================================================
INSERT INTO public.ministry_applications (
  id, applicant_id, team_id,
  applicant_name, applicant_email, applicant_phone,
  motivation, experience, availability, status,
  reviewed_by, review_notes, created_at
) VALUES
  -- Pending
  ('00000000-aaaa-0000-0000-aaaaaaaaaaaa',
   NULL, '11111111-1111-1111-1111-111111111111',
   'Tyler Moreau', 'tyler.moreau@email.com', '+1 (555) 401-0001',
   'I have been attending Citichurch for 6 months and feel called to serve in the broadcast ministry. I love technology and want to use my skills to help share the gospel online.',
   'I have 2 years of video production experience from my college media club. Familiar with OBS Studio and basic camera operation.',
   ARRAY['Sunday Morning', 'Saturday Rehearsal'],
   'pending', NULL, NULL, NOW() - INTERVAL '3 days'),

  -- Approved
  ('00000000-bbbb-0000-0000-bbbbbbbbbbbb',
   NULL, '33333333-3333-3333-3333-333333333333',
   'Michelle Park', 'michelle.park@email.com', '+1 (555) 401-0002',
   'I am a graphic designer by profession and attend the 11 AM service. I would love to contribute my design skills to help create visuals that enhance worship.',
   '5 years of professional graphic design experience using Adobe Creative Suite. Created church flyers and social media posts informally in the past.',
   ARRAY['Sunday Morning', 'Weekday Evening'],
   'approved', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Great background in design! Approved to join the Media team. Sofia (leader.media) will reach out with onboarding details.',
   NOW() - INTERVAL '14 days'),

  -- Rejected
  ('00000000-cccc-0000-0000-cccccccccccc',
   NULL, '44444444-4444-4444-4444-444444444444',
   'Brandon Cruz', 'brandon.cruz@email.com', '+1 (555) 401-0003',
   'I want to learn audio engineering and think serving at church would be a great way to start.',
   'No prior experience with audio equipment, but I am a quick learner and willing to attend all training sessions.',
   ARRAY['Sunday Morning'],
   'rejected', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Thank you for applying! At this time we are looking for volunteers with some audio background. We encourage you to complete the Sound Engineering 101 training module in the app and reapply next quarter.',
   NOW() - INTERVAL '21 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
SELECT
  (SELECT COUNT(*) FROM auth.users              WHERE email LIKE '%@citichurch.com') AS demo_auth_users,
  (SELECT COUNT(*) FROM public.profiles)                                              AS profiles,
  (SELECT COUNT(*) FROM public.teams)                                                 AS teams,
  (SELECT COUNT(*) FROM public.training_modules)                                      AS training_modules,
  (SELECT COUNT(*) FROM public.training_documents)                                    AS training_documents,
  (SELECT COUNT(*) FROM public.quiz_questions)                                        AS quiz_questions,
  (SELECT COUNT(*) FROM public.training_progress)                                     AS training_progress,
  (SELECT COUNT(*) FROM public.announcements)                                         AS announcements,
  (SELECT COUNT(*) FROM public.service_schedules)                                     AS service_schedules,
  (SELECT COUNT(*) FROM public.schedule_assignments)                                  AS schedule_assignments,
  (SELECT COUNT(*) FROM public.certificates)                                          AS certificates,
  (SELECT COUNT(*) FROM public.ministry_applications)                                 AS ministry_applications;
