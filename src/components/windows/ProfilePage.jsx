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
import { WindowContainer } from '@/components/ui/window-container';
import ItemCard from '@/components/explore/ItemCard';

/**
 * ProfilePage - Windows-styled unified profile component
 * Users can now both buy and sell without separate roles
 */
const ProfilePage = ({ isWindowView = true, userId = null }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true); // Track if this is the current user's profile
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
  const [isFollowing, setIsFollowing] = useState(false); // State for follow status
  
  // Determine the profile user ID from props or current user
  const profileUserId = userId || user?.id; 
  
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
      setLoading(true); // Start loading
      setError(null); // Reset error
      try {
        console.log('ProfilePage: Loading profile with userId prop:', userId);
        
        // Get the current user if not already set
        let currentUser = user;
        if (!currentUser) {
            const { data: authData } = await supabase.auth.getUser();
            console.log('Fetched auth user:', authData?.user?.id);
            currentUser = authData?.user;
            setUser(currentUser); // Set user state if fetched here
        }
        
        // Recalculate profileUserId based on potentially updated user state
        const effectiveProfileUserId = userId || currentUser?.id; 
        console.log('Effective profileUserId for fetching:', effectiveProfileUserId);

        if (!currentUser && !userId) {
          console.log('No authenticated user and no userId provided');
          if (!isWindowView) {
            router.push('/login');
          }
          return;
        }
        
        console.log('Current authenticated user:', currentUser?.id);
        setUser(currentUser);
        
        // Determine which user's profile to load
        // Use effectiveProfileUserId calculated above
        // const profileUserId = userId || user?.id; // REMOVE this line inside useEffect
        // console.log('Will load profile for userId:', profileUserId); // Update log
        console.log('Will load profile for userId:', effectiveProfileUserId);
        
        // Check if we're viewing the current user's profile
        const viewingOwnProfile = !userId || (currentUser && userId === currentUser.id);
        console.log('Viewing own profile?', viewingOwnProfile);
        setIsOwnProfile(viewingOwnProfile);

        // If viewing someone else's profile, check follow status
        if (!viewingOwnProfile && currentUser && effectiveProfileUserId) {
          console.log(`Checking follow status: ${currentUser.id} -> ${effectiveProfileUserId}`);
          const { count, error: followError } = await supabase
            .from('user_follows')
            .select('id', { count: 'exact', head: true })
            .eq('follower_id', currentUser.id)
            .eq('following_id', effectiveProfileUserId);

          if (followError) {
            console.error('Error checking follow status:', followError);
          } else {
            console.log('Follow status count:', count);
            setIsFollowing(count > 0);
          }
        }
        
        // Try to get the user's profile
        console.log('Fetching profile data for user_id:', effectiveProfileUserId);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', effectiveProfileUserId)
          .single();
        
        console.log('Profile fetch result:', { data, error });
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        // If profile exists, set it
        if (data) {
          console.log('Profile found:', data);
          setProfile(data);
          setOriginalProfile(JSON.parse(JSON.stringify(data))); // Deep copy for comparison
        } else {
          console.log('No profile found, creating default profile');
          // If profile doesn't exist, create a default structure
          const defaultProfile = {
            user_id: effectiveProfileUserId,
            username: 'User',
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
        
        console.log('Loading additional user data for:', effectiveProfileUserId);
        // Load user data
        await Promise.all([
          loadUserStats(effectiveProfileUserId),
          loadFollowers(effectiveProfileUserId),
          loadFollowing(effectiveProfileUserId),
          loadReviews(effectiveProfileUserId),
          loadProducts(effectiveProfileUserId),
          loadFavorites(effectiveProfileUserId),
          loadSavedItems(effectiveProfileUserId)
        ]);
        
        console.log('Profile data loading complete');
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [router, isWindowView, userId]);
  
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
      // loadMockFollowerData(); // Consider removing/refining fallback
    }
  };
  
  // Load reviews
  const loadReviews = async (userId) => {
    try {
      // Check if user_reviews table exists
      const { data: reviewsTableData, error: tableCheckError } = await supabase
        .from('user_reviews')
        .select('*') // Select all columns to check structure
        .limit(1);
        
      if (tableCheckError) {
        console.warn('Reviews table not available or query failed:', tableCheckError.message);
        // Return early or handle appropriately, maybe set error state
        setError('Could not query reviews table.');
        setReviews([]); // Ensure reviews are empty
        return;
      }
      
      // Determine the correct column name for the user being reviewed (likely reviewee_id)
      const revieweeColumn = reviewsTableData && reviewsTableData.length > 0 && 'reviewee_id' in reviewsTableData[0] ? 'reviewee_id' : 'user_id'; 
      console.log(`Using column '${revieweeColumn}' to fetch reviews for user ID: ${userId}`);
      
      // Determine the correct column name for the listing/product (likely listing_id)
      const itemFKColumn = reviewsTableData && reviewsTableData.length > 0 && 'listing_id' in reviewsTableData[0] ? 'listing_id' : 'product_id';
      console.log(`Using foreign key column '${itemFKColumn}' to join with listings.`);

      // Get reviews for this user
      const { data, error } = await supabase
        .from('user_reviews')
        .select(`
          id,
          rating,
          text, 
          comment,
          created_at,
          ${itemFKColumn},
          listings!inner(*),
          reviewer_id,
          profiles!inner(username)
        `)
        .eq(revieweeColumn, userId) // Filter by the user being reviewed
        .order('created_at', { ascending: false });
        
      if (error) throw error; // Let the catch block handle it
      
      if (data && data.length > 0) {
        console.log('Raw reviews data fetched:', data);
        // Transform data to match our reviews structure
        const formattedReviews = data.map(review => {
          const timestamp = formatRelativeTime(review.created_at);
          const reviewText = review.text || review.comment || ''; // Use text or comment field
          
          // Ensure listings data and photos exist before accessing
          const listingImage = review.listings && Array.isArray(review.listings.photos) && review.listings.photos.length > 0
            ? review.listings.photos[0] // Use the first photo from the listing
            : `https://picsum.photos/seed/item${review.id}/200/200`; // Fallback image

          const reviewerUsername = review.profiles?.username || 'anonymous'; // Handle potential null profile join
            
          return {
            id: review.id,
            username: reviewerUsername, 
            rating: review.rating,
            text: reviewText,
            timestamp,
            productImage: listingImage
          };
        }).filter(Boolean); // Filter out any nulls if joins failed
        
        console.log('Formatted reviews:', formattedReviews);
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
      // Improved error logging
      console.error('Error loading reviews. Status:', err?.status, 'Message:', err?.message, 'Details:', err?.details, 'Raw Error:', err);
      setError(`Failed to load reviews: ${err?.message || 'Unknown error'}`); // Set a more informative error state
      // Fallback to mock data is problematic if real data should exist. Let's comment it out for now to see the real error.
      // loadMockReviews(); 
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
  
  // Handle follow/unfollow action
  const handleFollow = async (targetUserId) => {
    if (!user) {
      console.error('User not logged in, cannot follow');
      // Optionally redirect to login or show message
      return;
    }

    const currentUserId = user.id;
    console.log(`Toggling follow for ${targetUserId} by ${currentUserId}. Currently following: ${isFollowing}`);

    try {
      if (isFollowing) {
        // --- Unfollow --- 
        console.log('Attempting to unfollow...');
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);

        if (error) throw error;

        console.log('Unfollow successful');
        setIsFollowing(false);
        // Decrement follower count locally
        setFollowers(prev => prev.filter(f => f.id !== currentUserId)); 
        
      } else {
        // --- Follow --- 
        console.log('Attempting to follow...');
        const { data, error } = await supabase
          .from('user_follows')
          .insert([{ follower_id: currentUserId, following_id: targetUserId }])
          .select(); // Optionally select to confirm insertion

        if (error) throw error;

        console.log('Follow successful', data);
        setIsFollowing(true);
        // Increment follower count locally (need current user's profile info)
        // Fetch minimal profile for the current user to add to the list
        const { data: currentUserProfile, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, username, full_name, avatar_url, verification_level')
            .eq('user_id', currentUserId)
            .single();

        if (profileError) {
            console.error("Could not fetch current user's profile for follower list update:", profileError);
        } else if (currentUserProfile) {
            const followerToAdd = {
                id: currentUserProfile.user_id,
                username: currentUserProfile.username,
                full_name: currentUserProfile.full_name,
                avatar_url: currentUserProfile.avatar_url,
                verified: currentUserProfile.verification_level === 'verified'
            };
            setFollowers(prev => [...prev, followerToAdd]);
        }
      }
    } catch (error) {
      console.error('Error toggling follow state:', error);
      // Show error message to user
      if (dialog) {
        dialog.showMessage('Error', `Could not ${isFollowing ? 'unfollow' : 'follow'} user. Please try again. Error: ${error.message}`);
      } else {
        setError(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user.`);
      }
    }
  };
  
  // Load actual products from database
  const loadProducts = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
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
  const loadFavorites = async (profileUserId) => {
    try {
      // If viewing someone else's profile, only show public data
      if (!isOwnProfile && user?.id !== profileUserId) {
        // For other users, we only load their public data
        const { data, error } = await supabase
          .from('listing_favorites')
          .select(`
            listing_id,
            listings (*)
          `)
          .eq('user_id', profileUserId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          // Extract the product data from the join
          const favorites = data.map(item => item.listings).filter(Boolean);
          setLikedItems(favorites);
        }
      } else {
        // For own profile, load everything
        const { data, error } = await supabase
          .from('listing_favorites')
          .select(`
            listing_id,
            listings (*)
          `)
          .eq('user_id', profileUserId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          // Extract the product data from the join
          const favorites = data.map(item => item.listings).filter(Boolean);
          setLikedItems(favorites);
        }
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };
  
  // Load saved items
  const loadSavedItems = async (profileUserId) => {
    try {
      // If viewing someone else's profile, only show public data
      if (!isOwnProfile && user?.id !== profileUserId) {
        // For others' profiles, we don't show their saved items (privacy)
        setSavedItems([]);
      } else {
        // For own profile, load saved items
        const { data, error } = await supabase
          .from('listing_saves')
          .select(`
            listing_id,
            listings (*)
          `)
          .eq('user_id', profileUserId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          // Extract the product data from the join
          const saves = data.map(item => item.listings).filter(Boolean);
          setSavedItems(saves);
        }
      }
    } catch (err) {
      console.error('Error loading saved items:', err);
    }
  };
  
  // Toggle favorite status for a product
  const toggleFavorite = async (listingId) => {
    if (!user) return;
    
    try {
      // Check if already favorited
      const { data, error } = await supabase
        .from('listing_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        // Remove from favorites
        await supabase
          .from('listing_favorites')
          .delete()
          .eq('id', data.id);
          
        // Update UI
        setLikedItems(prev => prev.filter(item => item.id !== listingId));
      } else {
        // Add to favorites
        await supabase
          .from('listing_favorites')
          .insert({
            user_id: user.id,
            listing_id: listingId
          });
          
        // Get the product details and update UI
        const { data: listingData } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single();
          
        if (listingData) {
          setLikedItems(prev => [listingData, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };
  
  // Toggle saved status for a product
  const toggleSaved = async (listingId) => {
    if (!user) return;
    
    try {
      // Check if already saved
      const { data, error } = await supabase
        .from('listing_saves')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        // Remove from saved
        await supabase
          .from('listing_saves')
          .delete()
          .eq('id', data.id);
          
        // Update UI
        setSavedItems(prev => prev.filter(item => item.id !== listingId));
      } else {
        // Add to saved
        await supabase
          .from('listing_saves')
          .insert({
            user_id: user.id,
            listing_id: listingId
          });
          
        // Get the product details and update UI
        const { data: listingData } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single();
          
        if (listingData) {
          setSavedItems(prev => [listingData, ...prev]);
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
    <div className="mb-6 p-4 border-b border-gray-200">
      <div className="flex items-start space-x-4">
        {/* Profile Avatar */}
        <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-300 flex-shrink-0 bg-gray-200">
          {profile?.avatar_url ? (
            <img 
              src={getProfileImageUrl(profile.avatar_url)} 
              alt={profile.username || "User"} 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.username?.charAt(0) || 'U')}&background=random` }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-300 text-gray-500">
              {(profile?.username || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          {/* Username */}
          <h1 className="text-xl font-bold">{profile?.username || 'User'}</h1>
          
          {/* Verification Badge */}
          {profile?.verification_level === 'verified' && (
            <div className="flex items-center text-xs text-green-600 mt-1">
              <Shield size={14} className="mr-1" /> Verified
            </div>
          )}
          
          {/* Follower/Following Stats */}
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <button onClick={() => { setFollowPopupTab('following'); setShowFollowPopup(true); }} className="hover:underline">
              <strong>{following.length}</strong> Following
            </button>
            <button onClick={() => { setFollowPopupTab('followers'); setShowFollowPopup(true); }} className="hover:underline">
              <strong>{followers.length}</strong> Followers
            </button>
          </div>
        </div>
      </div>

      {/* Bio */}
      {isEditing ? (
        <Textarea 
          className="mt-4 w-full" 
          value={profile?.bio || ''} 
          onChange={(e) => setProfile({...profile, bio: e.target.value})} 
          placeholder="Tell us about yourself..."
        />
      ) : (
        profile?.bio && <p className="mt-4 text-gray-700">{profile.bio}</p>
      )}
      
      {/* Location */}
      {isEditing ? (
        <div className="mt-2 flex items-center">
          <MapPin size={16} className="mr-2 text-gray-400" />
          <Input 
            className="text-sm" 
            value={profile?.location || ''} 
            onChange={(e) => setProfile({...profile, location: e.target.value})} 
            placeholder="Location"
          />
        </div>
      ) : (
        profile?.location && (
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <MapPin size={16} className="mr-2" />
            {profile.location}
          </div>
        )
      )}
      
      {/* Stats - Ratings/Sales */}
      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
        <button onClick={() => setShowReviewsPopup(true)} className="flex items-center hover:underline">
          <Star size={16} className="mr-1 text-yellow-400" fill="currentColor" /> 
          <strong>{stats.averageRating?.toFixed(1) || 'N/A'}</strong> 
          <span className="ml-1">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
        </button>
        {/* Add sales/purchases stats if relevant */}
        {/* <span><strong>{stats.sales}</strong> Sales</span> */}
      </div>
      
      {/* Edit Button */}
      {isOwnProfile && !isEditing && (
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="mt-4">
          Edit Profile
        </Button>
      )}
      {isOwnProfile && isEditing && (
        <div className="mt-4 flex space-x-2">
          <Button size="sm" onClick={handleSaveChanges} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={saving}>
            Cancel
          </Button>
        </div>
      )}
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
                  <li 
                    key={user.id} 
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setShowFollowPopup(false); // Close current popup
                      const targetUserId = user.id;
                      const targetUsername = user.username || 'User';
                      console.log(`Attempting to open profile window for user: ${targetUserId}`);
                      // Try using the window.__openWindow method found elsewhere
                      if (typeof window !== 'undefined' && typeof window.__openWindow === 'function') {
                        // Assuming the window ID format is componentName-id
                        window.__openWindow(`profile-${targetUserId}`, 'ProfilePage', `${targetUsername}'s Profile`, { userId: targetUserId }); 
                      } else {
                        console.warn('__openWindow function not found, cannot open profile window dynamically.');
                        // Maybe show an alert or fallback to router if applicable
                        // router.push(`/profile/${targetUserId}`); 
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={getProfileImageUrl(user.avatar_url)}
                            alt={user.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'U')}&background=random`;
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
  
  const content = (
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
              {/* ADD FOLLOW BUTTON HERE */}
              {!isOwnProfile && (
                <Button 
                  size="sm" 
                  variant={isFollowing ? 'secondary' : 'outline'} 
                  className="ml-auto" // Keeps it pushed right if space allows
                  onClick={() => handleFollow(profileUserId)} // Pass profileUserId from component scope
                  disabled={!user} 
                >
                  {isFollowing ? 'Following' : 'Follow'} 
                </Button>
              )}
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
  
  // For window view, don't use WindowContainer title since Window.jsx already provides it
  if (isWindowView) {
    return (
      <WindowContainer>
        {content}
      </WindowContainer>
    );
  }
  
  return content;
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