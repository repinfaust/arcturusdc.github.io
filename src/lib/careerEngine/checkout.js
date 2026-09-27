// One-time "buy a coffee" top-up for a career-engine app. Creates a Stripe
// Checkout session whose metadata (kind + tenantId) tells the Stripe webhook
// which app's usage doc to credit.
import { NextResponse } from 'next/server';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  const Stripe = (await import('stripe')).default;
  return new Stripe(key, { apiVersion: '2024-11-20.acacia' });
}

// coffee: { kind, priceId, productId, returnPath, label }
export function createCheckoutHandler(coffee) {
  return async function POST(request) {
    try {
      const { tenantId } = await request.json();
      if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
      }
      // Only a signed-in member can start a purchase for their workspace (D-SITE-033).
      const access = await verifySteaWorkspaceAccess(request, { tenantId });
      if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status });
      }

      const stripe = await getStripe();
      // Prefer the configured price id; fall back to looking one up from the product.
      let priceId = coffee.priceId;
      if (!priceId && coffee.productId) {
        const prices = await stripe.prices.list({ product: coffee.productId, active: true, limit: 1 });
        priceId = prices.data[0]?.id;
      }
      if (!priceId) {
        return NextResponse.json({ error: `No price configured for the ${coffee.label} coffee top-up.` }, { status: 500 });
      }

      const origin = request.headers.get('origin')
        || request.headers.get('referer')?.split('/').slice(0, 3).join('/')
        || 'https://www.arcturusdc.com';

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}${coffee.returnPath}?coffee=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${coffee.returnPath}?coffee=cancelled`,
        allow_promotion_codes: true,
        metadata: { kind: coffee.kind, tenantId },
      });

      return NextResponse.json({ url: session.url });
    } catch (error) {
      console.error(`${coffee.label} coffee checkout error:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  };
}
