// worker/src/index.js
import { Router } from 'itty-router';
import { corsHeaders, jsonResponse, errorResponse } from './utils/responses';
import { validateBooking, validatePayment } from './utils/validation';
import { createBooking, getBooking } from './services/database';
import { sendBookingEmails } from './services/email';
import { addToCRM } from './services/crm';
import { createPaymentIntent, handleStripeWebhook } from './services/stripe';

const router = Router();

// CORS preflight handler
router.options('*', () => new Response(null, { headers: corsHeaders }));

// Health check endpoint
router.get('/api/health', () => {
  return jsonResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 🌱 NEW ROOT ENDPOINT
router.get('/', () => {
  return jsonResponse({
    success: true,
    message: 'One Hour Offers API is live',
    endpoints: [
      '/api/health',
      '/api/services',
      '/api/bookings',
      '/api/create-payment-intent',
      '/api/webhooks/stripe'
    ]
  });
});

// Create booking endpoint
router.post('/api/bookings', async (request, env, ctx) => {
  try {
    const data = await request.json();
    
    // Validate input
    const validation = validateBooking(data);
    if (!validation.valid) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    // Rate limiting with KV
    const clientIP = request.headers.get('CF-Connecting-IP');
    const rateLimitKey = `ratelimit:${clientIP}`;
    const requestCount = await env.CACHE.get(rateLimitKey);

    if (requestCount && parseInt(requestCount) > 10) {
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    await env.CACHE.put(rateLimitKey, (parseInt(requestCount || 0) + 1).toString(), {
      expirationTtl: 60 * 15
    });

    // Generate booking ID
    const bookingId = `BOOK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create booking
    const booking = await createBooking(env.DB, {
      ...data,
      bookingId,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    // Send emails (async)
    ctx.waitUntil(
      sendBookingEmails(env, {
        ...data,
        bookingId: booking.bookingId
      })
    );

    // Add to CRM (async)
    ctx.waitUntil(
      addToCRM(env, {
        ...data,
        bookingId: booking.bookingId
      })
    );

    return jsonResponse({
      success: true,
      message: 'Booking created successfully',
      bookingId: booking.bookingId,
      data: {
        id: booking.id,
        bookingId: booking.bookingId,
        status: booking.status,
        serviceName: booking.serviceName,
        preferredDate: booking.preferredDate
      }
    }, 201);

  } catch (error) {
    console.error('Booking error:', error);
    return errorResponse('Failed to create booking. Please try again.', 500);
  }
});

// Get booking
router.get('/api/bookings/:bookingId', async (request, env) => {
  try {
    const { bookingId } = request.params;
    const booking = await getBooking(env.DB, bookingId);

    if (!booking) {
      return errorResponse('Booking not found', 404);
    }

    return jsonResponse({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Get booking error:', error);
    return errorResponse('Failed to retrieve booking', 500);
  }
});

// Create Stripe payment intent
router.post('/api/create-payment-intent', async (request, env) => {
  try {
    const data = await request.json();

    // Validate payment input
    const validation = validatePayment(data);
    if (!validation.valid) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const paymentIntent = await createPaymentIntent(env, {
      amount: Math.round(parseFloat(data.amount) * 100),
      currency: data.currency || 'usd',
      metadata: {
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        customerEmail: data.customerEmail,
        bookingId: data.bookingId
      }
    });

    return jsonResponse({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment intent error:', error);
    return errorResponse('Failed to create payment intent', 500);
  }
});

// Stripe webhook
router.post('/api/webhooks/stripe', async (request, env, ctx) => {
  try {
    const signature = request.headers.get('stripe-signature');
    const body = await request.text();

    if (!signature) return errorResponse('Missing signature', 400);

    const event = await handleStripeWebhook(env, body, signature);

    switch (event.type) {
      case 'payment_intent.succeeded':
        ctx.waitUntil(handlePaymentSuccess(env, event.data.object));
        break;

      case 'payment_intent.payment_failed':
        ctx.waitUntil(handlePaymentFailure(env, event.data.object));
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return errorResponse(`Webhook error: ${error.message}`, 400);
  }
});

// Service list
router.get('/api/services', async (request, env) => {
  try {
    const cached = await env.CACHE.get('services-list', 'json');
    if (cached) {
      return jsonResponse({
        success: true,
        data: cached,
        cached: true
      });
    }

    const services = [
      {
        id: "restaurant_visibility_fast_fix",
        category: "restaurants",
        name: "Restaurant Visibility Fast-Fix",
        price: "175-600",
        deliverables: [
          "Google Maps listing setup",
          "Online menu digitization",
          "1-page website",
          "3 QR codes",
          "30-day traffic tips"
        ]
      },
      {
        id: "real_estate_listing_enhancement",
        category: "real_estate",
        name: "Listing Enhancement Pack",
        price: "250-500",
        deliverables: [
          "Luxury listing webpage",
          "Rewritten property description",
          "Photo gallery setup",
          "Lead capture form",
          "Social media assets"
        ]
      }
    ];

    await env.CACHE.put('services-list', JSON.stringify(services), {
      expirationTtl: 3600
    });

    return jsonResponse({ success: true, data: services });

  } catch (error) {
    console.error('Services error:', error);
    return errorResponse('Failed to retrieve services', 500);
  }
});

// Payment success helper
async function handlePaymentSuccess(env, paymentIntent) {
  try {
    const bookingId = paymentIntent.metadata.bookingId;

    if (bookingId) {
      await env.DB.prepare(
        'UPDATE bookings SET payment_status = ?, payment_intent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE booking_id = ?'
      ).bind('paid', paymentIntent.id, bookingId).run();
    }

    await sendBookingEmails(env, {
      email: paymentIntent.metadata.customerEmail,
      type: 'payment_confirmation',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      serviceName: paymentIntent.metadata.serviceName
    });

  } catch (error) {
    console.error('Payment success handler error:', error);
  }
}

// Payment failure helper
async function handlePaymentFailure(env, paymentIntent) {
  try {
    await sendBookingEmails(env, {
      email: paymentIntent.metadata.customerEmail,
      type: 'payment_failed',
      reason: paymentIntent.last_payment_error?.message
    });
  } catch (error) {
    console.error('Payment failure handler error:', error);
  }
}

// 404 handler
router.all('*', () => errorResponse('Endpoint not found', 404));

// Main fetch handler
export default {
  async fetch(request, env, ctx) {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
};
