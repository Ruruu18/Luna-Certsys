-- Additional Database Tables for Resare
-- Run this after the initial supabase-schema.sql
-- Created: 2025-10-18

-- ==============================================
-- 1. SYSTEM SETTINGS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('string', 'number', 'boolean', 'json')),
  category VARCHAR(50) NOT NULL, -- 'general', 'payment', 'certificate', 'notification'
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- Can be accessed by non-admin users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_settings
CREATE POLICY "Public settings can be viewed by all authenticated users" ON system_settings
  FOR SELECT USING (
    is_public = TRUE OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update settings" ON system_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can insert settings" ON system_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert default system settings
INSERT INTO system_settings (key, value, type, category, description, is_public) VALUES
  ('certificate.barangay_clearance.fee', '50', 'number', 'certificate', 'Fee for Barangay Clearance', TRUE),
  ('certificate.residency.fee', '100', 'number', 'certificate', 'Fee for Certificate of Residency', TRUE),
  ('certificate.indigency.fee', '50', 'number', 'certificate', 'Fee for Certificate of Indigency', TRUE),
  ('certificate.business_permit.fee', '200', 'number', 'certificate', 'Fee for Business Permit', TRUE),
  ('certificate.processing_days', '3', 'number', 'certificate', 'Standard processing days for certificates', TRUE),
  ('notification.retention_days', '90', 'number', 'notification', 'Days to keep notifications before auto-delete', FALSE),
  ('payment.processor', 'paymongo', 'string', 'payment', 'Payment processor service', FALSE),
  ('general.barangay_name', 'Barangay Luna', 'string', 'general', 'Official barangay name', TRUE),
  ('general.municipality', 'Municipality Name', 'string', 'general', 'Municipality name', TRUE)
ON CONFLICT (key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 2. DOCUMENT ATTACHMENTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_request_id UUID REFERENCES certificate_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- For registration documents
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100), -- MIME type
  file_size INTEGER, -- bytes
  storage_path TEXT, -- Supabase storage path
  document_category VARCHAR(50), -- 'id', 'proof_of_residency', 'supporting_document'
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE document_attachments ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_document_attachments_certificate_request
  ON document_attachments(certificate_request_id);
CREATE INDEX IF NOT EXISTS idx_document_attachments_user
  ON document_attachments(user_id);

-- RLS Policies
CREATE POLICY "Users can view their own document attachments" ON document_attachments
  FOR SELECT USING (
    uploaded_by = auth.uid() OR
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM certificate_requests cr WHERE cr.id = certificate_request_id AND cr.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all document attachments" ON document_attachments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can upload their own documents" ON document_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() OR user_id = auth.uid()
  );

CREATE POLICY "Only admins can delete documents" ON document_attachments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ==============================================
-- 3. PUROK LOCATIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS purok_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purok_number INTEGER NOT NULL UNIQUE CHECK (purok_number BETWEEN 1 AND 7),
  name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  address TEXT,
  chairman_id UUID REFERENCES users(id) ON DELETE SET NULL,
  total_households INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE purok_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read access
CREATE POLICY "Anyone can view purok locations" ON purok_locations
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can update purok locations" ON purok_locations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can insert purok locations" ON purok_locations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Add trigger for updated_at
CREATE TRIGGER update_purok_locations_updated_at
  BEFORE UPDATE ON purok_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default purok locations (UPDATE WITH ACTUAL COORDINATES)
INSERT INTO purok_locations (purok_number, name, latitude, longitude, description, address) VALUES
  (1, 'Purok 1', 16.4023, 120.5960, 'Purok 1 area', 'Purok 1, Barangay Luna'),
  (2, 'Purok 2', 16.4025, 120.5965, 'Purok 2 area', 'Purok 2, Barangay Luna'),
  (3, 'Purok 3', 16.4028, 120.5970, 'Purok 3 area', 'Purok 3, Barangay Luna'),
  (4, 'Purok 4', 16.4020, 120.5975, 'Purok 4 area', 'Purok 4, Barangay Luna'),
  (5, 'Purok 5', 16.4018, 120.5955, 'Purok 5 area', 'Purok 5, Barangay Luna'),
  (6, 'Purok 6', 16.4030, 120.5950, 'Purok 6 area', 'Purok 6, Barangay Luna'),
  (7, 'Purok 7', 16.4015, 120.5945, 'Purok 7 area', 'Purok 7, Barangay Luna')
ON CONFLICT (purok_number) DO NOTHING;

-- ==============================================
-- 4. AUDIT LOGS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject'
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- RLS Policies - Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- ==============================================
-- 5. UPDATE EXISTING TABLES
-- ==============================================

-- Add missing columns to certificate_requests
ALTER TABLE certificate_requests
  ADD COLUMN IF NOT EXISTS document_urls TEXT[], -- Array of attachment URLs
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS estimated_completion_date DATE,
  ADD COLUMN IF NOT EXISTS picked_up BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS picked_up_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));

-- Add missing columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ==============================================
-- 6. CREATE HELPFUL VIEWS
-- ==============================================

-- View for certificate request statistics
CREATE OR REPLACE VIEW certificate_request_stats AS
SELECT
  status,
  COUNT(*) as count,
  certificate_type,
  DATE(created_at) as request_date
FROM certificate_requests
GROUP BY status, certificate_type, DATE(created_at);

-- View for user statistics by purok
CREATE OR REPLACE VIEW user_stats_by_purok AS
SELECT
  purok,
  role,
  COUNT(*) as user_count,
  COUNT(CASE WHEN is_active THEN 1 END) as active_users
FROM users
WHERE role = 'resident'
GROUP BY purok, role;

-- ==============================================
-- 7. HELPFUL FUNCTIONS
-- ==============================================

-- Function to calculate certificate fee based on type
CREATE OR REPLACE FUNCTION get_certificate_fee(cert_type TEXT)
RETURNS DECIMAL AS $$
DECLARE
  fee_value TEXT;
BEGIN
  SELECT value INTO fee_value
  FROM system_settings
  WHERE key = 'certificate.' ||
    CASE cert_type
      WHEN 'Barangay Clearance' THEN 'barangay_clearance'
      WHEN 'Certificate of Residency' THEN 'residency'
      WHEN 'Certificate of Indigency' THEN 'indigency'
      WHEN 'Business Permit' THEN 'business_permit'
      ELSE 'barangay_clearance'
    END || '.fee';

  RETURN COALESCE(fee_value::DECIMAL, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
  retention_days INTEGER;
BEGIN
  -- Get retention days from settings
  SELECT value::INTEGER INTO retention_days
  FROM system_settings
  WHERE key = 'notification.retention_days';

  retention_days := COALESCE(retention_days, 90);

  -- Delete old notifications
  DELETE FROM notifications
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
    AND is_read = TRUE;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 8. SCHEDULED JOBS (Setup in Supabase Dashboard)
-- ==============================================
-- Note: These need to be setup in Supabase Dashboard under Database > Cron Jobs
--
-- 1. Daily notification cleanup (runs at 2 AM daily):
--    SELECT cron.schedule('cleanup-old-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications()');
--
-- 2. Update certificate estimated completion dates:
--    Run when status changes to 'in_progress'

COMMENT ON TABLE system_settings IS 'Stores configurable system settings and parameters';
COMMENT ON TABLE document_attachments IS 'Stores file attachments for certificate requests and user registrations';
COMMENT ON TABLE purok_locations IS 'GPS coordinates and information for each purok';
COMMENT ON TABLE audit_logs IS 'Tracks all administrative actions for security and compliance';

-- End of migration
