// src/app/api/shopper/check-status/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { userId } = await request.json();
    console.log(`Manually checking status for user: ${userId}`);
    
    // Get all Stripe accounts for this user
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('user_id', userId);
      
    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }
    
    if (!profiles || profiles.length === 0 || !profiles[0].stripe_account_id) {
      return NextResponse.json({ error: 'No Stripe account found' }, { status: 404 });
    }
    
    let completedAccount = null;
    let updatedStatus = false;
    
    // Check each account with Stripe
    for (const profile of profiles) {
      if (profile.stripe_account_id) {
        try {
          console.log(`Checking Stripe account: ${profile.stripe_account_id}`);
          const account = await stripe.accounts.retrieve(profile.stripe_account_id);
          
          if (account.details_submitted) {
            console.log(`Account ${profile.stripe_account_id} has completed onboarding`);
            completedAccount = account;
            
            // Update database if needed
            if (!profile.stripe_onboarding_complete) {
              const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ stripe_onboarding_complete: true })
                .eq('stripe_account_id', profile.stripe_account_id);
                
              if (updateError) {
                console.error('Error updating profile:', updateError);
              } else {
                updatedStatus = true;
                console.log(`Updated onboarding status for account: ${profile.stripe_account_id}`);
              }
            }
          } else {
            console.log(`Account ${profile.stripe_account_id} has not completed onboarding`);
          }
        } catch (err) {
          console.error(`Error checking account ${profile.stripe_account_id}:`, err);
          // Continue checking other accounts
        }
      }
    }
    
    if (completedAccount) {
      return NextResponse.json({ 
        status: 'complete',
        updated: updatedStatus,
        message: 'Account verification complete',
        accountId: completedAccount.id
      });
    } else {
      // Check if any accounts are already marked as complete
      const completeProfile = profiles.find(p => p.stripe_onboarding_complete);
      if (completeProfile) {
        return NextResponse.json({ 
          status: 'complete',
          message: 'Account already marked as complete',
          accountId: completeProfile.stripe_account_id
        });
      }
      
      return NextResponse.json({ 
        status: 'pending',
        message: 'No completed accounts found'
      });
    }
    
  } catch (error) {
    console.error('Error checking account status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}