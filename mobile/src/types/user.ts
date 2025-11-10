import { User } from '../lib/supabase';

/**
 * Extended User Profile with Certificate Fields
 * Use this for screens that need certificate-related user data
 */
export interface ExtendedUserProfile extends User {
  // Certificate-related fields (already in database)
  date_of_birth?: string;
  place_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  civil_status?: 'Single' | 'Married' | 'Widowed' | 'Divorced' | 'Separated';
  photo_url?: string;
  middle_name?: string;
  suffix?: string;
}

/**
 * Form data for updating user profile with certificate fields
 */
export interface UserProfileUpdateData {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  middle_name?: string;
  suffix?: string;
  address?: string;
  phone_number?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  civil_status?: 'Single' | 'Married' | 'Widowed' | 'Divorced' | 'Separated';
  photo_url?: string;
}

/**
 * Check if user profile is complete for certificate generation
 */
export function isProfileCompleteForCertificate(user: ExtendedUserProfile): {
  isComplete: boolean;
  missingFields: string[];
} {
  const requiredFields = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'address', label: 'Address' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'place_of_birth', label: 'Place of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'civil_status', label: 'Civil Status' },
  ];

  const missing: string[] = [];

  for (const field of requiredFields) {
    if (!user[field.key as keyof ExtendedUserProfile]) {
      missing.push(field.label);
    }
  }

  return {
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}
