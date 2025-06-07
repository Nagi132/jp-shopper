'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, CheckCircle, RefreshCw } from 'lucide-react';

function VerificationSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [userVerified, setUserVerified] = useState(false);
  const [checking, setChecking] = useState(false);

  // Function to check if user's email is verified
  const checkVerificationStatus = async () => {
    if (!email) return;
    
    setChecking(true);
    
    try {
      // Try to get current session (works if user is already verified)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.user && (session.user.email_confirmed_at || session.user.confirmed_at)) {
        setUserVerified(true);
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
    } finally {
      setChecking(false);
    }
  };

  // Check verification status on mount
  useEffect(() => {
    checkVerificationStatus();
  }, [email]);

  // Handle resend verification email
  const handleResendEmail = async () => {
    if (!email) return;
    
    setResending(true);
    setResendSuccess(false);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });
      
      if (error) throw error;
      
      setResendSuccess(true);
    } catch (err) {
      console.error('Error resending verification email:', err);
      alert(`Failed to resend email: ${err.message}`);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
            {userVerified ? (
              <>
                <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
                Email Verified
              </>
            ) : (
              <>
                <Mail className="mr-2 h-6 w-6 text-blue-500" />
                Verify Your Email
              </>
            )}
          </CardTitle>
          <CardDescription className="text-center">
            {userVerified 
              ? "Your email has been successfully verified"
              : "We've sent a verification email to your inbox"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {userVerified ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4 text-center">
              <p className="font-medium mb-2">Your account is now verified!</p>
              <p>You can now proceed to your dashboard and start using the platform.</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 text-blue-700 p-4 rounded-md mb-4">
                <p className="font-medium mb-2">Please check your email</p>
                <p>We sent a verification link to: <span className="font-medium">{email || 'your email'}</span></p>
                <p className="mt-2 text-sm">Click the link in the email to verify your account and continue.</p>
              </div>
              
              {resendSuccess && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4">
                  <p className="text-sm font-medium">Verification email resent successfully!</p>
                </div>
              )}
            </>
          )}
          
          <div className="text-sm text-gray-500 mt-4">
            <p>Can't find the email? Check your spam folder or try resending the verification email.</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3">
          {userVerified ? (
            <Button className="w-full" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleResendEmail} 
                disabled={resending}
                variant="outline"
                className="w-full"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              
              <Button 
                onClick={checkVerificationStatus} 
                disabled={checking}
                variant="ghost"
                className="w-full"
              >
                {checking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking status...
                  </>
                ) : (
                  "I've already verified my email"
                )}
              </Button>
              
              <div className="w-full text-center">
                <Link href="/login" className="text-sm text-blue-600 hover:underline">
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerificationSentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
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
      <VerificationSentContent />
    </Suspense>
  );
}