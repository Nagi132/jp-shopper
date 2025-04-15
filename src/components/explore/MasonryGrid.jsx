'use client';

import React from 'react';
import Masonry from 'react-masonry-css';
import ItemCard from './ItemCard';

/**
 * MasonryGrid - A responsive masonry layout without gaps
 * Uses react-masonry-css for dynamic content handling
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items to display
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.theme - Theme properties (borderColor, bgColor, pattern)
 */
const MasonryGrid = ({ items = [], className = '', theme }) => {
  // Breakpoint columns config for responsive design
  const breakpointColumnsObj = {
    default: 3,  // Default to 3 columns
    1280: 3,     // 3 columns for large screens
    1024: 3,     // 3 columns for medium screens 
    768: 2,      // 2 columns for tablets
    640: 1       // 1 column for mobile
  };

  // Get theme colors or use defaults
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  const pattern = theme?.pattern || 'none';

  // Determine text color based on background color
  const getContrastText = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark
    return luminance > 0.5 ? '000000' : 'FFFFFF';
  };

  const textColor = theme?.textColor || getContrastText(bgColor);

  if (!items || items.length === 0) {
    return (
      <div 
        className="text-center py-10 rounded-lg border-2 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]"
        style={{
          backgroundColor: `#${bgColor}`,
          borderColor: `#${borderColor}`,
          color: `#${textColor}`,
          backgroundImage: pattern !== 'none' ? pattern : undefined,
        }}
      >
        No items found
      </div>
    );
  }

  return (
    <div 
      className={`p-2 rounded-lg ${className}`}
      style={{
        backgroundColor: `#${bgColor}30`, // Semi-transparent background
        backgroundImage: pattern !== 'none' ? pattern : undefined,
        boxShadow: `inset 0 0 20px rgba(0,0,0,0.05)`,
        border: pattern !== 'none' ? `2px solid #${borderColor}50` : 'none',
      }}
    >
      <style jsx global>{`
        /* Masonry grid styling */
        .masonry-grid {
          display: flex;
          width: 100%;
          max-width: 100%;
        }
        
        .masonry-grid_column {
          background-clip: padding-box;
          padding: 0 4px; /* Small gap between columns */
        }

        /* Item wrapper */
        .masonry-item {
          margin-bottom: 8px; /* Gap between items */
          transition: all 0.2s ease;
        }
        
        .masonry-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        /* Custom scrollbar that matches theme */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #${bgColor}50;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #${borderColor};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #${borderColor}90;
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
              theme={{
                borderColor,
                bgColor,
                textColor,
                pattern
              }}
            />
          </div>
        ))}
      </Masonry>
    </div>
  );
};

export default MasonryGrid;