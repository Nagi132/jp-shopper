// src/components/dashboard/ActiveRequestsCard.jsx
import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getStatusColor, getStatusIcon } from '@/lib/helpers/requestStatusHelpers';

export default function ActiveRequestsCard({ 
  requests, 
  isShopperProfile,
  maxItems = 3 
}) {
  if (requests.length === 0) return null;

  return (
    <Card className={`border-${isShopperProfile ? 'indigo' : 'blue'}-200`}>
      <CardHeader className={`bg-${isShopperProfile ? 'indigo' : 'blue'}-50`}>
        <CardTitle className={`flex items-center text-${isShopperProfile ? 'indigo' : 'blue'}-800`}>
          <Package className="w-5 h-5 mr-2" />
          {isShopperProfile ? 'Your Active Jobs' : 'Active Requests'}
        </CardTitle>
        <CardDescription>
          {isShopperProfile 
            ? 'Requests you\'re currently working on' 
            : 'Requests currently in progress'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.slice(0, maxItems).map((request) => (
            <div 
              key={request.id} 
              className="p-4 border rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{request.title || 'Untitled Request'}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {request.description || 'No description provided'}
                  </p>
                </div>
                <span 
                  className={`px-2 py-1 text-xs rounded-full capitalize inline-flex items-center gap-1 ${getStatusColor(request.status)}`}
                >
                  {getStatusIcon(request.status)}
                  <span>{request.status}</span>
                </span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-500">
                  Budget: {request.budget ? `¥${request.budget.toLocaleString()}` : 'Flexible'}
                </span>
                <Button asChild size="sm" variant={isShopperProfile ? 'default' : 'outline'}>
                  <Link href={`/requests/${request.id}`}>
                    {isShopperProfile ? 'Manage' : 'View Details'}
                  </Link>
                </Button>
              </div>
            </div>
          ))}

          {requests.length > maxItems && (
            <Button 
              asChild 
              variant="ghost" 
              className="w-full mt-2" 
              size="sm"
            >
              <Link href="/requests" className="flex items-center justify-center">
                View all {isShopperProfile ? 'active jobs' : 'active requests'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}