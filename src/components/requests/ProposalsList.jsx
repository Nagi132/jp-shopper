'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import ProposalItem from './ProposalItem';

export default function ProposalsList({ 
  proposals = [],
  loading = false,
  onAccept,
  onDecline,
  className = ""
}) {
  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle>Shopper Proposals</CardTitle>
        <CardDescription>
          Shoppers who are interested in helping you
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2">Loading proposals...</span>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No proposals yet</p>
            <p className="text-sm">Shoppers will send proposals when they're interested in your request</p>
          </div>
        ) : (
          <div className="space-y-6">
            {proposals.map(proposal => (
              <ProposalItem 
                key={proposal.id}
                proposal={proposal}
                onAccept={() => onAccept(proposal.id)}
                onDecline={() => onDecline(proposal.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}