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
 * Generate HTML for Barangay Business Permit
 */
export async function generateBusinessPermitHTML(data: CertificateData): Promise<string> {
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

  // Business name from purpose or default
  const businessName = purpose.includes('Business') ? purpose : `${purpose} Business`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Barangay Business Permit - ${fullName}</title>
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
      padding: 10px;
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
      color: #c00;
    }

    .title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin: 6px 0;
      letter-spacing: 1px;
      color: #c00;
      text-transform: uppercase;
    }

    .subtitle {
      text-align: center;
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 8px;
      font-style: italic;
    }

    .permit-number {
      text-align: center;
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 10px;
      padding: 6px;
      background: #f0f0f0;
      border: 1px solid #000;
    }

    .content {
      margin: 10px 0;
      font-size: 10pt;
    }

    .info-section {
      margin: 10px 0;
      padding: 8px;
      border: 1px solid #000;
      background: #f9f9f9;
    }

    .info-row {
      margin: 4px 0;
      display: flex;
    }

    .info-label {
      font-weight: bold;
      min-width: 150px;
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
      padding: 8px;
      background: #fff9e6;
      border: 1px solid #000;
    }

    .conditions h3 {
      font-size: 9pt;
      margin-bottom: 5px;
      text-align: center;
      text-decoration: underline;
    }

    .conditions ol {
      margin-left: 20px;
      margin-top: 5px;
    }

    .conditions li {
      margin: 2px 0;
      font-size: 8pt;
      line-height: 1.2;
    }

    .validity {
      text-align: center;
      margin: 8px 0;
      padding: 6px;
      background: #ffe6e6;
      border: 2px solid #c00;
      font-weight: bold;
      font-size: 9pt;
    }

    .signatures {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
    }

    .signature-block {
      text-align: center;
      width: 45%;
    }

    .signature-line {
      border-bottom: 1px solid #000;
      margin-bottom: 2px;
      height: 25px;
    }

    .signature-label {
      font-weight: bold;
      font-size: 8pt;
    }

    .signature-title {
      font-size: 7pt;
      font-style: italic;
      margin-top: 1px;
    }

    .footer {
      margin-top: 8px;
      text-align: center;
      font-size: 7pt;
      padding-top: 6px;
      border-top: 1px solid #000;
    }

    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80pt;
      color: rgba(0, 0, 0, 0.03);
      z-index: -1;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="watermark">BUSINESS PERMIT</div>

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
        <h2>BUSINESS PERMIT AND LICENSE</h2>
      </div>
      <img src="${surigaoLogoBase64}" alt="Surigao City Logo" class="header-logo" />
    </div>

    <!-- Title -->
    <div class="title">BARANGAY BUSINESS PERMIT</div>
    <div class="subtitle">This permit authorizes the business operation within barangay jurisdiction</div>

    <!-- Permit Number -->
    <div class="permit-number">
      PERMIT NO.: ${year}-BP-${certificateNumber}
    </div>

    <!-- Business Information -->
    <div class="info-section">
      <div class="info-row">
        <span class="info-label">Business Name:</span>
        <span class="info-value">${businessName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Business Owner:</span>
        <span class="info-value">${fullName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Business Address:</span>
        <span class="info-value">${address}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type of Business:</span>
        <span class="info-value">${purpose}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date Issued:</span>
        <span class="info-value">${month} ${day}, ${year}</span>
      </div>
    </div>

    <!-- Validity Period -->
    <div class="validity">
      VALID FOR ONE (1) YEAR FROM DATE OF ISSUANCE
    </div>

    <!-- Conditions -->
    <div class="conditions">
      <h3>CONDITIONS AND REQUIREMENTS</h3>
      <ol>
        <li>This permit must be displayed in a conspicuous place within the business premises.</li>
        <li>This permit is non-transferable and valid only for the business stated herein.</li>
        <li>The permit holder must comply with all barangay ordinances and regulations.</li>
        <li>This permit must be renewed annually before expiration.</li>
        <li>Violation of any barangay regulation may result in permit suspension or revocation.</li>
        <li>The business must maintain cleanliness and orderliness in its premises.</li>
      </ol>
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Business Owner</div>
        <div class="signature-title">Signature over Printed Name</div>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Punong Barangay</div>
        <div class="signature-title">Approved by</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This document is issued by the Barangay Luna and is an official permit.</p>
      <p>For inquiries, contact Barangay Luna Office</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
