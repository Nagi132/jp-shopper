'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
        try {
          // Get current user
          const { data: authData, error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            console.error('Auth error:', authError);
            throw authError;
          }
          
          if (!authData.user) {
            console.log('No user found');
            return;
          }
          
          console.log('User found:', authData.user.id);
      
          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*, shopper_profiles(*)')
            .eq('user_id', authData.user.id)
            .single();
      
          console.log('Profile query result:', { profileData, profileError });
      
          if (profileError) {
            if (profileError.code === 'PGRST116') {
              console.log('Profile not found for user');
              setProfile(null);
              setLoading(false);
              return;
            }
            throw profileError;
          }
      
          setProfile(profileData);
      
          // For now, let's skip loading requests until we have the profile working
          setRequests([]);
          
          // Uncomment this code once profile is working
          /*
          // Get relevant requests based on user type
          if (profileData.is_shopper) {
            // For shoppers: Get requests they've accepted and open requests
            const { data: shopperRequests, error: requestsError } = await supabase
              .from('requests')
              .select('*')
              .or(`status.eq.open`)
              .order('created_at', { ascending: false })
              .limit(10);
              
            console.log('Shopper requests query:', { shopperRequests, requestsError });
              
            if (requestsError) throw requestsError;
            setRequests(shopperRequests || []);
          } else {
            // For customers: Get their own requests
            const { data: customerRequests, error: requestsError } = await supabase
              .from('requests')
              .select('*')
              .eq('customer_id', authData.user.id)
              .order('created_at', { ascending: false })
              .limit(10);
              
            console.log('Customer requests query:', { customerRequests, requestsError });
              
            if (requestsError) throw requestsError;
            setRequests(customerRequests || []);
          }
          */
        } catch (err) {
          console.error('Error loading dashboard data:', err);
          setError(`Failed to load dashboard data: ${err.message || JSON.stringify(err)}`);
        } finally {
          setLoading(false);
        }
      };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading your dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md my-6">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Please complete your profile to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">We need some additional information before you can use the platform.</p>
            <Button asChild>
              <Link href="/profile">Set Up Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the appropriate dashboard based on user type
  return profile.is_shopper ? <ShopperDashboard profile={profile} requests={requests} /> : <CustomerDashboard profile={profile} requests={requests} />;
}

function CustomerDashboard({ profile, requests }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {profile.full_name || profile.username}!</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/requests/new">Create New Request</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/shoppers">Browse Shoppers</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col justify-center items-center h-32 text-center">
              <p className="text-3xl font-bold">{requests.length}</p>
              <p className="text-gray-500">Shopping {requests.length === 1 ? 'Request' : 'Requests'}</p>
              <Link href="/requests" className="text-blue-500 hover:underline mt-2">
                View All Requests
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Your most recent shopping requests</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">You haven't created any shopping requests yet.</p>
              <Button asChild>
                <Link href="/requests/new">Create Your First Request</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="p-4 border rounded-md hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{request.title || 'Untitled Request'}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {request.description || 'No description provided'}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full capitalize bg-gray-100">
                      {request.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-gray-500">
                      Budget: ¥{request.budget?.toLocaleString() || 'Not specified'}
                    </span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/requests/${request.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
              
              {requests.length > 0 && (
                <div className="text-center pt-2">
                  <Link href="/requests" className="text-sm text-blue-500 hover:underline">
                    View All Requests
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ShopperDashboard({ profile, requests }) {
    const router = useRouter();
    // Filter requests by status
    const openRequests = requests.filter(req => req.status === 'open');
    const myRequests = requests.filter(req => req.shopper_id === profile.shopper_profiles?.id);
    const activeRequests = myRequests.filter(req => req.status !== 'completed' && req.status !== 'cancelled');
    const completedRequests = myRequests.filter(req => req.status === 'completed');
    
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Welcome, {profile.full_name || profile.username}!</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Shopper Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Verification:</span>
                  <span className="px-2 py-1 text-xs rounded-full capitalize bg-gray-100">
                    {profile.shopper_profiles?.verification_level || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Location:</span>
                  <span className="text-gray-900">{profile.shopper_profiles?.location || 'Not specified'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Rating:</span>
                  <span className="text-gray-900">
                    {profile.shopper_profiles?.rating ? `${profile.shopper_profiles.rating}/5.0` : 'No ratings yet'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Active Requests:</span>
                  <span className="text-gray-900">{activeRequests.length}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/profile">Edit Profile</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/shoppers/browse">Browse Available Requests</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/shoppers/earnings">View Earnings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {activeRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Active Jobs</CardTitle>
              <CardDescription>Requests you're currently working on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-md hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{request.title || 'Untitled Request'}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {request.description || 'No description provided'}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full capitalize bg-blue-100 text-blue-800">
                        {request.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm text-gray-500">
                        Budget: ¥{request.budget?.toLocaleString() || 'Not specified'}
                      </span>
                      <Button asChild size="sm">
                        <Link href={`/requests/${request.id}`}>Manage</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Open Requests</CardTitle>
            <CardDescription>Recent shopping requests available to accept</CardDescription>
          </CardHeader>
          <CardContent>
            {openRequests.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-2">No open requests available at the moment</p>
                <p className="text-sm text-gray-400">Check back soon for new opportunities</p>
              </div>
            ) : (
              <div className="space-y-4">
                {openRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="p-4 border rounded-md hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{request.title || 'Untitled Request'}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {request.description || 'No description provided'}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Open
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm text-gray-500">
                        Budget: ¥{request.budget?.toLocaleString() || 'Not specified'}
                      </span>
                      <Button asChild size="sm">
                        <Link href={`/requests/${request.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                ))}
                
                {openRequests.length > 3 && (
                  <div className="text-center pt-2">
                    <Button asChild variant="outline">
                      <Link href="/shoppers/browse">View All Open Requests</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }