-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#3b82f6',
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read certificates
CREATE POLICY "Authenticated users can read certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (true);

-- Only admins and leaders can manage certificates
CREATE POLICY "Admins and leaders can manage certificates"
  ON certificates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'leader')
    )
  );

-- Add certificate_id and prerequisites to training_modules
ALTER TABLE training_modules
  ADD COLUMN IF NOT EXISTS certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb;
