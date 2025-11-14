/**
 * Create a 100% discount coupon in Stripe
 * Run with: STRIPE_SECRET_KEY=sk_live_... node scripts/create-stripe-discount-coupon.js
 */

const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is required');
  console.log('Set it as an environment variable: STRIPE_SECRET_KEY=sk_live_...');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

async function createDiscountCoupon() {
  try {
    console.log('🎟️  Creating 100% discount coupon in Stripe...\n');

    // Check if coupon already exists
    const existingCoupons = await stripe.coupons.list({ limit: 100 });
    const existingCoupon = existingCoupons.data.find(
      c => c.percent_off === 100 && c.name === 'STEa Free Trial'
    );

    if (existingCoupon) {
      console.log(`✅ Coupon already exists: ${existingCoupon.id}`);
      console.log(`   Name: ${existingCoupon.name}`);
      console.log(`   Percent Off: ${existingCoupon.percent_off}%`);
      console.log(`   Duration: ${existingCoupon.duration}`);
      
      // Check for promotion code
      const promoCodes = await stripe.promotionCodes.list({
        coupon: existingCoupon.id,
        limit: 10,
      });

      if (promoCodes.data.length > 0) {
        console.log(`\n📝 Promotion Codes:`);
        promoCodes.data.forEach(pc => {
          console.log(`   Code: ${pc.code} (Active: ${pc.active})`);
        });
      } else {
        console.log(`\n📝 No promotion codes found. Creating one...`);
        const promoCode = await stripe.promotionCodes.create({
          coupon: existingCoupon.id,
          code: 'FREETRIAL',
        });
        console.log(`   ✅ Created promotion code: ${promoCode.code}`);
      }

      return existingCoupon;
    }

    // Create new coupon
    const coupon = await stripe.coupons.create({
      name: 'STEa Free Trial',
      percent_off: 100,
      duration: 'once', // 'once', 'repeating', or 'forever'
      // duration_in_months: 1, // Only if duration is 'repeating'
      // max_redemptions: 100, // Optional: limit number of uses
      // redeem_by: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // Optional: expires in 90 days
    });

    console.log(`✅ Created coupon: ${coupon.id}`);
    console.log(`   Name: ${coupon.name}`);
    console.log(`   Percent Off: ${coupon.percent_off}%`);
    console.log(`   Duration: ${coupon.duration}`);

    // Create promotion code
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: 'FREETRIAL',
      // active: true, // Default is true
    });

    console.log(`\n📝 Created promotion code: ${promoCode.code}`);
    console.log(`   Coupon ID: ${promoCode.coupon}`);
    console.log(`   Active: ${promoCode.active}`);

    console.log(`\n✨ Setup complete!`);
    console.log(`\nUsers can now use code "${promoCode.code}" at checkout for 100% discount.`);

    return coupon;
  } catch (error) {
    console.error('❌ Error creating coupon:', error.message);
    if (error.type === 'StripeInvalidRequestError') {
      console.error('   Details:', error.raw?.message);
    }
    throw error;
  }
}

// Main execution
createDiscountCoupon()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

