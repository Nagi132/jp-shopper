'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { Loader2, AlertCircle, CheckCircle, User, MapPin, FileText, Shield, Star, MessageSquare, Save, Heart, X } from 'lucide-react';
import { useDialog } from '@/components/windows/MessageBox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ItemCard from '@/components/explore/ItemCard';

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
  const [activeTab, setActiveTab] = useState('selling');
  const [items, setItems] = useState([]);
  const [likedItems, setLikedItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [stats, setStats] = useState({
    sales: 0,
    purchases: 0,
    ratings: 0,
    averageRating: 0
  });
  const [showFollowPopup, setShowFollowPopup] = useState(false);
  const [followPopupTab, setFollowPopupTab] = useState('following');
  const [showReviewsPopup, setShowReviewsPopup] = useState(false);
  const [reviews, setReviews] = useState([]);
  
  const router = useRouter();
  const { theme } = useTheme();
  
  // Safely use the dialog hook by first checking if it's available
  let dialog = null;
  try {
    dialog = useDialog();
  } catch (e) {
    // Dialog provider not available, we'll handle this gracefully
    console.log('DialogProvider not available, notifications will be shown inline only');
  }
  
  // Get theme colors
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
  // Helper function to get the correct profile image URL
  const getProfileImageUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    
    // If it's already a full URL, return it
    if (avatarUrl.startsWith('http')) {
      return avatarUrl;
    }
    
    // Handle different storage paths
    try {
      // Check if it's from the 'profiles' bucket
      if (avatarUrl.startsWith('avatars/')) {
        return supabase.storage.from('profiles').getPublicUrl(avatarUrl).data.publicUrl;
      }
      
      // If it's just a filename, try both buckets
      if (!avatarUrl.includes('/')) {
        // Try the avatars bucket first
        return supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl;
      }
      
      // Default, try the avatars bucket with the path as-is
      return supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl;
    } catch (err) {
      console.error('Error formatting avatar URL:', err);
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.username || 'User')}&background=random`;
    }
  };
  
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
        
        // Load user data
        await Promise.all([
          loadUserStats(user.id),
          loadFollowers(user.id),
          loadFollowing(user.id),
          loadReviews(user.id),
          loadProducts(user.id),
          loadFavorites(user.id),
          loadSavedItems(user.id)
        ]);
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [router, isWindowView]);
  
  // Load followers
  const loadFollowers = async (userId) => {
    try {
      // Check if user_follows table exists
      const { error: tableCheckError } = await supabase
        .from('user_follows')
        .select('id')
        .limit(1)
        .throwOnError();
      
      if (tableCheckError) {
        console.log('Followers table not available yet, using mock data');
        return loadMockFollowerData();
      }
      
      // Get users who follow this user
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          follower_id,
          profiles!user_follows_follower_id_fkey(*)
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Extract profiles from the join
        const followerProfiles = data.map(item => {
          const profile = item.profiles;
          return {
            id: profile.user_id,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            verified: profile.verification_level === 'verified'
          };
        });
        
        setFollowers(followerProfiles);
      } else {
        // No followers yet
        setFollowers([]);
      }
    } catch (err) {
      console.error('Error loading followers:', err);
      // Fallback to mock data if there's an error
      loadMockFollowerData();
    }
  };
  
  // Load following
  const loadFollowing = async (userId) => {
    try {
      // Check if user_follows table exists
      const { error: tableCheckError } = await supabase
        .from('user_follows')
        .select('id')
        .limit(1);
        
      if (tableCheckError) {
        console.log('Following table not available yet, using mock data');
        return loadMockFollowerData();
      }
      
      // Get users that this user follows
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          profiles!user_follows_following_id_fkey(*)
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Extract profiles from the join
        const followingProfiles = data.map(item => {
          const profile = item.profiles;
          return {
            id: profile.user_id,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            verified: profile.verification_level === 'verified',
            // Check if they follow the current user back
            follows_you: followers.some(f => f.id === profile.user_id)
          };
        });
        
        setFollowing(followingProfiles);
      } else {
        // Not following anyone yet
        setFollowing([]);
      }
    } catch (err) {
      console.error('Error loading following:', err);
      // Fallback to mock data if there's an error
      loadMockFollowerData();
    }
  };
  
  // Load reviews
  const loadReviews = async (userId) => {
    try {
      // Check if user_reviews table exists
      const { error: tableCheckError } = await supabase
        .from('user_reviews')
        .select('id')
        .limit(1);
        
      if (tableCheckError) {
        console.log('Reviews table not available yet, using mock data');
        return loadMockReviews();
      }
      
      // Get reviews for this user
      const { data, error } = await supabase
        .from('user_reviews')
        .select(`
          id,
          rating,
          text,
          created_at,
          product_id,
          products(*),
          reviewer_id,
          profiles!user_reviews_reviewer_id_fkey(username)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Transform data to match our reviews structure
        const formattedReviews = data.map(review => {
          // Format timestamp to relative time (e.g., "2 days ago")
          const timestamp = formatRelativeTime(review.created_at);
          
          return {
            id: review.id,
            username: review.profiles.username,
            rating: review.rating,
            text: review.text,
            timestamp,
            productImage: review.products?.images?.[0] || `https://picsum.photos/seed/prod${review.id}/200/200` // Fallback image
          };
        });
        
        setReviews(formattedReviews);
        
        // Update stats with the review data
        const totalRating = data.reduce((acc, review) => acc + review.rating, 0);
        const averageRating = data.length > 0 ? totalRating / data.length : 0;
        
        setStats(prev => ({
          ...prev,
          ratings: data.length,
          averageRating
        }));
      } else {
        // No reviews yet
        setReviews([]);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
      // Fallback to mock data if there's an error
      loadMockReviews();
    }
  };
  
  // Format timestamp to relative time (e.g., "2 days ago")
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    
    if (diffDays < 1) {
      return 'today';
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffMonths < 12) {
      return `about ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffMonths / 12);
      return `about ${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };
  
  // Follow/unfollow a user
  const toggleFollow = async (targetUserId) => {
    if (!user) return;
    
    try {
      // Check if already following
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        // Unfollow
        await supabase
          .from('user_follows')
          .delete()
          .eq('id', data.id);
          
        // Update UI
        setFollowing(prev => prev.filter(profile => profile.id !== targetUserId));
      } else {
        // Follow
        await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });
          
        // Get the user profile and update UI
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .single();
          
        if (profileData) {
          const newFollowing = {
            id: profileData.user_id,
            username: profileData.username,
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url,
            verified: profileData.verification_level === 'verified',
            follows_you: followers.some(f => f.id === profileData.user_id)
          };
          
          setFollowing(prev => [newFollowing, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };
  
  // Load actual products from database
  const loadProducts = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setItems(data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };
  
  // Load favorited items
  const loadFavorites = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('product_favorites')
        .select(`
          product_id,
          products (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        // Extract the product data from the join
        const favorites = data.map(item => item.products).filter(Boolean);
        setLikedItems(favorites);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };
  
  // Load saved items
  const loadSavedItems = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('product_saves')
        .select(`
          product_id,
          products (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        // Extract the product data from the join
        const saves = data.map(item => item.products).filter(Boolean);
        setSavedItems(saves);
      }
    } catch (err) {
      console.error('Error loading saved items:', err);
    }
  };
  
  // Toggle favorite status for a product
  const toggleFavorite = async (productId) => {
    if (!user) return;
    
    try {
      // Check if already favorited
      const { data, error } = await supabase
        .from('product_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        // Remove from favorites
        await supabase
          .from('product_favorites')
          .delete()
          .eq('id', data.id);
          
        // Update UI
        setLikedItems(prev => prev.filter(item => item.id !== productId));
      } else {
        // Add to favorites
        await supabase
          .from('product_favorites')
          .insert({
            user_id: user.id,
            product_id: productId
          });
          
        // Get the product details and update UI
        const { data: productData } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
          
        if (productData) {
          setLikedItems(prev => [productData, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };
  
  // Toggle saved status for a product
  const toggleSaved = async (productId) => {
    if (!user) return;
    
    try {
      // Check if already saved
      const { data, error } = await supabase
        .from('product_saves')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        // Remove from saved
        await supabase
          .from('product_saves')
          .delete()
          .eq('id', data.id);
          
        // Update UI
        setSavedItems(prev => prev.filter(item => item.id !== productId));
      } else {
        // Add to saved
        await supabase
          .from('product_saves')
          .insert({
            user_id: user.id,
            product_id: productId
          });
          
        // Get the product details and update UI
        const { data: productData } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
          
        if (productData) {
          setSavedItems(prev => [productData, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error toggling saved item:', err);
    }
  };

  // Load mock items (temporary until we have a real database table)
  const loadMockItems = () => {
    // Generate mock items for selling tab
    const mockItems = Array.from({ length: 12 }, (_, i) => ({
      id: `mock-item-${i}`,
      title: `Item ${i + 1}`,
      budget: Math.floor(Math.random() * 10000) + 1000,
      images: [`https://picsum.photos/seed/${i + 10}/400/400`],
      status: i % 5 === 0 ? 'completed' : i % 7 === 0 ? 'open' : 'available'
    }));
    
    // Mock liked items
    const mockLikedItems = Array.from({ length: 8 }, (_, i) => ({
      id: `mock-liked-${i}`,
      title: `Liked Item ${i + 1}`,
      budget: Math.floor(Math.random() * 10000) + 1000,
      images: [`https://picsum.photos/seed/${i + 30}/400/400`],
      status: i % 4 === 0 ? 'completed' : 'available'
    }));
    
    // Mock saved items
    const mockSavedItems = Array.from({ length: 6 }, (_, i) => ({
      id: `mock-saved-${i}`,
      title: `Saved Item ${i + 1}`,
      budget: Math.floor(Math.random() * 10000) + 1000,
      images: [`https://picsum.photos/seed/${i + 50}/400/400`],
      status: 'available'
    }));
    
    setItems(mockItems);
    setLikedItems(mockLikedItems);
    setSavedItems(mockSavedItems);
  };
  
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

  // Load mock reviews
  useEffect(() => {
    if (reviews.length === 0) {
      loadMockReviews();
    }
  }, [reviews]);
  
  // Generate mock review data
  const loadMockReviews = () => {
    const mockReviews = [
      {
        id: 'rev1',
        username: 'derek588',
        rating: 5,
        text: 'added a hotwheel',
        timestamp: '24 days ago',
        productImage: 'https://picsum.photos/seed/prod1/200/200'
      },
      {
        id: 'rev2',
        username: 'nash_l',
        rating: 5,
        text: 'Shipped it fast',
        timestamp: 'about 1 month ago',
        productImage: 'https://picsum.photos/seed/prod2/200/200'
      },
      {
        id: 'rev3',
        username: 'rye3214',
        rating: 4,
        text: 'Good product and fairly quick delivery',
        timestamp: 'about 2 months ago',
        productImage: 'https://picsum.photos/seed/prod3/200/200'
      },
      {
        id: 'rev4',
        username: 'vr49zvfdw9',
        rating: 5,
        text: 'Arrived really quick and is in good condition',
        timestamp: 'about 2 months ago',
        productImage: 'https://picsum.photos/seed/prod4/200/200'
      }
    ];
    
    setReviews(mockReviews);
    
    // Update stats with the review count
    setStats(prev => ({
      ...prev,
      ratings: mockReviews.length,
      averageRating: mockReviews.reduce((acc, review) => acc + review.rating, 0) / mockReviews.length
    }));
  };
  
  const renderProfileInfo = () => (
    <div className="p-4 space-y-4">
      {/* Username */}
      <div className="space-y-2">
        <Label className="font-bold">Username</Label>
        <div className="text-lg font-medium">{profile?.username || 'Not set'}</div>
      </div>
      
      {/* Full name */}
      <div className="space-y-2">
        <Label className="font-bold">Full Name</Label>
        <div className="text-lg">{profile?.full_name || 'Not set'}</div>
      </div>
      
      {/* Bio */}
      <div className="space-y-2">
        <Label className="font-bold">Bio</Label>
        <div className="text-sm whitespace-pre-wrap">{profile?.bio || 'No bio provided'}</div>
      </div>
      
      {/* Location */}
      <div className="space-y-2">
        <Label className="font-bold">Location</Label>
        <div className="flex items-center text-md">
          <MapPin className="w-4 h-4 mr-1 inline" /> {profile?.location || 'Not specified'}
        </div>
      </div>
      
      {/* Languages */}
      <div className="space-y-2">
        <Label className="font-bold">Languages</Label>
        <div className="flex flex-wrap gap-2">
          {(profile?.languages || ['Japanese', 'English']).map(lang => (
            <span 
              key={lang} 
              className={`px-3 py-1 text-sm rounded-full bg-[#${borderColor}] text-black`}
            >
              {lang}
            </span>
          ))}
        </div>
      </div>
        
      {/* Specialties */}
      <div className="space-y-2">
        <Label className="font-bold">Specialties</Label>
        <div className="flex flex-wrap gap-2">
          {(profile?.specialties || []).length > 0 ? (
            (profile?.specialties || []).map(specialty => (
              <span 
                key={specialty} 
                className={`px-3 py-1 text-sm rounded-full bg-[#${bgColor}] text-black`}
              >
                {specialty}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500">No specialties selected</span>
          )}
        </div>
      </div>
      
      {/* Settings button to redirect to settings */}
      <div className="flex justify-end pt-4">
        <Button 
          variant="default"
          onClick={() => {
            // Open settings window or navigate to settings page
            if (isWindowView) {
              // Access window manager to open settings
              const openWindow = window.__openWindow;
              if (typeof openWindow === 'function') {
                openWindow('settings', 'SettingsPage', 'Settings');
              }
            } else {
              router.push('/settings');
            }
          }}
          className={`bg-[#${borderColor}] hover:bg-[#${borderColor}]/90 text-black`}
        >
          Edit in Settings
        </Button>
      </div>
    </div>
  );
  
  // Render follow/following popup
  const renderFollowPopup = () => {
    if (!showFollowPopup) return null;
    
    const followData = followPopupTab === 'following' ? following : followers;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={() => setShowFollowPopup(false)}>
        <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="border-b">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-lg font-medium">{profile?.username || 'User'}</h3>
              <button onClick={() => setShowFollowPopup(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tabs for switching between following and followers */}
            <div className="flex border-t">
              <button 
                className={`flex-1 py-3 font-medium text-center ${followPopupTab === 'following' ? 'border-b-2' : 'text-gray-500'}`}
                style={followPopupTab === 'following' ? { borderColor: `#${borderColor}` } : {}}
                onClick={() => setFollowPopupTab('following')}
              >
                Following
              </button>
              <button 
                className={`flex-1 py-3 font-medium text-center ${followPopupTab === 'followers' ? 'border-b-2' : 'text-gray-500'}`}
                style={followPopupTab === 'followers' ? { borderColor: `#${borderColor}` } : {}}
                onClick={() => setFollowPopupTab('followers')}
              >
                Followers
              </button>
            </div>
          </div>
          
          <div className="max-h-[70vh] overflow-y-auto">
            {followData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4">
                  <User className="w-12 h-12 opacity-30" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {followPopupTab === 'following' 
                    ? 'Not following anyone yet' 
                    : 'No followers yet'}
                </h3>
                <p className="text-sm text-gray-500 max-w-md px-4">
                  {followPopupTab === 'following' 
                    ? 'When you follow people, they\'ll appear here.' 
                    : 'When people follow you, they\'ll appear here.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {followData.map(user => (
                  <li key={user.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={user.avatar_url} 
                            alt={user.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`;
                            }}
                          />
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center">
                            <p className="font-medium">{user.username}</p>
                            {user.verified && (
                              <CheckCircle className="w-4 h-4 ml-1 text-blue-500 fill-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{user.full_name}</p>
                        </div>
                      </div>
                      {user.follows_you && followPopupTab === 'following' && (
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded-full text-gray-600">
                          Follows you
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render reviews popup
  const renderReviewsPopup = () => {
    if (!showReviewsPopup) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={() => setShowReviewsPopup(false)}>
        <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="border-b">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-lg font-medium">Feedback for @{profile?.username || 'user'}</h3>
              <button onClick={() => setShowReviewsPopup(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex justify-center border-t border-b py-2">
              <span className="font-medium">Sold</span>
            </div>
          </div>
          
          <div className="max-h-[70vh] overflow-y-auto">
            {reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4">
                  <Star className="w-12 h-12 opacity-30" />
                </div>
                <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                <p className="text-sm text-gray-500 max-w-md px-4">
                  When you receive reviews, they\'ll appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {reviews.map(review => (
                  <li key={review.id} className="p-4">
                    <div className="flex mb-3">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        <img 
                          src={review.productImage} 
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="font-medium">@{review.username}</p>
                        <div className="flex text-red-500 my-1.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-5 h-5 mr-0.5 ${i < review.rating ? 'fill-current' : ''}`}
                            />
                          ))}
                        </div>
                        <p className="text-sm">{review.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{review.timestamp}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render item grid with masonry layout
  const renderItemGrid = (itemsToRender) => {
    if (itemsToRender.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="mb-4">
            <ShoppingBag className="w-12 h-12 opacity-30" />
          </div>
          <h3 className="text-lg font-medium mb-2">No items yet</h3>
          <p className="text-sm text-gray-500 max-w-md">
            {activeTab === 'selling' ? 'Items you list for sale will appear here.' :
             activeTab === 'likes' ? 'Items you like will appear here.' :
             'Items you save will appear here.'}
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
        {itemsToRender.map(item => (
          <div 
            key={item.id}
            className="relative group cursor-pointer"
            onClick={() => {
              // In a real app, this would navigate to product detail
              console.log('Navigate to product', item.id);
            }}
          >
            <ItemCard 
              item={{
                ...item,
                // Map the database fields to what ItemCard expects
                budget: item.price || item.budget, // Handle both mock and real data
                images: item.images || []
              }}
              theme={{
                borderColor,
                bgColor,
                textColor
              }}
            />
            
            {/* Quick action buttons on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <button 
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    const productId = item.id;
                    const isLiked = likedItems.some(liked => liked.id === productId);
                    
                    if (isLiked) {
                      // Remove from likes
                      setLikedItems(prev => prev.filter(i => i.id !== productId));
                    } else {
                      // Add to likes if not already there
                      if (!likedItems.some(i => i.id === productId)) {
                        setLikedItems(prev => [item, ...prev]);
                      }
                    }
                    
                    // If we have real database, use the API function
                    if (productId.includes('mock-')) {
                      // Just update local state for mock data
                    } else {
                      toggleFavorite(productId);
                    }
                  }}
                >
                  <Heart 
                    className="w-5 h-5" 
                    fill={likedItems.some(liked => liked.id === item.id) ? "#FF69B4" : "transparent"}
                  />
                </button>
                <button 
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Start a message with the item's seller
                    console.log('Message about product', item.id);
                  }}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'selling':
        return renderItemGrid(items);
      case 'likes':
        return renderItemGrid(likedItems);
      case 'saved':
        return renderItemGrid(savedItems);
      default:
        return renderItemGrid(items);
    }
  };
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className={`h-full flex flex-col ${isWindowView ? 'bg-white' : 'bg-gray-50'}`}>
      {/* Profile header */}
      <div 
        className="p-4 pb-6"
        style={{ 
          backgroundColor: `#${bgColor}`, 
          color: `#${textColor}`,
          borderBottom: `2px solid #${borderColor}` 
        }}
      >
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div 
            className="w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center bg-white"
            style={{ borderColor: `#${borderColor}` }}
          >
            {profile?.avatar_url ? (
              <img 
                src={getProfileImageUrl(profile.avatar_url)}
                alt={profile?.username || 'User'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Error loading profile image:", profile.avatar_url);
                  // Use UI Avatars as fallback
                  const username = profile?.username || profile?.full_name || 'User';
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
                }}
              />
            ) : (
              <User className="w-8 h-8 text-gray-400" />
            )}
          </div>
          
          {/* User info */}
          <div className="flex-1">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">
                {profile?.username || 'New User'}
              </h1>
              
              {/* Verification badge if verified */}
              {(profile?.verification_level === 'verified' || profile?.stripe_verified) && (
                <CheckCircle className="w-4 h-4 ml-1 text-blue-500 fill-blue-500" />
              )}
            </div>
            
            {/* Star rating display under username */}
            <div 
              className="flex items-center mt-1 mb-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowReviewsPopup(true)}
            >
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(stats.averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-sm ml-1">({stats.ratings})</span>
            </div>
            
            <div className="text-sm flex items-center space-x-3">
              {profile?.full_name && (
                <span>{profile.full_name}</span>
              )}
              
              {/* Following/Followers counts - order changed */}
              <div className="flex space-x-3 text-sm">
                <button 
                  className="hover:underline" 
                  onClick={() => {
                    setFollowPopupTab('following');
                    setShowFollowPopup(true);
                  }}
                >
                  <span className="font-bold">{following.length}</span> following
                </button>
                <button 
                  className="hover:underline" 
                  onClick={() => {
                    setFollowPopupTab('followers');
                    setShowFollowPopup(true);
                  }}
                >
                  <span className="font-bold">{followers.length}</span> followers
                </button>
              </div>
            </div>
            
            {profile?.location && (
              <div className="text-sm flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {profile.location}
              </div>
            )}
          </div>
          
          {/* Stats at a glance */}
          <div className="flex space-x-4 text-center">
            <div>
              <div className="font-bold">{stats.sales}</div>
              <div className="text-xs">Sales</div>
            </div>
            <div>
              <div className="font-bold">{items.length}</div>
              <div className="text-xs">Items</div>
            </div>
          </div>
        </div>
      </div>
  
      {/* Tab navigation */}
      <div className={`${isWindowView ? 'flex-grow overflow-auto' : ''}`}>
        <div className="border-b">
          <ul className="flex">
            <li className="flex-1">
              <button 
                className={`w-full py-2 px-4 text-center text-sm ${activeTab === 'selling' ? `border-b-2 font-medium` : 'text-gray-500 hover:text-gray-700'}`}
                style={activeTab === 'selling' ? { borderColor: `#${borderColor}`, color: `#${borderColor}` } : {}}
                onClick={() => setActiveTab('selling')}
              >
                Selling
              </button>
            </li>
            <li className="flex-1">
              <button 
                className={`w-full py-2 px-4 text-center text-sm ${activeTab === 'likes' ? `border-b-2 font-medium` : 'text-gray-500 hover:text-gray-700'}`}
                style={activeTab === 'likes' ? { borderColor: `#${borderColor}`, color: `#${borderColor}` } : {}}
                onClick={() => setActiveTab('likes')}
              >
                Likes
              </button>
            </li>
            <li className="flex-1">
              <button 
                className={`w-full py-2 px-4 text-center text-sm ${activeTab === 'saved' ? `border-b-2 font-medium` : 'text-gray-500 hover:text-gray-700'}`}
                style={activeTab === 'saved' ? { borderColor: `#${borderColor}`, color: `#${borderColor}` } : {}}
                onClick={() => setActiveTab('saved')}
              >
                Saved
              </button>
            </li>
          </ul>
        </div>

        {/* Tab content */}
        <div className="p-4">
          {renderTabContent()}
        </div>
      </div>

      {/* Render popups */}
      {renderFollowPopup()}
      {renderReviewsPopup()}
    </div>
  );
};

// SVG Icon components
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
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
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
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

export default ProfilePage;