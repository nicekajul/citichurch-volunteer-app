-- ── Notifications table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'info',  -- schedule | announcement | application | training | info
  read        BOOLEAN     NOT NULL DEFAULT false,
  link        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id, created_at DESC);

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users read only their own notifications
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can mark their own notifications as read
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Any authenticated user (app code) can create notifications for anyone
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- ── Realtime ───────────────────────────────────────────────────────────────
-- Allows the browser client to receive new notifications in real time.
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
