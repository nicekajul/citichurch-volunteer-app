-- Add prerequisite certificate chain and ordering to certificates
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS prerequisite_certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Add index for ordering
CREATE INDEX IF NOT EXISTS idx_certificates_order ON certificates(order_index);
