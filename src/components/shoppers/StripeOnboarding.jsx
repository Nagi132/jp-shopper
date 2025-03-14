// src/components/shoppers/StripeOnboarding.jsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function StripeOnboarding() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);
  const [onboardingStatus, setOnboardingStatus] = useState('not_started'); // not_started, pending, complete
  const [accountId, setAccountId] = useState(null);
  
  // Check current onboarding status when component loads
  useEffect(() => {
    checkOnboardingStatus();
  }, []);
  
  // Function to check if onboarding is already complete
  const checkOnboardingStatus = async () => {
    try {
      setChecking(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_onboarding_complete')
        .eq('user_id', user.id)
        .single();
      
      if (data?.stripe_onboarding_complete) {
        setOnboardingStatus('complete');
        setAccountId(data.stripe_account_id);
      } else if (data?.stripe_account_id) {
        setOnboardingStatus('pending');
        setAccountId(data.stripe_account_id);
      } else {
        setOnboardingStatus('not_started');
      }
    } catch (err) {
      console.error('Error checking onboarding status:', err);
      setError('Failed to check onboarding status');
    } finally {
      setChecking(false);
    }
  };
  
  // In the startOnboarding function in StripeOnboarding.jsx
const startOnboarding = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    console.log('Starting onboarding for user:', user.id);
    
    // Ensure the user is marked as a shopper in their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_shopper')
      .eq('user_id', user.id)
      .single();
      
    // If profile exists but is_shopper is false, update it locally first
    if (profile && !profile.is_shopper) {
      console.log('Updating local profile to set is_shopper to true');
      await supabase
        .from('profiles')
        .update({ is_shopper: true })
        .eq('user_id', user.id);
    }
    
    const response = await fetch('/api/shopper/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        returnUrl: window.location.href
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to start onboarding');
    }
    
    // Redirect to Stripe onboarding
    window.location.href = data.url;
  } catch (err) {
    console.error('Onboarding error:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
  
  // Show loader while checking status
  if (checking) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Checking account status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show different content based on onboarding status
  if (onboardingStatus === 'complete') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            Payment Account Connected
          </CardTitle>
          <CardDescription>
            Your bank account is set up to receive payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Your Stripe account is successfully connected. You'll receive payments directly to your bank account
            when customers purchase items through you.
          </p>
          
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
            <p>
              <strong>Fee structure:</strong> For each transaction, you'll receive the item price plus the shipping fee,
              minus a 3% platform fee and a 5% service fee added to your earnings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (onboardingStatus === 'pending') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Account Setup</CardTitle>
          <CardDescription>
            Your account setup is not yet complete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            You've started the account setup process, but it's not complete yet.
            Please finish setting up your account to receive payments.
          </p>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <Button 
            onClick={startOnboarding}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resuming setup...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Continue Account Setup
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Default view for not_started
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Account Setup</CardTitle>
        <CardDescription>
          Set up your Stripe account to receive payments from customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Before you can accept requests and receive payments, you need to connect your Stripe account.
          This will allow us to securely transfer funds to you when customers pay for their items.
        </p>
        
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <Button 
          onClick={startOnboarding}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            'Set Up Payment Account'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}