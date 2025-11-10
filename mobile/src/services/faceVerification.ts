import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Face Verification Service
 * Handles face photo capture, upload, and verification
 */

export interface FaceVerificationResult {
  success: boolean;
  photoUrl?: string;
  error?: string;
}

/**
 * Upload face photo to Supabase Storage
 * Bucket: 'faces' (private, user-specific)
 */
export async function uploadFacePhoto(
  photoUri: string,
  userId: string
): Promise<{ url?: string; error?: string }> {
  try {
    console.log('📤 Uploading face photo for user:', userId);
    console.log('Photo URI:', photoUri);

    // Generate unique filename
    const fileName = `${userId}_verified_${Date.now()}.jpg`;
    const filePath = `${userId}/${fileName}`;

    // Read file as base64 (React Native compatible)
    const fileInfo = await FileSystem.getInfoAsync(photoUri);
    if (!fileInfo.exists) {
      throw new Error('Photo file not found');
    }

    console.log('Reading file as base64...');
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer for upload
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    console.log('✅ File converted to byte array, size:', byteArray.length)

    // Upload to Supabase Storage
    console.log('Uploading to Supabase storage...', filePath);
    const { data, error } = await supabase.storage
      .from('faces')
      .upload(filePath, byteArray, {
        contentType: 'image/jpeg',
        upsert: true, // Replace if exists
      });

    if (error) {
      console.error('❌ Storage upload error:', error);
      return { error: error.message };
    }

    console.log('✅ Upload successful, data:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('faces')
      .getPublicUrl(filePath);

    console.log('✅ Face photo uploaded successfully:', publicUrl);
    return { url: publicUrl };
  } catch (error: any) {
    console.error('❌ Upload face photo error:', error);
    return { error: error.message || 'Failed to upload face photo' };
  }
}

/**
 * Update user's face verification status
 */
export async function markFaceAsVerified(
  userId: string,
  photoUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('✅ Marking face as verified for user:', userId);

    const { error } = await supabase
      .from('users')
      .update({
        photo_url: photoUrl,
        face_verified: true,
        face_verified_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Update face verification error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Face verification status updated successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Mark face as verified error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Complete face verification flow
 * 1. Upload photo to storage
 * 2. Update user's verification status
 */
export async function verifyFace(
  photoUri: string,
  userId: string
): Promise<FaceVerificationResult> {
  try {
    console.log('🔐 Starting face verification for user:', userId);

    // Step 1: Upload photo
    const uploadResult = await uploadFacePhoto(photoUri, userId);

    if (uploadResult.error || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload face photo',
      };
    }

    // Step 2: Mark as verified
    const verifyResult = await markFaceAsVerified(userId, uploadResult.url);

    if (!verifyResult.success) {
      return {
        success: false,
        error: verifyResult.error || 'Failed to update verification status',
      };
    }

    // Step 3: Clean up local file (optional)
    try {
      await FileSystem.deleteAsync(photoUri, { idempotent: true });
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary file:', cleanupError);
    }

    console.log('✅ Face verification completed successfully!');
    return {
      success: true,
      photoUrl: uploadResult.url,
    };
  } catch (error: any) {
    console.error('Face verification error:', error);
    return {
      success: false,
      error: error.message || 'Face verification failed',
    };
  }
}

/**
 * Check if user has completed face verification
 */
export async function checkFaceVerification(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('face_verified')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.face_verified === true;
  } catch (error) {
    console.error('Check face verification error:', error);
    return false;
  }
}

/**
 * Validate photo quality (basic checks)
 * Returns true if photo meets minimum requirements
 */
export function validatePhotoQuality(photoUri: string): Promise<boolean> {
  // TODO: Implement photo quality validation
  // - Check file size (not too small/large)
  // - Check image dimensions
  // - Optionally: Use ML Kit for face detection
  return Promise.resolve(true);
}

/**
 * Re-verify face (for users who need to update their photo)
 * This will replace the existing face photo
 */
export async function reverifyFace(
  photoUri: string,
  userId: string
): Promise<FaceVerificationResult> {
  // Same as verifyFace, but explicitly allows re-verification
  return verifyFace(photoUri, userId);
}
