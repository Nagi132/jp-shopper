'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RequestHeader({ 
  request, 
  className = "",
  onBack = () => {}
}) {
  const router = useRouter();
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-purple-100 text-purple-800';
      case 'purchased': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className={`mb-6 overflow-hidden ${className}`}>
      <CardHeader className="bg-gray-50 border-b">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <CardTitle className="text-2xl">{request.title}</CardTitle>
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(request.status)}`}>
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
      <CardContent className="pt-3 pb-0">
        <Button variant="outline" onClick={onBack} className="mb-4">
          ← Back to Requests
        </Button>
      </CardContent>
    </Card>
  );
}