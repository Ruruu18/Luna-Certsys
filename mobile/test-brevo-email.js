/**
 * Quick Brevo Email Test Script
 *
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Add your Brevo API key and sender email to .env
 * 3. Run with: node test-brevo-email.js
 */

require('dotenv').config();

const BREVO_API_KEY = process.env.EXPO_PUBLIC_BREVO_API_KEY;
const SENDER_EMAIL = process.env.EXPO_PUBLIC_BREVO_SENDER_EMAIL;
const SENDER_NAME = process.env.EXPO_PUBLIC_BREVO_SENDER_NAME || 'Luna CERTSYS';
const RECIPIENT_EMAIL = process.env.TEST_RECIPIENT_EMAIL || 'your-email@example.com';

async function testBrevoEmail() {
  console.log('🧪 Testing Brevo Email Service...\n');

  // Check if required environment variables are set
  if (!BREVO_API_KEY) {
    console.error('❌ Error: EXPO_PUBLIC_BREVO_API_KEY not found in .env file');
    console.error('Please add your Brevo API key to the .env file\n');
    process.exit(1);
  }

  if (!SENDER_EMAIL) {
    console.error('❌ Error: EXPO_PUBLIC_BREVO_SENDER_EMAIL not found in .env file');
    console.error('Please add your verified sender email to the .env file\n');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log('  From:', SENDER_EMAIL);
  console.log('  To:', RECIPIENT_EMAIL);
  console.log('  API Key:', BREVO_API_KEY.substring(0, 20) + '...\n');

  try {
    console.log('📧 Sending test email via Brevo API...');

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: SENDER_NAME,
          email: SENDER_EMAIL
        },
        to: [
          {
            email: RECIPIENT_EMAIL,
            name: 'Test Recipient'
          }
        ],
        subject: 'Test Email from Luna CERTSYS',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                margin-bottom: 20px;
              }
              .content {
                background: #f9fafb;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 20px;
              }
              .success-box {
                background: #d1fae5;
                border-left: 4px solid #10b981;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✅ Email Service Working!</h1>
            </div>

            <div class="content">
              <h2>Congratulations!</h2>
              <p>If you're reading this, it means your Brevo email service is configured correctly and working perfectly!</p>

              <div class="success-box">
                <strong>✓ Test Successful</strong><br>
                Your Luna CERTSYS application can now send emails for:
                <ul>
                  <li>Registration approvals</li>
                  <li>Password delivery</li>
                  <li>Certificate notifications</li>
                  <li>System alerts</li>
                </ul>
              </div>

              <p><strong>Sender:</strong> ${SENDER_EMAIL}</p>
              <p><strong>Service:</strong> Brevo (formerly Sendinblue)</p>
              <p><strong>Plan:</strong> Free Tier (300 emails/day)</p>
            </div>

            <div class="footer">
              <p>This is a test email from Luna CERTSYS</p>
              <p>Barangay Luna Management System</p>
              <p style="font-size: 12px; margin-top: 10px;">© 2025 Barangay Luna, Surigao City</p>
            </div>
          </body>
          </html>
        `
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('\n❌ Failed to send email!');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(data, null, 2));

      if (data.code === 'unauthorized_sender') {
        console.error('\n⚠️  SOLUTION: The sender email is not verified in Brevo!');
        console.error('   Please verify', SENDER_EMAIL, 'at:');
        console.error('   https://app.brevo.com/settings/senders\n');
      }

      process.exit(1);
    }

    console.log('\n✅ SUCCESS! Email sent successfully!');
    console.log('Message ID:', data.messageId);
    console.log('\n📬 Check the inbox at:', RECIPIENT_EMAIL);
    console.log('   (Don\'t forget to check spam folder!)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nMake sure you have internet connection and the API key is correct.\n');
    process.exit(1);
  }
}

// Run the test
testBrevoEmail();
