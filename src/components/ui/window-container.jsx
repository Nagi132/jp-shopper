'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@/components/layouts/ThemeProvider';

/**
 * WindowContainer - Unified container for all window content
 * Provides consistent styling, theme integration, and structure
 * Now with cute borders like the theme customizer!
 */
const WindowContainer = ({ 
  children, 
  className = '', 
  hasHeader = false,
  headerContent = null,
  hasFooter = false,
  footerContent = null,
  padding = true,
  hasCloseButton = false,
  onClose = null,
  title = ''
}) => {
  const { theme } = useTheme();
  
  const baseStyles = {
    backgroundColor: `#${theme?.bgColor || 'ECE9D8'}`,
    color: `#${theme?.textColor || '000000'}`,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderColor: `#${theme?.borderColor || '69EFD7'}`
  };

  return (
    <div 
      className={`window-container shadow-[5px_5px_0px_rgba(0,0,0,0.2)] border-2 ${className}`}
      style={baseStyles}
    >
      {/* Window Title Bar - like the cute theme customizer */}
      {(hasHeader || hasCloseButton || title) && (
        <div 
          className="window-header px-3 py-2 border-b flex items-center justify-between"
          style={{ 
            backgroundColor: `#${theme?.borderColor || '69EFD7'}`,
            borderColor: `#${theme?.borderColor || '69EFD7'}`,
            color: '#FFFFFF',
            minHeight: '32px'
          }}
        >
          <div className="flex items-center">
            {title && (
              <h3 className="font-bold text-sm text-white">{title}</h3>
            )}
            {!title && headerContent && (
              <div className="text-white">{headerContent}</div>
            )}
          </div>
          {hasCloseButton && onClose && (
            <button
              onClick={onClose}
              className="window-control flex items-center justify-center w-6 h-6 hover:bg-white hover:bg-opacity-20 rounded focus:outline-none transition-colors"
              style={{
                color: '#FFFFFF'
              }}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      {/* Regular Header Content (if no title bar) */}
      {hasHeader && !hasCloseButton && !title && (
        <div 
          className="window-header px-4 py-2 border-b"
          style={{ 
            backgroundColor: `#${theme?.bgColor || 'ECE9D8'}30`,
            borderColor: `#${theme?.borderColor || '69EFD7'}40`
          }}
        >
          {headerContent}
        </div>
      )}
      
      {/* Main Content */}
      <div 
        className={`window-main-content flex-1 overflow-auto ${padding ? 'p-4' : ''}`}
        style={{ backgroundColor: `#${theme?.bgColor || 'ECE9D8'}` }}
      >
        {children}
      </div>
      
      {/* Optional Footer */}
      {hasFooter && (
        <div 
          className="window-footer px-4 py-2 border-t"
          style={{ 
            backgroundColor: `#${theme?.bgColor || 'ECE9D8'}20`,
            borderColor: `#${theme?.borderColor || '69EFD7'}40`
          }}
        >
          {footerContent}
        </div>
      )}
    </div>
  );
};

/**
 * WindowSection - Consistent section styling within windows
 */
const WindowSection = ({ 
  title, 
  children, 
  className = '',
  collapsible = false,
  defaultExpanded = true 
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  
  return (
    <div 
      className={`window-section mb-4 border rounded-sm ${className}`}
      style={{ borderColor: `#${theme?.borderColor || '69EFD7'}40` }}
    >
      {title && (
        <div 
          className={`section-header px-3 py-2 border-b ${collapsible ? 'cursor-pointer' : ''}`}
          style={{ 
            backgroundColor: `#${theme?.bgColor || 'ECE9D8'}20`,
            borderColor: `#${theme?.borderColor || '69EFD7'}40`,
            color: `#${theme?.textColor || '000000'}`
          }}
          onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
        >
          <h3 className="font-medium text-sm flex items-center">
            {collapsible && (
              <span className="mr-2 text-xs">
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            {title}
          </h3>
        </div>
      )}
      {(!collapsible || isExpanded) && (
        <div className="section-content p-3">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * WindowToolbar - Consistent toolbar styling for windows
 */
const WindowToolbar = ({ children, className = '' }) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className={`window-toolbar flex items-center justify-between px-4 py-2 border-b ${className}`}
      style={{ 
        backgroundColor: `#${theme?.bgColor || 'ECE9D8'}30`,
        borderColor: `#${theme?.borderColor || '69EFD7'}40`
      }}
    >
      {children}
    </div>
  );
};

/**
 * WindowStatusBar - Consistent status bar for windows
 */
const WindowStatusBar = ({ children, className = '' }) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className={`window-status-bar h-5 text-xs px-2 flex items-center border-t ${className}`}
      style={{ 
        backgroundColor: `#${theme?.bgColor || 'ECE9D8'}20`,
        borderColor: `#${theme?.borderColor || '69EFD7'}40`,
        color: `#${theme?.textColor || '000000'}`
      }}
    >
      {children}
    </div>
  );
};

export { WindowContainer, WindowSection, WindowToolbar, WindowStatusBar };