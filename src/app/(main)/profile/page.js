'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, AlertCircle, CheckCircle, User, MapPin, FileText } from 'lucide-react';
import { ensureShopperProfile } from '@/lib/functions/ensureShopperProfile';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null); // To track changes
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
          setOriginalProfile(JSON.parse(JSON.stringify(data))); // Deep copy for comparison
        } else {
          // If profile doesn't exist, create a default structure
          const defaultProfile = {
            user_id: user.id,
            username: '',
            full_name: '',
            avatar_url: '',
            is_shopper: false
          };
          setProfile(defaultProfile);
          setOriginalProfile(JSON.parse(JSON.stringify(defaultProfile)));
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

  // Handle toggle for shopper status
  const handleShopperToggle = (checked) => {
    setProfile({
      ...profile,
      is_shopper: checked,
      // Initialize shopper_profiles if becoming a shopper
      ...(checked && !profile.shopper_profiles ? {
        shopper_profiles: {
          location: '',
          bio: '',
          specialties: [],
        }
      } : {})
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate inputs
      if (!profile.username) {
        throw new Error('Username is required');
      }
      
      if (profile.username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      
      // Check if username is taken (only if it changed)
      if (profile.username !== originalProfile.username) {
        const { data: existingUsername, error: usernameError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', profile.username)
          .neq('user_id', user.id) // Exclude current user
          .maybeSingle();
          
        if (existingUsername) {
          throw new Error('Username is already taken');
        }
      }
      
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
            full_name: profile.full_name || '',
            avatar_url: profile.avatar_url || '',
            is_shopper: profile.is_shopper
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
              full_name: profile.full_name || '',
              avatar_url: profile.avatar_url || '',
              is_shopper: profile.is_shopper
            }
          ]);
      }
      
      if (result.error) throw result.error;
      
      // If user is a shopper, ensure shopper profile exists and update it
      if (profile.is_shopper) {
        console.log("Ensuring shopper profile exists...");
        const shopperProfile = await ensureShopperProfile(user.id);
        
        if (shopperProfile) {
          console.log("Shopper profile exists or was created:", shopperProfile.id);
          
          // Update the existing shopper profile with form data
          const { error: updateError } = await supabase
            .from('shopper_profiles')
            .update({
              bio: profile.shopper_profiles?.bio || '',
              location: profile.shopper_profiles?.location || '',
              specialties: profile.shopper_profiles?.specialties || []
            })
            .eq('id', shopperProfile.id);
            
          if (updateError) {
            console.error("Error updating shopper profile details:", updateError);
            throw updateError;
          }
          
          // Make sure the local state has the updated profile
          if (!profile.shopper_profiles) {
            setProfile(prev => ({
              ...prev,
              shopper_profiles: {
                ...shopperProfile,
                bio: profile.shopper_profiles?.bio || '',
                location: profile.shopper_profiles?.location || '',
                specialties: profile.shopper_profiles?.specialties || []
              }
            }));
          }
        } else {
          throw new Error("Failed to create shopper profile");
        }
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000); // Auto-hide success message after 5 seconds
      
      // Reload the profile to ensure we have the latest data
      const { data, error: reloadError } = await supabase
        .from('profiles')
        .select('*, shopper_profiles(*)')
        .eq('user_id', user.id)
        .single();
      
      if (reloadError) {
        console.error("Error reloading profile:", reloadError);
      } else {
        console.log("Reloaded profile data:", data);
        setProfile(data);
        setOriginalProfile(JSON.parse(JSON.stringify(data))); // Update original for future comparisons
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <User className="mr-2 h-6 w-6" />
            Your Profile
          </CardTitle>
          <CardDescription>
            Manage your personal information and marketplace preferences
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
              <Label htmlFor="username" className="font-medium">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                value={profile?.username || ''}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                required
                placeholder="Choose a unique username"
                className={`${!profile.username || profile.username.length < 3 ? 'border-red-300' : ''}`}
              />
              {(!profile.username || profile.username.length < 3) && (
                <p className="text-sm text-red-500">Username must be at least 3 characters</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile?.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Your real name (optional)"
              />
            </div>

            <div className="border-t pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">Shopper Settings</h3>
                  <p className="text-sm text-gray-500">Enable this to become a shopper on the marketplace</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="shopper-mode"
                    checked={profile?.is_shopper || false}
                    onCheckedChange={handleShopperToggle}
                  />
                  <Label htmlFor="shopper-mode" className="cursor-pointer">
                    {profile?.is_shopper ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>
            </div>

            {profile?.is_shopper && (
              <div className="space-y-6 border rounded-md p-4 bg-gray-50">
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Location in Japan
                  </Label>
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
                    placeholder="e.g., Tokyo, Osaka, Kyoto"
                  />
                  <p className="text-sm text-gray-500">Enter your location to help customers find local shoppers</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    Bio
                  </Label>
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
                    placeholder="Tell customers about yourself, your experience, and areas of expertise"
                    rows={5}
                  />
                  <p className="text-sm text-gray-500">
                    A good bio increases your chances of getting requests
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-md flex items-start">
                  <div className="mr-2 mt-0.5 text-blue-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      Verification Status: {profile?.shopper_profiles?.verification_level || 'Pending'}
                    </p>
                    {profile?.shopper_profiles?.verification_level === 'pending' && (
                      <p className="text-xs mt-1 text-blue-600">
                        Your shopper account is pending verification. We'll review your profile shortly.
                        Providing complete information will speed up this process.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-600 rounded-md flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <p>Profile updated successfully!</p>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}