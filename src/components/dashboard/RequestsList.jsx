import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getStatusColor, getStatusIcon } from '@/lib/helpers/requestStatusHelpers';

export default function RequestsList({ 
  requests, 
  emptyTitle = 'Requests', 
  emptyDescription = 'No requests found',
  emptyIcon: EmptyIcon,
  onCreateNew,
  maxItems = 5,
  showViewAll = true
}) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-10 bg-gray-50 rounded-md">
          {EmptyIcon && <EmptyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />}
          <p className="text-gray-500 mb-4">{emptyDescription}</p>
          {onCreateNew && (
            <Button onClick={onCreateNew}>
              Create Your First {emptyTitle}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{emptyTitle}</CardTitle>
          {showViewAll && (
            <Button asChild variant="outline" size="sm">
              <Link href="/requests">View All</Link>
            </Button>
          )}
        </div>
        <CardDescription>Your recent requests</CardDescription>
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
                <Button asChild size="sm" variant="outline">
                  <Link href={`/requests/${request.id}`}>View Details</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}