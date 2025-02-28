'use client';

import { Card, CardContent } from '@/components/ui/card';
import StatusTimeline from './StatusTimeline';

export default function RequestDetails({ 
  request, 
  shopperName,
  className = ""
}) {
  return (
    <Card className={className}>
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
              <StatusTimeline currentStatus={request.status} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}