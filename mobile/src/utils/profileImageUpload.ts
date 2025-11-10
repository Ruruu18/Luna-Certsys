import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

/**
 * Requests camera roll permissions and opens image picker
 * @returns Promise with the selected image URI or null if cancelled
 */
export const pickProfileImage = async (): Promise<string | null> => {
  try {
    // Request permission to access media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload profile pictures.'
      );
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile pictures
      quality: 0.8, // Compress to 80% quality to reduce file size
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image. Please try again.');
    return null;
  }
};

/**
 * Uploads a profile image to Supabase Storage and updates user profile
 * @param userId - The user's ID
 * @param imageUri - Local URI of the image to upload
 * @returns Promise with the public URL of the uploaded image or null if failed
 */
export const uploadProfileImage = async (
  userId: string,
  imageUri: string
): Promise<string | null> => {
  try {
    // Convert image URI to blob for upload
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Generate unique filename
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update user profile with new image URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_image_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      throw updateError;
    }

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    Alert.alert('Upload Failed', 'Failed to upload profile image. Please try again.');
    return null;
  }
};

/**
 * Deletes old profile image from storage
 * @param imageUrl - The full URL of the image to delete
 */
export const deleteOldProfileImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/profile-images/');
    if (urlParts.length < 2) {
      return; // Invalid URL format
    }

    const filePath = `profile-images/${urlParts[1]}`;

    // Delete from storage
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting old image:', error);
      // Don't throw - this is not critical
    }
  } catch (error) {
    console.error('Error in deleteOldProfileImage:', error);
    // Don't throw - this is not critical
  }
};
