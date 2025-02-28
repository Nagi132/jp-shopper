'use client';

import { Button } from '@/components/ui/button';
import { MapPin, Star, ShieldCheck, User } from 'lucide-react';

export default function ProposalItem({ 
  proposal, 
  onAccept, 
  onDecline 
}) {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className="bg-gray-100 rounded-full p-2 mr-3">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h4 className="font-medium">{proposal.shopper_name}</h4>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {proposal.location}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-sm">{proposal.rating}</span>
          </div>
          <div className="flex items-center mt-1">
            <ShieldCheck className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-xs capitalize">{proposal.verification}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-md mb-4">
        <p className="text-sm text-gray-700">{proposal.customer_message}</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onDecline}
          disabled={proposal.status !== 'pending'}
          className="text-sm"
        >
          Decline
        </Button>
        <Button
          onClick={onAccept}
          disabled={proposal.status !== 'pending'}
          className="text-sm"
        >
          Accept
        </Button>
      </div>
    </div>
  );
}