// src/app/api/webhooks/stripe/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      payload, 
      signature, 
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }
  
  // Handle different event types
  try {
    switch (event.type) {
      // Handle Connect account updates
      case 'account.updated': {
        const account = event.data.object;
        
        // Check if this is a Connect account with our metadata
        if (account.metadata?.userId) {
          // Check if details_submitted is true (onboarding completed)
          if (account.details_submitted) {
            // Update our database to mark onboarding as complete
            await supabase
              .from('profiles')
              .update({ stripe_onboarding_complete: true })
              .eq('stripe_account_id', account.id);
              
            console.log(`Shopper onboarding completed for account: ${account.id}`);
          }
        }
        break;
      }
      
      // Handle payment success
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        try {
          await handleSuccessfulPayment(paymentIntent);
        } catch (paymentErr) {
          // Log error but don't fail the webhook
          console.error('Error handling successful payment:', {
            message: paymentErr.message,
            details: paymentErr.stack,
            hint: '',
            code: ''
          });
        }
        break;
      }
      
      // You can add more event handlers here
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSuccessfulPayment(paymentIntent) {
  try {
    // Get request ID from metadata
    const { requestId } = paymentIntent.metadata || {};
    
    if (!requestId) {
      console.log('No requestId found in payment metadata');
      return;
    }
    
    console.log(`Processing payment for request: ${requestId}`);
    
    // Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ status: 'paid' })
      .eq('payment_intent_id', paymentIntent.id);
      
    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return;
    }
    
    // Update request status to paid
    const { error: requestError } = await supabase
      .from('requests')
      .update({ status: 'paid' })
      .eq('id', requestId);
      
    if (requestError) {
      console.error('Error updating request status:', requestError);
      return;
    }
    
    console.log(`Payment processed successfully for request: ${requestId}`);
  } catch (err) {
    console.error('Error in handleSuccessfulPayment:', err);
    throw err; // Re-throw to be caught by the caller
  }
}