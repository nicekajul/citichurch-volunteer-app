-- ── Email confirmation tracking ─────────────────────────────────────────────
-- Adds email_confirmed to profiles and keeps it in sync with auth.users
-- automatically via a trigger.

-- 1. Add column (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN NOT NULL DEFAULT false;

-- 2. Backfill: mark existing users who already confirmed their email
UPDATE public.profiles p
SET email_confirmed = true
FROM auth.users u
WHERE u.id = p.id
  AND u.email_confirmed_at IS NOT NULL;

-- 3. Trigger function: fires after every UPDATE on auth.users
--    When email_confirmed_at goes from NULL → a timestamp, flip the profile flag.
CREATE OR REPLACE FUNCTION public.sync_email_confirmation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  THEN
    UPDATE public.profiles
    SET email_confirmed = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_email_confirmation();
