'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SimpleStripeOnboarding from '@/components/shoppers/StripeOnboarding';

export default function ShopperSettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isShopper, setIsShopper] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getProfile = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        // Check if user is a shopper
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_shopper')
          .eq('user_id', user.id)
          .single();
          
        if (profile?.is_shopper) {
          setIsShopper(true);
        } else {
          // Not a shopper, redirect to dashboard
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!isShopper) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Shopper Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Connect your bank account to receive payments from customers.
              </p>
              
              {/* The Stripe Connect onboarding component */}
              <SimpleStripeOnboarding />
            </CardContent>
          </Card>
        </div>
        
        {/* You can add other shopper settings cards here */}
      </div>
    </div>
  );
}