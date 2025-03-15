'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import StatusTimeline from './StatusTimeline';

export default function RequestDetails({ 
  request, 
  shopperName,
  shippingVerification,
  className = ""
}) {
  // Helper function to format currency
  const formatCurrency = (amount) => {
    return amount ? `¥${amount.toLocaleString()}` : 'Not set';
  };

  // Calculate shipping status and display info
  const getShippingStatus = () => {
    if (!request) return { status: 'none', color: 'bg-gray-100 text-gray-800' };

    if (!request.shipping_deposit && request.status === 'open') {
      return { 
        status: 'not required yet', 
        color: 'bg-gray-100 text-gray-800',
        icon: null
      };
    }
    
    if (!request.shipping_deposit && ['assigned', 'paid', 'purchased'].includes(request.status)) {
      return { 
        status: 'pending deposit', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="w-3 h-3 mr-1" />
      };
    }
    
    if (request.shipping_deposit && !request.shipping_verified && ['paid', 'purchased'].includes(request.status)) {
      return { 
        status: 'deposit paid', 
        color: 'bg-blue-100 text-blue-800',
        icon: <Truck className="w-3 h-3 mr-1" />
      };
    }
    
    if (shippingVerification && shippingVerification.status === 'pending_approval') {
      return { 
        status: 'approval needed', 
        color: 'bg-orange-100 text-orange-800',
        icon: <AlertCircle className="w-3 h-3 mr-1" />
      };
    }
    
    if (request.shipping_verified || ['shipped', 'completed'].includes(request.status)) {
      return { 
        status: 'verified', 
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-3 h-3 mr-1" />
      };
    }
    
    return { 
      status: 'pending', 
      color: 'bg-gray-100 text-gray-800',
      icon: <Clock className="w-3 h-3 mr-1" />
    };
  };

  const shippingStatus = getShippingStatus();

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Description</h3>
          <p className="whitespace-pre-wrap text-gray-700">{request?.description}</p>
        </div>

        {request?.images && request.images.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Reference Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {request.images.map((url, index) => (
                <a 
                  key={index} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block"
                >
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

        {/* Shipping Information Section - New */}
        {request && (request.shipping_deposit > 0 || request.shipping_cost > 0 || shippingVerification) && (
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <div className="flex items-center mb-3">
              <Truck className="mr-2 h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-blue-800">Shipping Information</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Shipping Status:</span>
                <Badge className={`capitalize flex items-center ${shippingStatus.color}`}>
                  {shippingStatus.icon}
                  {shippingStatus.status}
                </Badge>
              </div>
              
              {request.shipping_deposit > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Deposit Amount:</span>
                  <span className="font-medium">{formatCurrency(request.shipping_deposit)}</span>
                </div>
              )}
              
              {shippingVerification && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Estimated Cost:</span>
                    <span className="font-medium">{formatCurrency(shippingVerification.estimated_cost)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-700">Actual Cost:</span>
                    <span className="font-medium">{formatCurrency(shippingVerification.actual_cost)}</span>
                  </div>
                  
                  {shippingVerification.difference !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Difference:</span>
                      <span className={`font-medium ${shippingVerification.difference > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {shippingVerification.difference > 0 ? '+' : ''}
                        {formatCurrency(shippingVerification.difference)}
                      </span>
                    </div>
                  )}
                </>
              )}
              
              {request.shipping_verified && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Final Shipping Cost:</span>
                  <span className="font-medium">{formatCurrency(request.shipping_cost)}</span>
                </div>
              )}
            </div>
            
            {shippingVerification && shippingVerification.notes && (
              <div className="mt-3 p-2 bg-white rounded border text-sm">
                <p className="font-medium mb-1">Shopper's Note:</p>
                <p className="text-gray-700">{shippingVerification.notes}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <h3 className="text-lg font-medium mb-2">Request Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Current Status:</span>
              <span className="font-medium capitalize">{request?.status}</span>
            </div>

            {request?.shopper_id ? (
              <div className="flex justify-between">
                <span className="text-gray-700">Assigned Shopper:</span>
                <span className="font-medium">{shopperName || 'Loading...'}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-700">Assigned Shopper:</span>
                <span className="text-gray-500">None yet</span>
              </div>
            )}

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Status Timeline</h4>
              <StatusTimeline currentStatus={request?.status} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}