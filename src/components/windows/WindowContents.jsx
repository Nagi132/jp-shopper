'use client';

// Import window content components
import HomePage from './HomePage';
import ExplorePage from './ExplorePage';
import MessagesPage from './MessagesPage';
import RequestsPage from './RequestsPage';
import FavoritesPage from './FavoritesPage';
import NotificationsPage from './NotificationsPage';
import SettingsPage from './SettingsPage';
import HelpPage from './HelpPage';
import RequestDetailPage from './RequestDetailPage';
import NewRequestPage from './NewRequestPage';
import ProfilePage from './ProfilePage';
import ListingPage from './ListingPage';
import ItemDetailPage from '@/components/item/ItemDetailPage';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

// ItemDetail component for displaying in windows
const ItemDetail = ({ itemId }) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seller, setSeller] = useState(null);
  const [sellerReviews, setSellerReviews] = useState([]);
  
  // Extract item ID from the window ID format (item-123)
  const id = typeof itemId === 'string' ? itemId.replace('item-', '') : itemId;
  
  console.log('ItemDetail window component rendering with ID:', id);

  // Global error handler for debugging purposes
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Call the original console.error
      originalConsoleError(...args);
      
      // Log the error to our state for debugging if it's a string
      if (args.length > 0 && typeof args[0] === 'string') {
        setError(prev => {
          const newError = `${prev ? prev + '\n' : ''}Error: ${args[0]}`;
          return newError.length > 500 ? newError.substring(0, 500) + '...' : newError;
        });
      }
    };
    
    // Cleanup
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Fetch item data
  useEffect(() => {
    async function fetchData() {
      try {
        if (!id) {
          setError('No item ID provided');
          setLoading(false);
          return;
        }

        // Fetch listing data
        console.log(`Fetching listing with ID: ${id}`);
        const { data, error: fetchError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single();
          
        console.log('Supabase listing query result:', { 
          data, 
          error: fetchError ? fetchError.message : null 
        });

        if (fetchError) {
          setError(`Error loading listing: ${fetchError.message}`);
          setLoading(false);
          return;
        }
        
        if (!data) {
          setError(`Item with ID ${id} not found`);
          setLoading(false);
          return;
        }
        
        // Ensure photos is always an array
        if (!data.photos) {
          data.photos = [];
        }
        
        // If photos is a string (JSON), parse it
        if (typeof data.photos === 'string') {
          try {
            data.photos = JSON.parse(data.photos);
          } catch (e) {
            console.error('Error parsing photos JSON:', e);
            data.photos = [];
          }
        }
        
        // Make sure photos is an array
        if (!Array.isArray(data.photos)) {
          data.photos = [];
        }
        
        setItem(data);
        
        // Try to fetch profile information if we have a user_id
        if (data.user_id) {
          try {
            console.log('Starting profile fetch for user_id:', data.user_id);
            
            // First, check if profiles table exists by getting its structure
            const { data: tablesData, error: tablesError } = await supabase
              .from('profiles')
              .select('*')
              .limit(1);
              
            console.log('Profiles table check:', {
              exists: !tablesError,
              error: tablesError ? tablesError.message : null,
              sampleData: tablesData && tablesData.length > 0 ? 'Found sample data' : 'No sample data'
            });
            
            // Try to get the profile data WITHOUT using single() which causes errors when no profile exists
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*') // Select all fields to make sure we don't miss anything
              .eq('id', data.user_id); // First try matching on 'id' field
              
            console.log('Profile fetch attempt with id field:', {
              success: !profileError,
              foundProfiles: profileData ? profileData.length : 0,
              error: profileError ? profileError.message : null
            });
            
            let foundProfile = null;
            
            // If no profile found with id, try with user_id
            if (!profileError && (!profileData || profileData.length === 0)) {
              console.log('No profile found with id field, trying user_id field');
              const { data: profileData2, error: profileError2 } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', data.user_id);
                
              console.log('Profile fetch attempt with user_id field:', {
                success: !profileError2,
                foundProfiles: profileData2 ? profileData2.length : 0,
                error: profileError2 ? profileError2.message : null
              });
              
              if (!profileError2 && profileData2 && profileData2.length > 0) {
                foundProfile = profileData2[0]; // Take the first one if multiple found
              }
            } else if (!profileError && profileData && profileData.length > 0) {
              foundProfile = profileData[0];
            }
            
            console.log('Profile fetch complete:', {
              success: !!foundProfile,
              userId: data.user_id,
              foundProfile: !!foundProfile,
              profileData: foundProfile || 'No profile found',
              possibleFieldsFound: foundProfile ? Object.keys(foundProfile).join(', ') : 'none'
            });
            
            // Store profile data for reference
            if (foundProfile) {
              data.profiles = foundProfile;
              // Add log right after assignment
              console.log('>>> Assigned foundProfile to data.profiles. Value is:', JSON.stringify(data.profiles)); 
            }
            
            // Process seller information
            console.log(`Processing seller data for user_id: ${data.user_id}`);
            
            // Initialize seller data
            let sellerData = {
              user_id: data.user_id
            };
            
            // If we have profile data, use it
            if (data.profiles) {
              console.log('Using profile data:', data.profiles);
              
              // Let's log the exact values before assigning
              console.log('>>> Checking profile fields:', {
                profileUsername: data.profiles.username,
                profileFullName: data.profiles.full_name,
                profileName: data.profiles.name,
                profileDisplayName: data.profiles.display_name,
                profileDisplayNameCamel: data.profiles.displayName
              });
              
              // Log the exact username value we found
              const foundUsername = data.profiles.username || 
                data.profiles.full_name || 
                data.profiles.name || 
                data.profiles.display_name ||
                data.profiles.displayName;
                
              console.log('Found username value:', foundUsername);
              
              // Try all possible field names for username
              sellerData.username = foundUsername;
              
              // Try all possible field names for full name
              sellerData.full_name = 
                data.profiles.full_name || 
                data.profiles.fullName || 
                data.profiles.name || 
                data.profiles.display_name;
              
              // Log values AFTER assignment
              console.log('>>> Seller data after profile assignment:', {
                assignedUsername: sellerData.username,
                assignedFullName: sellerData.full_name
              });
              
              // Try all possible field names for avatar
              sellerData.avatar_url = 
                data.profiles.avatar_url || 
                data.profiles.avatarUrl || 
                data.profiles.avatar || 
                data.profiles.profile_image || 
                data.profiles.profileImage;
              
              console.log('After checking all fields, seller data:', {
                foundUsername: !!sellerData.username,
                username: sellerData.username,
                fullName: sellerData.full_name,
                hasAvatar: !!sellerData.avatar_url
              });
            }
            
            // If we still don't have a username, try fallbacks
            if (!sellerData.username) {
              console.log('No username found in profile data, trying fallbacks');
              
              // Check if we have basic profile data but no username field
              if (foundProfile) {
                // Look at all fields to see if anything would work as a username
                const allFields = Object.keys(foundProfile);
                console.log('Available profile fields:', allFields.join(', '));
                
                // Check for email fields
                for (const field of allFields) {
                  const value = foundProfile[field];
                  if (typeof value === 'string') {
                    // Check if any field contains an email format
                    if (value.includes('@') && value.includes('.')) {
                      console.log(`Found email-like field "${field}": ${value}`);
                      sellerData.username = value.split('@')[0];
                      break;
                    }
                    // Check for anything that might be a username
                    if (field.toLowerCase().includes('user') || 
                        field.toLowerCase().includes('name') ||
                        field.toLowerCase().includes('login')) {
                      console.log(`Found potential username field "${field}": ${value}`);
                      sellerData.username = value;
                      
                      // Update the profile record to set the username field
                      try {
                        const { error: updateError } = await supabase
                          .from('profiles')
                          .update({ username: value })
                          .eq('user_id', data.user_id);
                        
                        if (!updateError) {
                          console.log('Updated profile to set username field');
                        }
                      } catch (updateErr) {
                        console.log('Failed to update profile:', updateErr);
                      }
                      break;
                    }
                  }
                }
              }
              
              // Try to use listing metadata if still no username
              if (!sellerData.username) {
                // Try to use email directly if available in the listing
                if (data.seller_email) {
                  sellerData.username = data.seller_email.split('@')[0];
                } 
                // Try to use name directly if available in the listing
                else if (data.seller_name) {
                  sellerData.username = data.seller_name;
                }
                // Try to get email from auth directly
                else {
                  try {
                    // Get current user to check if this is the current user's listing
                    const { data: authData } = await supabase.auth.getUser();
                    
                    if (authData && authData.user && authData.user.id === data.user_id) {
                      console.log('This is the current user\'s listing');
                      sellerData.username = authData.user.email.split('@')[0];
                      
                      // Create/update profile with username
                      const { error: profileUpdateError } = await supabase
                        .from('profiles')
                        .upsert({
                          user_id: data.user_id,
                          username: sellerData.username,
                          email: authData.user.email,
                          updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id' });
                        
                        if (!profileUpdateError) {
                          console.log('Updated current user profile with username');
                        }
                    } else {
                      // Fallback to user ID format
                      sellerData.username = 'Seller-' + data.user_id.substring(0, 4);
                    }
                  } catch (authError) {
                    console.log('Auth fetch failed:', authError?.message);
                    sellerData.username = 'Seller-' + data.user_id.substring(0, 4);
                  }
                }
              }
            }
            
            // Generate a placeholder avatar if none exists
            if (!sellerData.avatar_url) {
              // Get first letter of username or full name for the avatar
              let initials = '';
              if (sellerData.username) {
                initials = sellerData.username.charAt(0).toUpperCase();
              } else if (sellerData.full_name) {
                // For full names, use first letter of first and last name
                const nameParts = sellerData.full_name.split(' ');
                if (nameParts.length > 1) {
                  initials = nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0);
                } else {
                  initials = nameParts[0].charAt(0);
                }
                initials = initials.toUpperCase();
              } else {
                initials = 'S'; // Default to 'S' for Seller
              }
              
              sellerData.avatar_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128&bold=true`;
              console.log('Generated placeholder avatar with initials:', initials);
            }
            // Format the avatar_url if it's not a full URL
            else if (!sellerData.avatar_url.startsWith('http')) {
              try {
                const dbAvatarPath = sellerData.avatar_url; // e.g., "avatars/0b45...jpg"
                console.log('Original avatar path from DB:', dbAvatarPath);
                
                // Validate the path
                if (!dbAvatarPath || typeof dbAvatarPath !== 'string') {
                  throw new Error('Invalid avatar path stored in DB');
                }

                // Directly construct the URL using the correct 'profiles' bucket and the full path from DB
                const { data: profileUrlData } = supabase.storage
                  .from('profiles') // Use the correct bucket name
                  .getPublicUrl(dbAvatarPath); // Use the full path from the DB (e.g., "avatars/0b45...jpg")
                    
                if (profileUrlData && profileUrlData.publicUrl) {
                  sellerData.avatar_url = profileUrlData.publicUrl;
                  console.log('Resolved avatar from profiles bucket:', sellerData.avatar_url);
                } else {
                  // This should ideally not happen if getPublicUrl always returns a URL
                  // But log just in case
                  console.log('Could not construct public URL for profiles bucket');
                  throw new Error('Could not construct public URL'); // Trigger fallback
                }
              } catch (avatarError) {
                console.error('Error formatting avatar URL or file not found:', avatarError);
                // If we can't format the URL or get the public URL, use a placeholder
                let initials = '';
                if (sellerData.username) {
                  initials = sellerData.username.charAt(0).toUpperCase();
                } else if (sellerData.full_name) {
                  const nameParts = sellerData.full_name.split(' ');
                  if (nameParts.length > 1) {
                    initials = nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0);
                  } else {
                    initials = nameParts[0].charAt(0);
                  }
                  initials = initials.toUpperCase();
                } else {
                  initials = 'S';
                }
                
                sellerData.avatar_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128&bold=true`;
              }
            }
            
            // If we could not get profile data in any way, create a basic fallback
            if (!sellerData.username || sellerData.username.startsWith('Seller-')) {
              console.log('FALLBACK CHECK - Current username before fallback:', sellerData.username);
              console.log('Username condition check:', {
                noUsername: !sellerData.username,
                startsWithSeller: sellerData.username && sellerData.username.startsWith('Seller-'),
                condition: !sellerData.username || sellerData.username.startsWith('Seller-')
              });
              
              // Let's check if we have a full_name even though we don't have a good username
              if (sellerData.full_name && sellerData.full_name.length > 0) {
                console.log('Found valid full_name to use instead of Shop Owner:', sellerData.full_name);
                
                // Use the full_name instead of 'Shop Owner' as it's more personalized
                sellerData.username = sellerData.full_name;
              } else {
                // Extract ID suffix for display
                const idSuffix = data.user_id.substring(0, 4);
                // This is a last resort - create a friendly display name instead of technical IDs
                // But include the ID suffix to make it unique
                const friendlyName = `Shop ${idSuffix}`;
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(idSuffix)}&background=3b82f6&color=fff&size=128&bold=true`;
                
                console.log('>>> Generating fallback name:', {
                  reason: `Username is '${sellerData.username}', Full Name is '${sellerData.full_name}'`,
                  userId: data.user_id,
                  idSuffix: idSuffix,
                });
                console.log('Using friendly fallback seller data with ID suffix:', idSuffix);
                
                // Override with friendly data
                sellerData = {
                  user_id: data.user_id,
                  username: friendlyName,
                  original_id: sellerData.username || `Seller-${idSuffix}`, // Keep the original ID for reference
                  avatar_url: avatarUrl
                };
              }
            }
            
            // Set the seller
            console.log('Final seller data being set:', {
              userId: sellerData.user_id,
              username: sellerData.username,
              hasAvatar: !!sellerData.avatar_url,
              avatar: sellerData.avatar_url ? sellerData.avatar_url.substring(0, 50) + '...' : 'none'
            });
            setSeller(sellerData);
            
            // Now fetch reviews using the sellerData we just created
            try {
              console.log('Fetching reviews for user_id:', sellerData.user_id);
              
              // First, check if user_reviews table exists and its structure
              const { data: reviewsTableData, error: reviewsTableError } = await supabase
                .from('user_reviews')
                .select('*')
                .limit(1);
                
              console.log('User_reviews table check:', {
                exists: !reviewsTableError,
                error: reviewsTableError ? reviewsTableError.message : null,
                sampleData: reviewsTableData && reviewsTableData.length > 0 ? 'Found sample data' : 'No sample data',
                columns: reviewsTableData && reviewsTableData.length > 0 ? Object.keys(reviewsTableData[0]).join(', ') : 'No columns found'
              });
              
              // Based on the table structure, determine which fields to select
              let selectFields = 'id, rating, created_at';
              if (reviewsTableData && reviewsTableData.length > 0) {
                const sampleReview = reviewsTableData[0];
                if ('comment' in sampleReview) selectFields += ', comment';
                if ('text' in sampleReview) selectFields += ', text';
              }
              
              console.log(`Using select fields for reviews: ${selectFields}`);
              
              const { data: reviewsData, error: reviewsError } = await supabase
                .from('user_reviews')
                .select(selectFields)
                .eq('reviewee_id', sellerData.user_id)
                .order('created_at', { ascending: false })
                .limit(5);
                
              console.log('User reviews fetch result:', { 
                reviewCount: reviewsData?.length || 0, 
                error: reviewsError ? reviewsError.message : null,
                firstReview: reviewsData && reviewsData.length > 0 ? 
                  JSON.stringify(reviewsData[0]).substring(0, 100) + '...' : 'No reviews'
              });
              
              if (reviewsError) {
                console.error('Error fetching reviews:', reviewsError);
                
                // If the error is about missing 'comment' column, try again with just the fields we know exist
                if (reviewsError.message && reviewsError.message.includes('does not exist')) {
                  console.log('Trying fallback review query with minimal fields');
                  const { data: fallbackReviews, error: fallbackError } = await supabase
                    .from('user_reviews')
                    .select('id, rating, created_at')
                    .eq('reviewee_id', sellerData.user_id)
                    .order('created_at', { ascending: false })
                    .limit(5);
                    
                  console.log('Fallback review query result:', {
                    success: !fallbackError,
                    reviewCount: fallbackReviews?.length || 0,
                    error: fallbackError ? fallbackError.message : null
                  });
                    
                  if (fallbackReviews) {
                    setSellerReviews(fallbackReviews);
                  }
                }
              } else if (reviewsData) {
                setSellerReviews(reviewsData);
              }
            } catch (reviewsError) {
              console.error('Error in reviews fetching process:', reviewsError);
            }
            
            // Create or update profile with better data if we found it
            if (sellerData.username && sellerData.username !== 'Seller-' + data.user_id.substring(0, 4) && !data.profiles) {
              // Note: We're no longer attempting to create profiles from client-side code
              // This would trigger RLS policy violations (403 Forbidden)
              // Instead, just log that we found useful data that could be used for a profile
              console.log('Found useful seller data that could be used for a profile:', {
                userId: sellerData.user_id,
                username: sellerData.username
              });
            }
            
          } catch (profileError) {
            console.error('Error in profile fetching process:', profileError);
            // Fallback if anything goes wrong
            const fallbackName = 'Seller-' + data.user_id.substring(0, 4);
            setSeller({
              user_id: data.user_id,
              username: fallbackName,
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName.charAt(0))}&background=random&color=fff&size=128&bold=true`
            });
          }
        } else {
          console.warn('No user_id found in listing data, cannot fetch seller profile');
        }
        
      } catch (error) {
        console.error('Error in fetchData:', error);
        setError(error.message || 'Error loading item details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id]);

  return (
    <div className="h-full overflow-auto">
      <ItemDetailPage
        item={item}
        seller={seller}
        reviews={sellerReviews}
        loading={loading}
        error={error}
      />
    </div>
  );
};

// Export all components for use in the window manager
export {
  HomePage,
  ExplorePage,
  MessagesPage,
  RequestsPage,
  FavoritesPage,
  NotificationsPage,
  SettingsPage,
  HelpPage,
  RequestDetailPage as RequestDetail, // Alias to match what's expected in WindowManager
  NewRequestPage,
  ProfilePage,
  ListingPage,
  ItemDetail  // Export the new ItemDetail component
};