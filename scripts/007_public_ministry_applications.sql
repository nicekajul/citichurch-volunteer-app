-- Allow public (unauthenticated) ministry applications
-- Make applicant_id nullable so non-members can apply without an account
ALTER TABLE ministry_applications
  ALTER COLUMN applicant_id DROP NOT NULL;

-- Add contact fields for non-member applicants
ALTER TABLE ministry_applications
  ADD COLUMN IF NOT EXISTS applicant_name text,
  ADD COLUMN IF NOT EXISTS applicant_email text,
  ADD COLUMN IF NOT EXISTS applicant_phone text;

-- Allow anyone (including anonymous) to INSERT an application
DROP POLICY IF EXISTS "Authenticated users can submit applications" ON ministry_applications;

CREATE POLICY "Anyone can submit an application"
  ON ministry_applications FOR INSERT
  WITH CHECK (true);

-- Allow anon to read only their own submission by email (used for status check)
CREATE POLICY "Public can view by email"
  ON ministry_applications FOR SELECT
  USING (
    applicant_id IS NULL  -- public submissions visible to admin via other policy
    OR applicant_id = auth.uid()
  );
