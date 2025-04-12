'use client';

import React from 'react';
import Masonry from 'react-masonry-css';
import ItemCard from './ItemCard';

/**
 * MasonryGrid - A responsive masonry layout without gaps
 * Uses react-masonry-css for dynamic content handling
 */
const MasonryGrid = ({ items = [], className = '' }) => {
  // Breakpoint columns config for responsive design
  const breakpointColumnsObj = {
    default: 3,  // Default to 3 columns
    1280: 3,     // 3 columns for large screens
    1024: 3,     // 3 columns for medium screens 
    768: 2,      // 2 columns for tablets
    640: 1       // 1 column for mobile
  };

  if (!items || items.length === 0) {
    return <div className="text-center py-10">No items found</div>;
  }

  return (
    <div className={className}>
      <style jsx global>{`
        /* Masonry grid styling */
        .masonry-grid {
          display: flex;
          width: 100%;
          max-width: 100%;
        }
        
        .masonry-grid_column {
          background-clip: padding-box;
          padding: 0; /* No gaps */
        }

        /* Item wrapper */
        .masonry-item {
          margin-bottom: 0; /* No vertical gap */
          padding: 1px; /* Just enough to see separation */
        }
      `}</style>
      
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {items.map((item) => (
          <div key={item.id || Math.random().toString(36)} className="masonry-item">
            <ItemCard 
              item={item}
              isWanted={item.status === 'open'}
            />
          </div>
        ))}
      </Masonry>
    </div>
  );
};

export default MasonryGrid;