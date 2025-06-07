'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageSquare, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { useApp } from '@/contexts/AppContext';

/**
 * ItemDetailPage component - Detailed view of a listing
 * Shows product images, details, price, seller info, and actions
 */
const ItemDetailPage = ({ 
  item, 
  seller, 
  reviews = [], 
  loading = false, 
  error = null 
}) => {
  console.log('ItemDetailPage render:', { 
    hasItem: !!item, 
    hasSeller: !!seller,
    sellerData: seller ? {
      userId: seller.user_id,
      username: seller.username,
      hasAvatar: !!seller.avatar_url,
      avatarUrl: seller.avatar_url || 'No avatar'
    } : 'No seller data',
    reviewCount: reviews.length,
    photoCount: item?.photos?.length || 0
  });

  // Check if item exists, otherwise show error or loading state
  if (!item) {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    return (
      <div className="bg-red-50 border border-red-300 rounded-md p-6 my-4">
        <h2 className="text-xl font-bold text-red-700">Content Not Available</h2>
        <p className="text-red-600 mt-2">{error || "Sorry, this item could not be found."}</p>
      </div>
    );
  }

  // Ensure photos is always an array
  const photos = Array.isArray(item.photos) ? item.photos : [];

  const router = useRouter();
  const { theme } = useTheme();
  const { openWindow } = useApp();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Format price with yen symbol
  const formatPrice = (value) => {
    if (!value) return '';
    return `¥${value.toLocaleString()}`;
  };

  // Calculate average rating from reviews
  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => total + (review.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  };

  // Get formatted time from now
  const getTimeFromNow = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  // Handle next/previous image
  const nextImage = () => {
    if (photos && photos.length > 0) {
      setSelectedImage((selectedImage + 1) % photos.length);
    }
  };

  const prevImage = () => {
    if (photos && photos.length > 0) {
      setSelectedImage((selectedImage - 1 + photos.length) % photos.length);
    }
  };

  // Handle favorite toggle
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you would implement your favorite logic with Supabase
  };

  // Handle message seller
  const handleMessageSeller = () => {
    if (seller) {
      router.push(`/messages/?user=${seller.username}`);
    }
  };

  // Handle visit shop
  const handleVisitShop = () => {
    console.log('handleVisitShop called with seller data:', {
      username: seller?.username,
      userId: seller?.user_id,
      hasId: !!seller?.id,
      idType: seller?.id ? typeof seller.id : 'N/A',
      avatarUrl: seller?.avatar_url ? seller.avatar_url.substring(0, 50) + '...' : 'No avatar'
    });
    if (seller) {
      if (openWindow) {
        // Make sure we have the user_id
        const sellerId = seller.user_id || (typeof seller.id === 'string' ? seller.id : null);
        
        if (sellerId) {
          // Use App context to open the window
          console.log(`Opening profile window for seller: ${sellerId}`);
          openWindow(`profile-${sellerId}`, 'ProfilePage', `${seller.username || 'Seller'}'s Shop`);
        } else {
          console.error('Cannot open seller profile: No user_id available', seller);
          // Fallback to router if we somehow have a username but no ID
          if (seller.username) {
            router.push(`/profile/${seller.username}`);
          }
        }
      } else {
        console.log('openWindow function not available, falling back to router');
        // Fallback to router
        router.push(`/profile/${seller.username}`);
      }
    } else {
      console.error('No seller information available');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-4 py-6">
      {/* Left side - Image gallery */}
      <div className="flex flex-col lg:w-3/5">
        {/* Main image */}
        <div className="relative border border-gray-200 rounded-md overflow-hidden mb-4 aspect-square bg-gray-100">
          {photos.length > 0 ? (
            <img 
              src={photos[selectedImage]} 
              alt={item.title} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No image available
            </div>
          )}
          
          {/* Image navigation arrows */}
          {photos.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
        
        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
            {photos.map((photo, index) => (
              <button 
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-20 h-20 flex-shrink-0 border-2 rounded-md overflow-hidden ${
                  selectedImage === index ? 'border-black' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img 
                  src={photo} 
                  alt={`${item.title} thumbnail ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Right side - Item details */}
      <div className="lg:w-2/5">
        {/* Item details section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{item.title}</h1>
          
          <div className="flex items-baseline mb-4">
            <span className="text-2xl font-bold mr-3">{formatPrice(item.price)}</span>
            {item.price_original && item.price < item.price_original && (
              <>
                <span className="text-gray-500 line-through mr-2">{formatPrice(item.price_original)}</span>
                <span className="text-red-500 text-sm font-semibold bg-red-50 px-2 py-0.5 rounded">
                  {Math.round((1 - item.price / item.price_original) * 100)}% OFF
                </span>
              </>
            )}
          </div>
          
          {/* Size/Condition/Metadata bar - styled like Depop */}
          <div className="flex items-center text-sm text-gray-600 mb-4">
            {item.condition && (
              <>
                <span className="mr-2">{item.condition}</span>
                <span className="mx-1.5">•</span>
              </>
            )}
            {item.location && (
              <>
                <span className="mr-2">{item.location}</span>
              </>
            )}
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            {item.category && (
              <div>
                <span className="text-gray-500">Category</span>
                <p className="font-medium">{item.category}</p>
              </div>
            )}
            {item.subcategory && (
              <div>
                <span className="text-gray-500">Type</span>
                <p className="font-medium">{item.subcategory}</p>
              </div>
            )}
            {item.colors && item.colors.length > 0 && (
              <div>
                <span className="text-gray-500">Color</span>
                <p className="font-medium">{item.colors.join(', ')}</p>
              </div>
            )}
            {item.style && (
              <div>
                <span className="text-gray-500">Style</span>
                <p className="font-medium">{item.style}</p>
              </div>
            )}
          </div>
          
          {/* Action buttons - styled like Depop */}
          <div className="space-y-3">
            <Button 
              className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded"
            >
              Buy now
            </Button>
            
            <Button 
              className="w-full bg-white hover:bg-gray-50 text-black border border-gray-300 py-3 rounded"
              variant="outline"
            >
              Add to bag
            </Button>
            
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-white hover:bg-gray-50 text-black border border-gray-300 py-3 rounded"
                variant="outline"
              >
                Make offer
              </Button>
              
              <Button 
                className={`aspect-square p-0 flex items-center justify-center rounded ${
                  isFavorite ? 'bg-pink-50 text-pink-500 border-pink-200' : 'bg-white text-gray-500 border-gray-300'
                }`}
                variant="outline"
                onClick={toggleFavorite}
              >
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Seller profile section - styled like Depop */}
        {seller && (
          <div className="border-t border-gray-200 pt-6">
            {console.log('Rendering seller profile section:', {
              sellerRawData: seller,
              username: seller.username,
              startsWithSeller: seller.username && seller.username.startsWith('Seller-'),
              avatarUrl: seller.avatar_url,
              fullName: seller.full_name
            })}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-3">
                {seller.avatar_url ? (
                  <img 
                    src={seller.avatar_url} 
                    alt={seller.username || "Seller"} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Error loading profile image:", seller.avatar_url);
                      console.log('Image error details:', e.target.error);
                      
                      // Try to modify the URL to get around potential CORS issues
                      if (seller.avatar_url.includes('supabase.co/storage')) {
                        console.log('Attempting to fix Supabase storage URL...');
                        
                        // Extract the file path from the URL
                        const match = seller.avatar_url.match(/\/public\/([^/]+)\/(.+)$/);
                        if (match) {
                          const [_, bucket, path] = match;
                          console.log(`Extracted bucket: ${bucket}, path: ${path}`);
                          
                          // Get initials from the shop name
                          let initial = 'S';
                          if (seller.username) {
                            // If username is like "Shop 5e33", use the ID part for the initial
                            if (seller.username.startsWith('Shop ')) {
                              initial = seller.username.split(' ')[1] || 'S';
                            } else {
                              initial = seller.username.charAt(0);
                            }
                          }
                          
                          // Try a different URL format
                          const newUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=3b82f6&color=fff&size=128&bold=true`;
                          console.log('Using fallback avatar URL:', newUrl);
                          e.target.src = newUrl;
                          return;
                        }
                      }
                      
                      // Get initials from the shop name
                      let initial = 'S';
                      if (seller.username) {
                        // If username is like "Shop 5e33", use the ID part for the initial
                        if (seller.username.startsWith('Shop ')) {
                          initial = seller.username.split(' ')[1] || 'S';
                        } else {
                          initial = seller.username.charAt(0);
                        }
                      }
                      
                      // If we get here, use the default fallback
                      const randomColor = '3b82f6'; // Using a consistent blue color
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=${randomColor}&color=fff&size=128&bold=true`;
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-blue-500 text-white font-bold">
                    {seller.username && seller.username.startsWith('Shop ') 
                      ? seller.username.split(' ')[1] || 'S' 
                      : (seller.username || "S").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold">
                  {console.log('Rendering username:', {
                    username: seller.username,
                    startsWithSeller: seller.username && seller.username.startsWith('Seller-'), 
                    fullName: seller.full_name,
                    originalId: seller.original_id
                  })}
                  {/* Display the shop name, with optional debug mode to see the original ID */}
                  {seller.username}
                  {seller.original_id && process.env.NODE_ENV === 'development' && (
                    <span className="ml-1 text-xs text-gray-400" title="Original seller ID">
                      ({seller.original_id})
                    </span>
                  )}
                </h3>
                <div className="flex items-center text-sm">
                  <div className="flex text-yellow-400 mr-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className="w-3.5 h-3.5"
                        fill={star <= calculateAverageRating() ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span className="text-gray-500">
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mb-6">
              <Button 
                className="flex-1 bg-white hover:bg-gray-50 text-black border border-gray-300 rounded"
                variant="outline"
                onClick={handleVisitShop}
              >
                Visit shop
              </Button>
              
              <Button 
                className="flex-1 bg-white hover:bg-gray-50 text-black border border-gray-300 rounded"
                variant="outline"
                onClick={handleMessageSeller}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
            
            {/* Reviews section - styled like Depop */}
            {reviews && reviews.length > 0 && (
              <div>
                <h3 className="font-bold mb-3">Recent Reviews</h3>
                <div className="space-y-4 mb-2">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id || `review-${Math.random()}`} className="border-b border-gray-100 pb-3">
                      <div className="flex items-center mb-1">
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className="w-3 h-3"
                              fill={star <= (review.rating || 0) ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {getTimeFromNow(review.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">
                        {/* Try both comment and text fields, fallback to generic message */}
                        {review.comment || review.text || 'Great seller!'}
                      </p>
                    </div>
                  ))}
                </div>
                {reviews.length > 3 && (
                  <button 
                    className="text-sm text-blue-500 hover:underline"
                    onClick={handleVisitShop}
                  >
                    See all reviews
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetailPage; 