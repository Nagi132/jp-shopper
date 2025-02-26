'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getProfile = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        // Try to get the user's profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*, shopper_profiles(*)')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        // If profile exists, set it
        if (data) {
          setProfile(data);
        } else {
          // If profile doesn't exist, create a default structure
          setProfile({
            user_id: user.id,
            username: '',
            full_name: '',
            avatar_url: '',
            is_shopper: false
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [router]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Check if the profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      let result;
      
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update({
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          })
          .eq('user_id', user.id);
      } else {
        // Insert new profile
        result = await supabase
          .from('profiles')
          .insert([
            {
              user_id: user.id,
              username: profile.username,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              is_shopper: profile.is_shopper
            }
          ]);
      }
      
      if (result.error) throw result.error;
      
      // If user is a shopper, update/create shopper profile
      if (profile.is_shopper) {
        if (profile.shopper_profiles) {
          // Update existing shopper profile
          const { error } = await supabase
            .from('shopper_profiles')
            .update({
              bio: profile.shopper_profiles.bio || '',
              location: profile.shopper_profiles.location || '',
              specialties: profile.shopper_profiles.specialties || []
            })
            .eq('user_id', user.id);
          
          if (error) throw error;
        } else {
          // Create new shopper profile
          const { error } = await supabase
            .from('shopper_profiles')
            .insert([
              {
                user_id: user.id,
                bio: '',
                location: '',
                specialties: [],
                verification_level: 'pending',
                rating: 0,
                languages: ['Japanese']
              }
            ]);
          
          if (error) throw error;
        }
      }
      
      setSuccess(true);
      // Reload the profile
      const { data } = await supabase
        .from('profiles')
        .select('*, shopper_profiles(*)')
        .eq('user_id', user.id)
        .single();
      
      setProfile(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile?.username || ''}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile?.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>

            {profile?.is_shopper && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="location">Location in Japan</Label>
                  <Input
                    id="location"
                    value={profile?.shopper_profiles?.location || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      shopper_profiles: {
                        ...profile.shopper_profiles,
                        location: e.target.value
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile?.shopper_profiles?.bio || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      shopper_profiles: {
                        ...profile.shopper_profiles,
                        bio: e.target.value
                      }
                    })}
                    rows={5}
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-600">
                    <strong>Verification Status:</strong> {profile?.shopper_profiles?.verification_level || 'Pending'}
                  </p>
                  {profile?.shopper_profiles?.verification_level === 'pending' && (
                    <p className="text-xs mt-1 text-blue-600">
                      Your shopper account is pending verification. We'll review your profile shortly.
                    </p>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-600 rounded-md">
                Profile updated successfully!
              </div>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}