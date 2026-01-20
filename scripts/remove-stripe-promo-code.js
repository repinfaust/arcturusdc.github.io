/**
 * Remove/deactivate a Stripe promotion code
 * Run with: STRIPE_SECRET_KEY=sk_live_... node scripts/remove-stripe-promo-code.js FREETRIAL
 */

const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const CODE_TO_REMOVE = process.argv[2];

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is required');
  console.log('Set it as an environment variable: STRIPE_SECRET_KEY=sk_live_...');
  process.exit(1);
}

if (!CODE_TO_REMOVE) {
  console.error('❌ Promotion code is required');
  console.log('Usage: node scripts/remove-stripe-promo-code.js <CODE>');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

async function removePromoCode() {
  try {
    console.log(`🔍 Searching for promotion code: ${CODE_TO_REMOVE}...\n`);

    // List all promotion codes and find the one we want to remove
    const promoCodes = await stripe.promotionCodes.list({ limit: 100 });
    const promoCode = promoCodes.data.find(pc => pc.code.toUpperCase() === CODE_TO_REMOVE.toUpperCase());

    if (!promoCode) {
      console.log(`⚠️  Promotion code "${CODE_TO_REMOVE}" not found.`);
      console.log(`\nAvailable codes:`);
      promoCodes.data.forEach(pc => {
        console.log(`   - ${pc.code} (Active: ${pc.active})`);
      });
      return;
    }

    console.log(`Found: ${promoCode.code}`);
    console.log(`   ID: ${promoCode.id}`);
    console.log(`   Active: ${promoCode.active}`);
    console.log(`   Coupon: ${promoCode.coupon}`);

    if (!promoCode.active) {
      console.log(`\n✅ Code "${CODE_TO_REMOVE}" is already inactive.`);
      return;
    }

    // Update the promotion code to set it as inactive
    const updated = await stripe.promotionCodes.update(promoCode.id, {
      active: false,
    });

    console.log(`\n✅ Deactivated promotion code "${CODE_TO_REMOVE}"`);
    console.log(`   Code is now inactive and cannot be used.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.type === 'StripeInvalidRequestError') {
      console.error('   Details:', error.raw?.message);
    }
    throw error;
  }
}

// Main execution
removePromoCode()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

