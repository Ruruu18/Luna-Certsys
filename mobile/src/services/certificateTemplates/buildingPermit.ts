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
 * Generate HTML for Barangay Building Permit
 */
export async function generateBuildingPermitHTML(data: CertificateData): Promise<string> {
  // Convert logos to base64
  const lunaLogoBase64 = await assetToBase64(lunaLogoAsset);
  const surigaoLogoBase64 = await assetToBase64(surigaoLogoAsset);

  const {
    fullName,
    address,
    purpose,
    issueDate,
    certificateNumber,
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
  <title>Barangay Building Permit - ${fullName}</title>
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
      border: 2px solid #000;
      padding: 8px;
    }

    .header {
      text-align: center;
      margin-bottom: 8px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
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
      color: #006400;
    }

    .title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin: 5px 0;
      letter-spacing: 1px;
      color: #006400;
      text-transform: uppercase;
    }

    .subtitle {
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      margin-bottom: 8px;
      font-style: italic;
    }

    .permit-number {
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      margin-bottom: 8px;
      padding: 5px;
      background: #f0f0f0;
      border: 1px solid #000;
    }

    .content {
      margin: 10px 0;
      font-size: 10pt;
    }

    .certification-text {
      text-align: justify;
      margin: 8px 0;
      padding: 6px;
      background: #f9f9f9;
      border-left: 3px solid #006400;
      font-size: 9pt;
      line-height: 1.2;
    }

    .info-section {
      margin: 8px 0;
      padding: 6px;
      border: 1px solid #000;
    }

    .info-row {
      margin: 3px 0;
      display: flex;
    }

    .info-label {
      font-weight: bold;
      min-width: 140px;
      font-size: 9pt;
    }

    .info-value {
      flex: 1;
      border-bottom: 1px solid #000;
      padding-left: 6px;
      font-size: 9pt;
    }

    .conditions {
      margin: 8px 0;
      padding: 6px;
      background: #e6ffe6;
      border: 1px solid #006400;
    }

    .conditions h3 {
      font-size: 9pt;
      margin-bottom: 4px;
      text-align: center;
      text-decoration: underline;
      color: #006400;
    }

    .conditions ol {
      margin-left: 18px;
      margin-top: 4px;
    }

    .conditions li {
      margin: 1px 0;
      font-size: 7.5pt;
      line-height: 1.2;
    }

    .warning-box {
      text-align: center;
      margin: 8px 0;
      padding: 5px;
      background: #fff3cd;
      border: 2px solid #ff8c00;
      font-weight: bold;
      font-size: 8pt;
      color: #cc6600;
    }

    .signatures {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
    }

    .signature-block {
      text-align: center;
      width: 30%;
    }

    .signature-line {
      border-bottom: 1px solid #000;
      margin-bottom: 2px;
      height: 20px;
    }

    .signature-label {
      font-weight: bold;
      font-size: 7.5pt;
    }

    .signature-title {
      font-size: 6.5pt;
      font-style: italic;
      margin-top: 1px;
    }

    .footer {
      margin-top: 8px;
      text-align: center;
      font-size: 7pt;
      padding-top: 5px;
      border-top: 1px solid #000;
      line-height: 1.2;
    }

    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80pt;
      color: rgba(0, 100, 0, 0.03);
      z-index: -1;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="watermark">BUILDING PERMIT</div>

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
        <h2>BARANGAY BUILDING CLEARANCE</h2>
      </div>
      <img src="${surigaoLogoBase64}" alt="Surigao City Logo" class="header-logo" />
    </div>

    <!-- Title -->
    <div class="title">BUILDING PERMIT</div>
    <div class="subtitle">Barangay Clearance for Construction/Renovation</div>

    <!-- Permit Number -->
    <div class="permit-number">
      CLEARANCE NO.: ${year}-BUILD-${certificateNumber}
    </div>

    <!-- Certification Text -->
    <div class="certification-text">
      <p style="font-weight: bold; text-align: center; margin-bottom: 4px; font-size: 9pt;">BARANGAY CERTIFICATION</p>
      <p style="font-size: 8.5pt;">
        This is to certify that the Barangay has NO OBJECTION to the proposed construction/renovation
        at the property owned by the applicant named below, subject to compliance with all applicable
        building codes and barangay ordinances.
      </p>
    </div>

    <!-- Property & Owner Information -->
    <div class="info-section">
      <div class="info-row">
        <span class="info-label">Property Owner:</span>
        <span class="info-value">${fullName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Property Address:</span>
        <span class="info-value">${address}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type of Construction:</span>
        <span class="info-value">${purpose}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date Issued:</span>
        <span class="info-value">${month} ${day}, ${year}</span>
      </div>
    </div>

    <!-- Warning -->
    <div class="warning-box">
      ⚠ THIS IS ONLY A BARANGAY CLEARANCE ⚠<br/>
      A BUILDING PERMIT FROM THE CITY ENGINEER'S OFFICE IS STILL REQUIRED
    </div>

    <!-- Conditions -->
    <div class="conditions">
      <h3>CONDITIONS AND REQUIREMENTS</h3>
      <ol>
        <li>This clearance is valid for six (6) months from date of issuance.</li>
        <li>Construction must not cause inconvenience to neighboring properties.</li>
        <li>All construction materials must be properly stored within the property.</li>
        <li>Construction work must be conducted during reasonable hours (7:00 AM - 6:00 PM).</li>
        <li>The property owner must secure all necessary permits from concerned government offices.</li>
        <li>The barangay reserves the right to revoke this clearance if violations are observed.</li>
        <li>This clearance does not exempt the owner from obtaining proper building permits from the city.</li>
      </ol>
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Property Owner</div>
        <div class="signature-title">Signature over Printed Name</div>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Barangay Kagawad</div>
        <div class="signature-title">Attested by</div>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Punong Barangay</div>
        <div class="signature-title">Approved by</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This clearance is issued by Barangay Luna as a prerequisite for building permit application.</p>
      <p>For inquiries, contact Barangay Luna Office</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
