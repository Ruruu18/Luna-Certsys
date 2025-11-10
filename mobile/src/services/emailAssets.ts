/**
 * Email Template Assets Configuration
 *
 * IMPORTANT: For emails to display images properly, the images must be hosted
 * on a publicly accessible URL (not local file paths).
 *
 * Options for hosting images:
 * 1. Use your own web server/domain
 * 2. Use a CDN like Cloudinary, AWS S3, or Firebase Storage
 * 3. Use free image hosting services like:
 *    - ImgBB (https://imgbb.com)
 *    - Imgur (https://imgur.com)
 *    - Postimages (https://postimages.org)
 *
 * To upload the images:
 * - Barangay Luna Seal: /mobile/assets/Luna-Icon.png
 * - eLuna CERTSYS Logo: /mobile/assets/images/logo.png
 *
 * After uploading, replace the URLs below with the actual hosted URLs.
 */

export const EMAIL_ASSETS = {
  // Barangay Luna Surigao City Official Seal (circular logo)
  // TODO: Upload Luna-Icon.png and paste the URL here
  BARANGAY_SEAL_URL: 'https://your-cdn-here.com/Luna-Icon.png',

  // Luna CERTSYS System Logo (full logo with text)
  // TODO: Upload logo.png and paste the URL here
  LUNA_LOGO_URL: 'https://your-cdn-here.com/Luna-CERTSYS-Logo.png',
};

/**
 * Quick Setup Instructions:
 *
 * 1. Go to https://imgbb.com (or any image hosting service)
 * 2. Upload /mobile/assets/Luna-Icon.png
 * 3. Copy the direct link and paste it in BARANGAY_SEAL_URL above
 * 4. Upload /mobile/assets/images/logo.png
 * 5. Copy the direct link and paste it in ELUNA_LOGO_URL above
 * 6. Save this file
 * 7. Test the email by going to Dashboard → Test Email
 */
