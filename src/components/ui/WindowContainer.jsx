'use client';

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Minus, Square } from "lucide-react";

/**
 * WindowContainer - A Windows 2000 style container component with thick borders
 * @param {Object} props - The component props
 * @param {string} props.title - The window title (can be empty)
 * @param {string} props.className - Additional classes to apply to the container
 * @param {string} props.contentClassName - Classes for the content area
 * @param {string} props.borderColor - Border color (hex without #)
 * @param {string} props.bgColor - Background color (hex without #)
 * @param {string} props.statusText - Text to display in the status bar
 * @param {boolean} props.isDraggable - Whether the window can be dragged (desktop only)
 * @param {function} props.onClose - Function to call when close button is clicked
 * @param {React.ReactNode} props.children - The window content
 */
const WindowContainer = ({
  title = "",
  className,
  contentClassName,
  borderColor = "69EFD7",
  bgColor = "FED1EB",
  statusText,
  isDraggable = false,
  onClose,
  children,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Apply user's theme preference from localStorage if available
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('y2kTheme');
      if (savedTheme) {
        const theme = JSON.parse(savedTheme);
        if (theme.borderColor) borderColor = theme.borderColor;
        if (theme.bgColor) bgColor = theme.bgColor;
      }
    } catch (error) {
      console.error("Error loading theme from localStorage:", error);
    }
  }, []);

  // Mouse down handler for drag start
  const handleMouseDown = (e) => {
    if (!isDraggable) return;
    
    // Only start dragging from the title bar
    if (e.target.closest('.window-titlebar')) {
      setDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Mouse move handler for dragging
  const handleMouseMove = (e) => {
    if (dragging && isDraggable) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  // Mouse up handler for drag end
  const handleMouseUp = () => {
    setDragging(false);
  };

  // Add event listeners for dragging
  useEffect(() => {
    if (isDraggable) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggable, dragging, dragOffset]);

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleMinimize = () => {
    // Minimizing would typically need app-level state management
    // For now, we'll just alert
    alert("Window minimize functionality would be implemented at the app level");
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      alert("Window close functionality would be implemented at the app level");
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col",
        "shadow-[5px_5px_0px_rgba(0,0,0,0.4)]",
        isMaximized ? "fixed inset-0 z-50" : "relative",
        dragging ? "cursor-grabbing" : "",
        className
      )}
      style={{
        borderWidth: "4px",  // Thick border
        borderStyle: "solid",
        borderColor: `#${borderColor}`,
        backgroundColor: `#${bgColor}`,
        left: isDraggable && !isMaximized ? `${position.x}px` : undefined,
        top: isDraggable && !isMaximized ? `${position.y}px` : undefined,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Window Title Bar (empty title allowed) */}
      <div 
        className="window-titlebar h-6 flex items-center justify-end px-2 cursor-default select-none"
        style={{ backgroundColor: `#${borderColor}` }}
      >
        <div className="flex items-center space-x-1">
          <button
            className="w-4 h-4 flex items-center justify-center bg-gray-200 border border-gray-400 hover:bg-gray-300"
            onClick={handleMinimize}
          >
            <Minus className="h-2 w-2" />
          </button>
          <button
            className="w-4 h-4 flex items-center justify-center bg-gray-200 border border-gray-400 hover:bg-gray-300"
            onClick={handleMaximize}
          >
            <Square className="h-2 w-2" />
          </button>
          <button
            className="w-4 h-4 flex items-center justify-center bg-gray-200 border border-gray-400 hover:bg-gray-300 hover:bg-red-200"
            onClick={handleClose}
          >
            <X className="h-2 w-2" />
          </button>
        </div>
      </div>

      {/* Window Content - Scrollable */}
      <div className={cn(
        "flex-1 border border-gray-400 bg-white overflow-auto p-0",
        contentClassName
      )}>
        {children}
      </div>

      {/* Window Status Bar */}
      <div className="h-5 bg-gray-200 border-t border-gray-400 px-2 text-xs flex items-center">
        <span className="text-gray-700">{statusText || (title ? `${title} - Ready` : 'Ready')}</span>
      </div>
    </div>
  );
};

export default WindowContainer;