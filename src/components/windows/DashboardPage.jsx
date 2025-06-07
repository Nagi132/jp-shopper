'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { useApp } from '@/contexts/AppContext';
import { getThemeStyles, getContrastText } from '@/lib/theme-utils';
import { WindowLoadingState, WindowErrorState, WindowEmptyState } from '@/components/ui/window-states';
import { WindowContainer, WindowSection } from '@/components/ui/window-container';
import { WindowButton } from '@/components/ui/window-button';
import { 
  Plus, Package, Clock, CheckCircle, 
  ShoppingBag, User, RefreshCw, Search, BarChart3, Settings, 
  PanelRight, ChevronRight, Star, DollarSign, Truck, X
} from 'lucide-react';

/**
 * DashboardPage - Windows-styled dashboard component
 * Used in both Window and standalone contexts
 */
const DashboardPage = ({ isWindowView = true }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [requestsData, setRequestsData] = useState({
    customerRequests: [],
    shopperRequests: [],
  });
  const [stats, setStats] = useState({
    open: 0,
    active: 0,
    completed: 0,
    total: 0
  });
  
  const router = useRouter();
  const { theme } = useTheme();
  const { openWindow } = useApp();
  
  // Get theme styles using utility functions
  const themeStyles = getThemeStyles(theme);
  const primaryStyles = getThemeStyles(theme, 'primary');
  const mutedStyles = getThemeStyles(theme, 'muted');
  
  // Legacy theme variables for components that haven't been updated yet
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';

  // Load profile and data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!isWindowView) {
            router.push('/login');
          }
          return;
        }
        
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, shopper_profiles(*)')
          .eq('user_id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        if (profileData) {
          setProfile(profileData);
          
          // Load customer requests (as user)
          const { data: customerRequests } = await supabase
            .from('requests')
            .select('*')
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false });
            
          // If user is a shopper, load shopper requests
          let shopperRequests = [];
          if (profileData.is_shopper && profileData.shopper_profiles?.id) {
            const { data: shopperData } = await supabase
              .from('requests')
              .select('*')
              .eq('shopper_id', profileData.shopper_profiles.id)
              .order('created_at', { ascending: false });
              
            if (shopperData) {
              shopperRequests = shopperData;
            }
          }
          
          // Set requests data
          setRequestsData({
            customerRequests: customerRequests || [],
            shopperRequests: shopperRequests || []
          });
          
          // Calculate stats
          const allRequests = [...(customerRequests || []), ...(shopperRequests || [])];
          
          // Remove duplicates based on id
          const uniqueRequests = Array.from(new Map(allRequests.map(item => [item.id, item])).values());
          
          setStats({
            open: uniqueRequests.filter(req => req.status === 'open').length,
            active: uniqueRequests.filter(req => ['assigned', 'paid', 'purchased', 'shipped'].includes(req.status)).length,
            completed: uniqueRequests.filter(req => req.status === 'completed').length,
            total: uniqueRequests.length
          });
        } else {
          // If no profile exists, set default values
          setProfile({
            user_id: user.id,
            username: '',
            full_name: '',
            is_shopper: false
          });
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [router, isWindowView]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle opening different windows or pages
  const handleNavigation = (destination, component, title) => {
    if (isWindowView) {
      openWindow(destination, component, title);
    } else {
      router.push(`/${destination}`);
    }
  };

  // Handle request click
  const handleRequestClick = (requestId) => {
    if (isWindowView) {
      openWindow(`request-${requestId}`, 'RequestDetailPage', `Request #${requestId}`);
    } else {
      router.push(`/requests/${requestId}`);
    }
  };

  // Format timestamp
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Show loading indicator
  if (loading) {
    return (
      <WindowLoadingState 
        message="Loading your dashboard..."
        size="lg"
      />
    );
  }

  // Show error
  if (error) {
    return (
      <WindowErrorState
        title="Error Loading Dashboard"
        message={error}
        onRetry={handleRefresh}
      />
    );
  }

  // If no profile data
  if (!profile) {
    return (
      <WindowEmptyState
        icon={User}
        title="Complete Your Profile"
        message="Please complete your profile to access your dashboard and start using JP Shopper."
        actionLabel="Set Up Profile"
        onAction={() => handleNavigation('profile', 'ProfilePage', 'My Profile')}
      />
    );
  }

  return (
    <WindowContainer>
      {/* Header */}
      <div 
        className="py-3 px-4 flex items-center justify-between border-b"
        style={mutedStyles}
      >
        <div className="flex items-center">
          <h2 className="text-lg font-semibold" style={{ color: themeStyles.color }}>
            Welcome, {profile.full_name || profile.username || 'User'}!
          </h2>
        </div>
        
        <WindowButton
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </WindowButton>
      </div>
      
      {/* Content area with scroll */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard 
            title="Open Requests" 
            value={stats.open}
            icon={<Clock className="w-5 h-5" />}
            color={borderColor}
            bgColor={bgColor}
          />
          <StatCard 
            title="Active Requests" 
            value={stats.active}
            icon={<Package className="w-5 h-5" />}
            color={borderColor}
            bgColor={bgColor}
          />
          <StatCard 
            title="Completed" 
            value={stats.completed}
            icon={<CheckCircle className="w-5 h-5" />}
            color={borderColor}
            bgColor={bgColor}
          />
          <StatCard 
            title="Total Requests" 
            value={stats.total}
            icon={<ShoppingBag className="w-5 h-5" />}
            color={borderColor}
            bgColor={bgColor}
          />
        </div>
        
        {/* Quick Actions and Shopper Status */}
        <div className="grid grid-cols-2 gap-6">
          {/* Quick Actions Card */}
          <div 
            className="border rounded-sm"
            style={{ borderColor: `#${borderColor}40` }}
          >
            <div 
              className="px-4 py-2 border-b flex items-center"
              style={{ 
                backgroundColor: `#${bgColor}30`,
                borderColor: `#${borderColor}40` 
              }}
            >
              <h3 className="text-base font-medium">Quick Actions</h3>
            </div>
            <div className="p-4 space-y-2">
              <QuickActionButton 
                icon={<Plus className="w-4 h-4" />}
                label="Create New Request"
                onClick={() => handleNavigation('requests/new', 'NewRequestPage', 'Create New Request')}
                color={borderColor}
                textColor={getContrastText(borderColor)}
              />
              
              <QuickActionButton 
                icon={<Search className="w-4 h-4" />}
                label={profile.is_shopper ? "Browse Available Requests" : "Browse Shoppers"}
                onClick={() => handleNavigation(profile.is_shopper ? 'shoppers/browse' : 'shoppers', 'ExplorePage', profile.is_shopper ? 'Available Requests' : 'Browse Shoppers')}
                color={borderColor}
                textColor={getContrastText(borderColor)}
                outlined={true}
              />
              
              {profile.is_shopper && (
                <QuickActionButton 
                  icon={<BarChart3 className="w-4 h-4" />}
                  label="View Earnings"
                  onClick={() => handleNavigation('shoppers/earnings', 'EarningsPage', 'My Earnings')}
                  color={borderColor}
                  textColor={getContrastText(borderColor)}
                  outlined={true}
                />
              )}
            </div>
          </div>
          
          {/* Shopper Status Card (if user is a shopper) */}
          {profile.is_shopper && profile.shopper_profiles && (
            <div 
              className="border rounded-sm"
              style={{ borderColor: `#${borderColor}40` }}
            >
              <div 
                className="px-4 py-2 border-b flex items-center"
                style={{ 
                  backgroundColor: `#${bgColor}30`,
                  borderColor: `#${borderColor}40` 
                }}
              >
                <h3 className="text-base font-medium">Shopper Status</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Verification</span>
                  <span 
                    className="text-sm px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `#${borderColor}30`,
                      color: `#${borderColor}`
                    }}
                  >
                    {profile.shopper_profiles.verification_level || 'Pending'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Location</span>
                  <span className="text-sm">
                    {profile.shopper_profiles.location || 'Not specified'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Rating</span>
                  <span className="flex items-center text-sm">
                    {profile.shopper_profiles.rating ? (
                      <>
                        {profile.shopper_profiles.rating}
                        <Star className="w-3 h-3 ml-1 text-yellow-500" />
                      </>
                    ) : (
                      'No ratings yet'
                    )}
                  </span>
                </div>
                
                <div className="pt-2 mt-2 border-t" style={{ borderColor: `#${borderColor}40` }}>
                  <QuickActionButton 
                    icon={<Settings className="w-4 h-4" />}
                    label="Edit Profile"
                    onClick={() => handleNavigation('profile', 'ProfilePage', 'My Profile')}
                    color={borderColor}
                    textColor={getContrastText(borderColor)}
                    outlined={true}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Alternate card if not a shopper */}
          {!profile.is_shopper && (
            <div 
              className="border rounded-sm"
              style={{ borderColor: `#${borderColor}40` }}
            >
              <div 
                className="px-4 py-2 border-b flex items-center"
                style={{ 
                  backgroundColor: `#${bgColor}30`,
                  borderColor: `#${borderColor}40` 
                }}
              >
                <h3 className="text-base font-medium">Become a Shopper</h3>
              </div>
              <div className="p-4">
                <p className="text-sm mb-4">
                  Enable shopper mode to earn money by helping others find items in Japan!
                </p>
                <QuickActionButton 
                  icon={<User className="w-4 h-4" />}
                  label="Enable Shopper Mode"
                  onClick={() => handleNavigation('profile', 'ProfilePage', 'My Profile')}
                  color={borderColor}
                  textColor={getContrastText(borderColor)}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Recent/Active Requests */}
        <div 
          className="border rounded-sm"
          style={{ borderColor: `#${borderColor}40` }}
        >
          <div 
            className="px-4 py-2 border-b flex items-center justify-between"
            style={{ 
              backgroundColor: `#${bgColor}30`,
              borderColor: `#${borderColor}40` 
            }}
          >
            <h3 className="text-base font-medium">Recent Requests</h3>
            <button
              className="flex items-center text-sm"
              style={{ color: `#${borderColor}` }}
              onClick={() => handleNavigation('requests', 'RequestsPage', 'My Requests')}
            >
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="divide-y" style={{ borderColor: `#${borderColor}30` }}>
            {requestsData.customerRequests.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm opacity-70 mb-4">You haven't created any requests yet</p>
                <QuickActionButton 
                  icon={<Plus className="w-4 h-4" />}
                  label="Create Your First Request"
                  onClick={() => handleNavigation('requests/new', 'NewRequestPage', 'Create New Request')}
                  color={borderColor}
                  textColor={getContrastText(borderColor)}
                  small={true}
                />
              </div>
            ) : (
              requestsData.customerRequests.slice(0, 5).map((request) => (
                <div 
                  key={request.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-start"
                  onClick={() => handleRequestClick(request.id)}
                >
                  <div>
                    <h4 className="font-medium">{request.title || 'Untitled Request'}</h4>
                    <p className="text-sm text-gray-600 line-clamp-1 mt-0.5">
                      {request.description || 'No description provided'}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      Created: {formatDate(request.created_at)}
                    </div>
                  </div>
                  <div>
                    <span 
                      className="px-2 py-0.5 text-xs rounded-full capitalize inline-flex items-center"
                      style={{ 
                        backgroundColor: getStatusBgColor(request.status),
                        color: '#FFFFFF'
                      }}
                    >
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{request.status}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Active Shopper Jobs (if user is a shopper) */}
        {profile.is_shopper && requestsData.shopperRequests.length > 0 && (
          <div 
            className="border rounded-sm"
            style={{ borderColor: `#${borderColor}40` }}
          >
            <div 
              className="px-4 py-2 border-b flex items-center justify-between"
              style={{ 
                backgroundColor: `#${bgColor}30`,
                borderColor: `#${borderColor}40` 
              }}
            >
              <h3 className="text-base font-medium">Your Active Jobs</h3>
              <button
                className="flex items-center text-sm"
                style={{ color: `#${borderColor}` }}
                onClick={() => handleNavigation('shoppers/jobs', 'ShopperJobsPage', 'My Jobs')}
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="divide-y" style={{ borderColor: `#${borderColor}30` }}>
              {requestsData.shopperRequests
                .filter(req => ['assigned', 'paid', 'purchased', 'shipped'].includes(req.status))
                .slice(0, 3)
                .map((request) => (
                  <div 
                    key={request.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-start"
                    onClick={() => handleRequestClick(request.id)}
                  >
                    <div>
                      <h4 className="font-medium">{request.title || 'Untitled Request'}</h4>
                      <p className="text-sm text-gray-600 line-clamp-1 mt-0.5">
                        {request.description || 'No description provided'}
                      </p>
                      <div className="text-xs mt-1">
                        Budget: {request.budget ? `¥${request.budget.toLocaleString()}` : 'Flexible'}
                      </div>
                    </div>
                    <div>
                      <span 
                        className="px-2 py-0.5 text-xs rounded-full capitalize inline-flex items-center"
                        style={{ 
                          backgroundColor: getStatusBgColor(request.status),
                          color: '#FFFFFF'
                        }}
                      >
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </span>
                    </div>
                  </div>
                ))
              }
              
              {requestsData.shopperRequests.filter(req => 
                ['assigned', 'paid', 'purchased', 'shipped'].includes(req.status)
              ).length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-sm opacity-70 mb-4">You don't have any active jobs</p>
                  <QuickActionButton 
                    icon={<Search className="w-4 h-4" />}
                    label="Browse Available Requests"
                    onClick={() => handleNavigation('shoppers/browse', 'ExplorePage', 'Available Requests')}
                    color={borderColor}
                    textColor={getContrastText(borderColor)}
                    small={true}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div 
        className="h-5 text-xs px-2 flex items-center justify-between"
        style={{ 
          backgroundColor: `#${bgColor}20`,
          borderTop: `1px solid #${borderColor}40`
        }}
      >
        <span>
          {profile.is_shopper ? 'Shopper Mode Enabled' : 'Customer Mode'}
        </span>
        <span>
          {refreshing ? 'Refreshing...' : `Last updated: ${new Date().toLocaleTimeString()}`}
        </span>
      </div>
    </WindowContainer>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, bgColor }) => {
  return (
    <div 
      className="border rounded-sm p-4 flex flex-col"
      style={{ 
        borderColor: `#${color}40`,
        backgroundColor: `#${bgColor}20` 
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{title}</span>
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: `#${color}30`,
            color: `#${color}`
          }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ 
  icon, 
  label, 
  onClick, 
  color, 
  textColor,
  outlined = false,
  small = false
}) => {
  return (
    <button
      className={`flex items-center justify-center w-full ${small ? 'px-3 py-1' : 'px-3 py-2'} rounded-sm text-sm`}
      style={{ 
        backgroundColor: outlined ? 'transparent' : `#${color}`,
        color: outlined ? `#${color}` : (textColor === '000000' ? '#000000' : '#FFFFFF'),
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `#${color}${outlined ? '' : '40'}`,
        boxShadow: outlined ? 'none' : '1px 1px 0 rgba(0,0,0,0.1)'
      }}
      onClick={onClick}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );
};

// Get status color
const getStatusBgColor = (status) => {
  switch (status) {
    case 'open': return '#22C55E';
    case 'assigned': return '#3B82F6';
    case 'paid': return '#8B5CF6';
    case 'purchased': return '#F59E0B';
    case 'shipped': return '#6366F1';
    case 'completed': return '#10B981';
    case 'cancelled': return '#EF4444';
    default: return '#6B7280';
  }
};

// Get status icon
const getStatusIcon = (status) => {
  switch (status) {
    case 'open': return <Clock className="w-3 h-3" />;
    case 'assigned': return <User className="w-3 h-3" />;
    case 'paid': return <DollarSign className="w-3 h-3" />;
    case 'purchased': return <ShoppingBag className="w-3 h-3" />;
    case 'shipped': return <Truck className="w-3 h-3" />;
    case 'completed': return <CheckCircle className="w-3 h-3" />;
    case 'cancelled': return <X className="w-3 h-3" />;
    default: return null;
  }
};

export default DashboardPage;