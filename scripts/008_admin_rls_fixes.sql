-- Fix RLS policies for training_modules, training_documents, and quiz_questions
-- so that Admins can view all team-specific trainings as well.

-- training_modules
drop policy if exists "Users can view training modules" on public.training_modules;
create policy "Users can view training modules" on public.training_modules for select using (
  team_id is null or 
  team_id in (select team_id from public.profiles where id = auth.uid()) or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- training_documents
drop policy if exists "Users can view training documents" on public.training_documents;
create policy "Users can view training documents" on public.training_documents for select using (
  training_module_id in (
    select id from public.training_modules 
    where team_id is null or 
          team_id in (select team_id from public.profiles where id = auth.uid()) or
          exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
);

-- quiz_questions
drop policy if exists "Users can view quiz questions" on public.quiz_questions;
create policy "Users can view quiz questions" on public.quiz_questions for select using (
  training_module_id in (
    select id from public.training_modules 
    where team_id is null or 
          team_id in (select team_id from public.profiles where id = auth.uid()) or
          exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
);
