import { CertificateData } from '../../types/certificate';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

// Load logo assets
const lunaLogoAsset = Asset.fromModule(require('../../../assets/Luna-Icon.png'));
const surigaoLogoAsset = Asset.fromModule(require('../../../assets/images/surigaocity_logo.png'));

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
 * Generate HTML for Certificate of Residency
 */
export async function generateCertificateOfResidencyHTML(data: CertificateData): Promise<string> {
  // Convert logos to base64
  const lunaLogoBase64 = await assetToBase64(lunaLogoAsset);
  const surigaoLogoBase64 = await assetToBase64(surigaoLogoAsset);

  const {
    fullName,
    address,
    dateOfBirth,
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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Residency - ${fullName}</title>
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

    .cert-number {
      text-align: right;
      font-weight: bold;
      font-size: 9pt;
      margin-bottom: 8px;
    }

    .photo-box {
      float: right;
      width: 110px;
      height: 110px;
      border: 2px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      margin: 0 0 10px 15px;
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

    .certification-text {
      margin: 15px 0;
      text-indent: 40px;
    }

    .resident-info {
      margin: 15px 0;
      padding-left: 40px;
    }

    .info-item {
      margin: 5px 0;
    }

    .info-label {
      font-weight: bold;
      display: inline-block;
      min-width: 130px;
    }

    .purpose-section {
      margin: 15px 0;
      text-indent: 40px;
    }

    .issue-info {
      margin: 12px 0 8px;
      text-indent: 40px;
    }

    .signatures {
      margin-top: 20px;
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

    .official-seal {
      margin-top: 20px;
      text-align: center;
    }

    .seal-box {
      border: 2px solid #000;
      width: 100px;
      height: 100px;
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .seal-text {
      font-size: 8pt;
      color: #666;
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
      <img src="${lunaLogoBase64}" alt="Luna Logo" class="header-logo" />
      <div class="header-text">
        <p>Republic of the Philippines</p>
        <p>CARAGA Region XIII</p>
        <p>Province of Surigao del Norte</p>
        <p>City of Surigao</p>
        <h1>BARANGAY LUNA</h1>
        <h2>OFFICE OF THE PUNONG BARANGAY</h2>
      </div>
      <img src="${surigaoLogoBase64}" alt="Surigao City Logo" class="header-logo" />
    </div>

    <!-- Title -->
    <div class="title">CERTIFICATE OF RESIDENCY</div>

    <!-- Certificate Number -->
    <div class="cert-number">Certificate No. ${year} - ${certificateNumber}</div>

    <!-- Content -->
    <div class="content">
      <p class="to-whom">TO WHOM IT MAY CONCERN:</p>

      ${photoUrl ? `
      <div class="photo-box">
        <img src="${photoUrl}" alt="Resident Photo" />
      </div>
      ` : `
      <div class="photo-box">
        <div class="photo-placeholder">2x2<br/>PHOTO</div>
      </div>
      `}

      <p class="certification-text">
        This is to certify that the person named below is a bona fide resident of Barangay Luna,
        Surigao City, Surigao del Norte, and has been residing in this barangay.
      </p>

      <div class="resident-info">
        <div class="info-item">
          <span class="info-label">Name:</span>
          <span>${fullName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Address:</span>
          <span>${address}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date of Birth:</span>
          <span>${new Date(dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Gender:</span>
          <span>${gender}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Civil Status:</span>
          <span>${civilStatus}</span>
        </div>
      </div>

      <p class="purpose-section">
        This certification is issued upon the request of the above-named person for
        <strong>${purpose.toUpperCase()}</strong> purposes.
      </p>

      <p class="issue-info">
        Issued this <strong>${day}</strong> day of <strong>${month}, ${year}</strong>
        at Barangay Luna, Surigao City, Philippines.
      </p>
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Resident's Signature</div>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Punong Barangay</div>
      </div>
    </div>

    <!-- Official Seal -->
    <div class="official-seal">
      <div class="seal-box">
        <div class="seal-text">OFFICIAL<br/>SEAL</div>
      </div>
      <p style="font-size: 9pt; font-style: italic;">Not valid without official seal</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
