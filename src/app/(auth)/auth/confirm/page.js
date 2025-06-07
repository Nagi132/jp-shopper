'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, X, Loader2 } from 'lucide-react';

// This page handles the redirect from email verification
function EmailConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Supabase auth library automatically handles the token in the URL
        const { data, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (data && data.user) {
          // User is authenticated and verified
          setSuccess(true);
          
          // Create or update profiles as needed
          try {
            // Check if profile exists
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', data.user.id)
              .single();
              
            // If no profile exists, fetch user metadata and create one
            if (!profile) {
              const { data: userData } = await supabase.auth.getUser();
              const metadata = userData?.user?.user_metadata || {};
              
              // Create profile
              await supabase
                .from('profiles')
                .insert({
                  user_id: data.user.id,
                  username: metadata.username || data.user.email.split('@')[0],
                  full_name: metadata.full_name || '',
                  is_shopper: metadata.is_shopper || false
                });
                
              // Create shopper profile if needed
              if (metadata.is_shopper) {
                await supabase
                  .from('shopper_profiles')
                  .insert({
                    user_id: data.user.id,
                    specialties: [],
                    location: '',
                    bio: '',
                    verification_level: 'pending',
                    rating: 0,
                    languages: ['Japanese']
                  });
              }
            }
          } catch (profileError) {
            console.error('Error creating profiles:', profileError);
            // Continue anyway since the verification was successful
          }
        } else {
          throw new Error('Verification failed or expired');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError(err.message);
      } finally {
        setVerifying(false);
      }
    };
    
    if (searchParams) {
      verifyEmail();
    }
  }, [searchParams, router]);

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Verifying your email...</p>
            <p className="text-gray-500 mt-2">Please wait while we confirm your email address</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
              Verification Failed
            </CardTitle>
            <CardDescription className="text-center">
              We couldn't verify your email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              <p className="font-medium mb-2">Error Details</p>
              <p>{error || "The verification link may be invalid or expired."}</p>
            </div>
            <p className="text-sm text-gray-600">
              You can try logging in again or request a new verification email from the login page.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/login">Back to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            Email Verified
          </CardTitle>
          <CardDescription className="text-center">
            Your email has been successfully verified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4 text-center">
            <p className="font-medium mb-2">Your account is now active!</p>
            <p>You can now log in and start using the platform.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function EmailConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Loading...
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <EmailConfirmContent />
    </Suspense>
  );
}