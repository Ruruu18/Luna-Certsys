-- Certificate PDF Generation Support Migration
-- Run this in your Supabase SQL Editor after the initial schema

-- Add additional user profile fields needed for certificates
ALTER TABLE users
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS place_of_birth TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
ADD COLUMN IF NOT EXISTS civil_status TEXT CHECK (civil_status IN ('Single', 'Married', 'Widowed', 'Divorced', 'Separated')),
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS suffix TEXT;

-- Add PDF storage fields to certificate_requests
ALTER TABLE certificate_requests
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS certificate_number TEXT UNIQUE;

-- Create certificate_templates table for managing different certificate types
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL,
  description TEXT,
  base_fee DECIMAL(10,2) DEFAULT 50.00,
  is_active BOOLEAN DEFAULT TRUE,
  fields_required JSONB, -- Store required fields as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default certificate templates
INSERT INTO certificate_templates (template_name, template_type, description, base_fee, fields_required)
VALUES
  (
    'Barangay Certification',
    'certification',
    'Official barangay certification for residents',
    50.00,
    '["full_name", "address", "date_of_birth", "place_of_birth", "gender", "civil_status", "purpose"]'::jsonb
  ),
  (
    'Barangay Clearance',
    'clearance',
    'Certificate of no pending case',
    75.00,
    '["full_name", "address", "date_of_birth", "purpose"]'::jsonb
  ),
  (
    'Certificate of Residency',
    'residency',
    'Proof of residency in barangay',
    50.00,
    '["full_name", "address", "date_of_birth"]'::jsonb
  ),
  (
    'Certificate of Indigency',
    'indigency',
    'Certificate for low-income residents',
    0.00,
    '["full_name", "address", "date_of_birth", "civil_status"]'::jsonb
  ),
  (
    'Business Permit',
    'permit',
    'Barangay business permit',
    200.00,
    '["full_name", "address", "business_name", "business_address", "business_type"]'::jsonb
  ),
  (
    'Certificate of Good Moral Character',
    'moral',
    'Good moral character certification',
    50.00,
    '["full_name", "address", "date_of_birth", "purpose"]'::jsonb
  )
ON CONFLICT (template_name) DO NOTHING;

-- Create function to generate unique certificate numbers
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  year_code TEXT;
  sequence_num TEXT;
BEGIN
  year_code := TO_CHAR(NOW(), 'YYYY');
  sequence_num := LPAD(NEXTVAL('certificate_number_seq')::TEXT, 6, '0');
  RETURN 'CERT-' || year_code || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for certificate numbers
CREATE SEQUENCE IF NOT EXISTS certificate_number_seq START 1;

-- Add trigger to auto-generate certificate number when PDF is generated
CREATE OR REPLACE FUNCTION set_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pdf_url IS NOT NULL AND NEW.certificate_number IS NULL THEN
    NEW.certificate_number := generate_certificate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_certificate_number
  BEFORE INSERT OR UPDATE ON certificate_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_certificate_number();

-- Add updated_at trigger for certificate_templates
CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on certificate_templates
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certificate_templates
CREATE POLICY "Everyone can view active templates" ON certificate_templates
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage templates" ON certificate_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificate_requests_certificate_number ON certificate_requests(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_pdf_url ON certificate_requests(pdf_url);
CREATE INDEX IF NOT EXISTS idx_users_date_of_birth ON users(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_type ON certificate_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_active ON certificate_templates(is_active);

-- Add comments for documentation
COMMENT ON COLUMN users.photo_url IS 'URL to user profile photo stored in Supabase Storage';
COMMENT ON COLUMN certificate_requests.pdf_url IS 'URL to generated certificate PDF in Supabase Storage';
COMMENT ON COLUMN certificate_requests.certificate_number IS 'Unique certificate number (format: CERT-YYYY-XXXXXX)';
COMMENT ON TABLE certificate_templates IS 'Templates for different certificate types with required fields';
