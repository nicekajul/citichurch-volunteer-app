-- ── Email confirmation — combined setup + fix ────────────────────────────────
-- Run this entire script in Supabase SQL Editor.
-- It is fully idempotent — safe to run multiple times.

-- 1. Add the column (skipped automatically if it already exists)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN NOT NULL DEFAULT false;

-- 2. Full resync — mark every profile whose auth account is already confirmed
UPDATE public.profiles p
SET email_confirmed = true
FROM auth.users u
WHERE u.id = p.id
  AND u.email_confirmed_at IS NOT NULL;

-- 3. Force-confirm demo accounts (they bypass the email flow)
UPDATE public.profiles
SET email_confirmed = true
WHERE email IN (
  'admin@citichurch.com',
  'leader@citichurch.com',
  'volunteer@citichurch.com'
);

-- 4. Trigger function: auto-sync future confirmations from auth.users → profiles
CREATE OR REPLACE FUNCTION public.sync_email_confirmation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.profiles
    SET email_confirmed = true
    WHERE id = NEW.id AND email_confirmed = false;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Attach trigger (INSERT OR UPDATE so it catches all cases)
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_email_confirmation();
