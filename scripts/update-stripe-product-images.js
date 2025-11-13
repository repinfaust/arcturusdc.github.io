/**
 * Script to update all Stripe products with the STEa logo
 * Run with: node scripts/update-stripe-product-images.js
 * 
 * Requires STRIPE_SECRET_KEY environment variable
 * 
 * The logo will be set using the public URL from your website
 */

const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is required');
  console.log('Set it as an environment variable: STRIPE_SECRET_KEY=sk_live_...');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

// Logo URL - update this to your production domain if different
const LOGO_URL = 'https://www.arcturusdc.com/img/acturusdc_stea_logo.png';

// Alternative: Upload file to Stripe and use file ID
// Uncomment the uploadFile function below if you prefer to upload the image to Stripe
async function uploadFileToStripe(filePath) {
  try {
    const file = await stripe.files.create({
      purpose: 'product_image',
      file: {
        data: fs.readFileSync(filePath),
        name: path.basename(filePath),
        type: 'image/png',
      },
    });
    return file.id;
  } catch (error) {
    console.error('Error uploading file to Stripe:', error.message);
    throw error;
  }
}

async function updateAllProducts() {
  console.log('🖼️  Updating Stripe products with STEa logo...\n');
  console.log(`Using logo URL: ${LOGO_URL}\n`);

  try {
    // List all products
    const products = await stripe.products.list({
      limit: 100, // Adjust if you have more than 100 products
    });

    if (products.data.length === 0) {
      console.log('⚠️  No products found in Stripe account');
      return;
    }

    console.log(`Found ${products.data.length} product(s)\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products.data) {
      // Only update STEa products
      if (!product.name.includes('STEa')) {
        console.log(`⏭️  Skipping ${product.name} (not a STEa product)`);
        skippedCount++;
        continue;
      }

      try {
        // Check if logo is already set
        const hasLogo = product.images && product.images.length > 0;
        
        if (hasLogo && product.images.includes(LOGO_URL)) {
          console.log(`✓ ${product.name} already has the correct logo`);
          skippedCount++;
          continue;
        }

        // Update product with logo
        const updatedProduct = await stripe.products.update(product.id, {
          images: [LOGO_URL],
        });

        console.log(`✅ Updated ${product.name} (${product.id})`);
        console.log(`   Logo URL: ${LOGO_URL}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating ${product.name}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated: ${updatedCount} product(s)`);
    console.log(`   ⏭️  Skipped: ${skippedCount} product(s)`);
    console.log(`   📦 Total: ${products.data.length} product(s)`);

    if (updatedCount > 0) {
      console.log('\n✨ All products updated successfully!');
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  // Option 1: Use public URL (recommended - simpler)
  await updateAllProducts();

  // Option 2: Upload file to Stripe first, then use file ID
  // Uncomment below if you want to upload the image to Stripe instead
  /*
  const logoPath = path.join(__dirname, '../public/img/acturusdc_stea_logo.png');
  
  if (!fs.existsSync(logoPath)) {
    console.error(`❌ Logo file not found: ${logoPath}`);
    process.exit(1);
  }

  console.log('📤 Uploading logo to Stripe...');
  const fileId = await uploadFileToStripe(logoPath);
  console.log(`✅ Logo uploaded: ${fileId}`);
  
  // Then update products with file ID instead of URL
  // You would need to modify updateAllProducts to use fileId
  */
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

