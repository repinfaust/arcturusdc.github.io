import { createCheckoutHandler } from '@/lib/careerEngine/checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Squared "buy a coffee" top-up. Uses SQUARED_COFFEE_PRICE_ID / PRODUCT_ID when
// set, or inline Squared-branded £5 GBP price_data so checkout never shows
// Career Ops branding (D-SITE-034, D-SITE-080).
export const POST = createCheckoutHandler({
  kind: 'squared_coffee',
  priceId: process.env.SQUARED_COFFEE_PRICE_ID || '',
  productId: process.env.SQUARED_COFFEE_PRODUCT_ID || '',
  priceData: {
    currency: 'gbp',
    unit_amount: 500,
    product_data: {
      name: 'Squared — Buy a brew (+50 actions)',
      description: '50 additional AI actions for Squared (role scoring, CV tailoring, SJAR/OJAR translation, and cover letters).',
    },
  },
  returnPath: '/apps/stea/squared',
  label: 'Squared',
});
