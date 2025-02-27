// src/app/api/payment/create-intent/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PLATFORM_FEE_PERCENT = 10; // 10% marketplace fee

export async function POST(request) {
  try {
    const { requestId, customerId, amount } = await request.json();
    
    // Verify request exists and belongs to customer
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .eq('customer_id', customerId)
      .single();
      
    if (requestError || !requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    
    // Calculate platform fee
    const fee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100));
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in JPY (no need to convert to cents as JPY has no decimals)
      currency: 'jpy',
      metadata: {
        requestId,
        customerId,
        fee
      }
    });
    
    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        request_id: requestId,
        customer_id: customerId,
        amount,
        fee,
        payment_intent_id: paymentIntent.id,
        status: 'pending'
      }]);
      
    if (transactionError) {
      console.error('Transaction insert error:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
    
    // Return client secret for checkout
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret 
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}