-- ── Training Progress Approval ───────────────────────────────────────────────
-- Problem: the leader dashboard's "Approve" button called
--   update training_progress set status = 'approved' ...
-- but the status column's CHECK constraint only allows
--   ('not_started', 'in_progress', 'completed'), and there was no UPDATE policy
-- letting a leader/admin touch another user's row at all. The write silently
-- no-op'd (PostgREST still returns 204), so approvals never actually persisted
-- and "who approved this" had nowhere to be recorded.
-- Fix: track approval in its own columns, independent of status, and add the
-- UPDATE policies needed to set them.

ALTER TABLE public.training_progress
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Leaders can update training_progress rows belonging to members of their own team
CREATE POLICY "progress_update_leader_team"
  ON public.training_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS ldr
      WHERE ldr.id = auth.uid()
        AND ldr.role = 'leader'
        AND EXISTS (
          SELECT 1 FROM public.profiles AS mbr
          WHERE mbr.id = training_progress.user_id
            AND mbr.team_id = ldr.team_id
        )
    )
  );

-- Admins can update any training_progress row
CREATE POLICY "progress_update_admin"
  ON public.training_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
