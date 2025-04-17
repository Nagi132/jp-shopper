'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

/**
 * DesktopIcon - A Windows 2000 style desktop icon
 * Fixed version that prevents shifting/teleporting on click and drag
 */
const DesktopIcon = ({
  id,
  name,
  icon,
  position = { x: 0, y: 0 },
  onClick,
  isActive,
  theme = { borderColor: '69EFD7', bgColor: 'FED1EB' }
}) => {
  // Initialize state with the initial position exactly once
  const [iconPosition, setIconPosition] = useState(position);
  
  // Keep track of whether we're dragging
  const [isDragging, setIsDragging] = useState(false);
  
  // Track selection state
  const [isSelected, setIsSelected] = useState(false);
  
  // Create refs
  const iconRef = useRef(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const initialPositionSet = useRef(false);
  
  // Set initial position only once on mount, and when position prop changes dramatically
  useEffect(() => {
    // Only update from props if not dragging and position changed significantly
    // or if we haven't set initial position yet
    if ((!initialPositionSet.current) || 
        (!isDragging && 
        (Math.abs(position.x - iconPosition.x) > 50 || Math.abs(position.y - iconPosition.y) > 50))) {
      setIconPosition(position);
      initialPositionSet.current = true;
      
      // Try to load saved position from localStorage
      try {
        const savedPositions = JSON.parse(localStorage.getItem('desktopIconPositions') || '{}');
        if (savedPositions[id]) {
          setIconPosition(savedPositions[id]);
        }
      } catch (error) {
        console.error('Error loading saved position for icon:', id, error);
      }
    }
  }, [position, id, isDragging, iconPosition.x, iconPosition.y]);
  
  // Handle click to select
  const handleClick = (e) => {
    e.stopPropagation();
    setIsSelected(true);
  };
  
  // Handle double click
  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only trigger if not dragging
    if (!isDragging) {
      onClick();
    }
  };
  
  // Handle start of dragging
  const handleMouseDown = (e) => {
    // Only start drag if the icon is selected
    if (isSelected) {
      e.preventDefault();
      e.stopPropagation();
      
      // Record where the drag started
      dragStartPosRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        iconX: iconPosition.x,
        iconY: iconPosition.y
      };
      
      setIsDragging(true);
    }
  };
  
  // Mouse move handler for dragging
  useEffect(() => {
    // Define the handler inside the effect to have access to current state
    const handleMouseMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        
        // Calculate the delta from the drag start position
        const deltaX = e.clientX - dragStartPosRef.current.mouseX;
        const deltaY = e.clientY - dragStartPosRef.current.mouseY;
        
        // Update position based on the starting position + delta
        // This prevents accumulating small errors that cause drift
        const newX = dragStartPosRef.current.iconX + deltaX;
        const newY = dragStartPosRef.current.iconY + deltaY;
        
        setIconPosition({ x: newX, y: newY });
      }
    };
    
    // Mouse up handler for finishing the drag
    const handleMouseUp = (e) => {
      if (isDragging) {
        setIsDragging(false);
        
        // Save position to localStorage
        try {
          const savedPositions = JSON.parse(localStorage.getItem('desktopIconPositions') || '{}');
          savedPositions[id] = iconPosition;
          localStorage.setItem('desktopIconPositions', JSON.stringify(savedPositions));
        } catch (error) {
          console.error('Error saving icon position:', error);
        }
      }
    };
    
    // Reset selection when clicking elsewhere
    const handleDocumentClick = (e) => {
      if (!e.target.closest(`#desktop-icon-${id}`)) {
        setIsSelected(false);
      }
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleDocumentClick);
    
    // Clean up
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isDragging, id, iconPosition]);
  
  // Handle image error
  const handleImageError = (e) => {
    e.target.src = '/icons/default.svg';
  };
  
  return (
    <div
      ref={iconRef}
      id={`desktop-icon-${id}`}
      className="desktop-icon absolute flex flex-col items-center justify-center w-16 select-none"
      style={{
        left: iconPosition.x,
        top: iconPosition.y,
        cursor: isSelected ? 'cursor-win-move' : 'cursor-win-default',
        userSelect: 'none',
        pointerEvents: 'auto', // Ensures the icon receives mouse events
        touchAction: 'none', // Prevents the browser from handling touch events
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      draggable={false} // Disable HTML5 drag and drop
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
            alt={name || `Icon for ${id}`}
            fill
            style={{ objectFit: 'contain' }}
            onError={handleImageError}
            draggable={false} // Prevents the image from being dragged
            unoptimized={true} // Prevents Next.js image optimization
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
        className={`text-xs text-center px-1 py-0.5 rounded leading-tight max-w-full ${isSelected ? 'text-white' : 'text-black'}`}
        style={{
          backgroundColor: isSelected ? `#${theme.borderColor}` : 'transparent',
          color: isSelected ? '#FFFFFF' : '#000000',
          textShadow: !isSelected ? '0 0 3px rgba(255,255,255,0.7)' : 'none',
          userSelect: 'none', // Prevents text selection
        }}
      >
        {name}
      </div>
    </div>
  );
};

export default DesktopIcon;