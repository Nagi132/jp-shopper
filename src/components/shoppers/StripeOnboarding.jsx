// src/components/shoppers/StripeOnboarding.jsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function StripeOnboarding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const startOnboarding = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const response = await fetch('/api/shopper/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          returnUrl: window.location.href
        })
      });
      
      const { url, error: apiError } = await response.json();
      
      if (apiError) throw new Error(apiError);
      
      // Redirect to Stripe onboarding
      window.location.href = url;
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
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
          <div className="p-3 bg-red-50 text-red-600 rounded-md mb-4">
            {error}
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