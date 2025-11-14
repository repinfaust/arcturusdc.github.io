import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

async function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }
  
  // Dynamic import to avoid build-time resolution issues
  const Stripe = (await import('stripe')).default;
  return new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });
}

export async function POST(request) {
  try {
    const stripe = await getStripe();

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

    // Determine plan from priceId
    const planMap = {
      'price_1ST5paCtbV5UkklC3qY1EcxC': 'solo-monthly',
      'price_1ST5pbCtbV5UkklCMtwkY2Rl': 'solo-yearly',
      'price_1ST5pcCtbV5UkklCU0wTnhyM': 'team-monthly',
      'price_1ST5pdCtbV5UkklCmzRVHRWc': 'team-yearly',
      'price_1ST5pfCtbV5UkklC8d44VTfC': 'agency-monthly',
      'price_1ST5pgCtbV5UkklCsj4MuhYh': 'agency-yearly',
    };
    const plan = planMap[priceId] || 'solo-monthly';

    // Create Checkout Session with custom fields
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
      // Skip card collection if payment amount is 0 (e.g., with 100% discount)
      payment_method_collection: 'if_required',
      metadata: {
        planName: body.planName || 'Unknown',
        plan: plan,
      },
      // Custom fields for workspace setup
      custom_fields: [
        {
          key: 'workspace_name',
          label: {
            type: 'custom',
            custom: 'Workspace Name',
          },
          type: 'text',
          optional: false,
        },
        {
          key: 'google_email',
          label: {
            type: 'custom',
            custom: 'Google Sign-in Email',
          },
          type: 'text',
          optional: false,
          description: 'Use the email you\'ll sign in with using "Continue with Google" for STEa.',
        },
      ],
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
