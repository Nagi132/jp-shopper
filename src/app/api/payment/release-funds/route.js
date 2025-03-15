// src/app/api/payment/release-funds/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { requestId, customerId } = await request.json();
    
    // Verify request exists and belongs to customer
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('*, shopper_profiles(*)')
      .eq('id', requestId)
      .eq('customer_id', customerId)
      .eq('status', 'shipped')
      .single();
      
    if (requestError || !requestData) {
      return NextResponse.json({ error: 'Request not found or not in correct state' }, { status: 404 });
    }
    
    // Get transaction info
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
      
    if (transactionError || !transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    // Get main transaction (first one)
    const mainTransaction = transactions[0];
    
    // Calculate total amount to transfer including shipping
    const itemAmount = mainTransaction.amount;
    const shippingAmount = requestData.shipping_cost || mainTransaction.shipping_deposit;
    const platformFee = mainTransaction.fee;
    
    // Total to transfer = item price + shipping - platform fee
    const transferAmount = itemAmount + shippingAmount - platformFee;
    
    // Get shopper's Stripe account ID
    const { data: shopperUser, error: shopperError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('user_id', requestData.shopper_profiles.user_id)
      .single();
      
    if (shopperError || !shopperUser || !shopperUser.stripe_account_id) {
      return NextResponse.json({ error: 'Shopper payment account not found' }, { status: 404 });
    }
    
    // Create transfer to shopper's account
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: 'jpy',
      destination: shopperUser.stripe_account_id,
      transfer_group: requestId,
      metadata: {
        requestId,
        transactionId: mainTransaction.id,
        itemAmount,
        shippingAmount,
        platformFee
      }
    });
    
    // Update transaction with transfer info
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        transfer_id: transfer.id,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', mainTransaction.id);
      
    if (updateError) {
      console.error('Error updating transaction:', updateError);
    }
    
    // Update request status
    const { error: requestUpdateError } = await supabase
      .from('requests')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
      
    if (requestUpdateError) {
      console.error('Error updating request:', requestUpdateError);
    }
    
    return NextResponse.json({ 
      success: true,
      transferAmount,
      itemAmount,
      shippingAmount,
      platformFee
    });
  } catch (error) {
    console.error('Error releasing funds:', error);
    return NextResponse.json({ error: 'Failed to release funds: ' + error.message }, { status: 500 });
  }
}