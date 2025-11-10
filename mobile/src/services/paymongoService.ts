import { PAYMONGO_CONFIG } from '../config/payment';

export interface PaymentIntent {
  id: string;
  type: string;
  attributes: {
    amount: number;
    currency: string;
    description: string;
    statement_descriptor: string;
    status: string;
    client_key: string;
    created_at: number;
    updated_at: number;
  };
}

export interface PaymentMethodResponse {
  id: string;
  type: string;
  attributes: {
    type: string;
    billing: any;
    details: any;
  };
}

/**
 * Create a PayMongo Payment Intent
 * @param amount - Amount in centavos (multiply by 100 from peso)
 * @param description - Payment description
 * @returns Payment intent object
 */
export const createPaymentIntent = async (
  amount: number,
  description: string
): Promise<PaymentIntent> => {
  try {
    const response = await fetch(`${PAYMONGO_CONFIG.API_URL}/payment_intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${PAYMONGO_CONFIG.SECRET_KEY}:`)}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amount * 100, // Convert to centavos
            payment_method_allowed: ['paymaya', 'card'],
            payment_method_options: {
              card: {
                request_three_d_secure: 'any',
              },
            },
            currency: 'PHP',
            description,
            statement_descriptor: 'Barangay Certificate',
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to create payment intent');
    }

    return data.data;
  } catch (error) {
    console.error('PayMongo Payment Intent Error:', error);
    throw error;
  }
};

/**
 * Create a PayMongo Payment Method (for GCash/PayMaya/GrabPay)
 * @param paymentIntentId - Payment intent ID
 * @param type - Payment method type (gcash, paymaya, grab_pay)
 * @returns Payment method object
 */
export const createPaymentMethod = async (
  paymentIntentId: string,
  type: 'gcash' | 'paymaya' | 'grab_pay' = 'gcash'
): Promise<PaymentMethodResponse> => {
  try {
    const response = await fetch(`${PAYMONGO_CONFIG.API_URL}/payment_methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${PAYMONGO_CONFIG.SECRET_KEY}:`)}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type,
            billing: {
              name: 'Barangay Luna Resident',
              email: 'resident@brgyluna.gov.ph',
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to create payment method');
    }

    return data.data;
  } catch (error) {
    console.error('PayMongo Payment Method Error:', error);
    throw error;
  }
};

/**
 * Attach payment method to payment intent and generate QR code
 * @param paymentIntentId - Payment intent ID
 * @param paymentMethodId - Payment method ID
 * @param returnUrl - URL to return after payment (optional for QR)
 * @returns Payment intent with checkout URL
 */
export const attachPaymentMethod = async (
  paymentIntentId: string,
  paymentMethodId: string,
  returnUrl?: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${PAYMONGO_CONFIG.API_URL}/payment_intents/${paymentIntentId}/attach`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${PAYMONGO_CONFIG.SECRET_KEY}:`)}`,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodId,
              return_url: returnUrl || 'https://barangayluna.gov.ph/payment/success',
            },
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to attach payment method');
    }

    return data.data;
  } catch (error) {
    console.error('PayMongo Attach Payment Error:', error);
    throw error;
  }
};

/**
 * Create a PayMongo Source for QR payments (GCash, GrabPay)
 * Note: PayMaya is not supported via Sources API - use Payment Intents instead
 * @param amount - Amount in pesos
 * @param description - Payment description
 * @param type - Source type (gcash, grab_pay)
 * @returns Source object with checkout URL and QR code
 */
export const createPaymentSource = async (
  amount: number,
  description: string,
  type: 'gcash' | 'grab_pay' = 'gcash'
): Promise<any> => {
  try {
    const response = await fetch(`${PAYMONGO_CONFIG.API_URL}/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${PAYMONGO_CONFIG.SECRET_KEY}:`)}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amount * 100, // Convert to centavos
            redirect: {
              success: 'https://barangayluna.gov.ph/payment/success',
              failed: 'https://barangayluna.gov.ph/payment/failed',
            },
            type,
            currency: 'PHP',
            description,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to create payment source');
    }

    return data.data;
  } catch (error) {
    console.error('PayMongo Source Error:', error);
    throw error;
  }
};

/**
 * Get payment status
 * @param paymentIntentId - Payment intent ID
 * @returns Payment intent status
 */
export const getPaymentStatus = async (paymentIntentId: string): Promise<string> => {
  try {
    const response = await fetch(
      `${PAYMONGO_CONFIG.API_URL}/payment_intents/${paymentIntentId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${PAYMONGO_CONFIG.SECRET_KEY}:`)}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to get payment status');
    }

    return data.data.attributes.status;
  } catch (error) {
    console.error('PayMongo Status Check Error:', error);
    throw error;
  }
};

/**
 * Get source status (for QR payments)
 * @param sourceId - Source ID
 * @returns Source status and details
 */
export const getSourceStatus = async (sourceId: string): Promise<any> => {
  try {
    const response = await fetch(`${PAYMONGO_CONFIG.API_URL}/sources/${sourceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${PAYMONGO_CONFIG.SECRET_KEY}:`)}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to get source status');
    }

    return data.data;
  } catch (error) {
    console.error('PayMongo Source Status Error:', error);
    throw error;
  }
};
