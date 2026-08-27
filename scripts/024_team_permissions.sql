-- ── Delegated Team Permissions ───────────────────────────────────────────────
-- Lets a team leader hand off specific responsibilities to a trusted team
-- member instead of doing everything themselves: managing the schedule,
-- managing training modules, approving/declining completed trainings, and
-- posting announcements.
--
-- Design: one row per (user, team, permission). A leader grants/revokes rows
-- for members of their own team; admins can grant for any team. All the
-- policies below are additive — they sit alongside the existing
-- admin/leader-only policies (RLS policies for the same command are OR'd
-- together), so nothing already working can regress.

CREATE TABLE IF NOT EXISTS public.team_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN ('schedule', 'training', 'approvals', 'announcements')),
  granted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, team_id, permission)
);

CREATE INDEX IF NOT EXISTS team_permissions_user_id_idx ON public.team_permissions(user_id);
CREATE INDEX IF NOT EXISTS team_permissions_team_id_idx ON public.team_permissions(team_id);

ALTER TABLE public.team_permissions ENABLE ROW LEVEL SECURITY;

-- Visible to: the member themselves, their team's leader, and admins
CREATE POLICY "team_permissions_select" ON public.team_permissions FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (
    SELECT 1 FROM public.profiles ldr
    WHERE ldr.id = auth.uid() AND ldr.role = 'leader' AND ldr.team_id = team_permissions.team_id
  )
);

-- Grantable by: the team's own leader (only for members of that same team), or an admin
CREATE POLICY "team_permissions_insert" ON public.team_permissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (
    SELECT 1 FROM public.profiles ldr
    WHERE ldr.id = auth.uid() AND ldr.role = 'leader' AND ldr.team_id = team_permissions.team_id
      AND EXISTS (
        SELECT 1 FROM public.profiles mbr
        WHERE mbr.id = team_permissions.user_id AND mbr.team_id = ldr.team_id
      )
  )
);

-- Revocable by: the team's own leader, or an admin
CREATE POLICY "team_permissions_delete" ON public.team_permissions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (
    SELECT 1 FROM public.profiles ldr
    WHERE ldr.id = auth.uid() AND ldr.role = 'leader' AND ldr.team_id = team_permissions.team_id
  )
);

-- ── Training modules (+ documents, quiz questions) ──────────────────────────
CREATE POLICY "training_modules_insert_delegated" ON public.training_modules FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_permissions tp
    WHERE tp.user_id = auth.uid() AND tp.permission = 'training' AND tp.team_id = training_modules.team_id
  )
);
CREATE POLICY "training_modules_update_delegated" ON public.training_modules FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.team_permissions tp
    WHERE tp.user_id = auth.uid() AND tp.permission = 'training' AND tp.team_id = training_modules.team_id
  )
);

CREATE POLICY "training_documents_delegated" ON public.training_documents FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.training_modules tm
    JOIN public.team_permissions tp ON tp.team_id = tm.team_id AND tp.permission = 'training' AND tp.user_id = auth.uid()
    WHERE tm.id = training_documents.training_module_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.training_modules tm
    JOIN public.team_permissions tp ON tp.team_id = tm.team_id AND tp.permission = 'training' AND tp.user_id = auth.uid()
    WHERE tm.id = training_documents.training_module_id
  )
);

CREATE POLICY "quiz_questions_delegated" ON public.quiz_questions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.training_modules tm
    JOIN public.team_permissions tp ON tp.team_id = tm.team_id AND tp.permission = 'training' AND tp.user_id = auth.uid()
    WHERE tm.id = quiz_questions.training_module_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.training_modules tm
    JOIN public.team_permissions tp ON tp.team_id = tm.team_id AND tp.permission = 'training' AND tp.user_id = auth.uid()
    WHERE tm.id = quiz_questions.training_module_id
  )
);

-- ── Schedule / roster ─────────────────────────────────────────────────────────
-- service_schedules has no team_id of its own (a service can span several
-- teams' assignments), so — matching the existing admin/leader policies —
-- delegated access here is gated on holding the 'schedule' permission for
-- any team, same looseness the app already relies on for leaders.
CREATE POLICY "service_schedules_insert_delegated" ON public.service_schedules FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.team_permissions WHERE user_id = auth.uid() AND permission = 'schedule')
);
CREATE POLICY "service_schedules_update_delegated" ON public.service_schedules FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.team_permissions WHERE user_id = auth.uid() AND permission = 'schedule')
);

CREATE POLICY "schedule_assignments_insert_delegated" ON public.schedule_assignments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_permissions tp
    WHERE tp.user_id = auth.uid() AND tp.permission = 'schedule' AND tp.team_id = schedule_assignments.team_id
  )
);
CREATE POLICY "schedule_assignments_update_delegated" ON public.schedule_assignments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.team_permissions tp
    WHERE tp.user_id = auth.uid() AND tp.permission = 'schedule' AND tp.team_id = schedule_assignments.team_id
  )
);
CREATE POLICY "schedule_assignments_delete_delegated" ON public.schedule_assignments FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.team_permissions tp
    WHERE tp.user_id = auth.uid() AND tp.permission = 'schedule' AND tp.team_id = schedule_assignments.team_id
  )
);

-- ── Training progress approvals ──────────────────────────────────────────────
CREATE POLICY "progress_select_delegated" ON public.training_progress FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_permissions tp
    JOIN public.profiles mbr ON mbr.id = training_progress.user_id AND mbr.team_id = tp.team_id
    WHERE tp.user_id = auth.uid() AND tp.permission = 'approvals'
  )
);
CREATE POLICY "progress_update_delegated" ON public.training_progress FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.team_permissions tp
    JOIN public.profiles mbr ON mbr.id = training_progress.user_id AND mbr.team_id = tp.team_id
    WHERE tp.user_id = auth.uid() AND tp.permission = 'approvals'
  )
);

-- ── Announcements ─────────────────────────────────────────────────────────────
CREATE POLICY "announcements_insert_delegated" ON public.announcements FOR INSERT WITH CHECK (
  team_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.team_permissions tp
    WHERE tp.user_id = auth.uid() AND tp.permission = 'announcements' AND tp.team_id = announcements.team_id
  )
);
