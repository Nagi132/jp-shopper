'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading your requests...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md my-6">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Requests</h1>
        <Button asChild>
          <Link href="/requests/new">Create New Request</Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-gray-500 mb-4">You haven't created any shopping requests yet.</p>
            <Button asChild>
              <Link href="/requests/new">Create Your First Request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{request.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {request.description}
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        Budget: {request.budget ? `¥${request.budget.toLocaleString()}` : 'Flexible'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Status: <span className="px-2 py-0.5 rounded-full capitalize bg-gray-100">{request.status}</span>
                      </span>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/requests/${request.id}`}>View Details</Link>
                  </Button>
                </div>
                
                {request.images && request.images.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {request.images.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Reference ${index + 1}`}
                        className="h-20 w-auto rounded-md object-cover"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}