import { createCheckoutHandler } from '@/lib/careerEngine/checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Squared "buy a coffee" top-up. Its own Stripe price, so the checkout page
// never shows Career Ops branding; unset means top-ups are unavailable (D-SITE-034).
export const POST = createCheckoutHandler({
  kind: 'squared_coffee',
  priceId: process.env.SQUARED_COFFEE_PRICE_ID || '',
  productId: process.env.SQUARED_COFFEE_PRODUCT_ID || '',
  returnPath: '/apps/stea/squared',
  label: 'Squared',
});
