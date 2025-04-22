'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { useApp } from '@/contexts/AppContext';
import { 
  Loader2, AlertCircle, Search, RefreshCw, Filter, MapPin, Star,
  ArrowUpDown, ShoppingBag, Check, ChevronDown, Eye, User
} from 'lucide-react';

/**
 * ShoppersBrowsePage - Windows-styled component for browsing available requests
 * Used in both Window and standalone contexts
 */
const ShoppersBrowsePage = ({ isWindowView = true }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState('desc');
  const [acceptingRequest, setAcceptingRequest] = useState(null);
  
  const router = useRouter();
  const { theme } = useTheme();
  const { openWindow } = useApp();
  
  // Get theme colors
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
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

  // Load requests
  useEffect(() => {
    const fetchRequests = async () => {
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
        
        setUser(user);
        
        // Check if the user is a shopper
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_shopper, shopper_profiles(id)')
          .eq('user_id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        setProfile(profile);
        
        if (!profile.is_shopper) {
          throw new Error('You must be a shopper to browse available requests');
        }
        
        // Fetch all open requests
        const { data, error } = await supabase
          .from('requests')
          .select('*, profiles(username, full_name)')
          .eq('status', 'open')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Filter out user's own requests
        const filteredData = data.filter(request => request.customer_id !== user.id);
        
        setRequests(filteredData || []);
        setFilteredRequests(filteredData || []);
        
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError(err.message || 'Failed to load requests');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [router, isWindowView]);

  // Handle filter, search and sort changes
  useEffect(() => {
    if (!requests) return;
    
    let result = [...requests];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(request => 
        request.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        request.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter if needed
    if (filter !== 'all') {
      // This is a placeholder for category filtering
      // In a real app, you'd filter by request categories
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => 
          sortDirection === 'desc' 
            ? new Date(b.created_at) - new Date(a.created_at)
            : new Date(a.created_at) - new Date(b.created_at)
        );
        break;
      case 'budget':
        result.sort((a, b) => {
          const budgetA = a.budget || 0;
          const budgetB = b.budget || 0;
          return sortDirection === 'desc' ? budgetB - budgetA : budgetA - budgetB;
        });
        break;
      default:
        // Default to newest
        result.sort((a, b) => 
          sortDirection === 'desc' 
            ? new Date(b.created_at) - new Date(a.created_at)
            : new Date(a.created_at) - new Date(b.created_at)
        );
    }
    
    setFilteredRequests(result);
  }, [requests, searchTerm, filter, sortBy, sortDirection]);

  // Handle accepting a request
  const handleAcceptRequest = async (requestId) => {
    if (!user || !profile?.shopper_profiles?.id) return;
    
    setAcceptingRequest(requestId);
    
    try {
      // Get shopper profile id
      const shopperProfileId = profile.shopper_profiles.id;
      
      // Update the request to assign it to this shopper
      const { error } = await supabase
        .from('requests')
        .update({ 
          shopper_id: shopperProfileId,
          status: 'assigned'
        })
        .eq('id', requestId);
        
      if (error) throw error;
      
      // Navigate to the request detail page
      if (isWindowView) {
        openWindow(`request-${requestId}`, 'RequestDetailPage', `Request #${requestId}`);
      } else {
        router.push(`/requests/${requestId}`);
      }
      
    } catch (err) {
      console.error('Error accepting request:', err);
      alert('Failed to accept request. Please try again.');
    } finally {
      setAcceptingRequest(null);
    }
  };

  // Handle viewing request details
  const handleViewRequest = (requestId) => {
    if (isWindowView) {
      openWindow(`request-${requestId}`, 'RequestDetailPage', `Request #${requestId}`);
    } else {
      router.push(`/requests/${requestId}`);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Fetch all open requests
      const { data, error } = await supabase
        .from('requests')
        .select('*, profiles(username, full_name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Filter out user's own requests
      const filteredData = data.filter(request => request.customer_id !== user.id);
      
      setRequests(filteredData || []);
      // Don't need to set filteredRequests as the useEffect will handle that
      
    } catch (err) {
      console.error('Error refreshing requests:', err);
      alert('Failed to refresh requests. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Toggle sort order
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Show loading indicator
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div 
          className="w-10 h-10 rounded-full animate-spin mb-3"
          style={{ 
            borderTopWidth: '3px',
            borderRightWidth: '3px',
            borderStyle: 'solid',
            borderColor: `#${borderColor}` 
          }}
        ></div>
        <span className="ml-2">Loading available requests...</span>
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div className="h-full p-4 flex flex-col items-center justify-center">
        <div 
          className="p-4 rounded-sm max-w-md border-l-4 border-red-500"
          style={{ backgroundColor: '#FEF2F2' }}
        >
          <div className="flex">
            <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
            <div>
              <h3 className="text-red-800 font-semibold">Error Loading Requests</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                className="mt-3 px-3 py-1 text-sm rounded-sm"
                style={{ 
                  backgroundColor: `#${borderColor}`,
                  color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF' 
                }}
                onClick={() => router.push('/dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div 
        className="py-2 px-4 flex items-center justify-between border-b"
        style={{ 
          backgroundColor: `#${bgColor}30`, 
          borderColor: `#${borderColor}40` 
        }}
      >
        <div className="flex items-center">
          <ShoppingBag className="w-5 h-5 mr-2" style={{ color: `#${borderColor}` }} />
          <h2 className="text-lg font-medium">Available Requests</h2>
        </div>
        
        <button
          className="flex items-center px-2 py-1 text-sm rounded-sm"
          style={{ 
            backgroundColor: `#${borderColor}20`,
            color: `#${borderColor}`,
            border: `1px solid #${borderColor}40`
          }}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {/* Filters bar */}
      <div 
        className="py-2 px-4 flex flex-wrap justify-between items-center border-b"
        style={{ 
          backgroundColor: `#${bgColor}10`, 
          borderColor: `#${borderColor}30` 
        }}
      >
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-sm"
            style={{ borderColor: `#${borderColor}40` }}
          />
        </div>
        
        {/* Filter and Sort */}
        <div className="flex items-center mt-2 sm:mt-0">
          {/* Filter button */}
          <div className="relative mr-2">
            <button
              className="flex items-center px-2 py-1.5 text-sm border rounded-sm"
              style={{ borderColor: `#${borderColor}40` }}
              onClick={() => {}}
            >
              <Filter className="w-4 h-4 mr-1" />
              <span>All Categories</span>
            </button>
          </div>
          
          {/* Sort dropdown */}
          <div className="relative">
            <button
              className="flex items-center px-2 py-1.5 text-sm border rounded-sm"
              style={{ borderColor: `#${borderColor}40` }}
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              <span>
                {sortBy === 'newest' ? 'Newest' : 
                 sortBy === 'budget' ? 'Budget' : 'Sort by'}
              </span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            
            {sortDropdownOpen && (
              <div 
                className="absolute right-0 mt-1 w-40 border rounded-sm shadow-md z-10"
                style={{ 
                  backgroundColor: 'white',
                  borderColor: `#${borderColor}40`
                }}
              >
                <button
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    setSortBy('newest');
                    setSortDropdownOpen(false);
                  }}
                >
                  {sortBy === 'newest' && <Check className="w-3 h-3 mr-1" />}
                  <span className={sortBy === 'newest' ? 'ml-4' : ''}>Newest First</span>
                </button>
                <button
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    setSortBy('budget');
                    setSortDropdownOpen(false);
                  }}
                >
                  {sortBy === 'budget' && <Check className="w-3 h-3 mr-1" />}
                  <span className={sortBy === 'budget' ? 'ml-4' : ''}>Budget</span>
                </button>
                <div 
                  className="mx-3 my-1 border-t"
                  style={{ borderColor: `#${borderColor}30` }}
                ></div>
                <button
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    toggleSortDirection();
                    setSortDropdownOpen(false);
                  }}
                >
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  {sortDirection === 'desc' ? 'Descending' : 'Ascending'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content area with requests */}
      <div className="flex-1 overflow-auto">
        {filteredRequests.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="w-16 h-16 mb-3 opacity-20" />
            <h3 className="text-lg font-medium mb-1">No requests available</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm 
                ? 'No requests match your search criteria' 
                : 'There are no open requests at the moment'}
            </p>
            {searchTerm && (
              <button
                className="px-3 py-1.5 text-sm rounded-sm"
                style={{ 
                  backgroundColor: `#${borderColor}`,
                  color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF' 
                }}
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((request) => (
              <div 
                key={request.id}
                className="border rounded-sm overflow-hidden"
                style={{ borderColor: `#${borderColor}40` }}
              >
                {/* Request header */}
                <div 
                  className="p-3 border-b"
                  style={{ 
                    backgroundColor: `#${bgColor}20`,
                    borderColor: `#${borderColor}30` 
                  }}
                >
                  <h3 className="font-medium truncate">{request.title}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center text-xs text-gray-500">
                      <User className="w-3 h-3 mr-1" />
                      <span>
                        {request.profiles?.full_name || request.profiles?.username || 'Anonymous'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(request.created_at)}
                    </span>
                  </div>
                </div>
                
                {/* Request body */}
                <div className="p-3">
                  <p className="text-sm line-clamp-3 mb-3 h-12">
                    {request.description || 'No description provided'}
                  </p>
                  
                  {/* Budget */}
                  <div 
                    className="py-1 px-2 text-sm rounded mb-3 inline-flex items-center"
                    style={{ 
                      backgroundColor: `#${borderColor}20`,
                      color: `#${borderColor}`
                    }}
                  >
                    Budget: {request.budget ? `¥${request.budget.toLocaleString()}` : 'Flexible'}
                  </div>
                  
                  {/* Images preview */}
                  {request.images && request.images.length > 0 && (
                    <div className="flex space-x-1 mb-3 overflow-x-auto pb-1">
                      {request.images.slice(0, 3).map((url, index) => (
                        <div 
                          key={index}
                          className="w-16 h-16 rounded-sm overflow-hidden flex-shrink-0 border"
                          style={{ borderColor: `#${borderColor}30` }}
                        >
                          <img
                            src={url}
                            alt={`Reference ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {request.images.length > 3 && (
                        <div 
                          className="w-16 h-16 flex items-center justify-center text-sm rounded-sm"
                          style={{ 
                            backgroundColor: `#${bgColor}30`,
                            border: `1px solid #${borderColor}30`
                          }}
                        >
                          +{request.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      className="flex-1 flex items-center justify-center py-1.5 text-sm rounded-sm"
                      style={{ 
                        backgroundColor: 'transparent',
                        color: `#${borderColor}`,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: `#${borderColor}40`
                      }}
                      onClick={() => handleViewRequest(request.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </button>
                    
                    <button
                      className="flex-1 flex items-center justify-center py-1.5 text-sm rounded-sm"
                      style={{ 
                        backgroundColor: `#${borderColor}`,
                        color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: `#${borderColor}`
                      }}
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={acceptingRequest === request.id}
                    >
                      {acceptingRequest === request.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
          {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} available
        </span>
        <span>
          {refreshing ? 'Refreshing...' : `Last updated: ${new Date().toLocaleTimeString()}`}
        </span>
      </div>
    </div>
  );
};

export default ShoppersBrowsePage;