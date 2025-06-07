'use client';

import React from 'react';
import Image from 'next/image';

/**
 * MobileDesktopIcons - Touch-optimized desktop icons for mobile
 * Grid layout with larger touch targets
 */
const MobileDesktopIcons = ({ items, onIconTap, theme }) => {
  
  const handleIconClick = (item) => {
    // Add haptic feedback for mobile
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    onIconTap(item);
  };

  return (
    <div className="grid grid-cols-3 gap-6 p-4">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => handleIconClick(item)}
          className="flex flex-col items-center cursor-pointer select-none group"
        >
          {/* Icon Container */}
          <div 
            className="relative w-16 h-16 mb-2 rounded-lg border-2 flex items-center justify-center transition-all duration-200 group-active:scale-95 group-hover:scale-105"
            style={{
              backgroundColor: `#${theme?.bgColor || 'ECE9D8'}`,
              borderColor: `#${theme?.borderColor || '69EFD7'}`,
              boxShadow: `2px 2px 4px rgba(0,0,0,0.1)`,
            }}
          >
            {/* Icon Image */}
            <div className="relative w-8 h-8">
              <Image
                src={item.icon}
                alt={item.name}
                width={32}
                height={32}
                className="object-contain"
                style={{
                  filter: `hue-rotate(${theme?.iconHue || 0}deg) saturate(${theme?.iconSaturation || 100}%)`
                }}
              />
            </div>
            
            {/* Touch ripple effect */}
            <div 
              className="absolute inset-0 rounded-lg opacity-0 group-active:opacity-20 transition-opacity duration-200"
              style={{
                backgroundColor: `#${theme?.borderColor || '69EFD7'}`
              }}
            />
          </div>
          
          {/* Icon Label */}
          <span 
            className="text-xs font-medium text-center leading-tight max-w-full break-words"
            style={{
              color: `#${theme?.textColor || '000000'}`,
              textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
            }}
          >
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MobileDesktopIcons;