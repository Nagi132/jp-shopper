// src/components/payments/CheckoutForm.jsx
'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ShoppingBag, CreditCard, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import ShippingDepositSystem from '@/components/shipping/ShippingDepositSystem';

export default function CheckoutForm({ requestId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [shippingCost, setShippingCost] = useState(2000); // Default shipping deposit
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError("Stripe hasn't loaded yet. Please try again.");
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      // Get customer ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      console.log('Request payment for:', { 
        requestId, 
        userId: user.id,
        amount,
        shippingCost 
      });
      
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
      
      // Parse the response even if it's an error
      const responseData = await response.json();
      console.log('Payment API response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || 'Unknown error creating payment');
      }
      
      const { clientSecret } = responseData;
      
      if (!clientSecret) {
        throw new Error('No client secret returned from payment creation');
      }
      
      // Confirm the payment with billing details included
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'Test User', // For testing, provide these details
            email: user.email,
            address: {
              postal_code: '123-4567', // Japanese postal code format
              country: 'JP',
            }
          }
        }
      });
      
      if (stripeError) {
        console.error("Stripe payment error:", stripeError);
        
        // Translate common Stripe errors
        if (stripeError.message.includes('郵便番号')) {
          throw new Error('Please enter a valid postal code (e.g., 123-4567).');
        } else {
          throw new Error(stripeError.message);
        }
      }
      
      console.log("Payment succeeded:", paymentIntent);
      setSucceeded(true);
      
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
      setTimeout(() => {
        onSuccess();
      }, 1000); // Short delay to show success message
      
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

  // For testing in development, show test card numbers
  const renderTestCardInfo = () => {
    if (process.env.NODE_ENV !== 'production') {
      return (
        <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-4">
          <h4 className="font-medium mb-1">Test Card Information:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Card Number: 4242 4242 4242 4242</li>
            <li>Expiry: Any future date (e.g., 12/25)</li>
            <li>CVC: Any 3 digits</li>
            <li>Postal Code: Any valid format (e.g., 123-4567)</li>
          </ul>
        </div>
      );
    }
    return null;
  };
  
  // Show success state
  if (succeeded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your payment has been processed. The shopper will be notified to purchase and ship your item.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
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
            
            {/* Test card information in development */}
            {renderTestCardInfo()}
            
            <div className="border rounded-md p-3 mb-6">
              <CardElement options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                    padding: '10px 12px',
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
                hidePostalCode: false, // Show postal code field
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
            <div className="p-3 bg-red-50 text-red-600 rounded-md mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
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