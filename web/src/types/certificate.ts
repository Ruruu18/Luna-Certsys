export interface ResidentInfo {
  fullName: string;
  address: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: 'Male' | 'Female';
  civilStatus: 'Single' | 'Married' | 'Widowed' | 'Separated';
  photoUrl?: string;
}

export interface CertificateRequest {
  residentInfo: ResidentInfo;
  purpose: string;
  requestDate: Date;
  issueDate?: Date;
}

export interface OfficialInfo {
  punongBarangay: string;
  kagawadOnDuty: string;
  position: string;
}

export interface BarangayInfo {
  name: string;
  city: string;
  province: string;
  region: string;
  address?: string;
  plusCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  sealUrl?: string;
}

export const DEFAULT_BARANGAY_INFO: BarangayInfo = {
  name: 'BARANGAY LUNA',
  city: 'City of Surigao',
  province: 'Province of Surigao del Norte',
  region: 'CARAGA Region XIII',
  address: 'Sitio Looc, Brgy Luna, Surigao City, Surigao del Norte',
  plusCode: 'QF6M+9FF',
  coordinates: {
    latitude: 9.7858,
    longitude: 125.4833,
  },
};
