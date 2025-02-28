import { supabase } from '@/lib/supabase/client';

export async function ensureShopperProfile(userId) {
  try {
    // Check if shopper profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('shopper_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProfile) {
      return existingProfile;
    }

    // Create new shopper profile
    const { data, error } = await supabase
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

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error ensuring shopper profile:', error);
    throw error;
  }
}

export async function updateShopperProfile(userId, profileData) {
  try {
    const { data, error } = await supabase
      .from('shopper_profiles')
      .update(profileData)
      .eq('user_id', userId);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating shopper profile:', error);
    throw error;
  }
}