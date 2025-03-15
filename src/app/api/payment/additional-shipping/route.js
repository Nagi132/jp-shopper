// src/app/api/payment/additional-shipping/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { verificationId, requestId, amount } = await request.json();
    
    // Ensure verification exists
    const { data: verification, error: verificationError } = await supabase
      .from('shipping_verifications')
      .select('*')
      .eq('id', verificationId)
      .single();
      
    if (verificationError || !verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }
    
    // Ensure request exists
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('*, transactions(*)')
      .eq('id', requestId)
      .single();
      
    if (requestError || !requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    
    // Get original transaction to link the payments
    const originalTransaction = requestData.transactions[0];
    if (!originalTransaction) {
      return NextResponse.json({ error: 'No original transaction found' }, { status: 400 });
    }
    
    // Create payment intent for additional amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Additional amount in JPY
      currency: 'jpy',
      metadata: {
        requestId,
        verificationId,
        originalTransactionId: originalTransaction.id,
        type: 'additional_shipping'
      }
    });
    
    // Create additional shipping transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        request_id: requestId,
        customer_id: originalTransaction.customer_id,
        amount: 0, // No item amount for additional shipping
        shipping_deposit: amount, // Additional shipping amount
        total_amount: amount,
        fee: 0, // No additional fee on shipping adjustments
        payment_intent_id: paymentIntent.id,
        status: 'pending',
        type: 'additional_shipping',
        related_transaction_id: originalTransaction.id
      }]);
      
    if (transactionError) {
      console.error('Additional shipping transaction error:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction record' }, { status: 500 });
    }
    
    // Return client secret for checkout
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret 
    });
  } catch (error) {
    console.error('Additional shipping payment error:', error);
    return NextResponse.json({ error: 'Failed to create payment: ' + error.message }, { status: 500 });
  }
}