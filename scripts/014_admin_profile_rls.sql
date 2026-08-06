-- Fix: the previous version caused infinite recursion because the USING clause
-- queried `profiles` itself, triggering the policy again in a loop.
--
-- Solution: a SECURITY DEFINER function reads the caller's role with elevated
-- privileges (bypassing RLS), so the policy check never re-enters RLS.

-- 1. Drop the broken recursive policies.
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles"  ON public.profiles;

-- 2. Helper function — runs as the function owner (superuser), not the caller,
--    so it is not subject to RLS on profiles.
CREATE OR REPLACE FUNCTION public.get_my_profile_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Re-create the policies using the helper (no recursion).
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING      (public.get_my_profile_role() = 'admin')
WITH CHECK (public.get_my_profile_role() = 'admin');

CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.get_my_profile_role() = 'admin');
