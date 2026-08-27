-- Replace the production ministry team roster with the current set of 10 teams.
-- Existing teams are renamed/updated in place (preserving id, leader_id, and member
-- assignments) where a reasonable equivalent exists; the rest are net-new inserts.

-- Broadcast -> Broadcast (unchanged, keep existing members/leader)
update public.teams set
  description = 'Live streaming and video broadcast team',
  icon = 'Radio',
  color = '#EF4444'
where id = '11111111-1111-1111-1111-111111111111';

-- Lights -> Lights (unchanged)
update public.teams set
  description = 'Stage lighting and visual effects team',
  icon = 'Lightbulb',
  color = '#F59E0B'
where id = '22222222-2222-2222-2222-222222222222';

-- Media -> Media & Display
update public.teams set
  name = 'Media & Display',
  description = 'Slides, screens, and on-site display content team',
  icon = 'Monitor',
  color = '#10B981'
where id = '33333333-3333-3333-3333-333333333333';

-- Sounds -> Audio
update public.teams set
  name = 'Audio',
  description = 'Audio engineering and sound mixing team',
  icon = 'Volume2',
  color = '#3B82F6'
where id = '44444444-4444-4444-4444-444444444444';

-- Stage Design -> Stage Management
update public.teams set
  name = 'Stage Management',
  description = 'Set design, staging, and show-flow management team',
  icon = 'Theater',
  color = '#8B5CF6'
where id = '55555555-5555-5555-5555-555555555555';

-- Cameras -> Photography & Documentation
update public.teams set
  name = 'Photography & Documentation',
  description = 'Event photography and documentation team',
  icon = 'Camera',
  color = '#EC4899'
where id = '66666666-6666-6666-6666-666666666666';

-- New teams
insert into public.teams (id, name, description, icon, color) values
  ('77777777-7777-7777-7777-777777777777', 'Worship', 'Worship team leading music and praise', 'Music', '#14B8A6'),
  ('88888888-8888-8888-8888-888888888888', 'Graphic Design & Layouts', 'Graphics, layouts, and visual design team', 'PenTool', '#F97316'),
  ('99999999-9999-9999-9999-999999999999', 'Citichamp (Children''s Church)', 'Children''s Church production team', 'Baby', '#22C55E'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Website Development', 'Website and web application development team', 'Globe', '#6366F1')
on conflict (id) do nothing;
