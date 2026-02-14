-- Confirm all demo user emails to bypass email verification
-- This script sets email_confirmed_at for demo accounts

-- Update all users with citichurch.com domain to be confirmed
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE 
  email LIKE '%@citichurch.com'
  AND email_confirmed_at IS NULL;

-- Verify the update
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email LIKE '%@citichurch.com'
ORDER BY email;
