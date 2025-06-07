'use client';

import React from 'react';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { cn } from '@/lib/utils';

/**
 * WindowButton - Unified button component for window interfaces
 * Provides consistent Windows 2000 styling with theme integration
 */
const WindowButton = React.forwardRef(({
  children,
  variant = 'default',
  size = 'default',
  disabled = false,
  className = '',
  onClick,
  ...props
}, ref) => {
  const { theme } = useTheme();
  
  // Helper function to determine contrast text color
  const getContrastText = (hexColor) => {
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '000000' : 'FFFFFF';
  };

  // Base styles that apply to all variants
  const baseStyles = {
    border: '1px solid',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.1s ease',
  };

  // Variant-specific styles
  const variantStyles = {
    default: {
      backgroundColor: `#${theme?.buttonBgColor || 'D4D0C8'}`,
      color: '#000000',
      borderColor: '#888888',
      boxShadow: '2px 2px 0 #FFFFFF inset, -2px -2px 0 #808080 inset',
      ':hover': !disabled && {
        backgroundColor: `#${theme?.buttonBgColor || 'E0DCD4'}`,
      },
      ':active': !disabled && {
        boxShadow: '1px 1px 0 #FFFFFF inset, -1px -1px 0 #808080 inset',
        transform: 'translate(1px, 1px)',
      }
    },
    primary: {
      backgroundColor: `#${theme?.borderColor || '69EFD7'}`,
      color: getContrastText(theme?.borderColor || '69EFD7') === '000000' ? '#000000' : '#FFFFFF',
      borderColor: `#${theme?.borderColor || '69EFD7'}`,
      boxShadow: '1px 1px 0 rgba(0,0,0,0.1)',
      ':hover': !disabled && {
        filter: 'brightness(110%)',
      },
      ':active': !disabled && {
        transform: 'translate(1px, 1px)',
        boxShadow: '0px 0px 0 rgba(0,0,0,0.1)',
      }
    },
    secondary: {
      backgroundColor: `#${theme?.bgColor || 'ECE9D8'}`,
      color: `#${theme?.textColor || '000000'}`,
      borderColor: `#${theme?.borderColor || '69EFD7'}40`,
      boxShadow: '1px 1px 0 rgba(0,0,0,0.05)',
      ':hover': !disabled && {
        backgroundColor: `#${theme?.bgColor || 'ECE9D8'}80`,
      }
    },
    danger: {
      backgroundColor: '#ff6b6b',
      color: '#FFFFFF',
      borderColor: '#e55656',
      boxShadow: '2px 2px 0 #FFFFFF inset, -2px -2px 0 #c44545 inset',
      ':hover': !disabled && {
        backgroundColor: '#ff5252',
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: `#${theme?.textColor || '000000'}`,
      borderColor: 'transparent',
      ':hover': !disabled && {
        backgroundColor: `#${theme?.bgColor || 'ECE9D8'}40`,
        borderColor: `#${theme?.borderColor || '69EFD7'}40`,
      }
    }
  };

  // Size variants
  const sizeStyles = {
    sm: {
      padding: '4px 8px',
      fontSize: '11px',
      minHeight: '20px',
    },
    default: {
      padding: '6px 12px',
      fontSize: '12px',
      minHeight: '24px',
    },
    lg: {
      padding: '8px 16px',
      fontSize: '14px',
      minHeight: '32px',
    }
  };

  // Combine styles
  const buttonStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  // Handle click events
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
        `focus:ring-[#${theme?.borderColor || '69EFD7'}]`,
        className
      )}
      style={buttonStyles}
      onClick={handleClick}
      disabled={disabled}
      onMouseDown={(e) => {
        if (!disabled) {
          // Apply active styles on mouse down
          e.currentTarget.style.boxShadow = variantStyles[variant][':active']?.boxShadow || buttonStyles.boxShadow;
          e.currentTarget.style.transform = variantStyles[variant][':active']?.transform || 'none';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          // Remove active styles on mouse up
          e.currentTarget.style.boxShadow = buttonStyles.boxShadow;
          e.currentTarget.style.transform = 'none';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          // Remove active styles on mouse leave
          e.currentTarget.style.boxShadow = buttonStyles.boxShadow;
          e.currentTarget.style.transform = 'none';
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
});

WindowButton.displayName = 'WindowButton';

/**
 * WindowIconButton - Square button for icons
 */
const WindowIconButton = React.forwardRef(({
  icon,
  title,
  variant = 'default',
  size = 'default',
  ...props
}, ref) => {
  const sizeMap = {
    sm: '20px',
    default: '24px', 
    lg: '32px'
  };

  return (
    <WindowButton
      ref={ref}
      variant={variant}
      size={size}
      title={title}
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      {...props}
    >
      {icon}
    </WindowButton>
  );
});

WindowIconButton.displayName = 'WindowIconButton';

/**
 * WindowButtonGroup - Group related buttons with consistent spacing
 */
const WindowButtonGroup = ({ children, className = '', spacing = 'default' }) => {
  const spacingMap = {
    tight: 'gap-1',
    default: 'gap-2',
    loose: 'gap-3'
  };

  return (
    <div className={cn('flex items-center', spacingMap[spacing], className)}>
      {children}
    </div>
  );
};

export { WindowButton, WindowIconButton, WindowButtonGroup };