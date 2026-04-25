-- Add rejection_reason column to schedule_assignments
ALTER TABLE public.schedule_assignments
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Allow volunteers to update their OWN assignment status (to confirm or decline)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'schedule_assignments'
      AND policyname = 'Volunteers can respond to own assignments'
  ) THEN
    CREATE POLICY "Volunteers can respond to own assignments"
      ON public.schedule_assignments
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
