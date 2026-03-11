-- Ministry Applications Table
CREATE TABLE IF NOT EXISTS ministry_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  motivation text NOT NULL,
  experience text NOT NULL DEFAULT '',
  availability text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_ministry_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ministry_applications_updated_at
  BEFORE UPDATE ON ministry_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_ministry_applications_updated_at();

-- Enable RLS
ALTER TABLE ministry_applications ENABLE ROW LEVEL SECURITY;

-- Applicant can view their own applications
CREATE POLICY "Applicants can view own applications"
  ON ministry_applications FOR SELECT
  USING (applicant_id = auth.uid());

-- Admins and leaders can view all applications
CREATE POLICY "Admins and leaders can view all applications"
  ON ministry_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'leader')
    )
  );

-- Any authenticated user can submit an application
CREATE POLICY "Authenticated users can submit applications"
  ON ministry_applications FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND applicant_id = auth.uid()
  );

-- Admins can update application status
CREATE POLICY "Admins can review applications"
  ON ministry_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
