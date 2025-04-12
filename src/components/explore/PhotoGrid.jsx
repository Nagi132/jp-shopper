'use client';

import React, { useState, useEffect } from 'react';
import Gallery from 'react-photo-gallery';
import ItemCard from './ItemCard';

/**
 * PhotoGrid - A responsive photo grid component that maintains aspect ratios
 * Uses react-photo-gallery to create a masonry-style layout
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items to display
 * @param {string} props.className - Additional CSS classes
 */
const PhotoGrid = ({ items = [], className = '' }) => {
  const [photos, setPhotos] = useState([]);
  
  // Convert items to photo objects for react-photo-gallery
  useEffect(() => {
    if (!items || items.length === 0) return;
    
    // For each item, create a photo object with a random aspect ratio
    // In a real app, you'd use the actual image dimensions
    const photoItems = items.map(item => {
      // Generate a semi-random aspect based on item id for variety
      // Real implementation would use actual image dimensions
      const hash = item.id ? String(item.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.random() * 100;
      
      // Create different aspect ratios for variety
      let width = 1;
      let height = 1;
      
      if (hash % 10 === 0) {
        // Square
        width = 1;
        height = 1;
      } else if (hash % 7 === 0) {
        // Portrait
        width = 3;
        height = 4;
      } else if (hash % 5 === 0) {
        // Landscape
        width = 4;
        height = 3;
      } else if (hash % 3 === 0) {
        // Wide
        width = 16;
        height = 9;
      }
      
      return {
        src: item.images?.[0] || `https://placehold.jp/80/${hash % 2 === 0 ? '69EFD7' : 'FED1EB'}/ffffff/400x400.png?text=${encodeURIComponent(item.title || 'Item')}`,
        width,
        height,
        key: item.id || `item-${hash}`,
        item // Pass the entire item object for the renderer
      };
    });
    
    setPhotos(photoItems);
  }, [items]);
  
  // Custom image renderer that uses our ItemCard component
  const imageRenderer = ({ index, photo, margin }) => {
    return (
      <ItemCard
        key={photo.key}
        item={photo.item}
        isWanted={photo.item.status === 'open'}
        style={{ margin }}
      />
    );
  };
  
  if (!photos.length) {
    return <div className="text-center py-10">No items found</div>;
  }
  
  return (
    <div className={className}>
      <Gallery
        photos={photos}
        renderImage={imageRenderer}
        targetRowHeight={200}
        margin={0} // No gaps between images
      />
    </div>
  );
};

export default PhotoGrid;