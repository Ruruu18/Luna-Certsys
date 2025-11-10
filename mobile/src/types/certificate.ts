/**
 * Certificate Type Definitions
 */

export interface CertificateData {
  // User Information
  fullName: string;
  address: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  civilStatus: string;
  photoUrl?: string;

  // Certificate Details
  certificateType: string;
  purpose: string;
  certificateNumber: string;

  // Issue Information
  issueDate: Date;
  issuedBy: string; // Punong Barangay or Official name

  // Optional fields
  middleName?: string;
  suffix?: string;
  contactNumber?: string;
}

export interface CertificateTemplate {
  id: string;
  templateName: string;
  templateType: string;
  description: string;
  baseFee: number;
  isActive: boolean;
  fieldsRequired: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneratePDFOptions {
  certificateData: CertificateData;
  requestId: string;
  templateType: string;
}

export interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  certificateNumber?: string;
  error?: string;
}

export type CertificateStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface CertificateRequest {
  id: string;
  userId: string;
  certificateType: string;
  purpose: string;
  status: CertificateStatus;
  notes?: string;
  amount?: number;
  processedBy?: string;
  pdfUrl?: string;
  pdfGeneratedAt?: string;
  certificateNumber?: string;
  createdAt: string;
  updatedAt: string;
}
