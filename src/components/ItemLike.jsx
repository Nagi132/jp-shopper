"use client";

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useDialog } from '@/components/windows/MessageBox';

/**
 * ItemLike component for liking items to feed the recommendation algorithm
 * @param {Object} props Component props
 * @param {string} props.listingId ID of the listing to like/unlike
 * @param {number} props.initialLikes Initial like count
 * @param {boolean} props.initialLiked Whether the user has already liked this item
 * @param {string} props.size Size of the heart icon ('sm', 'md', 'lg')
 * @param {boolean} props.showCount Whether to show the like count
 * @param {string} props.className Additional CSS classes
 */
const ItemLike = ({ 
  listingId, 
  initialLikes = 0, 
  initialLiked = false,
  size = 'md',
  showCount = true,
  className
}) => {
  const { session, user } = useSession();
  const router = useRouter();
  const dialog = useDialog();
  
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  
  // Get heart size based on prop
  const heartSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size] || 'w-5 h-5';
  
  // Check if user has liked this item on mount
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_interactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('listing_id', listingId)
          .eq('interaction_type', 'like')
          .maybeSingle();
          
        if (error) throw error;
        setLiked(!!data);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    
    checkIfLiked();
  }, [user, listingId]);
  
  // Handle like/unlike action
  const handleLikeToggle = async () => {
    if (loading) return;
    
    if (!user) {
      dialog?.showInfo(
        'Sign in required', 
        'Please sign in to like items and get personalized recommendations',
        () => router.push('/login')
      );
      return;
    }
    
    try {
      setLoading(true);
      
      if (liked) {
        // Remove like
        const { error } = await supabase
          .from('user_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId)
          .eq('interaction_type', 'like');
          
        if (error) throw error;
        
        // Update like count in listing
        await supabase.rpc('decrement_like_count', { listing_id: listingId });
        
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Add like
        const { error } = await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            listing_id: listingId,
            interaction_type: 'like',
            interaction_metadata: {
              timestamp: new Date().toISOString(),
              source: 'item_page'
            }
          });
          
        if (error) throw error;
        
        // Update like count in listing
        await supabase.rpc('increment_like_count', { listing_id: listingId });
        
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      dialog?.showError('Error', 'Failed to update like status. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        onClick={handleLikeToggle}
        disabled={loading}
        className={cn(
          "flex items-center justify-center transition-all duration-200",
          liked ? "text-red-500" : "text-gray-400 hover:text-gray-600",
          loading && "opacity-50 cursor-not-allowed"
        )}
        aria-label={liked ? "Unlike item" : "Like item"}
      >
        <Heart 
          className={cn(
            heartSize,
            liked ? "fill-current" : ""
          )} 
        />
      </button>
      
      {showCount && (
        <span className="text-sm text-gray-500">{likeCount}</span>
      )}
    </div>
  );
};

export default ItemLike; 