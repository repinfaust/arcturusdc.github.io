import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// One-time "buy a coffee" top-up for Career Ops. Uses the configured price (or
// resolves one from the product), creates a one-time Stripe Checkout session, and
// carries the tenantId + coffee metadata so the webhook can grant actions.
const COFFEE_PRICE_ID = process.env.CAREER_COFFEE_PRICE_ID || 'price_1TdCcWCtbV5UkklCKoJ4qxO6';
const COFFEE_PRODUCT_ID = process.env.CAREER_COFFEE_PRODUCT_ID || 'prod_UcRVy8pl9xjoyj';

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  const Stripe = (await import('stripe')).default;
  return new Stripe(key, { apiVersion: '2024-11-20.acacia' });
}

export async function POST(request) {
  try {
    const stripe = await getStripe();
    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Prefer the configured price id; fall back to looking one up from the product.
    let priceId = COFFEE_PRICE_ID;
    if (!priceId) {
      const prices = await stripe.prices.list({ product: COFFEE_PRODUCT_ID, active: true, limit: 1 });
      priceId = prices.data[0]?.id;
    }
    if (!priceId) {
      return NextResponse.json({ error: 'No active price found for the Career Ops coffee product. Add a one-time GBP price in Stripe.' }, { status: 500 });
    }

    const origin = request.headers.get('origin')
      || request.headers.get('referer')?.split('/').slice(0, 3).join('/')
      || 'https://www.arcturusdc.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/apps/stea/career?coffee=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/apps/stea/career?coffee=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        kind: 'career_coffee',
        tenantId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Career coffee checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
