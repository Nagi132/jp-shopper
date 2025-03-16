// src/app/api/payment/create-intent/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Create a fresh Supabase client directly in this file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PLATFORM_FEE_PERCENT = 10; // 10% marketplace fee

export async function POST(request) {
  console.log('API route hit: /api/payment/create-intent');
  
  try {
    // Log the request body
    const requestBody = await request.json();
    console.log('Request body:', JSON.stringify(requestBody));
    
    const { requestId, customerId, amount, shippingCost = 0 } = requestBody;
    
    if (!requestId || !customerId || !amount) {
      return NextResponse.json({ 
        error: 'Missing required parameters',
        params: { requestId, customerId, amount }
      }, { status: 400 });
    }
    
    // Skip database check for now and proceed with payment intent creation
    console.log('Proceeding with payment intent creation');
    
    // Calculate platform fee
    const fee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100));
    
    // Calculate total amount including shipping deposit
    const totalAmount = amount + shippingCost;
    
    console.log('Creating payment intent with amount:', totalAmount);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount, // Amount in JPY (no decimals needed)
      currency: 'jpy',
      metadata: {
        requestId,
        customerId,
        fee,
        itemAmount: amount,
        shippingAmount: shippingCost
      }
    });
    
    console.log('Payment intent created:', paymentIntent.id);
    
    // Try to create transaction record but don't fail if it doesn't work
    try {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          request_id: requestId,
          customer_id: customerId,
          amount: amount,
          shipping_deposit: shippingCost,
          total_amount: totalAmount,
          fee,
          payment_intent_id: paymentIntent.id,
          status: 'pending'
        }]);
      
      if (transactionError) {
        console.error('Transaction insert error:', transactionError);
        console.log('Continuing despite transaction error');
      } else {
        console.log('Transaction record created successfully');
      }
    } catch (txErr) {
      console.error('Failed to create transaction record:', txErr);
      console.log('Continuing despite transaction error');
    }
    
    // Return client secret for checkout
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      success: true
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create payment', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : null
    }, { status: 500 });
  }
}