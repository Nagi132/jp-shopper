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
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent);
      break;
      
    case 'payment_intent.payment_failed':
      // Handle failed payment
      break;
  }
  
  return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(paymentIntent) {
  try {
    // Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ status: 'paid' })
      .eq('payment_intent_id', paymentIntent.id);
      
    if (updateError) throw updateError;
    
    // Get request ID from metadata
    const { requestId } = paymentIntent.metadata;
    
    // Update request status to paid
    const { error: requestError } = await supabase
      .from('requests')
      .update({ status: 'paid' })
      .eq('id', requestId);
      
    if (requestError) throw requestError;
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}