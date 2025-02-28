// src/lib/functions/ensureShopperProfile.js
import { supabase } from '@/lib/supabase/client';

export async function ensureShopperProfile(userId) {
  console.log("Checking if shopper profile exists for user:", userId);
  
  // First, check if the user is marked as a shopper
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_shopper')
    .eq('user_id', userId)
    .single();
    
  if (!profileData?.is_shopper) {
    console.log("User is not marked as a shopper");
    return null;
  }
  
  // Check if shopper profile exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('shopper_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  console.log("Existing shopper profile check:", existingProfile, checkError);
  
  if (existingProfile) {
    console.log("Shopper profile exists:", existingProfile.id);
    return existingProfile;
  }
  
  // Create a new shopper profile
  console.log("Creating new shopper profile for user:", userId);
  
  const { data: newProfile, error: createError } = await supabase
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
    
  if (createError) {
    console.error("Error creating shopper profile:", createError);
    return null;
  }
  
  console.log("Created new shopper profile:", newProfile.id);
  return newProfile;
}