import React from 'react';
import { Loader2, AlertCircle, RefreshCw, Package, Search, Frown } from 'lucide-react';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { getThemeStyles, getLoadingSpinnerStyles } from '@/lib/theme-utils';
import { WindowButton } from './window-button';

/**
 * Unified loading state component for desktop windows
 */
export const WindowLoadingState = ({ 
  message = 'Loading...', 
  size = 'md',
  showSkip = false,
  onSkip = null,
  className = ''
}) => {
  const { theme } = useTheme();
  const spinnerStyles = getLoadingSpinnerStyles(theme, size);
  const textStyles = getThemeStyles(theme);
  
  return (
    <div className={`flex flex-col items-center justify-center h-full min-h-[200px] space-y-4 ${className}`}>
      <div 
        className={spinnerStyles.className}
        style={spinnerStyles.style}
      />
      <p className="text-sm font-medium" style={{ color: textStyles.color }}>
        {message}
      </p>
      {showSkip && onSkip && (
        <WindowButton 
          variant="secondary" 
          size="sm"
          onClick={onSkip}
          className="mt-2"
        >
          Skip Loading
        </WindowButton>
      )}
    </div>
  );
};

/**
 * Unified error state component for desktop windows
 */
export const WindowErrorState = ({ 
  title = 'Something went wrong', 
  message = 'An unexpected error occurred. Please try again.',
  error = null,
  onRetry = null,
  onBack = null,
  showDetails = false,
  className = ''
}) => {
  const { theme } = useTheme();
  const errorStyles = getThemeStyles(theme, 'error');
  const textStyles = getThemeStyles(theme);
  
  return (
    <div className={`flex flex-col items-center justify-center h-full min-h-[200px] space-y-4 p-6 ${className}`}>
      <div 
        className="p-4 rounded-full"
        style={{ backgroundColor: errorStyles.backgroundColor }}
      >
        <AlertCircle 
          className="w-8 h-8" 
          style={{ color: errorStyles.color }}
        />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold" style={{ color: textStyles.color }}>
          {title}
        </h3>
        <p className="text-sm opacity-80 max-w-md" style={{ color: textStyles.color }}>
          {message}
        </p>
      </div>
      
      {showDetails && error && (
        <details className="mt-4 max-w-md">
          <summary className="text-xs cursor-pointer opacity-60" style={{ color: textStyles.color }}>
            Show technical details
          </summary>
          <pre className="mt-2 p-2 text-xs bg-gray-100 rounded border overflow-auto max-h-32">
            {error.toString()}
          </pre>
        </details>
      )}
      
      <div className="flex gap-2 mt-4">
        {onRetry && (
          <WindowButton variant="primary" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </WindowButton>
        )}
        {onBack && (
          <WindowButton variant="secondary" onClick={onBack}>
            Go Back
          </WindowButton>
        )}
      </div>
    </div>
  );
};

/**
 * Empty state component for when there's no data to display
 */
export const WindowEmptyState = ({ 
  icon: Icon = Package,
  title = 'Nothing here yet', 
  message = 'Get started by creating your first item.',
  actionLabel = 'Get Started',
  onAction = null,
  className = ''
}) => {
  const { theme } = useTheme();
  const textStyles = getThemeStyles(theme);
  const mutedStyles = getThemeStyles(theme, 'muted');
  
  return (
    <div className={`flex flex-col items-center justify-center h-full min-h-[300px] space-y-4 p-6 ${className}`}>
      <div 
        className="p-6 rounded-full"
        style={{ backgroundColor: mutedStyles.backgroundColor }}
      >
        <Icon 
          className="w-12 h-12" 
          style={{ color: `#${theme?.borderColor || '69EFD7'}` }}
        />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold" style={{ color: textStyles.color }}>
          {title}
        </h3>
        <p className="text-sm opacity-80 max-w-md" style={{ color: textStyles.color }}>
          {message}
        </p>
      </div>
      
      {onAction && actionLabel && (
        <WindowButton variant="primary" onClick={onAction} className="mt-4">
          {actionLabel}
        </WindowButton>
      )}
    </div>
  );
};

/**
 * Search empty state component
 */
export const WindowSearchEmptyState = ({ 
  searchQuery = '',
  onClearSearch = null,
  className = ''
}) => {
  const { theme } = useTheme();
  
  return (
    <WindowEmptyState
      icon={Search}
      title={searchQuery ? 'No results found' : 'Start searching'}
      message={
        searchQuery 
          ? `No items found for "${searchQuery}". Try different keywords or filters.`
          : 'Enter a search term to find what you\'re looking for.'
      }
      actionLabel={searchQuery ? 'Clear Search' : null}
      onAction={searchQuery ? onClearSearch : null}
      className={className}
    />
  );
};

/**
 * Network error state component
 */
export const WindowNetworkErrorState = ({ 
  onRetry = null,
  className = ''
}) => {
  return (
    <WindowErrorState
      title="Connection Problem"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      className={className}
    />
  );
};

/**
 * Permission error state component
 */
export const WindowPermissionErrorState = ({ 
  onBack = null,
  className = ''
}) => {
  return (
    <WindowErrorState
      icon={Frown}
      title="Access Denied"
      message="You don't have permission to view this content. Please contact support if you believe this is an error."
      onBack={onBack}
      className={className}
    />
  );
};