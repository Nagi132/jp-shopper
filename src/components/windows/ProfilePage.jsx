'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { Loader2, AlertCircle, CheckCircle, User, MapPin, FileText, Shield, Star, MessageSquare } from 'lucide-react';
import { useDialog } from '@/components/windows/MessageBox';

/**
 * ProfilePage - Windows-styled unified profile component
 * Users can now both buy and sell without separate roles
 */
const ProfilePage = ({ isWindowView = true }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    sales: 0,
    purchases: 0,
    ratings: 0,
    averageRating: 0
  });
  
  const router = useRouter();
  const { theme } = useTheme();
  const { showInfo } = useDialog();
  
  // Get theme colors
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
  // Determine text color based on background color
  const getContrastText = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark
    return luminance > 0.5 ? '000000' : 'FFFFFF';
  };
  
  const textColor = theme?.textColor || getContrastText(bgColor);

  // Load profile data
  useEffect(() => {
    const getProfile = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (!isWindowView) {
            router.push('/login');
          }
          return;
        }
        
        setUser(user);
        
        // Try to get the user's profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
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
            bio: '',
            location: '',
            specialties: [],
            verification_level: 'pending',
            rating: 0,
            languages: ['Japanese', 'English']
          };
          setProfile(defaultProfile);
          setOriginalProfile(JSON.parse(JSON.stringify(defaultProfile)));
        }
        
        // Load user stats
        await loadUserStats(user.id);
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [router, isWindowView]);
  
  // Load user stats (sales, purchases, ratings)
  const loadUserStats = async (userId) => {
    try {
      // Get number of sales (requests where user is the seller)
      const { data: salesData } = await supabase
        .from('requests')
        .select('id, status', { count: 'exact' })
        .eq('seller_id', userId)
        .in('status', ['completed', 'shipped']);
      
      // Get number of purchases (requests created by user)
      const { data: purchasesData } = await supabase
        .from('requests')
        .select('id', { count: 'exact' })
        .eq('customer_id', userId);
      
      // Get ratings (future enhancement)
      // For now we'll use placeholder data
      
      setStats({
        sales: salesData?.length || 0,
        purchases: purchasesData?.length || 0,
        ratings: Math.floor(Math.random() * 20), // Placeholder
        averageRating: (4 + Math.random()).toFixed(1) // Placeholder between 4.0-5.0
      });
      
    } catch (err) {
      console.error('Error loading user stats:', err);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Discard changes and revert to original profile
      setProfile(JSON.parse(JSON.stringify(originalProfile)));
    }
    setIsEditing(!isEditing);
    setError(null);
    setSuccess(false);
  };

  // Handle form field changes
  const handleChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested fields (e.g., 'seller_profiles.bio')
      const [parent, child] = field.split('.');
      setProfile({
        ...profile,
        [parent]: {
          ...profile[parent],
          [child]: value
        }
      });
    } else {
      // Handle top-level fields
      setProfile({
        ...profile,
        [field]: value
      });
    }
  };

  // Save profile changes
  const handleSave = async () => {
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
            bio: profile.bio || '',
            location: profile.location || '',
            specialties: profile.specialties || [],
            verification_level: profile.verification_level || 'pending',
            languages: profile.languages || ['Japanese', 'English']
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
              bio: profile.bio || '',
              location: profile.location || '',
              specialties: profile.specialties || [],
              verification_level: 'pending',
              languages: ['Japanese', 'English']
            }
          ]);
      }
      
      if (result.error) throw result.error;
      
      // Reload the profile to ensure we have the latest data
      const { data: updatedProfile, error: reloadError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (!reloadError && updatedProfile) {
        setProfile(updatedProfile);
        setOriginalProfile(JSON.parse(JSON.stringify(updatedProfile)));
      }
      
      setSuccess(true);
      setIsEditing(false);
      
      // Show success message
      showInfo('Your profile has been updated successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div 
          className="w-10 h-10 rounded-full animate-spin mb-3"
          style={{ 
            borderTopWidth: '3px',
            borderRightWidth: '3px',
            borderStyle: 'solid',
            borderColor: `#${borderColor}` 
          }}
        ></div>
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div 
        className="py-2 px-4 flex items-center justify-between border-b"
        style={{ 
          backgroundColor: `#${bgColor}30`, 
          borderColor: `#${borderColor}40` 
        }}
      >
        <div className="flex items-center">
          <User className="w-5 h-5 mr-2" style={{ color: `#${borderColor}` }} />
          <h2 className="text-lg font-medium">Your Profile</h2>
        </div>
        
        <button
          className="flex items-center px-3 py-1 text-sm rounded-sm"
          style={{ 
            backgroundColor: isEditing ? `#${borderColor}80` : `#${borderColor}`,
            color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
            border: `1px solid #${borderColor}`,
            boxShadow: '1px 1px 0 rgba(0,0,0,0.1)'
          }}
          onClick={isEditing ? handleSave : toggleEditMode}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            'Save Changes'
          ) : (
            'Edit Profile'
          )}
        </button>
      </div>
      
      {/* Content area with scroll */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-6">
          {/* Notifications */}
          {error && (
            <div 
              className="p-3 rounded-sm flex items-center"
              style={{ 
                backgroundColor: '#FEE2E2', 
                borderLeft: '4px solid #EF4444' 
              }}
            >
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div 
              className="p-3 rounded-sm flex items-center"
              style={{ 
                backgroundColor: '#DCFCE7', 
                borderLeft: '4px solid #22C55E' 
              }}
            >
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              <p className="text-green-700">Profile updated successfully!</p>
            </div>
          )}
          
          {/* Stats Section */}
          <div 
            className="grid grid-cols-4 gap-3"
          >
            <div 
              className="p-3 rounded-sm border flex flex-col items-center justify-center"
              style={{ 
                borderColor: `#${borderColor}40`,
                backgroundColor: `#${bgColor}10` 
              }}
            >
              <ShoppingBag className="w-5 h-5 mb-1" style={{ color: `#${borderColor}` }} />
              <span className="text-2xl font-bold">{stats.sales}</span>
              <span className="text-xs">Sales</span>
            </div>
            
            <div 
              className="p-3 rounded-sm border flex flex-col items-center justify-center"
              style={{ 
                borderColor: `#${borderColor}40`,
                backgroundColor: `#${bgColor}10` 
              }}
            >
              <Package className="w-5 h-5 mb-1" style={{ color: `#${borderColor}` }} />
              <span className="text-2xl font-bold">{stats.purchases}</span>
              <span className="text-xs">Purchases</span>
            </div>
            
            <div 
              className="p-3 rounded-sm border flex flex-col items-center justify-center"
              style={{ 
                borderColor: `#${borderColor}40`,
                backgroundColor: `#${bgColor}10` 
              }}
            >
              <MessageSquare className="w-5 h-5 mb-1" style={{ color: `#${borderColor}` }} />
              <span className="text-2xl font-bold">{stats.ratings}</span>
              <span className="text-xs">Reviews</span>
            </div>
            
            <div 
              className="p-3 rounded-sm border flex flex-col items-center justify-center"
              style={{ 
                borderColor: `#${borderColor}40`,
                backgroundColor: `#${bgColor}10` 
              }}
            >
              <Star className="w-5 h-5 mb-1" style={{ color: `#${borderColor}` }} />
              <div className="flex items-center">
                <span className="text-2xl font-bold">{stats.averageRating}</span>
                <span className="text-xs ml-1">/5</span>
              </div>
              <span className="text-xs">Rating</span>
            </div>
          </div>
          
          {/* Profile Info Section */}
          <div 
            className="p-4 rounded-sm border"
            style={{ 
              borderColor: `#${borderColor}40`,
              backgroundColor: `#${bgColor}10` 
            }}
          >
            <h3 className="text-base font-medium mb-3">Basic Information</h3>
            
            <div className="space-y-3">
              {/* Email - always read-only */}
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-1.5 text-sm bg-gray-100 border rounded-sm"
                  style={{ borderColor: `#${borderColor}40` }}
                />
              </div>
              
              {/* Username */}
              <div>
                <label className="block text-sm mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile?.username || ''}
                  onChange={(e) => handleChange('username', e.target.value)}
                  disabled={!isEditing}
                  required
                  className={`w-full px-3 py-1.5 text-sm border rounded-sm ${
                    isEditing ? 'bg-white' : 'bg-gray-100'
                  } ${
                    isEditing && (!profile.username || profile.username.length < 3) 
                      ? 'border-red-300' 
                      : ''
                  }`}
                  style={{ borderColor: `#${borderColor}40` }}
                />
                {isEditing && (!profile.username || profile.username.length < 3) && (
                  <p className="text-xs text-red-500 mt-1">Username must be at least 3 characters</p>
                )}
              </div>
              
              {/* Full Name */}
              <div>
                <label className="block text-sm mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile?.full_name || ''}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-3 py-1.5 text-sm border rounded-sm ${
                    isEditing ? 'bg-white' : 'bg-gray-100'
                  }`}
                  style={{ borderColor: `#${borderColor}40` }}
                />
              </div>
            </div>
          </div>
          
          {/* Seller Settings Section */}
          <div 
            className="p-4 rounded-sm border"
            style={{ 
              borderColor: `#${borderColor}40`,
              backgroundColor: `#${bgColor}10` 
            }}
          >
            <h3 className="text-base font-medium mb-3">Seller Capabilities</h3>
            <p className="text-sm mb-4">Complete your profile to help others find you and access both buying and selling features.</p>
            
            <div className="space-y-3">
              {/* Location */}
              <div>
                <label className="block text-sm mb-1 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={profile?.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-3 py-1.5 text-sm border rounded-sm ${
                    isEditing ? 'bg-white' : 'bg-gray-100'
                  }`}
                  style={{ borderColor: `#${borderColor}40` }}
                  placeholder="e.g., Tokyo, Osaka, Kyoto"
                />
              </div>
              
              {/* Bio */}
              <div>
                <label className="block text-sm mb-1 flex items-center">
                  <FileText className="w-3 h-3 mr-1" />
                  Bio
                </label>
                <textarea
                  value={profile?.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-3 py-1.5 text-sm border rounded-sm ${
                    isEditing ? 'bg-white' : 'bg-gray-100'
                  }`}
                  style={{ borderColor: `#${borderColor}40` }}
                  rows={4}
                  placeholder="Share a bit about yourself, your interests, and what you sell or collect"
                />
              </div>
              
              {/* Verification Status */}
              <div 
                className="p-3 rounded-sm flex items-start"
                style={{ backgroundColor: `#${borderColor}20` }}
              >
                <Shield className="w-4 h-4 mr-2 mt-0.5" style={{ color: `#${borderColor}` }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: `#${borderColor}` }}>
                    Verification Status: {profile?.verification_level || 'Pending'}
                  </p>
                  {(profile?.verification_level === 'pending' || !profile) && (
                    <p className="text-xs mt-1">
                      Your seller account is awaiting verification. Complete your profile to speed up this process.
                      Verified sellers have greater visibility in search results.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Cancel button (only in edit mode) */}
          {isEditing && (
            <div className="flex justify-end">
              <button
                className="px-4 py-1.5 text-sm rounded-sm"
                style={{ 
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  boxShadow: '1px 1px 0 rgba(0,0,0,0.05)'
                }}
                onClick={toggleEditMode}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Status bar */}
      <div 
        className="h-5 text-xs px-2 flex items-center"
        style={{ 
          backgroundColor: `#${bgColor}20`,
          borderTop: `1px solid #${borderColor}40`
        }}
      >
        <span>User: {profile?.username || user?.email || 'Not logged in'}</span>
      </div>
    </div>
  );
};

// Add missing Lucide icons
const ShoppingBag = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <path d="M3 6h18"></path>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);

const Package = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"></path>
  </svg>
);

export default ProfilePage;