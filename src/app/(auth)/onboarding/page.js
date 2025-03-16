'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, User, ShoppingBag } from 'lucide-react';

export default function OnboardingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState('customer');
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      // Get current user
      const { data } = await supabase.auth.getUser();
      
      if (!data.user) {
        // Not logged in, redirect to login
        router.push('/login');
        return;
      }
      
      // Check if user already has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
        
      if (profile) {
        // User already has profile, redirect to dashboard
        router.push('/dashboard');
        return;
      }
      
      // Populate form with data from auth
      setUser(data.user);
      
      // Try to pre-fill data if available from OAuth
      const metadata = data.user.user_metadata || {};
      if (metadata.full_name) setFullName(metadata.full_name);
      if (metadata.name) setFullName(metadata.name);
      if (!username && data.user.email) {
        // Create a username suggestion from email
        setUsername(data.user.email.split('@')[0]);
      }
      
      setLoading(false);
    };
    
    checkUser();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      if (!user) throw new Error('No user found');
      
      // Create profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          username,
          full_name: fullName,
          is_shopper: userType === 'shopper',
        })
        .select();
        
      if (profileError) throw profileError;
      
      // If they're a shopper, create shopper profile
      if (userType === 'shopper') {
        const { error: shopperError } = await supabase
          .from('shopper_profiles')
          .insert({
            user_id: user.id,
            specialties: [],
            location: '',
            bio: '',
            verification_level: 'pending',
            rating: 0,
            languages: ['Japanese'],
          });
          
        if (shopperError) throw shopperError;
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Preparing your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>Just a few more details to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            
            <div className="space-y-3">
              <Label>I want to join as:</Label>
              <RadioGroup 
                value={userType} 
                onValueChange={setUserType}
                className="grid grid-cols-2 gap-4 pt-2"
              >
                <div className={`relative rounded-lg border-2 p-4 flex flex-col items-center cursor-pointer transition-all ${
                  userType === "customer" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-200"
                }`}>
                  <RadioGroupItem value="customer" id="customer" className="sr-only" />
                  <ShoppingBag className={`h-8 w-8 mb-2 ${userType === "customer" ? "text-blue-600" : "text-gray-500"}`} />
                  <Label htmlFor="customer" className="cursor-pointer font-medium text-center">
                    Customer
                    <p className="font-normal text-xs text-gray-500 mt-1">
                      Find and buy items from Japan
                    </p>
                  </Label>
                </div>
                
                <div className={`relative rounded-lg border-2 p-4 flex flex-col items-center cursor-pointer transition-all ${
                  userType === "shopper" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-200"
                }`}>
                  <RadioGroupItem value="shopper" id="shopper" className="sr-only" />
                  <User className={`h-8 w-8 mb-2 ${userType === "shopper" ? "text-indigo-600" : "text-gray-500"}`} />
                  <Label htmlFor="shopper" className="cursor-pointer font-medium text-center">
                    Shopper
                    <p className="font-normal text-xs text-gray-500 mt-1">
                      Shop for others in Japan
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Setting up your account...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}