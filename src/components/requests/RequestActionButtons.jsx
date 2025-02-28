'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Customer cancellation button */}
      {isCustomer && request.status === 'open' && (
        <Button
          variant="outline"
          className="text-red-500 border-red-300 hover:bg-red-50"
          onClick={onCancel}
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Cancel Request
        </Button>
      )}

      {/* Shopper proposal button */}
      {!isCustomer && !isShopper && request.status === 'open' && (
        <Button
          onClick={onShowProposalForm}
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Send Proposal
        </Button>
      )}

      {/* Payment button for customers */}
      {isCustomer && request.status === 'assigned' && (
        <Button
          onClick={onShowPayment}
          className="bg-green-600 hover:bg-green-700"
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Make Payment
        </Button>
      )}

      {/* Shopper "purchased" button */}
      {isShopper && request.status === 'paid' && (
        <Button
          onClick={() => onUpdateStatus('purchased')}
          disabled={loading}
          variant="outline"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Mark as Purchased
        </Button>
      )}

      {/* Shopper "shipped" button */}
      {isShopper && request.status === 'purchased' && (
        <Button
          onClick={() => onUpdateStatus('shipped')}
          disabled={loading}
          variant="outline"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Mark as Shipped
        </Button>
      )}

      {/* Customer "completed" button */}
      {isCustomer && request.status === 'shipped' && (
        <Button
          onClick={() => onUpdateStatus('completed')}
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Confirm Receipt
        </Button>
      )}
    </div>
  );
}