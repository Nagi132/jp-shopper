// src/components/payments/CheckoutForm.jsx
'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function CheckoutForm({ requestId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      // Get customer ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Create payment intent on the server
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          customerId: user.id,
          amount
        })
      });
      
      const { clientSecret, error: intentError } = await response.json();
      
      if (intentError) {
        throw new Error(intentError);
      }
      
      // Confirm the payment
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)
        }
      });
      
      if (stripeError) {
        throw new Error(stripeError.message);
      }
      
      // Payment succeeded
      onSuccess();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Your payment will be held securely until you confirm receipt of your item
            </p>
            <div className="border rounded-md p-3">
              <CardElement options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }} />
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="text-lg font-bold">
              Total: ¥{amount.toLocaleString()}
            </div>
            <Button 
              type="submit" 
              disabled={processing || !stripe}
              className="ml-auto"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ¥${amount.toLocaleString()}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}