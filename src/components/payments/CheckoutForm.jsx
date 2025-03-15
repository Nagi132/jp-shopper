// src/components/payments/CheckoutForm.jsx
'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ShoppingBag, CreditCard, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import ShippingDepositSystem from '@/components/shipping/ShippingDepositSystem';

export default function CheckoutForm({ requestId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [shippingCost, setShippingCost] = useState(2000); // Default shipping deposit
  
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
          amount,
          shippingCost
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
      
      // Update the request to include shipping cost
      const { error: updateError } = await supabase
        .from('requests')
        .update({
          shipping_deposit: shippingCost
        })
        .eq('id', requestId);
        
      if (updateError) {
        console.warn('Error updating request with shipping cost:', updateError);
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
  
  // Handle shipping cost change
  const handleShippingCostChange = (cost) => {
    setShippingCost(cost);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>
          Complete your payment for this request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              Your payment will be held securely until you confirm receipt of your item
            </p>
            <div className="border rounded-md p-3 mb-6">
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
            
            {/* Shipping Deposit Component */}
            <ShippingDepositSystem 
              onShippingCostChange={handleShippingCostChange}
              initialCost={shippingCost}
              disabled={processing}
              className="mb-6"
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {/* Payment Summary */}
          <div className="border rounded-md p-4 bg-gray-50 mb-6">
            <h3 className="font-medium text-lg mb-3">Payment Summary</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Item cost:</span>
                <span>¥{amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping deposit:</span>
                <span>¥{shippingCost.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>¥{(amount + shippingCost).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              <p>* The actual shipping cost will be determined when the item is shipped.</p>
              <p>* If the actual shipping cost is lower, you'll receive a refund for the difference.</p>
              <p>* If higher, the shopper may request additional payment.</p>
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={processing || !stripe}
            className="w-full h-12 text-base"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ShoppingBag className="mr-2 h-5 w-5" />
                Pay ¥{(amount + shippingCost).toLocaleString()}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}