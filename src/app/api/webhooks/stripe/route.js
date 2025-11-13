import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        // Handle one-time payments (like MCP addon) vs subscriptions
        if (session.mode === 'payment') {
          // One-time payment - log to purchases collection
          await adminDb.collection('stea_purchases').add({
            customerId: session.customer,
            sessionId: session.id,
            email: session.customer_email,
            amount: session.amount_total,
            currency: session.currency,
            paymentStatus: 'succeeded',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          // Subscription - log to subscriptions collection
          await adminDb.collection('stea_subscriptions').add({
            customerId: session.customer,
            sessionId: session.id,
            email: session.customer_email,
            status: 'pending',
            mode: session.mode,
            amount: session.amount_total,
            currency: session.currency,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object;
        console.log('Subscription created:', subscription.id);

        // Update or create subscription record
        await adminDb.collection('stea_subscriptions').add({
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          priceId: subscription.items.data[0]?.price.id,
          productId: subscription.items.data[0]?.price.product,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id);

        // Find and update the subscription
        const subscriptionQuery = await adminDb
          .collection('stea_subscriptions')
          .where('subscriptionId', '==', subscription.id)
          .limit(1)
          .get();

        if (!subscriptionQuery.empty) {
          const doc = subscriptionQuery.docs[0];
          await doc.ref.update({
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date(),
          });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription deleted:', subscription.id);

        // Mark subscription as canceled
        const subscriptionQuery = await adminDb
          .collection('stea_subscriptions')
          .where('subscriptionId', '==', subscription.id)
          .limit(1)
          .get();

        if (!subscriptionQuery.empty) {
          const doc = subscriptionQuery.docs[0];
          await doc.ref.update({
            status: 'canceled',
            canceledAt: new Date(),
            updatedAt: new Date(),
          });
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);

        // Log successful payment
        await adminDb.collection('stea_payments').add({
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
          paidAt: new Date(invoice.status_transitions.paid_at * 1000),
          createdAt: new Date(),
        });

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Invoice payment failed:', invoice.id);

        // Log failed payment
        await adminDb.collection('stea_payments').add({
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: 'failed',
          failureReason: invoice.last_finalization_error?.message || 'Unknown error',
          createdAt: new Date(),
        });

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    service: 'Stripe Webhook Handler',
    status: 'active',
    endpoint: '/api/webhooks/stripe',
  });
}
