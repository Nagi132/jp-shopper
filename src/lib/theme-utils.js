/**
 * Theme utilities for consistent styling across desktop windows
 */

/**
 * Calculate contrast text color based on background color
 * @param {string} hexColor - Hex color without # prefix
 * @returns {string} - Hex color for contrasting text (black or white)
 */
export const getContrastText = (hexColor) => {
  if (!hexColor) return '000000';
  
  // Remove # if present
  const cleanHex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  
  // Calculate luminance using standard formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark
  return luminance > 0.5 ? '000000' : 'FFFFFF';
};

/**
 * Get theme-based styles for window components
 * @param {Object} theme - Theme object from ThemeProvider
 * @param {string} variant - Style variant ('default', 'primary', 'secondary', etc.)
 * @returns {Object} - CSS style object
 */
export const getThemeStyles = (theme, variant = 'default') => {
  const bgColor = theme?.bgColor || 'FED1EB';
  const borderColor = theme?.borderColor || '69EFD7';
  const textColor = theme?.textColor || getContrastText(bgColor);
  
  const baseStyles = {
    backgroundColor: `#${bgColor}`,
    borderColor: `#${borderColor}`,
    color: `#${textColor}`
  };
  
  switch (variant) {
    case 'primary':
      return {
        ...baseStyles,
        backgroundColor: `#${borderColor}`,
        color: `#${getContrastText(borderColor)}`,
        borderColor: `#${borderColor}`
      };
    
    case 'secondary':
      return {
        ...baseStyles,
        backgroundColor: `#${bgColor}80`, // 50% opacity
        borderColor: `#${borderColor}80`
      };
    
    case 'muted':
      return {
        ...baseStyles,
        backgroundColor: `#${bgColor}40`, // 25% opacity
        color: `#${textColor}80`
      };
    
    case 'error':
      return {
        ...baseStyles,
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
        color: '#DC2626'
      };
    
    case 'success':
      return {
        ...baseStyles,
        backgroundColor: '#DCFCE7',
        borderColor: '#22C55E',
        color: '#16A34A'
      };
    
    case 'warning':
      return {
        ...baseStyles,
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
        color: '#D97706'
      };
    
    default:
      return baseStyles;
  }
};

/**
 * Generate loading spinner styles consistent with theme
 * @param {Object} theme - Theme object from ThemeProvider
 * @param {string} size - Size variant ('sm', 'md', 'lg')
 * @returns {Object} - CSS style object for spinner
 */
export const getLoadingSpinnerStyles = (theme, size = 'md') => {
  const borderColor = theme?.borderColor || '69EFD7';
  
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };
  
  return {
    className: `${sizes[size]} animate-spin rounded-full border-2 border-t-transparent`,
    style: {
      borderColor: `#${borderColor}`,
      borderTopColor: 'transparent'
    }
  };
};

/**
 * Generate button styles consistent with theme and Windows 2000 aesthetic
 * @param {Object} theme - Theme object from ThemeProvider
 * @param {string} variant - Button variant
 * @param {boolean} disabled - Whether button is disabled
 * @returns {Object} - CSS style object
 */
export const getButtonStyles = (theme, variant = 'default', disabled = false) => {
  const baseStyles = getThemeStyles(theme, variant);
  
  if (disabled) {
    return {
      ...baseStyles,
      opacity: 0.5,
      cursor: 'not-allowed'
    };
  }
  
  return {
    ...baseStyles,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid',
    boxShadow: '2px 2px 0px rgba(0,0,0,0.1)',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '3px 3px 0px rgba(0,0,0,0.15)'
    },
    '&:active': {
      transform: 'translateY(0px)',
      boxShadow: '1px 1px 0px rgba(0,0,0,0.1)'
    }
  };
};

/**
 * Generate form field styles consistent with theme
 * @param {Object} theme - Theme object from ThemeProvider
 * @param {boolean} error - Whether field has error state
 * @param {boolean} focused - Whether field is focused
 * @returns {Object} - CSS style object
 */
export const getFormFieldStyles = (theme, error = false, focused = false) => {
  const baseStyles = getThemeStyles(theme);
  
  let styles = {
    ...baseStyles,
    border: '2px solid',
    transition: 'all 0.2s ease'
  };
  
  if (error) {
    const errorStyles = getThemeStyles(theme, 'error');
    styles = {
      ...styles,
      borderColor: errorStyles.borderColor,
      boxShadow: `0 0 0 3px ${errorStyles.borderColor}20`
    };
  } else if (focused) {
    styles = {
      ...styles,
      boxShadow: `0 0 0 3px #${theme?.borderColor || '69EFD7'}20`
    };
  }
  
  return styles;
};