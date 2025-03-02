'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import LandingPage from '@/components/landing/LandingPage';
import ExplorePage from '@/components/explore/ExplorePage';

export default function RootPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
        setLoading(false);
      } catch (error) {
        console.error('Auth error:', error);
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mr-3"></div>
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // If user is logged in, show the Explore page
  if (user) {
    return <ExplorePage user={user} />;
  }

  // Otherwise, show the landing page
  return <LandingPage />;
}