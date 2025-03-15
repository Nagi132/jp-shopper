// src/app/api/webhooks/stripe/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
    console.log(`Processing webhook event: ${event.type}`);
    
    switch (event.type) {
      // Handle Connect account updates
      case 'account.updated': {
        const account = event.data.object;
        
        // Check if this is a Connect account with our metadata
        if (account.metadata?.userId) {
          console.log(`Processing account update for: ${account.id}, details_submitted: ${account.details_submitted}`);
          
          // Check if details_submitted is true (onboarding completed)
          if (account.details_submitted) {
            // Update our database to mark onboarding as complete
            const { data, error } = await supabaseAdmin
              .from('profiles')
              .update({ 
                stripe_onboarding_complete: true
                // Let the database handle updated_at
              })
              .eq('stripe_account_id', account.id)
              .select();
              
            if (error) {
              console.error('Error updating profile:', error);
            } else {
              console.log(`Shopper onboarding completed for account: ${account.id}, updated profile: ${JSON.stringify(data)}`);
            }
          }
        }
        break;
      }
      
      // These events also indicate completed steps in the onboarding process
      case 'account.application.authorized':
      case 'account.application.deauthorized': 
      case 'capability.updated': {
        const object = event.data.object;
        let accountId;
        
        if (event.type === 'capability.updated') {
          accountId = object.account;
        } else {
          accountId = object.id;
        }
        
        if (!accountId) {
          console.log(`No account ID found in event: ${event.type}`);
          break;
        }
        
        console.log(`Checking account status for: ${accountId} from event: ${event.type}`);
        
        try {
          // Retrieve the latest account details
          const account = await stripe.accounts.retrieve(accountId);
          
          if (account && account.details_submitted) {
            console.log(`Account ${accountId} has completed onboarding (from ${event.type})`);
            
            // Find the profile by stripe_account_id
            const { data: profiles, error: findError } = await supabaseAdmin
              .from('profiles')
              .select('*')
              .eq('stripe_account_id', accountId);
              
            if (findError) {
              console.error('Error finding profile:', findError);
              break;
            }
            
            if (profiles && profiles.length > 0) {
              // Update the profile
              const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ 
                  stripe_onboarding_complete: true
                  // Let the database handle updated_at
                })
                .eq('stripe_account_id', accountId);
                
              if (updateError) {
                console.error('Error updating profile:', updateError);
              } else {
                console.log(`Updated onboarding status for account: ${accountId}`);
              }
            } else {
              console.log(`No profile found for account: ${accountId}`);
            }
          }
        } catch (err) {
          // Handle Stripe permission errors gracefully
          if (err.code === 'account_invalid' || err.type === 'StripePermissionError') {
            console.warn(`Cannot access account ${accountId}: ${err.message}. Skipping.`);
          } else {
            throw err; // Re-throw other errors to be caught by the outer catch
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
          console.error('Error handling successful payment:', paymentErr);
        }
        break;
      }
      
      // Handle person-related events
      case 'person.created':
      case 'person.updated':
      case 'person.deleted': {
        console.log(`Received person event: ${event.type}`);
        // These are informational events that don't require action
        break;
      }
      
      // Handle external account events
      case 'account.external_account.created':
      case 'account.external_account.updated':
      case 'account.external_account.deleted': {
        console.log(`Received external account event: ${event.type}`);
        // These events relate to bank accounts or cards being added to Connect accounts
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (err) {
    // Handle different types of errors gracefully
    console.error('Webhook processing error:', err);
    
    // For database schema errors, don't return a 500
    if (err.code === 'PGRST204') {
      console.warn('Database schema issue detected:', err.message);
      return NextResponse.json({ 
        received: true,
        warning: 'Database schema issue detected'
      });
    }
    
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
    const { error: updateError } = await supabaseAdmin // Fixed: Using supabaseAdmin instead of supabase
      .from('transactions')
      .update({ status: 'paid' })
      .eq('payment_intent_id', paymentIntent.id);
      
    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return;
    }
    
    // Update request status to paid
    const { error: requestError } = await supabaseAdmin // Fixed: Using supabaseAdmin instead of supabase
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