-- ── Volunteer Availability ────────────────────────────────────────────────────
-- Lets volunteers (and leaders) mark which upcoming dates they're generally
-- available for, so leaders/admins can see it while building a schedule.
-- Assigning someone who hasn't set availability is still always allowed —
-- this table is advisory only, never a hard constraint.

CREATE TABLE IF NOT EXISTS volunteer_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'unavailable')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_volunteer_availability_user_date
  ON volunteer_availability (user_id, date);

ALTER TABLE volunteer_availability ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies so this script is safe to re-run
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'volunteer_availability'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON volunteer_availability', pol.policyname);
  END LOOP;
END $$;

-- 1. Every user can manage their own availability rows
CREATE POLICY "availability_select_own"
  ON volunteer_availability FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "availability_insert_own"
  ON volunteer_availability FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "availability_update_own"
  ON volunteer_availability FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "availability_delete_own"
  ON volunteer_availability FOR DELETE
  USING (user_id = auth.uid());

-- 2. Admins can read everyone's availability (to assist scheduling)
CREATE POLICY "availability_select_admin"
  ON volunteer_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Leaders can read availability for members of their own team
CREATE POLICY "availability_select_leader_team"
  ON volunteer_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS ldr
      WHERE ldr.id = auth.uid()
        AND ldr.role = 'leader'
        AND EXISTS (
          SELECT 1 FROM profiles AS mbr
          WHERE mbr.id = volunteer_availability.user_id
            AND mbr.team_id = ldr.team_id
        )
    )
  );
