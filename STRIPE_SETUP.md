# Stripe Payment Integration Setup Guide

This guide explains how to set up and use the Stripe payment integration for STEa pricing.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Your Stripe API keys (found in Stripe Dashboard → Developers → API keys)

## Environment Variables

Set the following environment variables in your deployment platform (Vercel, etc.) or `.env.local` file:

```bash
# Required: Your Stripe secret key (get from Stripe Dashboard → API keys)
STRIPE_SECRET_KEY=sk_live_...

# Required: Webhook signing secret (get this after setting up webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Stripe Products & Prices

All products and prices have been created in your Stripe account. The Price IDs are hardcoded in the frontend:

- **Solo Monthly**: `price_1ST5paCtbV5UkklC3qY1EcxC` (£9/month)
- **Solo Yearly**: `price_1ST5pbCtbV5UkklCMtwkY2Rl` (£92/year)
- **Team Monthly**: `price_1ST5pcCtbV5UkklCU0wTnhyM` (£25/seat/month)
- **Team Yearly**: `price_1ST5pdCtbV5UkklCmzRVHRWc` (£255/seat/year)
- **Agency Monthly**: `price_1ST5pfCtbV5UkklC8d44VTfC` (£49/seat/month)
- **Agency Yearly**: `price_1ST5pgCtbV5UkklCsj4MuhYh` (£499/seat/year)
- **MCP Config Pack**: `price_1ST5phCtbV5UkklC7fcJL3Ar` (£30 one-time)

To recreate or update prices, run:
```bash
node scripts/setup-stripe-prices.js
```

## Webhook Setup

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the "Signing secret" and set it as `STRIPE_WEBHOOK_SECRET`

## Testing

### Test Mode

For testing, use Stripe test mode:
1. Get test API keys from Stripe Dashboard (toggle "Test mode")
2. Update environment variables with test keys
3. Create test products/prices or use the script with test keys
4. Use Stripe test cards: https://stripe.com/docs/testing

### Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Use any future expiry date and any 3-digit CVC

## How It Works

1. **User clicks "Subscribe"** → Frontend calls `/api/create-checkout-session`
2. **API creates Stripe Checkout Session** → Returns checkout URL
3. **User redirected to Stripe Checkout** → Completes payment
4. **Stripe sends webhook** → `/api/webhooks/stripe` processes event
5. **Firestore updated** → Subscription/purchase recorded in `stea_subscriptions` or `stea_purchases`

## Firestore Collections

The webhook handler creates/updates these collections:

- **`stea_subscriptions`**: Subscription records (monthly/yearly plans)
- **`stea_purchases`**: One-time purchases (MCP addon)
- **`stea_payments`**: Payment history (successful and failed)

## Troubleshooting

### Checkout not working
- Verify `STRIPE_SECRET_KEY` is set correctly
- Check browser console for errors
- Verify Price IDs match your Stripe account

### Webhooks not firing
- Verify webhook endpoint URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook logs in Stripe Dashboard → Webhooks → [Your endpoint] → Logs

### Payment succeeded but no Firestore record
- Check webhook logs in Stripe Dashboard
- Verify Firebase Admin is configured correctly
- Check server logs for errors

## Security Notes

- **Never commit** `.env.local` or `.env` files
- **Never expose** `STRIPE_SECRET_KEY` in client-side code
- **Always verify** webhook signatures (already implemented)
- **Use HTTPS** for webhook endpoints in production

## Support

For issues or questions:
- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Project Support: support@arcturusdc.com

