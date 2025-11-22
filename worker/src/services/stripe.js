
/**
 * Stripe payment integration service
 */

export async function createPaymentIntent(env, { amount, currency, metadata }) {
  try {
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency,
        'automatic_payment_methods[enabled]': 'true',
        ...Object.entries(metadata).reduce((acc, [key, value]) => {
          acc[`metadata[${key}]`] = value;
          return acc;
        }, {})
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    throw error;
  }
}

export async function handleStripeWebhook(env, payload, signature) {
  try {
    // Verify webhook signature
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    // Parse the event (signature verification would happen here in production)
    // For Cloudflare Workers, you may need to use crypto API for signature verification
    const event = JSON.parse(payload);

    // In production, verify the signature using:
    // const signature verification with crypto.subtle API
    
    return event;
  } catch (error) {
    console.error('Webhook verification error:', error);
    throw error;
  }
}

export async function retrievePaymentIntent(env, paymentIntentId) {
  try {
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to retrieve payment intent: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Retrieve payment intent error:', error);
    throw error;
  }
}

