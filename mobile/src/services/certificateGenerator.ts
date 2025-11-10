import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supabase } from '../lib/supabase';
import { uploadPDF } from './storageService';
import { CertificateData, PDFGenerationResult } from '../types/certificate';
import { generateBarangayCertificationHTML } from './certificateTemplates/barangayCertification';
import { generateCertificateOfResidencyHTML } from './certificateTemplates/certificateOfResidency';
import { generateCertificateOfIndigencyHTML } from './certificateTemplates/certificateOfIndigency';
import { generateBusinessPermitHTML } from './certificateTemplates/businessPermit';
import { generateBuildingPermitHTML } from './certificateTemplates/buildingPermit';

/**
 * Main Certificate Generator Service
 * Handles PDF generation, upload, and storage
 */

interface GenerateCertificateOptions {
  requestId: string;
  userId: string;
  certificateType: string;
  purpose: string;
}

/**
 * Generate certificate PDF based on type
 */
export async function generateCertificatePDF(
  options: GenerateCertificateOptions
): Promise<PDFGenerationResult> {
  try {
    const { requestId, userId, certificateType, purpose } = options;

    console.log('📄 Starting certificate generation for request:', requestId);

    // 1. Fetch user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Failed to fetch user data:', userError);
      return {
        success: false,
        error: 'User data not found',
      };
    }

    // 2. Validate required fields
    const missingFields = validateUserData(userData);
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      };
    }

    // 3. Prepare certificate data
    const certificateData: CertificateData = {
      fullName: userData.full_name,
      address: userData.address || 'Not specified',
      dateOfBirth: userData.date_of_birth || 'Not specified',
      placeOfBirth: userData.place_of_birth || 'Not specified',
      gender: userData.gender || 'Not specified',
      civilStatus: userData.civil_status || 'Not specified',
      photoUrl: userData.photo_url,
      certificateType,
      purpose,
      certificateNumber: `TEMP-${Date.now()}`, // Will be replaced by DB trigger
      issueDate: new Date(),
      issuedBy: 'Punong Barangay',
      middleName: userData.middle_name,
      suffix: userData.suffix,
      contactNumber: userData.phone_number,
    };

    // 4. Generate HTML based on certificate type
    let html = '';

    switch (certificateType) {
      case 'Barangay Certification':
      case 'Barangay Clearance':
        html = await generateBarangayCertificationHTML(certificateData);
        break;
      case 'Certificate of Residency':
        html = await generateCertificateOfResidencyHTML(certificateData);
        break;
      case 'Certificate of Indigency':
        html = await generateCertificateOfIndigencyHTML(certificateData);
        break;
      case 'Business Permit':
        html = await generateBusinessPermitHTML(certificateData);
        break;
      case 'Building Permit':
        html = await generateBuildingPermitHTML(certificateData);
        break;
      default:
        html = await generateBarangayCertificationHTML(certificateData);
    }

    // 5. Generate PDF using expo-print
    console.log('🖨️ Generating PDF...');
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    console.log('✅ PDF generated at:', uri);

    // 6. Upload PDF to Supabase Storage
    console.log('☁️ Uploading to Supabase Storage...');
    const uploadResult = await uploadPDF(
      uri,
      `cert-${userId}-${Date.now()}`,
      'certificates'
    );

    if (uploadResult.error) {
      console.error('Failed to upload PDF:', uploadResult.error);
      return {
        success: false,
        error: uploadResult.error,
      };
    }

    console.log('✅ PDF uploaded successfully:', uploadResult.url);

    // 7. Update certificate request with PDF URL
    const { data: updatedRequest, error: updateError } = await supabase
      .from('certificate_requests')
      .update({
        pdf_url: uploadResult.url,
        pdf_generated_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update request:', updateError);
      return {
        success: false,
        error: 'Failed to save PDF information',
      };
    }

    console.log('✅ Certificate generated successfully!');
    console.log('📋 Certificate Number:', updatedRequest.certificate_number);

    // 8. Clean up local file
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary file:', cleanupError);
    }

    return {
      success: true,
      pdfUrl: uploadResult.url,
      certificateNumber: updatedRequest.certificate_number,
    };
  } catch (error: any) {
    console.error('Certificate generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate certificate',
    };
  }
}

/**
 * Validate user data has all required fields for certificate
 */
function validateUserData(userData: any): string[] {
  const required = [
    { field: 'full_name', label: 'Full Name' },
    { field: 'address', label: 'Address' },
    { field: 'date_of_birth', label: 'Date of Birth' },
    { field: 'place_of_birth', label: 'Place of Birth' },
    { field: 'gender', label: 'Gender' },
    { field: 'civil_status', label: 'Civil Status' },
  ];

  const missing: string[] = [];

  for (const item of required) {
    if (!userData[item.field]) {
      missing.push(item.label);
    }
  }

  return missing;
}

/**
 * Preview certificate (generate and show without saving)
 */
export async function previewCertificate(
  certificateData: CertificateData
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    let html = '';

    switch (certificateData.certificateType) {
      case 'Barangay Certification':
      case 'Barangay Clearance':
        html = await generateBarangayCertificationHTML(certificateData);
        break;
      case 'Certificate of Residency':
        html = await generateCertificateOfResidencyHTML(certificateData);
        break;
      case 'Certificate of Indigency':
        html = await generateCertificateOfIndigencyHTML(certificateData);
        break;
      case 'Business Permit':
        html = await generateBusinessPermitHTML(certificateData);
        break;
      case 'Building Permit':
        html = await generateBuildingPermitHTML(certificateData);
        break;
      default:
        html = await generateBarangayCertificationHTML(certificateData);
    }

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    return { success: true, uri };
  } catch (error: any) {
    console.error('Preview error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Download and share certificate
 */
export async function downloadCertificate(
  pdfUrl: string,
  fileName: string = 'certificate.pdf'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Sharing is not available on this device',
      };
    }

    // Download PDF to local storage
    const downloadResumable = FileSystem.createDownloadResumable(
      pdfUrl,
      FileSystem.documentDirectory + fileName,
      {}
    );

    const result = await downloadResumable.downloadAsync();

    if (!result) {
      return { success: false, error: 'Download failed' };
    }

    // Share the file
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Download Certificate',
      UTI: 'com.adobe.pdf',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error.message || 'Failed to download certificate',
    };
  }
}

/**
 * Print certificate directly
 */
export async function printCertificate(pdfUrl: string): Promise<void> {
  try {
    // Download PDF first
    const downloadResumable = FileSystem.createDownloadResumable(
      pdfUrl,
      FileSystem.cacheDirectory + 'temp-cert.pdf',
      {}
    );

    const result = await downloadResumable.downloadAsync();

    if (!result) {
      throw new Error('Failed to download PDF');
    }

    // Print using expo-print
    await Print.printAsync({
      uri: result.uri,
    });

    // Cleanup
    await FileSystem.deleteAsync(result.uri, { idempotent: true });
  } catch (error) {
    console.error('Print error:', error);
    throw error;
  }
}
