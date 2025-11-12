/**
 * Email Service for Luna CERTSYS
 * Sends emails for registration approval, password delivery, etc.
 */

import { EMAIL_ASSETS } from './emailAssets';

const RESEND_API_KEY = process.env.EXPO_PUBLIC_RESEND_API_KEY;

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface PasswordEmailParams {
  recipientEmail: string;
  recipientName: string;
  password: string;
  purokChairmanName: string;
}

/**
 * Send email using Resend API
 * Resend is a modern email service perfect for transactional emails
 * Sign up at: https://resend.com
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not found in environment variables');
      return {
        success: false,
        error: 'Email service not configured. Please add RESEND_API_KEY to .env'
      };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from || 'Luna CERTSYS <onboarding@resend.dev>', // Resend testing domain (no verification needed)
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Email sending failed:', data);
      return {
        success: false,
        error: data.message || 'Failed to send email'
      };
    }

    console.log('✅ Email sent successfully:', data);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Email service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}

/**
 * Send registration approval email with password
 */
export async function sendPasswordEmail(params: PasswordEmailParams): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Approved - Luna CERTSYS</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 20px;
        }
        .barangay-seal {
          width: 80px;
          height: 80px;
        }
        .system-logo {
          max-width: 300px;
          height: auto;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        h1 {
          color: #059669;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .password-box {
          background-color: #eff6ff;
          border: 2px dashed #2563eb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .password {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
          letter-spacing: 2px;
          font-family: 'Courier New', monospace;
          user-select: all;
        }
        .instructions {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
        }
        .steps {
          margin: 20px 0;
        }
        .step {
          margin: 10px 0;
          padding-left: 30px;
          position: relative;
        }
        .step::before {
          content: "→";
          position: absolute;
          left: 0;
          color: #2563eb;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 12px 30px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin: 20px 0;
        }
        .warning {
          color: #dc2626;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <img src="${EMAIL_ASSETS.BARANGAY_SEAL_URL}" alt="Barangay Luna Seal" class="barangay-seal" />
            <img src="${EMAIL_ASSETS.LUNA_LOGO_URL}" alt="Luna CERTSYS" class="system-logo" />
          </div>
          <h1>✓ Registration Approved!</h1>
        </div>

        <div class="content">
          <p>Hello <strong>${params.recipientName}</strong>,</p>

          <p>Great news! Your registration request has been approved by <strong>${params.purokChairmanName}</strong>, your Purok Chairman.</p>

          <p>Your Luna CERTSYS account is now active and ready to use! You can now access the mobile app and request barangay certificates.</p>

          <div class="password-box">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Your Temporary Password</p>
            <div class="password">${params.password}</div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">Copy this password to login</p>
          </div>

          <div class="instructions">
            <p style="margin: 0; font-weight: 600;">⚠️ Important Security Notice</p>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Please change this temporary password immediately after your first login for security purposes.</p>
          </div>

          <div class="steps">
            <h3 style="margin-bottom: 15px;">How to Login:</h3>
            <div class="step">Open the Luna CERTSYS mobile app</div>
            <div class="step">Enter your email: <strong>${params.recipientEmail}</strong></div>
            <div class="step">Enter the temporary password shown above</div>
            <div class="step">Go to Settings → Change Password</div>
            <div class="step">Set a new secure password</div>
          </div>
        </div>

        <div class="footer">
          <p>If you did not request this account, please contact your Purok Chairman immediately.</p>
          <p style="margin-top: 10px;">This is an automated message from Luna CERTSYS - Barangay Luna Management System</p>
          <p style="margin-top: 10px; font-size: 12px;">© 2025 Barangay Luna, Surigao City. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: params.recipientEmail,
    subject: '✓ Your Luna CERTSYS Account is Approved! 🎉',
    html,
  });
}

/**
 * Send test email (for debugging)
 */
export async function sendTestEmail(recipientEmail: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: recipientEmail,
    subject: 'Test Email from Luna CERTSYS',
    html: '<h1>Test Email</h1><p>If you received this, your email service is working!</p>',
  });
}
