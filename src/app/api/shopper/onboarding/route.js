// src/app/api/shopper/onboarding/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { userId, returnUrl } = await request.json();
    
    // Improved error handling with detailed logging
    console.log('Onboarding request for user:', userId);
    
    // Get the user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    // Handle missing profile more gracefully
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // If no profile exists, create one with is_shopper=true
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: userId,
            is_shopper: true
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating profile:', createError);
          return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
        }
        
        console.log('Created new shopper profile:', newProfile);
      } else {
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
      }
    }
    
    // If profile exists but is_shopper is false, update it
    if (profile && profile.is_shopper !== true) {
      console.log('Updating profile to set is_shopper to true');
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ is_shopper: true })
        .eq('user_id', userId);
        
      if (updateError) {
        console.error('Error updating profile:', updateError);
      }
    }
    
    // Ensure we're using HTTPS URLs for Stripe in live mode
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Force HTTPS for all stripe redirect URLs
    if (baseUrl.startsWith('http://') && process.env.NODE_ENV === 'production') {
      baseUrl = baseUrl.replace('http://', 'https://');
    }
    
    // Ensure base URL doesn't have trailing slash
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
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
    
    console.log('Created Stripe account:', account.id);
    
    // Update user profile with Stripe account ID
    const { error: stripeUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        stripe_account_id: account.id,
        stripe_onboarding_complete: false
      })
      .eq('user_id', userId);
      
    if (stripeUpdateError) {
      console.error('Error updating profile with Stripe account ID:', stripeUpdateError);
      // Don't fail here - we'll create the account link anyway
    }
    
    const refresh_url = `${baseUrl}/shoppers/settings?refresh=true`;
    const return_url = returnUrl ? 
      (returnUrl.startsWith('http') ? returnUrl : `${baseUrl}${returnUrl.startsWith('/') ? returnUrl : '/' + returnUrl}`) : 
      `${baseUrl}/shoppers/settings`;
    
    console.log('Creating account link with URLs:', {
      refresh_url,
      return_url
    });
    
    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url,
      return_url,
      type: 'account_onboarding',
    });
    
    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating onboarding:', error);
    return NextResponse.json({ error: 'Failed to create onboarding: ' + error.message }, { status: 500 });
  }
}