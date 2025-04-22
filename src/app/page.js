'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DialogProvider } from '@/components/windows/MessageBox';
import LandingPage from '@/components/windows/LandingPage';

export default function RootPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
        
        if (data.user) {
          // If user is logged in, redirect to desktop
          router.replace('/desktop');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth error:', error);
        setLoading(false);
      }
    };
    
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mr-3"></div>
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // If not logged in, show the landing page
  return (
    <DialogProvider>
      <div className="h-screen w-screen" style={{ 
        backgroundImage: 'linear-gradient(135deg, rgba(105, 239, 215, 0.1), rgba(254, 209, 235, 0.1))' 
      }}>
        <LandingPage />
      </div>
    </DialogProvider>
  );
}