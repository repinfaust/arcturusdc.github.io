import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }
  
  return new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });
}

export async function POST(request) {
  try {
    const stripe = getStripe();

    const body = await request.json();
    const { priceId, mode = 'subscription' } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Validate mode
    if (mode !== 'subscription' && mode !== 'payment') {
      return NextResponse.json(
        { error: 'Mode must be either "subscription" or "payment"' },
        { status: 400 }
      );
    }

    // Get the origin for success/cancel URLs
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000';

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${origin}/apps/stea/explore?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/apps/stea/explore?canceled=true`,
      allow_promotion_codes: true,
      customer_email: body.email || undefined,
      metadata: {
        planName: body.planName || 'Unknown',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
