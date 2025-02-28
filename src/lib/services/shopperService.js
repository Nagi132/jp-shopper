// src/lib/services/shopperService.js
import { supabase } from '@/lib/supabase/client';

export async function fetchShopperRequests(shopperProfileId, options = {}) {
  const { 
    statuses = ['open', 'assigned', 'paid', 'purchased', 'shipped', 'completed'], 
    limit = null 
  } = options;

  try {
    let query = supabase
      .from('requests')
      .select('*')
      .in('status', statuses)
      .eq('shopper_id', shopperProfileId)
      .order('updated_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching shopper requests:', error);
    throw error;
  }
}

export async function updateShopperProfile(userId, profileData) {
  try {
    const { data, error } = await supabase
      .from('shopper_profiles')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating shopper profile:', error);
    throw error;
  }
}

export async function calculateShopperStats(shopperProfileId) {
  try {
    const [openRequests, activeRequests, completedRequests] = await Promise.all([
      fetchShopperRequests(shopperProfileId, { statuses: ['open'], limit: null }),
      fetchShopperRequests(shopperProfileId, { statuses: ['assigned', 'paid', 'purchased', 'shipped'], limit: null }),
      fetchShopperRequests(shopperProfileId, { statuses: ['completed'], limit: null })
    ]);

    return {
      open: openRequests.length,
      active: activeRequests.length,
      completed: completedRequests.length,
      total: openRequests.length + activeRequests.length + completedRequests.length
    };
  } catch (error) {
    console.error('Error calculating shopper stats:', error);
    throw error;
  }
}