-- ── Notify admins when a new volunteer registers ─────────────────────────────
-- This runs server-side so it fires even if no admin is logged in at the time.

CREATE OR REPLACE FUNCTION public.notify_admins_new_volunteer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert a notification row for every admin
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT
    p.id,
    'New volunteer registered',
    COALESCE(NEW.name, 'A new volunteer') || ' (' || COALESCE(NEW.email, '') || ') has registered and needs a team assignment.',
    'info',
    '/dashboard/volunteers'
  FROM public.profiles p
  WHERE p.role = 'admin'
    AND p.id != NEW.id;   -- don't self-notify if an admin signs up

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_volunteer ON public.profiles;
CREATE TRIGGER on_new_volunteer
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'volunteer')
  EXECUTE FUNCTION public.notify_admins_new_volunteer();
