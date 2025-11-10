<template>
  <div class="certificate-form">
    <div class="form-header">
      <h2>Barangay Certification Request</h2>
      <p>Fill in the required information to generate your barangay certificate</p>
    </div>

    <form @submit.prevent="handleSubmit" class="form-container">
      <!-- Personal Information Section -->
      <div class="form-section">
        <h3>Personal Information</h3>

        <div class="form-group">
          <label for="fullName">Full Name <span class="required">*</span></label>
          <input
            id="fullName"
            v-model="formData.fullName"
            type="text"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div class="form-group">
          <label for="address">Address <span class="required">*</span></label>
          <input
            id="address"
            v-model="formData.address"
            type="text"
            placeholder="Enter your complete address"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="dateOfBirth">Date of Birth <span class="required">*</span></label>
            <input id="dateOfBirth" v-model="formData.dateOfBirth" type="date" required />
          </div>

          <div class="form-group">
            <label for="placeOfBirth">Place of Birth <span class="required">*</span></label>
            <input
              id="placeOfBirth"
              v-model="formData.placeOfBirth"
              type="text"
              placeholder="City/Municipality"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="gender">Gender <span class="required">*</span></label>
            <select id="gender" v-model="formData.gender" required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div class="form-group">
            <label for="civilStatus">Civil Status <span class="required">*</span></label>
            <select id="civilStatus" v-model="formData.civilStatus" required>
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Purpose Section -->
      <div class="form-section">
        <h3>Certificate Purpose</h3>

        <div class="form-group">
          <label for="purpose">Purpose of Request <span class="required">*</span></label>
          <input
            id="purpose"
            v-model="formData.purpose"
            type="text"
            placeholder="e.g., EMPLOYMENT, LOCAL APPLICATION, etc."
            required
          />
          <small>Enter the reason for requesting this certificate</small>
        </div>
      </div>

      <!-- Official Information Section -->
      <div class="form-section">
        <h3>Issuing Official Information</h3>

        <div class="form-group">
          <label for="punongBarangay">Punong Barangay Name <span class="required">*</span></label>
          <input
            id="punongBarangay"
            v-model="formData.punongBarangay"
            type="text"
            placeholder="Enter Punong Barangay name"
            required
          />
        </div>

        <div class="form-group">
          <label for="kagawadOnDuty">Kagawad on Duty</label>
          <input
            id="kagawadOnDuty"
            v-model="formData.kagawadOnDuty"
            type="text"
            placeholder="Enter Kagawad name (optional)"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="form-actions">
        <button type="button" @click="handleReset" class="btn-secondary">Reset Form</button>
        <button type="submit" class="btn-primary" :disabled="isGenerating">
          {{ isGenerating ? 'Generating...' : 'Generate Certificate' }}
        </button>
      </div>
    </form>

    <!-- Success Message -->
    <div v-if="showSuccess" class="success-message">
      Certificate generated successfully! Check your downloads folder.
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { generateBarangayCertificate } from '@/services/certificateGenerator';
import type { ResidentInfo, OfficialInfo } from '@/types/certificate';

const formData = reactive({
  fullName: '',
  address: '',
  dateOfBirth: '',
  placeOfBirth: '',
  gender: '' as 'Male' | 'Female' | '',
  civilStatus: '' as 'Single' | 'Married' | 'Widowed' | 'Separated' | '',
  purpose: '',
  punongBarangay: '',
  kagawadOnDuty: '',
});

const isGenerating = ref(false);
const showSuccess = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
  try {
    isGenerating.value = true;
    errorMessage.value = '';
    showSuccess.value = false;

    // Validate form
    if (!formData.gender || !formData.civilStatus) {
      errorMessage.value = 'Please fill in all required fields';
      return;
    }

    // Prepare resident info
    const residentInfo: ResidentInfo = {
      fullName: formData.fullName,
      address: formData.address,
      dateOfBirth: formatDate(formData.dateOfBirth),
      placeOfBirth: formData.placeOfBirth,
      gender: formData.gender as 'Male' | 'Female',
      civilStatus: formData.civilStatus as 'Single' | 'Married' | 'Widowed' | 'Separated',
    };

    // Prepare official info
    const officialInfo: OfficialInfo = {
      punongBarangay: formData.punongBarangay,
      kagawadOnDuty: formData.kagawadOnDuty,
      position: 'Punong Barangay',
    };

    // Generate certificate
    const pdf = await generateBarangayCertificate(
      residentInfo,
      formData.purpose,
      officialInfo,
    );

    // Save the PDF
    const filename = `Barangay_Certification_${formData.fullName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    pdf.save(filename);

    // Show success message
    showSuccess.value = true;
    setTimeout(() => {
      showSuccess.value = false;
    }, 5000);
  } catch (error) {
    console.error('Error generating certificate:', error);
    errorMessage.value = 'Failed to generate certificate. Please try again.';
  } finally {
    isGenerating.value = false;
  }
};

const handleReset = () => {
  Object.assign(formData, {
    fullName: '',
    address: '',
    dateOfBirth: '',
    placeOfBirth: '',
    gender: '',
    civilStatus: '',
    purpose: '',
    punongBarangay: '',
    kagawadOnDuty: '',
  });
  errorMessage.value = '';
  showSuccess.value = false;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
</script>

<style scoped>
.certificate-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.form-header p {
  color: #7f8c8d;
}

.form-container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  color: #34495e;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

.required {
  color: #e74c3c;
}

input[type='text'],
input[type='date'],
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dfe6e9;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input[type='text']:focus,
input[type='date']:focus,
select:focus {
  outline: none;
  border-color: #3498db;
}

small {
  display: block;
  margin-top: 0.25rem;
  color: #7f8c8d;
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-primary:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover {
  background-color: #bdc3c7;
}

.success-message {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
  text-align: center;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
  text-align: center;
}

@media (max-width: 768px) {
  .certificate-form {
    padding: 1rem;
  }

  .form-container {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
