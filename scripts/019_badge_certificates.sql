-- ── Production Ministry — Official Training Tiers ─────────────────────────
-- Wipes all existing certificates and training modules, then seeds the 3
-- official tiers with their full module lists. Safe to re-run.

DO $$
DECLARE
  tier1_id UUID;
  tier2_id UUID;
  tier3_id UUID;
BEGIN

  -- ── Ensure columns exist on training_modules ────────────────────────────
  ALTER TABLE training_modules
    ADD COLUMN IF NOT EXISTS order_index   INTEGER  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quiz_required BOOLEAN  DEFAULT false,
    ADD COLUMN IF NOT EXISTS passing_score INTEGER  DEFAULT 70,
    ADD COLUMN IF NOT EXISTS summary       TEXT     DEFAULT '';

  -- ── Fix FK: certificate_id must reference certificates, not issued_certificates
  ALTER TABLE training_modules
    DROP CONSTRAINT IF EXISTS training_modules_certificate_id_fkey;

  ALTER TABLE training_modules
    ADD CONSTRAINT training_modules_certificate_id_fkey
    FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE SET NULL;

  -- ── 1. Detach all modules, delete all certificates ──────────────────────
  UPDATE training_modules SET certificate_id = NULL;
  DELETE FROM certificates;

  -- ── 2. Delete all existing training modules (cascade → progress, quizzes)
  DELETE FROM training_modules;

  -- ── 3. Tier 1: Ministry Essentials ──────────────────────────────────────
  INSERT INTO certificates (name, description, color, order_index)
  VALUES (
    'Ministry Essentials',
    'Foundation training covering ministry vision, safety, volunteer expectations, and studio etiquette. Required before any specialist track.',
    '#f59e0b', 1
  ) RETURNING id INTO tier1_id;

  INSERT INTO training_modules
    (title, description, summary, duration, order_index, quiz_enabled, quiz_required, passing_score, certificate_id)
  VALUES
    (
      'Heart of Production',
      'Ministry vision, welcome, and the purpose behind broadcasting the service.',
      'Understand why we do what we do. Covers the ministry vision, our role in broadcasting the gospel, and the core values that drive our team — excellence, teamwork, and servant leadership.',
      0, 1, true, false, 70, tier1_id
    ),
    (
      'Volunteer Handbook',
      'Dress code, call times, and general expectations for all Production Ministry volunteers.',
      'Everything you need to know as a new volunteer: dress code policy, call time expectations, communication protocols, and what a typical service day looks like.',
      0, 2, true, true, 80, tier1_id
    ),
    (
      'Safety & Emergency Protocol',
      'Basic safety, fire extinguisher locations, evacuation plans, and equipment safety guidelines.',
      'Your safety and the safety of others is our top priority. Learn emergency procedures, evacuation routes, fire extinguisher locations, electrical safety, and proper equipment handling.',
      0, 3, true, true, 80, tier1_id
    ),
    (
      'Studio Etiquette & Comms',
      'How to use headsets (Clear-Com, Hollyland, etc.), radio discipline, and keeping quiet in the booth.',
      'Master in-service communication. Learn headset operation (Clear-Com, Hollyland), radio discipline, intercom etiquette, and how to stay professional during a live broadcast.',
      0, 4, true, true, 75, tier1_id
    );

  -- ── 4. Tier 2: Broadcast Specialist ─────────────────────────────────────
  INSERT INTO certificates (name, description, color, order_index, prerequisite_certificate_id)
  VALUES (
    'Broadcast Specialist',
    'Role-specific technical training across 3 tracks — Camera Operator, Control Room & Switching, and IT & Support. Requires Ministry Essentials.',
    '#dc2626', 2, tier1_id
  ) RETURNING id INTO tier2_id;

  INSERT INTO training_modules
    (title, description, summary, duration, order_index, quiz_enabled, quiz_required, passing_score, certificate_id)
  VALUES
    -- Track A: Camera Operator
    (
      'Gear Care & Handling',
      'Track A: Camera Operator — Proper lens cleaning, tripod balancing, and cable coiling (over-under method).',
      'Learn how to properly care for and handle our camera equipment. Covers lens cleaning technique, tripod balancing, and the over-under cable coiling method to protect gear and extend its lifespan.',
      0, 1, true, true, 75, tier2_id
    ),
    (
      'Setup & Strike',
      'Track A: Camera Operator — Properly setting up and tearing down the camera station.',
      'The right way to build and break down a camera station before and after service. Covers cable routing, power-up/down sequences, shot list preparation, and post-service equipment storage.',
      0, 2, true, true, 75, tier2_id
    ),
    (
      'Basic Framing & Composition',
      'Track A: Camera Operator — Rule of thirds, headroom, and matching shots with other cameras.',
      'Learn the fundamental principles of camera framing for live worship. Covers rule of thirds, headroom, lead space, shot matching with other cameras, and safe zone awareness.',
      0, 3, true, false, 70, tier2_id
    ),
    (
      'Navigating Call Shots',
      'Track A: Camera Operator — Understanding the Director''s cues (pan, tilt, zoom, hold, standby).',
      'Master the language of the control room. Learn to respond instantly and accurately to director cues: pan, tilt, zoom, hold, standby, and ready. Covers communication discipline and timing.',
      0, 4, true, true, 80, tier2_id
    ),
    -- Track B: Control Room & Switching
    (
      'ATEM Basics',
      'Track B: Control Room & Switching — Switcher interface, cutting vs. transitioning, and basic keying (lower thirds/lyrics).',
      'Get familiar with the ATEM switcher. Learn the interface layout, the difference between cuts and transitions, how to key in lower thirds and lyrics, and basic macro execution.',
      0, 5, true, true, 75, tier2_id
    ),
    (
      'OBS & Encoding Basics',
      'Track B: Control Room & Switching — Starting/stopping the stream, checking audio levels, and managing scenes.',
      'Master OBS for live streaming. Learn scene management, audio monitoring, stream health indicators, recording settings, and how to safely start and stop a live broadcast without interruption.',
      0, 6, true, true, 75, tier2_id
    ),
    (
      'Broadcast Audio 101',
      'Track B: Control Room & Switching — House sound vs. broadcast sound, monitoring levels, and preventing clipping.',
      'Understand audio in the broadcast context. Learn the difference between the house mix and the broadcast mix, how to monitor levels correctly, how to spot clipping, and how to fix it mid-service.',
      0, 7, true, false, 70, tier2_id
    ),
    -- Track C: IT & Support
    (
      'Network Fundamentals',
      'Track C: IT & Support — Internet troubleshooting, understanding bitrate, and monitoring stream health.',
      'Learn to keep the stream alive. Covers network troubleshooting basics, understanding bitrate requirements for different platforms, reading stream health dashboards, and escalation steps.',
      0, 8, true, false, 70, tier2_id
    ),
    (
      'Signal Flow 101',
      'Track C: IT & Support — How video travels from the camera to the switcher to the internet.',
      'Trace the signal from camera to screen. Understand how video moves through the full production chain — camera → switcher → encoder → CDN → viewer — and where common failures occur.',
      0, 9, true, true, 75, tier2_id
    );

  -- ── 5. Tier 3: Production Leader ─────────────────────────────────────────
  INSERT INTO certificates (name, description, color, order_index, prerequisite_certificate_id)
  VALUES (
    'Production Leader',
    'Advanced leadership and mastery — service direction, advanced switching, live troubleshooting, and ministry mentorship. Requires Broadcast Specialist.',
    '#7c3aed', 3, tier2_id
  ) RETURNING id INTO tier3_id;

  INSERT INTO training_modules
    (title, description, summary, duration, order_index, quiz_enabled, quiz_required, passing_score, certificate_id)
  VALUES
    (
      'Service Director',
      'Calling shots, pacing the service, and communicating with the worship leader, pastor, and camera team.',
      'Step into the director''s chair. Learn how to call shots with confidence, pace the service flow, and maintain clear, calm communication with worship leaders, pastors, and camera operators in real time.',
      0, 1, true, true, 85, tier3_id
    ),
    (
      'Technical Director (TD)',
      'Advanced ATEM/OBS routing, multi-cam live mixing, macros, and handling complex transitions.',
      'Master the technical side of directing. Covers advanced ATEM routing, multi-camera live switching, macro programming, handling complex transitions, and managing unexpected technical issues.',
      0, 2, true, true, 85, tier3_id
    ),
    (
      'Dynamic Cinematography',
      'Advanced framing for live worship — depth of field, capturing emotion, and safe dynamic movement.',
      'Elevate your camera work. Learn advanced composition for live worship: using depth of field creatively, capturing genuine moments of worship, and executing controlled dynamic movement safely.',
      0, 3, true, false, 75, tier3_id
    ),
    (
      'Live Troubleshooting',
      'Handling a dropped stream, frozen camera, or missing audio during a live broadcast without panicking.',
      'Stay calm and fix it live. Learn proven protocols for the most common broadcast emergencies — dropped streams, frozen cameras, lost audio — and how to recover quickly without disrupting worship.',
      0, 4, true, true, 85, tier3_id
    ),
    (
      'Ministry Mentor',
      'Training for volunteers ready to shadow and teach Tier 1 and Tier 2 volunteers.',
      'Give back by teaching others. Prepares experienced volunteers to mentor newer members, lead hands-on training sessions, deliver feedback constructively, and help build a culture of excellence.',
      0, 5, true, false, 75, tier3_id
    );

  RAISE NOTICE 'Done — T1: %, T2: %, T3: %  |  18 modules seeded.', tier1_id, tier2_id, tier3_id;
END $$;
