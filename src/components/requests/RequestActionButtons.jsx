'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Truck, CheckCircle } from 'lucide-react';

export default function RequestActionButtons({ 
  request,
  isCustomer,
  isShopper,
  loading = false,
  onCancel,
  onShowPayment,
  onUpdateStatus,
  onShowProposalForm,
  className = ""
}) {
  const [localLoading, setLocalLoading] = useState(false);
  
  // Handle state transition with logging
  const handleStatusUpdate = async (newStatus) => {
    setLocalLoading(true);
    console.log(`Attempting to update status from ${request.status} to ${newStatus}`);
    
    try {
      await onUpdateStatus(newStatus);
      console.log(`Status updated successfully to ${newStatus}`);
    } catch (err) {
      console.error(`Error updating status to ${newStatus}:`, err);
    } finally {
      setLocalLoading(false);
    }
  };
  
  const isButtonLoading = loading || localLoading;
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Customer cancellation button */}
      {isCustomer && request.status === 'open' && (
        <Button
          variant="outline"
          className="text-red-500 border-red-300 hover:bg-red-50"
          onClick={onCancel}
          disabled={isButtonLoading}
        >
          {isButtonLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Cancel Request
        </Button>
      )}

      {/* Shopper proposal button */}
      {!isCustomer && !isShopper && request.status === 'open' && (
        <Button
          onClick={onShowProposalForm}
          disabled={isButtonLoading}
        >
          {isButtonLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Send Proposal
        </Button>
      )}

      {/* Payment button for customers */}
      {isCustomer && request.status === 'assigned' && (
        <Button
          onClick={onShowPayment}
          className="bg-green-600 hover:bg-green-700"
          disabled={isButtonLoading}
        >
          {isButtonLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Make Payment
        </Button>
      )}

      {/* Shopper "purchased" button - IMPORTANT STEP */}
      {isShopper && request.status === 'paid' && (
        <Button
          onClick={() => handleStatusUpdate('purchased')}
          disabled={isButtonLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isButtonLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Package className="w-4 h-4 mr-2" />
          )}
          Mark as Purchased
        </Button>
      )}

      {/* Shopper "shipped" button */}
      {isShopper && request.status === 'purchased' && (
        <Button
          onClick={() => handleStatusUpdate('shipped')}
          disabled={isButtonLoading}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isButtonLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Truck className="w-4 h-4 mr-2" />
          )}
          Mark as Shipped
        </Button>
      )}

      {/* Customer "completed" button */}
      {isCustomer && request.status === 'shipped' && (
        <Button
          onClick={() => handleStatusUpdate('completed')}
          disabled={isButtonLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isButtonLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Confirm Receipt
        </Button>
      )}
    </div>
  );
}