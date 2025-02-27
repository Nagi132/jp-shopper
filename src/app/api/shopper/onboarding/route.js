// src/app/api/shopper/onboarding/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { userId, returnUrl } = await request.json();
    
    // Verify user is a shopper
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_shopper')
      .eq('user_id', userId)
      .single();
      
    if (error || !profile.is_shopper) {
      return NextResponse.json({ error: 'User is not a shopper' }, { status: 403 });
    }
    
    // Create a Stripe account for the shopper
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'JP',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        userId
      }
    });
    
    // Update user profile with Stripe account ID
    await supabase
      .from('profiles')
      .update({ stripe_account_id: account.id })
      .eq('user_id', userId);
    
    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shoppers/onboarding/refresh`,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/shoppers/onboarding/complete`,
      type: 'account_onboarding',
    });
    
    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating onboarding:', error);
    return NextResponse.json({ error: 'Failed to create onboarding' }, { status: 500 });
  }
}