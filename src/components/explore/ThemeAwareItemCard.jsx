'use client';

import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ThemeContext } from "@/contexts/ThemeContext";

/**
 * ThemeAwareItemCard - A card component that reflects current theme colors
 */
const ThemeAwareItemCard = ({ 
  item, 
  isWanted = false,
  className = "", 
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const { theme } = useContext(ThemeContext);
  
  // Extract required fields from the item with fallbacks
  const {
    id,
    title = "Untitled Item",
    budget: price,
    images = [],
    status,
  } = item || {};

  // Get primary image with fallback
  const primaryImage = images?.length > 0 
    ? images[0] 
    : `https://placehold.jp/80/${isWanted ? 'ff66cc' : '69EFD7'}/ffffff/400x400.png?text=${encodeURIComponent(title)}`;
    
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

  // Get text color based on bg color brightness
  const getTextColor = (bgColor) => {
    // Convert to RGB
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return white for dark backgrounds, black for light
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  // Determine background color and pattern
  const cardStyle = {
    backgroundColor: theme?.bgColor ? `#${theme.bgColor}` : 'white',
    backgroundImage: theme?.pattern !== 'none' ? theme.pattern : 'none',
  };

  // Determine text color
  const textColor = theme?.bgColor ? 
    getTextColor(`#${theme.bgColor}`) : 
    '#000000';

  return (
    <Link href={`/requests/${id}`} className={`block ${className}`}>
      <div className="relative">
        {/* Image with aspect ratio */}
        <div className="relative" style={{ aspectRatio: '1', width: '100%' }}>
          <img 
            src={primaryImage}
            alt={title}
            className="object-cover w-full h-full"
            loading="lazy"
          />
          
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
                <span className="text-[#E7F227] font-bold text-sm px-2 py-1">
                  SOLD
                </span>
              )}
              {isRequested && !isSold && (
                <span className="text-[#51F5FF] font-bold text-sm px-2 py-1">
                  REQUESTED
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Item Info - Displayed below the image with theme colors */}
        <div className="p-1" style={{ ...cardStyle }}>
          {/* Title - Truncate if too long */}
          <h3 className="text-xs font-medium truncate" style={{ color: textColor }}>
            {title}
          </h3>
          
          {/* Price */}
          <div className="text-xs" style={{ color: textColor }}>
            {isWanted ? 'WANTED' : formatPrice(price)}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ThemeAwareItemCard;