import { printAsync, printToFileAsync } from 'expo-print';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { File } from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import { Asset } from 'expo-asset';

interface Transaction {
  id: string;
  referenceNumber: string;
  certificateType: string;
  amount: number;
  paymentMethod: string;
  status: string;
  date: string;
  receiptNumber?: string;
}

const getLogoBase64 = async (): Promise<string> => {
  try {
    const asset = Asset.fromModule(require('../../assets/Luna-Icon.png'));
    await asset.downloadAsync();

    if (asset.localUri) {
      // Use the new File API
      const file = new File(asset.localUri);
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Convert to base64
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      return `data:image/png;base64,${base64}`;
    }
  } catch (error) {
    console.error('Error loading logo:', error);
  }
  return '';
};

const generateReceiptHTML = (transaction: Transaction, logoBase64: string = ''): string => {
  const currentDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 40px;
            background: #f5f5f5;
          }

          .receipt {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }

          .header {
            text-align: center;
            padding-bottom: 30px;
            border-bottom: 2px solid #FCD116;
            margin-bottom: 30px;
          }

          .logo-container {
            margin-bottom: 20px;
          }

          .logo-image {
            width: 120px;
            height: 120px;
            margin: 0 auto;
            display: block;
          }

          .barangay-info {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
          }

          .receipt-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 1px;
            margin-bottom: 20px;
          }

          .status-paid {
            background: #d4edda;
            color: #155724;
          }

          .status-pending {
            background: #fff3cd;
            color: #856404;
          }

          .status-failed {
            background: #f8d7da;
            color: #721c24;
          }

          .amount-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: center;
          }

          .amount-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .amount-value {
            font-size: 42px;
            font-weight: bold;
            color: #4A90E2;
          }

          .details-section {
            margin: 30px 0;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            border-bottom: 1px solid #eee;
          }

          .detail-row:last-child {
            border-bottom: none;
          }

          .detail-label {
            color: #666;
            font-size: 14px;
            font-weight: 500;
          }

          .detail-value {
            color: #333;
            font-size: 14px;
            font-weight: 600;
            text-align: right;
            max-width: 60%;
            word-wrap: break-word;
          }

          .footer {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #eee;
            text-align: center;
          }

          .footer-note {
            color: #999;
            font-size: 12px;
            line-height: 1.6;
            margin-bottom: 15px;
          }

          .generated-at {
            color: #bbb;
            font-size: 11px;
            font-style: italic;
          }

          @media print {
            body {
              background: white;
              padding: 0;
            }

            .receipt {
              box-shadow: none;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            ${logoBase64 ? `
            <div class="logo-container">
              <img src="${logoBase64}" class="logo-image" alt="Barangay Luna Seal" />
            </div>
            ` : ''}
            <div class="barangay-info">
              <strong>BARANGAY LUNA</strong><br />
              Surigao City, Philippines<br />
              Official Payment Receipt
            </div>
          </div>

          <div class="receipt-title">Payment Receipt</div>

          <div style="text-align: center;">
            <span class="status-badge status-${transaction.status.toLowerCase()}">
              ${transaction.status}
            </span>
          </div>

          <div class="amount-section">
            <div class="amount-label">Total Amount Paid</div>
            <div class="amount-value">₱${transaction.amount.toFixed(2)}</div>
          </div>

          <div class="details-section">
            <div class="detail-row">
              <span class="detail-label">Reference Number</span>
              <span class="detail-value">${transaction.referenceNumber}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Certificate Type</span>
              <span class="detail-value">${transaction.certificateType}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Payment Method</span>
              <span class="detail-value">${transaction.paymentMethod}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Transaction Date</span>
              <span class="detail-value">${transaction.date}</span>
            </div>

            ${transaction.receiptNumber ? `
            <div class="detail-row">
              <span class="detail-label">Receipt Number</span>
              <span class="detail-value">${transaction.receiptNumber}</span>
            </div>
            ` : ''}

            <div class="detail-row">
              <span class="detail-label">Transaction ID</span>
              <span class="detail-value">${transaction.id}</span>
            </div>
          </div>

          <div class="footer">
            <div class="footer-note">
              This is an official receipt issued by Barangay Luna.<br />
              For verification or inquiries, please contact:<br />
              <strong>brgy_luna@surigao.gov.ph</strong> | <strong>09123456789</strong>
            </div>
            <div class="generated-at">
              Generated on: ${currentDate}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const downloadReceipt = async (transaction: Transaction): Promise<void> => {
  try {
    // Check if sharing is available
    const isSharingAvailable = await isAvailableAsync();

    if (!isSharingAvailable) {
      Alert.alert(
        'Sharing Not Available',
        'Sharing is not available on this device. Please try on a different device.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Load the logo as base64
    const logoBase64 = await getLogoBase64();

    // Generate HTML content
    const html = generateReceiptHTML(transaction, logoBase64);

    // Generate PDF
    const { uri } = await printToFileAsync({
      html,
      base64: false,
    });

    // Share the file directly (no need to move it in the new API)
    await shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save or Share Receipt',
      UTI: 'com.adobe.pdf',
    });

    Alert.alert(
      'Receipt Downloaded',
      'Your receipt has been generated successfully!',
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('Error generating receipt:', error);
    Alert.alert(
      'Download Failed',
      'Failed to generate receipt. Please try again.',
      [{ text: 'OK' }]
    );
  }
};

export const printReceipt = async (transaction: Transaction): Promise<void> => {
  try {
    // Load the logo as base64
    const logoBase64 = await getLogoBase64();

    // Generate HTML content
    const html = generateReceiptHTML(transaction, logoBase64);

    // Print the receipt
    await printAsync({
      html,
    });
  } catch (error) {
    console.error('Error printing receipt:', error);
    Alert.alert(
      'Print Failed',
      'Failed to print receipt. Would you like to download it instead?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => downloadReceipt(transaction) },
      ]
    );
  }
};
