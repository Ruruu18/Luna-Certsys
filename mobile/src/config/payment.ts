// PayMongo Configuration
// SECURITY: API keys are loaded from environment variables

const PAYMONGO_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY || '';
const PAYMONGO_SECRET_KEY = process.env.EXPO_PUBLIC_PAYMONGO_SECRET_KEY || '';

if (!PAYMONGO_PUBLIC_KEY || !PAYMONGO_SECRET_KEY) {
  console.error('PayMongo API keys are not configured. Please set EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY and EXPO_PUBLIC_PAYMONGO_SECRET_KEY in your .env file');
}

export const PAYMONGO_CONFIG = {
  PUBLIC_KEY: PAYMONGO_PUBLIC_KEY,
  SECRET_KEY: PAYMONGO_SECRET_KEY,
  API_URL: 'https://api.paymongo.com/v1',
};

// Encode secret key for API authorization
export const getAuthHeader = () => {
  const base64 = Buffer.from(`${PAYMONGO_CONFIG.SECRET_KEY}:`).toString('base64');
  return `Basic ${base64}`;
};
