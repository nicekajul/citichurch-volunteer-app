-- Adds a draft/published/archived lifecycle to training modules, so admins
-- and leaders can stage content before it's visible to volunteers, and
-- retire old modules without deleting their history (progress, quizzes,
-- certificate links).
--
-- All existing modules default to 'published' so nothing currently visible
-- to volunteers disappears when this runs.

ALTER TABLE public.training_modules
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published', 'archived'));
