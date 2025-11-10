import { CertificateData } from '../../types/certificate';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

// Load logo assets
const lunaLogoAsset = Asset.fromModule(require('../../../assets/Luna-Icon.png'));
// Using logo.png as placeholder - replace with actual Surigao City logo when available
const surigaoLogoAsset = Asset.fromModule(require('../../../assets/images/logo.png'));

/**
 * Convert asset to base64
 */
async function assetToBase64(asset: Asset): Promise<string> {
  await asset.downloadAsync();
  const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/png;base64,${base64}`;
}

/**
 * Generate HTML for Barangay Certification
 * Based on the official Barangay Luna format
 */
export async function generateBarangayCertificationHTML(data: CertificateData): Promise<string> {
  // Convert logos to base64
  const lunaLogoBase64 = await assetToBase64(lunaLogoAsset);
  const surigaoLogoBase64 = await assetToBase64(surigaoLogoAsset);
  const {
    fullName,
    address,
    dateOfBirth,
    placeOfBirth,
    gender,
    civilStatus,
    purpose,
    issueDate,
    certificateNumber,
    photoUrl,
  } = data;

  // Format date
  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return { day, month, year };
  };

  const { day, month, year } = formatDate(issueDate);

  // Format date of birth
  const formattedDOB = new Date(dateOfBirth).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Barangay Certification - ${fullName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 10mm 15mm;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
      background: #fff;
      padding: 5px;
    }

    .container {
      max-width: 700px;
      margin: 0 auto;
      position: relative;
    }

    .header {
      text-align: center;
      margin-bottom: 8px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
    }

    .header-logo {
      width: 55px;
      height: 55px;
      object-fit: contain;
    }

    .header-text {
      line-height: 1.2;
      font-size: 9pt;
      flex: 1;
      text-align: center;
    }

    .header-text h1 {
      font-size: 12pt;
      font-weight: bold;
      margin: 2px 0;
    }

    .header-text h2 {
      font-size: 11pt;
      font-weight: bold;
      margin: 1px 0;
    }

    .title {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      font-style: italic;
      margin: 8px 0 10px;
      letter-spacing: 1px;
    }

    .content {
      text-align: justify;
      margin: 8px 0;
      font-size: 10pt;
    }

    .to-whom {
      font-weight: bold;
      margin-bottom: 8px;
    }

    .details-section {
      margin: 10px 0;
      position: relative;
    }

    .details-row {
      margin: 3px 0;
      display: flex;
      align-items: baseline;
    }

    .details-label {
      font-weight: bold;
      min-width: 130px;
      display: inline-block;
      font-size: 10pt;
    }

    .details-value {
      flex: 1;
      border-bottom: 1px solid #000;
      padding-left: 6px;
      display: inline-block;
      font-size: 10pt;
    }

    .photo-box {
      position: absolute;
      right: 0;
      top: 0;
      width: 110px;
      height: 110px;
      border: 2px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }

    .photo-box img {
      max-width: 100%;
      max-height: 100%;
      object-fit: cover;
    }

    .photo-placeholder {
      color: #999;
      font-size: 8pt;
      text-align: center;
    }

    .purpose-section {
      margin: 10px 0;
      font-size: 10pt;
    }

    .issue-info {
      margin: 12px 0 8px;
      font-size: 10pt;
    }

    .cert-number {
      position: absolute;
      right: 0;
      top: -12px;
      font-weight: bold;
      font-size: 9pt;
    }

    .signatures {
      margin-top: 15px;
      display: flex;
      justify-content: space-between;
    }

    .signature-block {
      text-align: center;
      width: 45%;
    }

    .signature-line {
      border-bottom: 1px solid #000;
      margin-bottom: 3px;
      height: 30px;
    }

    .signature-label {
      font-weight: bold;
      font-size: 9pt;
    }

    .authority-section {
      margin-top: 15px;
      text-align: right;
    }

    .authority-title {
      font-size: 9pt;
      margin-bottom: 3px;
    }

    .authority-signature {
      margin-top: 12px;
      text-align: center;
    }

    .official-title {
      font-style: italic;
      text-decoration: underline;
      margin-top: 2px;
      font-size: 9pt;
    }

    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80pt;
      color: rgba(0, 0, 0, 0.05);
      z-index: -1;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="watermark">BARANGAY LUNA</div>

  <div class="container">
    <!-- Header -->
    <div class="header">
      <!-- Luna Logo (Left) -->
      <img src="${lunaLogoBase64}" alt="Luna Logo" class="header-logo" />

      <!-- Header Text (Center) -->
      <div class="header-text">
        <p>Republic of the Philippines</p>
        <p>CARAGA Region XIII</p>
        <p>Province of Surigao del Norte</p>
        <p>City of Surigao</p>
        <h1>BARANGAY LUNA</h1>
        <h2>OFFICE OF THE PUNONG BARANGAY</h2>
      </div>

      <!-- Surigao City Logo (Right) -->
      <img src="${surigaoLogoBase64}" alt="Surigao City Logo" class="header-logo" />
    </div>

    <!-- Title -->
    <div class="title">BARANGAY CERTIFICATION</div>

    <!-- Content -->
    <div class="content">
      <p class="to-whom">TO WHOM IT MAY CONCERN:</p>

      <p style="text-indent: 40px; margin-bottom: 10px;">
        This is to certify that the person whose name and signature appear herein is a bonafide resident of this Barangay.
      </p>

      <!-- Details Section with Photo -->
      <div class="details-section">
        <div class="cert-number">${year} - ${certificateNumber}</div>

        ${photoUrl ? `
        <div class="photo-box">
          <img src="${photoUrl}" alt="Applicant Photo" />
        </div>
        ` : `
        <div class="photo-box">
          <div class="photo-placeholder">2x2<br/>PHOTO</div>
        </div>
        `}

        <div style="padding-right: 130px;">
          <div class="details-row">
            <span class="details-label">FULL NAME:</span>
            <span class="details-value">${fullName}</span>
          </div>
          <div class="details-row">
            <span class="details-label">ADDRESS:</span>
            <span class="details-value">${address}</span>
          </div>
          <div class="details-row">
            <span class="details-label">DATE OF BIRTH:</span>
            <span class="details-value">${formattedDOB}</span>
          </div>
          <div class="details-row">
            <span class="details-label">PLACE OF BIRTH:</span>
            <span class="details-value">${placeOfBirth}</span>
          </div>
          <div class="details-row">
            <span class="details-label">GENDER:</span>
            <span class="details-value">${gender}</span>
          </div>
          <div class="details-row">
            <span class="details-label">CIVIL STATUS:</span>
            <span class="details-value">${civilStatus}</span>
          </div>
        </div>
      </div>

      <!-- Purpose -->
      <div class="purpose-section">
        <p>
          This certification is issued upon the request of the above-mentioned person as a requirement for
          <strong>${purpose.toUpperCase()}</strong>
        </p>
      </div>

      <!-- Issue Info -->
      <div class="issue-info">
        <p>Issued this <strong>${day}</strong> day of <strong>${month}</strong> at Barangay Luna, Surigao City, Philippines.</p>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">APPLICANT</div>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Punong Barangay</div>
      </div>
    </div>

    <!-- Authority Section -->
    <div class="authority-section">
      <p class="authority-title">By the Authority of the Punong Barangay:</p>

      <div class="authority-signature">
        <div style="height: 25px;"></div>
        <p class="official-title">(SIGNATURE OVER PRINTED NAME)</p>
        <p style="font-size: 9pt; margin: 1px 0;">Barangay Capitan/Kagawad:</p>
        <p style="font-size: 9pt; margin: 1px 0;">Capitan/Kagawad on Duty</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
