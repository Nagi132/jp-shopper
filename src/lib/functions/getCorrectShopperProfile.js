// src/lib/functions/getCorrectShopperProfile.js
import { supabase } from '@/lib/supabase/client';

export async function getCorrectShopperProfile(userId) {
  console.log("Finding correct shopper profile for user:", userId);
  
  // STEP 1: Check if any requests are assigned to a shopper profile for this user
  const { data: profiles } = await supabase
    .from('shopper_profiles')
    .select('id')
    .eq('user_id', userId);
    
  if (profiles && profiles.length > 0) {
    const profileIds = profiles.map(p => p.id);
    console.log("Found shopper profiles:", profileIds);
    
    // Check which of these profiles is used in requests
    const { data: linkedRequests } = await supabase
      .from('requests')
      .select('shopper_id, status')
      .in('shopper_id', profileIds)
      .not('status', 'eq', 'completed');
      
    console.log("Found requests linked to profiles:", linkedRequests);
    
    if (linkedRequests && linkedRequests.length > 0) {
      // Use the profile that's already linked to requests
      const activeProfileId = linkedRequests[0].shopper_id;
      console.log("Using profile ID with active requests:", activeProfileId);
      
      const { data: activeProfile } = await supabase
        .from('shopper_profiles')
        .select('*')
        .eq('id', activeProfileId)
        .single();
        
      if (activeProfile) {
        return activeProfile;
      }
    }
    
    // If no profile with active requests, use any existing profile
    console.log("No active requests found, using first available profile");
    const { data: anyProfile } = await supabase
      .from('shopper_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (anyProfile) {
      return anyProfile;
    }
  }
  
  // Create new profile as last resort
  console.log("No existing profiles found, creating new one");
  const { data: newProfile, error } = await supabase
    .from('shopper_profiles')
    .insert({
      user_id: userId,
      bio: '',
      location: '',
      specialties: [],
      verification_level: 'pending',
      rating: 0,
      languages: ['Japanese']
    })
    .select()
    .single();
    
  if (error) {
    console.error("Failed to create profile:", error);
    return null;
  }
  
  return newProfile;
}