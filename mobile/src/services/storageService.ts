import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import * as Sharing from 'expo-sharing';

/**
 * Storage Service for handling file uploads to Supabase Storage
 */

export interface UploadResult {
  url: string;
  path: string;
  error: null;
}

export interface UploadError {
  url: null;
  path: null;
  error: string;
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  uri: string,
  bucket: string = 'profile-photos',
  folder: string = 'users'
): Promise<UploadResult | UploadError> {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Generate unique filename
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: null, path: null, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
      error: null,
    };
  } catch (error: any) {
    console.error('Upload exception:', error);
    return {
      url: null,
      path: null,
      error: error.message || 'Failed to upload image',
    };
  }
}

/**
 * Upload PDF to Supabase Storage
 */
export async function uploadPDF(
  uri: string,
  fileName: string,
  bucket: string = 'certificates'
): Promise<UploadResult | UploadError> {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Generate unique filename
    const uniqueFileName = `${Date.now()}-${fileName}.pdf`;

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (error) {
      console.error('PDF upload error:', error);
      return { url: null, path: null, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
      error: null,
    };
  } catch (error: any) {
    console.error('PDF upload exception:', error);
    return {
      url: null,
      path: null,
      error: error.message || 'Failed to upload PDF',
    };
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(
  path: string,
  bucket: string = 'profile-photos'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Delete exception:', error);
    return { success: false, error: error.message || 'Failed to delete file' };
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(path: string, bucket: string = 'profile-photos'): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * Download file from Supabase Storage
 */
export async function downloadFile(
  path: string,
  bucket: string = 'certificates'
): Promise<{ data: Blob | null; error: string | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      console.error('Download error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Download exception:', error);
    return { data: null, error: error.message || 'Failed to download file' };
  }
}

/**
 * Download certificate from URL and save to device
 */
export async function downloadCertificate(url: string, fileName: string) {
  try {
    // Create a file path in the document directory
    const fileUri = FileSystem.documentDirectory + fileName;

    // Download the file directly from URL
    const downloadResult = await FileSystem.downloadAsync(url, fileUri);

    if (downloadResult.status !== 200) {
      return { success: false, error: 'Failed to download file' };
    }

    // Share/save the file using Expo Sharing
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Certificate',
        UTI: 'com.adobe.pdf',
      });
    } else {
      // If sharing is not available, just return success
      // The file is already saved to the document directory
      console.log('Sharing not available, file saved to:', fileUri);
    }

    return { success: true, data: null };
  } catch (error: any) {
    console.error('Download certificate error:', error);
    return { success: false, error: error.message || 'Failed to download certificate' };
  }
}
