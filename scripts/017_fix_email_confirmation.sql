-- ── Fix: email_confirmed sync ────────────────────────────────────────────────
-- Run this in Supabase SQL Editor to repair any missing confirmations.

-- 1. Full resync — marks all profiles whose auth account is already confirmed
UPDATE public.profiles p
SET email_confirmed = true
FROM auth.users u
WHERE u.id = p.id
  AND u.email_confirmed_at IS NOT NULL
  AND p.email_confirmed = false;

-- 2. Mark demo users as confirmed (they bypass the email flow)
UPDATE public.profiles
SET email_confirmed = true
WHERE email IN (
  'admin@citichurch.com',
  'leader@citichurch.com',
  'volunteer@citichurch.com'
);

-- 3. Replace the trigger with one that fires on both INSERT and UPDATE
--    (handles admin-created users who start with email_confirmed_at already set)
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

DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_email_confirmation();
