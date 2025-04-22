'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Input validation
  const validateInputs = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Username validation
    if (username.length < 3 || username.length > 20) {
      throw new Error('Username must be between 3 and 20 characters');
    }

    // Check for username uniqueness
    return checkUsernameUniqueness(username);
  };

  // Check username uniqueness
  const checkUsernameUniqueness = async (username) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (data) {
      throw new Error('Username is already taken');
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate inputs first
      await validateInputs();

      // 1. Register the user with email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Authentication succeeded but no user was returned");

      // Check if confirmation was sent
      if (authData.user && !authData.user.confirmed_at && !authData.user.email_confirmed_at) {
        // Show confirmation message
        router.push('/auth/verification-sent?email=' + encodeURIComponent(email));
        return;
      }

      console.log("Auth successful, user ID:", authData.user.id);

      // 2. Create the unified user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          username,
          full_name: fullName,
          bio: '',
          location: '',
          specialties: [],
          verification_level: 'pending',
          rating: 0,
          languages: ['Japanese', 'English']
        })
        .select();

      if (profileError) {
        console.error("Profile creation error:", profileError);

        // Check for specific error types
        if (profileError.code === '23505') {
          throw new Error('Username is already in use. Please choose another.');
        }

        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      // 3. Redirect to dashboard or verification page
      if (authData.user.email_confirmed_at) {
        router.push('/dashboard');
      } else {
        router.push('/auth/verification-sent?email=' + encodeURIComponent(email));
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Join our Japanese Shopping Marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>All users can both buy and sell items on our platform. Complete your profile after signing up to get started!</p>
            </div>
            {error && <p className="text-sm font-medium text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-center">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}