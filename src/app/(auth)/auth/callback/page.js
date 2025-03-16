'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [status, setStatus] = useState('Finalizing authentication...');
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get session (this should be set by the OAuth callback)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }
        
        // Check if user already has a profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking profile:', error);
        }
        
        // Redirect based on whether profile exists
        if (profile) {
          // Profile exists, go to dashboard
          router.push('/dashboard');
        } else {
          // New user, go to onboarding
          router.push('/onboarding');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('Authentication error. Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      }
    };
    
    handleAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}