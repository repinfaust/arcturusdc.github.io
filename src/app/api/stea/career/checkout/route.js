import { createCheckoutHandler } from '@/lib/careerEngine/checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Career Ops "buy a coffee" top-up (D-SITE-034: shared with Squared's checkout).
export const POST = createCheckoutHandler({
  kind: 'career_coffee',
  priceId: process.env.CAREER_COFFEE_PRICE_ID || 'price_1TdCcWCtbV5UkklCKoJ4qxO6',
  productId: process.env.CAREER_COFFEE_PRODUCT_ID || 'prod_UcRVy8pl9xjoyj',
  returnPath: '/apps/stea/career',
  label: 'Career Ops',
});
