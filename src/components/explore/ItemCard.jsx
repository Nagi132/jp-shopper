'use client';

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";

/**
 * ItemCard - A card component for displaying items in a masonry grid
 * 
 * @param {Object} props
 * @param {Object} props.item - The item data
 * @param {boolean} props.isWanted - Whether this is a "wanted" item (request)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.theme - Theme properties (borderColor, bgColor)
 */
const ItemCard = ({ 
  item, 
  isWanted = false,
  className = "",
  theme
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Extract required fields from the item with fallbacks
  const {
    id,
    title = "Untitled Item",
    budget: price,
    images = [],
    status,
  } = item || {};

  // Get theme colors or use defaults
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  const textColor = theme?.textColor || '000000';

  // Get primary image with fallback
  const primaryImage = images?.length > 0 
    ? images[0] 
    // Use theme colors for placeholder background
    : `https://placehold.jp/80/${isWanted ? borderColor : bgColor}/ffffff/400x400.png?text=${encodeURIComponent(title)}`;
    
  // Check item status
  const isSold = status === 'completed';
  const isRequested = status === 'open' && !isWanted;

  // Load favorite status from localStorage on mount
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('favorites');
      if (savedFavorites) {
        const favorites = JSON.parse(savedFavorites);
        setIsFavorite(favorites.includes(id));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, [id]);

  // Toggle favorite status
  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const savedFavorites = localStorage.getItem('favorites');
      let favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
      
      if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
      } else {
        favorites.push(id);
      }
      
      localStorage.setItem('favorites', JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };

  // Format price with yen symbol
  const formatPrice = (price) => {
    if (!price) return '';
    return `¥${price.toLocaleString()}`;
  };

  return (
    <div 
      className={`mb-0 ${className}`}
      style={{
        border: theme ? `2px solid #${theme.borderColor}` : undefined,
      }}
    >
      <div className="relative">
        {/* Main Image */}
        <div className="relative aspect-auto overflow-hidden">
          <img 
            src={primaryImage}
            alt={title}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>

        {/* Favorite Heart Button */}
        <button
          className="absolute top-2 right-2 z-10"
          onClick={toggleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart 
            className="w-5 h-5 text-white drop-shadow-[1px_1px_0px_rgba(0,0,0,0.7)]"
            fill={isFavorite ? "#E7F227" : "transparent"}
            stroke={isFavorite ? "#E7F227" : "white"}
          />
        </button>
        
        {/* Status Overlay */}
        {(isSold || isRequested) && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            {isSold && (
              <span className="text-[#E7F227] font-bold text-lg px-3 py-1">
                SOLD
              </span>
            )}
            {isRequested && !isSold && (
              <span className="text-[#51F5FF] font-bold text-lg px-3 py-1">
                REQUESTED
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Item Info - Displayed below the image */}
      <div 
        className="p-2"
        style={{
          backgroundColor: theme ? `#${theme.bgColor}` : undefined,
          color: theme?.textColor ? `#${theme.textColor}` : undefined,
        }}
      >
        {/* Title - Truncate if too long */}
        <h3 className="text-sm font-medium truncate">
          {title}
        </h3>
        
        {/* Price */}
        <div className="text-sm">
          {isWanted ? 'WANTED' : formatPrice(price)}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;