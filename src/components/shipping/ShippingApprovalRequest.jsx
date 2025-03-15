'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, ThumbsUp, ThumbsDown, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

/**
 * Component for customers to approve or reject additional shipping costs
 * - Shows the estimated vs actual costs
 * - Allows viewing receipts
 * - Provides approval or rejection options
 */
export default function ShippingApprovalRequest({ 
  verification,
  requestData,
  onApprove,
  onReject,
  className = ""
}) {
  const [status, setStatus] = useState('pending'); // pending, approving, approved, rejecting, rejected
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showReceipts, setShowReceipts] = useState(false);
  
  const estimatedCost = verification?.estimated_cost || 0;
  const actualCost = verification?.actual_cost || 0;
  const costDifference = actualCost - estimatedCost;
  
  // Handle approval of additional shipping cost
  const handleApprove = async () => {
    setStatus('approving');
    setLoading(true);
    setError(null);
    
    try {
      // Process the additional payment
      const { data: paymentIntentData, error: paymentError } = await supabase.functions.invoke(
        'create-additional-payment-intent',
        {
          body: { 
            verificationId: verification.id, 
            requestId: requestData.id,
            amount: costDifference 
          }
        }
      );
      
      if (paymentError) throw new Error(paymentError.message);
      
      // Update verification status
      const { error: updateError } = await supabase
        .from('shipping_verifications')
        .update({ 
          status: 'approved',
          approval_date: new Date().toISOString()
        })
        .eq('id', verification.id);
        
      if (updateError) throw updateError;
      
      // Update request
      const { error: requestError } = await supabase
        .from('requests')
        .update({ 
          shipping_verified: true,
          shipping_cost: actualCost
        })
        .eq('id', requestData.id);
        
      if (requestError) throw requestError;
      
      setStatus('approved');
      if (onApprove) onApprove();
      
    } catch (err) {
      console.error('Error approving shipping cost:', err);
      setError(err.message);
      setStatus('pending');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle rejection of additional shipping cost
  const handleReject = async () => {
    setStatus('rejecting');
    setLoading(true);
    setError(null);
    
    try {
      // Update verification status
      const { error: updateError } = await supabase
        .from('shipping_verifications')
        .update({ 
          status: 'rejected',
          rejection_date: new Date().toISOString()
        })
        .eq('id', verification.id);
        
      if (updateError) throw updateError;
      
      setStatus('rejected');
      if (onReject) onReject();
      
    } catch (err) {
      console.error('Error rejecting shipping cost:', err);
      setError(err.message);
      setStatus('pending');
    } finally {
      setLoading(false);
    }
  };

  // Styles for status
  const getStatusStyles = () => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <Card className={`${className} ${getStatusStyles()}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-amber-800">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Shipping Cost Approval Required
        </CardTitle>
        <CardDescription className="text-amber-700">
          Your shopper has submitted the actual shipping cost which differs from the estimated amount
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Cost Comparison */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-md border">
            <div>
              <p className="text-sm text-gray-500">Estimated Cost</p>
              <p className="text-lg font-semibold">¥{estimatedCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Actual Cost</p>
              <p className="text-lg font-semibold">¥{actualCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Difference</p>
              <p className="text-lg font-semibold text-amber-600">+¥{costDifference.toLocaleString()}</p>
            </div>
          </div>
          
          {/* Shipping Notes from Shopper */}
          {verification.notes && (
            <div className="p-4 bg-white rounded-md border">
              <p className="text-sm font-medium mb-2">Shopper's Notes:</p>
              <p className="text-sm text-gray-700">{verification.notes}</p>
            </div>
          )}
          
          {/* Receipt Images */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReceipts(!showReceipts)}
              className="mb-2"
            >
              {showReceipts ? 'Hide Receipts' : 'View Receipts'}
            </Button>
            
            {showReceipts && verification.receipt_images && verification.receipt_images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {verification.receipt_images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Receipt ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-black bg-opacity-70 rounded-md p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Status Message */}
          {status === 'approved' && (
            <div className="p-4 bg-green-50 text-green-700 rounded-md flex items-center">
              <ThumbsUp className="h-5 w-5 mr-2" />
              <p>You have approved the additional shipping cost.</p>
            </div>
          )}
          
          {status === 'rejected' && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center">
              <ThumbsDown className="h-5 w-5 mr-2" />
              <p>You have rejected the additional shipping cost.</p>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </CardContent>
      
      {status === 'pending' && (
        <CardFooter className="flex justify-end space-x-4 border-t bg-white p-4">
          <Button 
            variant="outline" 
            onClick={handleReject}
            disabled={loading}
          >
            {loading && status === 'rejecting' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ThumbsDown className="h-4 w-4 mr-2" />
            )}
            Reject
          </Button>
          
          <Button 
            onClick={handleApprove}
            disabled={loading}
          >
            {loading && status === 'approving' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ThumbsUp className="h-4 w-4 mr-2" />
            )}
            Approve & Pay
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}