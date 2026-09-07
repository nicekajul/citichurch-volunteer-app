-- The profiles.status check constraint has only ever allowed ('active', 'inactive'),
-- but the app has always treated 'pending' as a valid status (add-volunteer form,
-- "Activate Volunteer" action, invite flow, and various status filters). Any
-- attempt to actually write 'pending' has been silently failing at the DB level.
-- Widen the constraint to match what the app has always assumed.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive', 'pending'));
