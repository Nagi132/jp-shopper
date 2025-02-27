'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '@/components/payments/CheckoutForm';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function RequestDetailPage({ params }) {
  const unwrappedParams = use(params);
  const requestId = unwrappedParams.id;
  
  const [user, setUser] = useState(null);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCustomer, setIsCustomer] = useState(false);
  const [isShopper, setIsShopper] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUser(user);

        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Request not found');
        
        setRequest(data);
        
        // Check if user is the customer or shopper for this request
        setIsCustomer(user.id === data.customer_id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*, shopper_profiles(*)')
          .eq('user_id', user.id)
          .single();

        setIsShopper(
          profile?.is_shopper && 
          profile?.shopper_profiles?.id === data.shopper_id
        );
        
      } catch (err) {
        console.error('Error fetching request:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, router]);

  const handleCancelRequest = async () => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;
      
      // Update local state
      setRequest(prev => ({ ...prev, status: 'cancelled' }));
    } catch (err) {
      console.error('Error cancelling request:', err);
      alert('Failed to cancel request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleAcceptRequest = async () => {
    setActionLoading(true);
    try {
      // Get shopper profile id
      const { data: shopperProfile, error: profileError } = await supabase
        .from('shopper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Update the request
      const { error } = await supabase
        .from('requests')
        .update({ 
          shopper_id: shopperProfile.id,
          status: 'assigned'
        })
        .eq('id', requestId);

      if (error) throw error;
      
      // Update local state
      setRequest(prev => ({
        ...prev,
        shopper_id: shopperProfile.id,
        status: 'assigned'
      }));
      
      setIsShopper(true);
      
    } catch (err) {
      console.error('Error accepting request:', err);
      alert('Failed to accept request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!confirm(`Are you sure you want to mark this request as ${newStatus}?`)) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;
      
      // Update local state
      setRequest(prev => ({
        ...prev,
        status: newStatus
      }));
      
    } catch (err) {
      console.error(`Error updating request status to ${newStatus}:`, err);
      alert('Failed to update request status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading request details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <h2 className="text-lg font-medium text-red-700 mb-2">Error Loading Request</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/requests')}>
              Back to Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
          ← Back to Requests
        </Button>
        
        <div className="flex gap-2">
          {isCustomer && request.status === 'open' && (
            <Button 
              variant="outline" 
              className="text-red-500 border-red-300 hover:bg-red-50"
              onClick={handleCancelRequest}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cancel Request
            </Button>
          )}
          
          {!isCustomer && !isShopper && request.status === 'open' && (
            <Button 
              onClick={handleAcceptRequest}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Accept Request
            </Button>
          )}
          
          {/* Payment button for customers when request is assigned */}
          {isCustomer && request.status === 'assigned' && (
            <Button 
              onClick={() => setShowPayment(true)}
              className="bg-green-600 hover:bg-green-700"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Make Payment
            </Button>
          )}
          
          {isShopper && request.status === 'assigned' && (
            <>
              <Button 
                onClick={() => handleUpdateStatus('purchased')}
                disabled={actionLoading}
                variant="outline"
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Mark as Purchased
              </Button>
            </>
          )}
          
          {isShopper && request.status === 'purchased' && (
            <Button 
              onClick={() => handleUpdateStatus('shipped')}
              disabled={actionLoading}
              variant="outline"
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Mark as Shipped
            </Button>
          )}
          
          {isCustomer && request.status === 'shipped' && (
            <Button 
              onClick={() => handleUpdateStatus('completed')}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Receipt
            </Button>
          )}
        </div>
      </div>
      
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <CardTitle className="text-2xl">{request.title}</CardTitle>
              <div className="mt-2">
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full capitalize 
                  ${request.status === 'open' ? 'bg-green-100 text-green-800' : 
                    request.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                    request.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    request.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                    request.status === 'purchased' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                    request.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'}`}
                >
                  {request.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                {request.budget ? `¥${request.budget.toLocaleString()}` : 'Flexible budget'}
              </div>
              <div className="text-sm text-gray-500">
                Created: {new Date(request.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="whitespace-pre-wrap text-gray-700">{request.description}</p>
          </div>
          
          {request.images && request.images.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Reference Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {request.images.map((url, index) => (
                  <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={url}
                      alt={`Reference ${index + 1}`}
                      className="w-full h-48 object-cover rounded-md hover:opacity-90 transition-opacity border border-gray-200"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-lg font-medium mb-2">Request Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Current Status:</span>
                <span className="font-medium capitalize">{request.status}</span>
              </div>
              {request.shopper_id ? (
                <div className="flex justify-between">
                  <span className="text-gray-700">Assigned Shopper:</span>
                  <span className="font-medium">Shopper Name</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-700">Assigned Shopper:</span>
                  <span className="text-gray-500">None yet</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment form that appears when "Make Payment" is clicked */}
      {showPayment && (
        <div className="mb-6">
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              requestId={requestId}
              amount={request.budget} 
              onSuccess={() => {
                setShowPayment(false);
                // Update request status to paid
                handleUpdateStatus('paid');
              }}
            />
          </Elements>
        </div>
      )}
      
      {/* Placeholder for future messaging component */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            Communications about this request
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-md">
            <p className="mb-2">Messaging functionality coming soon</p>
            <p className="text-sm">You'll be able to communicate with your shopper/customer here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}