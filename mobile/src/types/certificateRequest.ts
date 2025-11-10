import { CertificateRequest } from '../lib/supabase';

/**
 * Extended Certificate Request with PDF fields
 * Use this for screens that need PDF-related data
 */
export interface ExtendedCertificateRequest extends CertificateRequest {
  // PDF generation fields (already in database)
  pdf_url?: string;
  pdf_generated_at?: string;
  certificate_number?: string;
}

/**
 * Certificate request with user data (for admin screens)
 */
export interface CertificateRequestWithUser extends ExtendedCertificateRequest {
  user?: {
    id: string;
    full_name: string;
    email: string;
    address?: string;
    phone_number?: string;
    photo_url?: string;
  };
}
