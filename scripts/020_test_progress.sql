-- ── Test Progress Seed ───────────────────────────────────────────────────────
-- John Leader  → all 3 tiers fully completed
-- Sarah Volunteer → Tier 1 (Ministry Essentials) + Tier 2 (Broadcast Specialist)
-- Safe to re-run: deletes existing progress for these two users before inserting.

DO $$
DECLARE
  john_id   UUID;
  sarah_id  UUID;
  t1_id     UUID;
  t2_id     UUID;
  t3_id     UUID;
BEGIN

  -- ── Look up profile IDs ───────────────────────────────────────────────────
  SELECT id INTO john_id  FROM profiles WHERE email = 'leader@citichurch.com'    LIMIT 1;
  SELECT id INTO sarah_id FROM profiles WHERE email = 'volunteer@citichurch.com' LIMIT 1;

  IF john_id IS NULL  THEN RAISE EXCEPTION 'leader@citichurch.com not found in profiles — run demo setup first'; END IF;
  IF sarah_id IS NULL THEN RAISE EXCEPTION 'volunteer@citichurch.com not found in profiles — run demo setup first'; END IF;

  -- ── Look up certificate IDs by name ───────────────────────────────────────
  SELECT id INTO t1_id FROM certificates WHERE name = 'Ministry Essentials'  LIMIT 1;
  SELECT id INTO t2_id FROM certificates WHERE name = 'Broadcast Specialist' LIMIT 1;
  SELECT id INTO t3_id FROM certificates WHERE name = 'Production Leader'    LIMIT 1;

  IF t1_id IS NULL THEN RAISE EXCEPTION 'Certificate "Ministry Essentials" not found — run 019 first'; END IF;
  IF t2_id IS NULL THEN RAISE EXCEPTION 'Certificate "Broadcast Specialist" not found — run 019 first'; END IF;
  IF t3_id IS NULL THEN RAISE EXCEPTION 'Certificate "Production Leader" not found — run 019 first'; END IF;

  -- ── Wipe existing progress for these two users ────────────────────────────
  DELETE FROM training_progress WHERE user_id IN (john_id, sarah_id);

  -- ── John Leader: complete ALL modules (Tier 1 + 2 + 3) ───────────────────
  INSERT INTO training_progress (user_id, training_module_id, status, progress, quiz_score, completed_at)
  SELECT
    john_id,
    m.id,
    'completed',
    100,
    85,
    NOW() - (INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY m.order_index))
  FROM training_modules m
  WHERE m.certificate_id IN (t1_id, t2_id, t3_id);

  -- ── Sarah Volunteer: complete Tier 1 + Tier 2 only ───────────────────────
  INSERT INTO training_progress (user_id, training_module_id, status, progress, quiz_score, completed_at)
  SELECT
    sarah_id,
    m.id,
    'completed',
    100,
    80,
    NOW() - (INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY m.order_index))
  FROM training_modules m
  WHERE m.certificate_id IN (t1_id, t2_id);

  RAISE NOTICE 'Done — John (%) completed all tiers | Sarah (%) completed Tier 1 + 2', john_id, sarah_id;
END $$;
