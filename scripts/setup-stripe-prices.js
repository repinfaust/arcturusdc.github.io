/**
 * Script to fetch or create Stripe products and prices
 * Run with: node scripts/setup-stripe-prices.js
 * 
 * Requires STRIPE_SECRET_KEY environment variable
 */

const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is required');
  console.log('Set it as an environment variable or update the script');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

// Price configuration
const pricesConfig = [
  {
    productName: 'STEa Solo Monthly',
    productDescription: 'Solo plan - Monthly subscription',
    amount: 900, // £9.00 in pence
    currency: 'gbp',
    interval: 'month',
    key: 'solo_monthly',
  },
  {
    productName: 'STEa Solo Yearly',
    productDescription: 'Solo plan - Yearly subscription (15% off)',
    amount: 9200, // £92.00 in pence (15% discount from £108/year)
    currency: 'gbp',
    interval: 'year',
    key: 'solo_yearly',
  },
  {
    productName: 'STEa Team Monthly',
    productDescription: 'Team plan - Monthly subscription per seat',
    amount: 2500, // £25.00 in pence
    currency: 'gbp',
    interval: 'month',
    key: 'team_monthly',
  },
  {
    productName: 'STEa Team Yearly',
    productDescription: 'Team plan - Yearly subscription per seat (15% off)',
    amount: 25500, // £255.00 in pence (15% discount from £300/year)
    currency: 'gbp',
    interval: 'year',
    key: 'team_yearly',
  },
  {
    productName: 'STEa Agency Monthly',
    productDescription: 'Agency/Partner plan - Monthly subscription per seat',
    amount: 4900, // £49.00 in pence
    currency: 'gbp',
    interval: 'month',
    key: 'agency_monthly',
  },
  {
    productName: 'STEa Agency Yearly',
    productDescription: 'Agency/Partner plan - Yearly subscription per seat (15% off)',
    amount: 49900, // £499.00 in pence (15% discount from £588/year)
    currency: 'gbp',
    interval: 'year',
    key: 'agency_yearly',
  },
  {
    productName: 'STEa MCP Config Pack',
    productDescription: 'One-time purchase: Self-hosted AutoProduct MCP configuration pack',
    amount: 3000, // £30.00 in pence
    currency: 'gbp',
    interval: null, // one-time payment
    key: 'mcp_addon',
  },
];

async function findOrCreateProduct(name, description) {
  // Search for existing product
  const products = await stripe.products.search({
    query: `name:'${name}'`,
  });

  if (products.data.length > 0) {
    console.log(`  ✓ Found existing product: ${name} (${products.data[0].id})`);
    return products.data[0];
  }

  // Create new product
  const product = await stripe.products.create({
    name,
    description,
  });
  console.log(`  ✓ Created new product: ${name} (${product.id})`);
  return product;
}

async function findOrCreatePrice(productId, amount, currency, interval, key) {
  // Search for existing price
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
  });

  // Check if price with same amount and interval exists
  const existingPrice = prices.data.find(
    (p) =>
      p.unit_amount === amount &&
      p.currency === currency &&
      (interval ? p.recurring?.interval === interval : !p.recurring)
  );

  if (existingPrice) {
    console.log(`    ✓ Found existing price: ${key} (${existingPrice.id})`);
    return existingPrice;
  }

  // Create new price
  const priceData = {
    product: productId,
    unit_amount: amount,
    currency,
  };

  if (interval) {
    priceData.recurring = { interval };
  }

  const price = await stripe.prices.create(priceData);
  console.log(`    ✓ Created new price: ${key} (${price.id})`);
  return price;
}

async function main() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  const priceIds = {};

  for (const config of pricesConfig) {
    console.log(`\n📦 Processing: ${config.productName}`);
    
    try {
      // Find or create product
      const product = await findOrCreateProduct(
        config.productName,
        config.productDescription
      );

      // Find or create price
      const price = await findOrCreatePrice(
        product.id,
        config.amount,
        config.currency,
        config.interval,
        config.key
      );

      priceIds[config.key] = price.id;
    } catch (error) {
      console.error(`  ❌ Error processing ${config.key}:`, error.message);
    }
  }

  console.log('\n\n✅ Setup complete! Here are your Price IDs:\n');
  console.log('Copy these into your frontend code (src/app/apps/stea/explore/page.js):\n');
  console.log('const priceIds = {');
  Object.entries(priceIds).forEach(([key, id]) => {
    console.log(`  ${key}: '${id}',`);
  });
  console.log('};\n');

  console.log('Or set them as environment variables:\n');
  Object.entries(priceIds).forEach(([key, id]) => {
    console.log(`STRIPE_PRICE_${key.toUpperCase()}=${id}`);
  });
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

