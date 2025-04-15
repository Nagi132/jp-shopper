'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * DesktopIcon - A Windows 2000 style desktop icon
 * 
 * @param {Object} props
 * @param {string} props.id - Unique identifier for the icon
 * @param {string} props.name - Display name of the icon
 * @param {string} props.icon - Path to the icon image
 * @param {Object} props.position - Position on the desktop {x, y}
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.isActive - Whether the app is currently open
 * @param {Object} props.theme - Theme colors
 */
const DesktopIcon = ({
  id,
  name,
  icon,
  position,
  onClick,
  isActive,
  theme
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const [iconPosition, setIconPosition] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Reset selection when clicking elsewhere
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest(`#desktop-icon-${id}`)) {
        setIsSelected(false);
      }
    };
    
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [id]);
  
  // Handle icon click
  const handleClick = (e) => {
    e.stopPropagation();
    setIsSelected(true);
  };
  
  // Handle icon double click
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    onClick();
  };
  
  // Handle icon mousedown for dragging
  const handleMouseDown = (e) => {
    if (isSelected) {
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      e.preventDefault(); // Prevent text selection
    }
  };
  
  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setIconPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);
  
  // Check if icon image exists, otherwise use placeholder
  const handleImageError = (e) => {
    e.target.src = '/icons/default.svg';
  };
  
  return (
    <div
      id={`desktop-icon-${id}`}
      className="desktop-icon absolute flex flex-col items-center justify-center w-16 select-none"
      style={{
        left: iconPosition.x,
        top: iconPosition.y,
        cursor: isSelected ? 'move' : 'default',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Icon image */}
      <div 
        className={`w-12 h-12 flex items-center justify-center mb-1 rounded ${isSelected ? 'bg-blue-500 bg-opacity-30' : ''}`}
        style={{
          border: isSelected ? `1px solid #${theme.borderColor}80` : 'none',
          backgroundColor: isSelected ? `#${theme.borderColor}30` : 'transparent',
          boxShadow: isSelected ? '0 0 5px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <div className="w-10 h-10 relative">
          <Image
            src={icon || '/icons/default.svg'}
            alt={name}
            fill
            style={{objectFit: 'contain'}}
            onError={handleImageError}
          />
          {isActive && (
            <div 
              className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full" 
              style={{ backgroundColor: `#${theme.borderColor}` }}
            />
          )}
        </div>
      </div>
      
      {/* Icon label */}
      <div 
        className={`text-xs text-center px-1 py-0.5 rounded leading-tight max-w-full ${isSelected ? 'text-white bg-blue-500' : 'text-black'}`}
        style={{
          backgroundColor: isSelected ? `#${theme.borderColor}` : 'transparent',
          color: isSelected ? '#FFFFFF' : '#000000',
          textShadow: !isSelected ? '0 0 3px rgba(255,255,255,0.7)' : 'none',
        }}
      >
        {name}
      </div>
    </div>
  );
};

export default DesktopIcon;