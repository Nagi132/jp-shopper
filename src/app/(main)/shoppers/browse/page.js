'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';

export default function BrowseRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Check if the user is a shopper
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_shopper')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;
        if (!profile.is_shopper) {
          router.push('/dashboard');
          return;
        }

        // Fetch all open requests
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
        setFilteredRequests(data || []);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [router]);

  // Filter and search functionality
  useEffect(() => {
    let result = [...requests];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(request => 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        request.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filter !== 'all') {
      // For future implementation when we have categories
    }
    
    setFilteredRequests(result);
  }, [requests, searchTerm, filter]);

  const handleAcceptRequest = async (requestId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get shopper profile id
      const { data: shopperProfile, error: profileError } = await supabase
        .from('shopper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Update the request to assign it to this shopper
      const { error } = await supabase
        .from('requests')
        .update({ 
          shopper_id: shopperProfile.id,
          status: 'assigned'
        })
        .eq('id', requestId);

      if (error) throw error;

      // Navigate to the request detail page
      router.push(`/requests/${requestId}`);
    } catch (err) {
      console.error('Error accepting request:', err);
      alert('Failed to accept request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading available requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <h2 className="text-lg font-medium text-red-700 mb-2">Error Loading Requests</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Available Requests</h1>
        <p className="text-gray-600">Browse open requests that need a shopper</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-2">No available requests found</p>
            <p className="text-sm text-gray-400">Check back later for new shopping requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="p-4 bg-gray-50 border-b">
                <CardTitle className="line-clamp-1">{request.title}</CardTitle>
                <CardDescription>
                  Budget: {request.budget ? `¥${request.budget.toLocaleString()}` : 'Flexible'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <p className="line-clamp-3 text-sm text-gray-700 mb-4 h-16">
                  {request.description}
                </p>
                
                {request.images && request.images.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {request.images.slice(0, 3).map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Reference ${index + 1}`}
                        className="h-16 w-16 object-cover rounded-md flex-shrink-0"
                      />
                    ))}
                    {request.images.length > 3 && (
                      <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-500 flex-shrink-0">
                        +{request.images.length - 3}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => router.push(`/requests/${request.id}`)}
                    variant="outline"
                    className="w-full"
                  >
                    View Details
                  </Button>
                  <Button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="w-full"
                  >
                    Accept Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}