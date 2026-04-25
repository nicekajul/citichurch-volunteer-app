-- Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'leader', 'volunteer')),
  team_id uuid,
  avatar_url text,
  phone text,
  join_date timestamptz default now(),
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create teams table
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  leader_id uuid references public.profiles(id) on delete set null,
  icon text,
  color text default '#6B7280',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add foreign key to profiles after teams table exists
alter table public.profiles
  add constraint profiles_team_id_fkey
  foreign key (team_id)
  references public.teams(id)
  on delete set null;

-- Create training_modules table
create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text,
  duration integer, -- in minutes
  team_id uuid references public.teams(id) on delete cascade,
  required boolean default false,
  quiz_enabled boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create training_documents table
create table if not exists public.training_documents (
  id uuid primary key default gen_random_uuid(),
  training_module_id uuid not null references public.training_modules(id) on delete cascade,
  name text not null,
  url text not null,
  file_type text,
  created_at timestamptz default now()
);

-- Create quiz_questions table
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  training_module_id uuid not null references public.training_modules(id) on delete cascade,
  question text not null,
  options jsonb not null, -- array of options
  correct_answer text not null,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Create training_progress table
create table if not exists public.training_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  training_module_id uuid not null references public.training_modules(id) on delete cascade,
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  progress integer default 0, -- percentage
  quiz_score integer,
  quiz_attempts integer default 0,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, training_module_id)
);

-- Create announcements table
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  author_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create service_schedules table
create table if not exists public.service_schedules (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  service_date timestamptz not null,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create schedule_assignments table
create table if not exists public.schedule_assignments (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.service_schedules(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  role text not null,
  status text default 'assigned' check (status in ('assigned', 'confirmed', 'declined', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(schedule_id, user_id)
);

-- Create certificates table
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  training_module_id uuid not null references public.training_modules(id) on delete cascade,
  certificate_number text unique not null,
  issued_date timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.training_modules enable row level security;
alter table public.training_documents enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.training_progress enable row level security;
alter table public.announcements enable row level security;
alter table public.service_schedules enable row level security;
alter table public.schedule_assignments enable row level security;
alter table public.certificates enable row level security;

-- Profiles policies
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can insert profiles" on public.profiles for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete profiles" on public.profiles for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Teams policies
create policy "Users can view all teams" on public.teams for select using (true);
create policy "Admins can manage teams" on public.teams for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Training modules policies
create policy "Users can view training modules" on public.training_modules for select using (
  team_id is null or 
  team_id in (select team_id from public.profiles where id = auth.uid())
);
create policy "Admins and leaders can create training" on public.training_modules for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
);
create policy "Admins and leaders can update training" on public.training_modules for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
);
create policy "Admins can delete training" on public.training_modules for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Training documents policies
create policy "Users can view training documents" on public.training_documents for select using (
  training_module_id in (
    select id from public.training_modules 
    where team_id is null or team_id in (select team_id from public.profiles where id = auth.uid())
  )
);
create policy "Admins and leaders can manage documents" on public.training_documents for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
);

-- Quiz questions policies (same as training modules)
create policy "Users can view quiz questions" on public.quiz_questions for select using (
  training_module_id in (
    select id from public.training_modules 
    where team_id is null or team_id in (select team_id from public.profiles where id = auth.uid())
  )
);
create policy "Admins and leaders can manage quiz questions" on public.quiz_questions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
);

-- Training progress policies
create policy "Users can view own progress" on public.training_progress for select using (auth.uid() = user_id);
create policy "Users can create own progress" on public.training_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on public.training_progress for update using (auth.uid() = user_id);
create policy "Leaders can view team progress" on public.training_progress for select using (
  exists (
    select 1 from public.profiles p1
    join public.profiles p2 on p1.team_id = p2.team_id
    where p1.id = auth.uid() and p1.role = 'leader' and p2.id = training_progress.user_id
  )
);

-- Announcements policies
create policy "Users can view announcements" on public.announcements for select using (
  team_id is null or 
  team_id in (select team_id from public.profiles where id = auth.uid())
);
create policy "Admins and leaders can create announcements" on public.announcements for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
);
create policy "Authors can update own announcements" on public.announcements for update using (auth.uid() = author_id);
create policy "Authors can delete own announcements" on public.announcements for delete using (auth.uid() = author_id);

-- Service schedules policies
create policy "Users can view schedules" on public.service_schedules for select using (true);
create policy "Admins and leaders can create schedules" on public.service_schedules for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
);
create policy "Admins and leaders can update schedules" on public.service_schedules for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
);
create policy "Admins can delete schedules" on public.service_schedules for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Schedule assignments policies
create policy "Users can view all assignments" on public.schedule_assignments for select using (true);
create policy "Admins and leaders can create assignments" on public.schedule_assignments for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
);
create policy "Admins and leaders can update assignments" on public.schedule_assignments for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
);
create policy "Admins and leaders can delete assignments" on public.schedule_assignments for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'leader'))
);

-- Certificates policies
create policy "Users can view own certificates" on public.certificates for select using (auth.uid() = user_id);
create policy "Admins can manage certificates" on public.certificates for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Create indexes for better performance
create index if not exists profiles_team_id_idx on public.profiles(team_id);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists teams_leader_id_idx on public.teams(leader_id);
create index if not exists training_modules_team_id_idx on public.training_modules(team_id);
create index if not exists training_progress_user_id_idx on public.training_progress(user_id);
create index if not exists training_progress_training_module_id_idx on public.training_progress(training_module_id);
create index if not exists announcements_team_id_idx on public.announcements(team_id);
create index if not exists schedule_assignments_schedule_id_idx on public.schedule_assignments(schedule_id);
create index if not exists schedule_assignments_user_id_idx on public.schedule_assignments(user_id);
