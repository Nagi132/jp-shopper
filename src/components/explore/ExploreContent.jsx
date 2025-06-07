'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Search, RefreshCw, ChevronDown, Grid, List } from 'lucide-react';
import MasonryGrid from '@/components/explore/MasonryGrid';
import { useTheme } from '@/components/layouts/ThemeProvider';

/**
 * ExploreContent - Shared component that works in both standalone page and window contexts
 * Handles data fetching, filtering, searching, and rendering of explore items
 */
const ExploreContent = ({ 
  className = '',
  compact = false, // Used for window mode which has less space
  onItemClick = null // Optional callback for item clicks
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortOption, setSortOption] = useState('relevant');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const { theme } = useTheme();
  const router = useRouter();

  // Fetch items from Supabase
  const fetchItems = async () => {
    try {
      setLoading(true);
      
      // Fetch both listings and requests to display as items
      const [listingsResponse, requestsResponse] = await Promise.all([
        // Fetch listings (products)
        supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30),
          
        // Fetch requests
        supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      // Check for errors
      if (listingsResponse.error) throw listingsResponse.error;
      if (requestsResponse.error) throw requestsResponse.error;
      
      // Combine the results
      const listingsData = listingsResponse.data || [];
      const requestsData = requestsResponse.data || [];
      
      // Tag each item with its type for filtering
      const combinedItems = [
        ...listingsData.map(item => ({ ...item, item_type: 'listing' })),
        ...requestsData.map(item => ({ ...item, item_type: 'request' }))
      ];
      
      // Sort combined items by creation date
      combinedItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      console.log('Fetched data:', { listings: listingsData.length, requests: requestsData.length });
      setItems(combinedItems);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchItems();
  }, []);

  // Filter items based on tabs, search query, and sort option
  const filteredAndSortedItems = useMemo(() => {
    // First, filter items based on active tab and search query
    let filtered = items.filter(item => {
      // Apply tab filter
      let tabMatch = true;
      
      if (activeTab === 'available') {
        if (item.item_type === 'listing') {
          tabMatch = !item.is_sold;
        } else { // request
          tabMatch = item.status === 'open' && item.shopper_id === null;
        }
      } else if (activeTab === 'sold') {
        if (item.item_type === 'listing') {
          tabMatch = item.is_sold === true;
        } else { // request
          tabMatch = item.status === 'completed';
        }
      } else if (activeTab === 'requested') {
        if (item.item_type === 'listing') {
          tabMatch = false; // Listings don't have a "requested" state
        } else { // request
          tabMatch = item.status === 'open' && item.shopper_id !== null;
        }
      }
      
      // Apply search filter
      const searchMatch = !searchQuery || 
        (item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         item.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return tabMatch && searchMatch;
    });
    
    // Then, sort the filtered items
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'lowToHigh':
          const aPrice = a.item_type === 'listing' ? (a.price || 0) : (a.budget || 0);
          const bPrice = b.item_type === 'listing' ? (b.price || 0) : (b.budget || 0);
          return aPrice - bPrice;
        case 'highToLow':
          const aPriceDesc = a.item_type === 'listing' ? (a.price || 0) : (a.budget || 0);
          const bPriceDesc = b.item_type === 'listing' ? (b.price || 0) : (b.budget || 0);
          return bPriceDesc - aPriceDesc;
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        default: // 'relevant' - could implement more sophisticated relevance later
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });
  }, [items, activeTab, searchQuery, sortOption]);

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchItems();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Toggle sort dropdown
  const toggleSortDropdown = () => {
    setSortDropdownOpen(!sortDropdownOpen);
  };

  // Handle item click
  const handleItemClick = (item) => {
    console.log('Item clicked:', {
      id: item.id,
      title: item.title,
      item_type: item.item_type,
      hasPhotos: item.photos && item.photos.length > 0,
      photoCount: item.photos ? item.photos.length : 0
    });
    
    if (onItemClick) {
      // Use callback if provided (window mode)
      console.log('Using callback for item click (window mode)');
      onItemClick(item);
    } else {
      // Navigate directly (standalone page mode)
      if (item.item_type === 'listing') {
        const itemUrl = `/item/${item.id}`;
        console.log(`Navigating to listing: ${itemUrl}`);
        
        // Force using regular full-page navigation instead of client-side
        window.location.href = itemUrl;
      } else {
        const requestUrl = `/requests/${item.id}`;
        console.log(`Navigating to request: ${requestUrl}`);
        router.push(requestUrl);
      }
    }
  };
  
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

  const textColor = theme?.textColor || getContrastText(theme.bgColor);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tab Navigation and Search Bar - Styled with theme colors */}
      <div 
        className={`sticky top-0 z-10 rounded-t-lg border-2 border-b-0 shadow-sm mb-0 ${compact ? 'px-2 py-1' : ''}`}
        style={{
          backgroundColor: `#${theme.bgColor}`,
          borderColor: `#${theme.borderColor}`,
          color: `#${textColor}`
        }}
      >
        {/* Tabs */}
        <div className="flex px-4 gap-1 border-b" style={{ borderColor: `#${theme.borderColor}40` }}>
          <TabButton 
            active={activeTab === 'all'} 
            onClick={() => setActiveTab('all')}
            borderColor={theme.borderColor}
            textColor={textColor}
            compact={compact}
          >
            ALL
          </TabButton>
          <TabButton 
            active={activeTab === 'available'} 
            onClick={() => setActiveTab('available')}
            borderColor={theme.borderColor}
            textColor={textColor}
            compact={compact}
          >
            AVAILABLE
          </TabButton>
          <TabButton 
            active={activeTab === 'sold'} 
            onClick={() => setActiveTab('sold')}
            borderColor={theme.borderColor}
            textColor={textColor}
            compact={compact}
          >
            SOLD
          </TabButton>
          <TabButton 
            active={activeTab === 'requested'} 
            onClick={() => setActiveTab('requested')}
            borderColor={theme.borderColor}
            textColor={textColor}
            compact={compact}
          >
            REQUESTED
          </TabButton>
        </div>
        
        {/* Search & Sort Row */}
        <div className={`flex items-center px-4 ${compact ? 'py-1' : 'py-2'} gap-2`}>
          {/* Search Box */}
          <div className="relative flex-grow max-w-md">
            <Search 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4" 
              style={{ color: `#${textColor}80` }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 px-2 py-1 border text-sm rounded-sm ${compact ? 'h-7' : ''}`}
              style={{ 
                borderColor: `#${theme.borderColor}`,
                backgroundColor: `#FFFFFF80`,
                color: `#${textColor}`,
              }}
            />
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex border rounded-sm overflow-hidden" style={{ borderColor: `#${theme.borderColor}40` }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`${compact ? 'h-7 w-7' : 'h-8 w-8'} flex items-center justify-center`}
              style={{ 
                backgroundColor: viewMode === 'grid' ? `#${theme.borderColor}30` : 'transparent',
                borderRight: `1px solid #${theme.borderColor}40`
              }}
            >
              <Grid className="h-3 w-3" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`${compact ? 'h-7 w-7' : 'h-8 w-8'} flex items-center justify-center`}
              style={{ 
                backgroundColor: viewMode === 'list' ? `#${theme.borderColor}30` : 'transparent',
              }}
            >
              <List className="h-3 w-3" />
            </button>
          </div>
          
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={toggleSortDropdown}
              className={`flex items-center text-sm border px-2 rounded-sm ${compact ? 'py-0 h-7' : 'py-1'}`}
              style={{ 
                borderColor: `#${theme.borderColor}`,
                backgroundColor: `#${theme.bgColor}80`,
                color: `#${textColor}`,
              }}
            >
              <span className="mr-1 text-xs">
                {sortOption === 'relevant' ? 'Relevance' : 
                 sortOption === 'lowToHigh' ? 'Price: Low to High' :
                 sortOption === 'highToLow' ? 'Price: High to Low' :
                 'Newly Listed'}
              </span>
              <ChevronDown className="h-3 w-3" />
            </button>
            
            {sortDropdownOpen && (
              <div 
                className="absolute right-0 mt-1 border shadow-lg z-20 w-48 py-1"
                style={{ 
                  backgroundColor: `#${theme.bgColor}`, 
                  borderColor: `#${theme.borderColor}`,
                  color: `#${textColor}`,
                }}
              >
                <SortOption 
                  selected={sortOption === 'relevant'}
                  onClick={() => {
                    setSortOption('relevant');
                    setSortDropdownOpen(false);
                  }}
                  borderColor={theme.borderColor}
                  bgColor={theme.bgColor}
                  textColor={textColor}
                >
                  Relevance
                </SortOption>
                <SortOption 
                  selected={sortOption === 'lowToHigh'}
                  onClick={() => {
                    setSortOption('lowToHigh');
                    setSortDropdownOpen(false);
                  }}
                  borderColor={theme.borderColor}
                  bgColor={theme.bgColor}
                  textColor={textColor}
                >
                  Price: Low to High
                </SortOption>
                <SortOption 
                  selected={sortOption === 'highToLow'}
                  onClick={() => {
                    setSortOption('highToLow');
                    setSortDropdownOpen(false);
                  }}
                  borderColor={theme.borderColor}
                  bgColor={theme.bgColor}
                  textColor={textColor}
                >
                  Price: High to Low
                </SortOption>
                <SortOption 
                  selected={sortOption === 'newest'}
                  onClick={() => {
                    setSortOption('newest');
                    setSortDropdownOpen(false);
                  }}
                  borderColor={theme.borderColor}
                  bgColor={theme.bgColor}
                  textColor={textColor}
                >
                  Newly Listed
                </SortOption>
              </div>
            )}
          </div>
          
          {/* Refresh Button */}
          <button
            style={{ 
              backgroundColor: `#${theme.borderColor}`,
              color: getContrastText(theme.borderColor) === '000000' ? '#000000' : '#FFFFFF',
              borderColor: `#${theme.borderColor}80`,
            }}
            className={`${compact ? 'h-7 w-7' : 'px-2 h-8'} flex items-center justify-center rounded-sm`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          backgroundColor: `#${theme.bgColor}10`, // Very transparent version of the bg color
          minHeight: '300px',
          borderLeft: `2px solid #${theme.borderColor}`,
          borderRight: `2px solid #${theme.borderColor}`,
          borderBottom: `2px solid #${theme.borderColor}`,
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
          boxShadow: `4px 4px 0 rgba(0,0,0,0.2)`,
        }}
        className="flex-1 overflow-auto"
      >
        {/* Loading State */}
        {loading ? (
          <div 
            className="flex flex-col items-center justify-center h-64"
            style={{ color: `#${theme.borderColor}` }}
          >
            <div 
              className="w-10 h-10 rounded-full animate-spin mb-3"
              style={{ 
                borderTopWidth: '2px',
                borderRightWidth: '2px',
                borderStyle: 'solid',
                borderColor: `#${theme.borderColor}` 
              }}
            ></div>
            <p className="text-sm" style={{ color: `#${textColor}` }}>Loading items...</p>
          </div>
        ) : error ? (
          <div 
            className="p-6 border border-red-200 rounded m-4"
            style={{ 
              backgroundColor: '#FFF0F0',
              color: '#CC0000'
            }}
          >
            <p className="font-bold mb-2">Error loading items</p>
            <p>{error}</p>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="p-6 text-center">
            <p 
              className="mb-2" 
              style={{ color: `#${textColor}` }}
            >
              No items found matching your search
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="px-2 py-1 rounded-sm text-sm"
              style={{ 
                backgroundColor: `#${theme.borderColor}`,
                color: getContrastText(theme.borderColor) === '000000' ? '#000000' : '#FFFFFF',
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <MasonryGrid 
              items={filteredAndSortedItems} 
              theme={theme} 
              onItemClick={handleItemClick}
            />
          ) : (
            <ListView 
              items={filteredAndSortedItems} 
              theme={theme} 
              onItemClick={handleItemClick}
              compact={compact}
            />
          )
        )}
      </div>
      
      {/* Status Bar */}
      <div 
        className={`h-5 mt-1 px-2 text-xs flex items-center ${compact ? 'text-xs' : ''}`}
        style={{ 
          backgroundColor: `#${theme.bgColor}20`,
          borderTop: `1px solid #${theme.borderColor}40`
        }}
      >
        <span>
          {filteredAndSortedItems.length} item{filteredAndSortedItems.length !== 1 ? 's' : ''} • 
          {activeTab === 'all' ? ' All' : 
           activeTab === 'available' ? ' Available' : 
           activeTab === 'sold' ? ' Sold' : 
           ' Requested'}
        </span>
      </div>
    </div>
  );
};

// Tab button component
const TabButton = ({ children, active, onClick, borderColor, textColor, compact = false }) => (
  <button
    className={`${compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} border-b-2 transition-colors`}
    style={{
      borderColor: active ? `#${borderColor}` : 'transparent',
      color: active ? `#${borderColor}` : `#${textColor}80`,
    }}
    onClick={onClick}
  >
    {children}
  </button>
);

// Sort option component
const SortOption = ({ children, selected, onClick, borderColor, bgColor, textColor }) => (
  <button
    className={`block w-full text-left px-4 py-2 text-xs`}
    style={{
      backgroundColor: selected ? `#${borderColor}30` : 'transparent',
      color: selected ? `#${borderColor}` : `#${textColor}`,
      borderBottom: `1px solid #${borderColor}20`,
    }}
    onClick={onClick}
  >
    {children}
  </button>
);

// List view component
const ListView = ({ items, theme, onItemClick, compact = false }) => (
  <div className="w-full border rounded-sm overflow-hidden" style={{ borderColor: `#${theme.borderColor}40` }}>
    {items.map((item, index) => (
      <div 
        key={item.id || index}
        className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
        style={{ 
          borderBottom: index < items.length - 1 ? `1px solid #${theme.borderColor}20` : 'none'
        }}
        onClick={() => onItemClick(item)}
      >
        <div 
          className={`${compact ? 'w-6 h-6 mr-2' : 'w-8 h-8 mr-3'} rounded-sm bg-cover bg-center`}
          style={{ 
            backgroundImage: item.images?.length > 0 ? 
              `url(${item.images[0]})` : 
              `url(https://placehold.jp/80/${theme.borderColor}/ffffff/80x80.png?text=${encodeURIComponent(item.title?.substring(0, 2) || 'Item')})`,
            backgroundColor: `#${theme.borderColor}30`
          }}
        />
        <div className="flex-1">
          <div className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>{item.title || 'Untitled Item'}</div>
          <div className={`${compact ? 'text-xs opacity-70' : 'text-xs opacity-70'}`}>
            {item.status === 'open' ? 'Available' : 
             item.status === 'completed' ? 'Sold' : 'Requested'}
            {item.budget ? ` • ¥${item.budget.toLocaleString()}` : ''}
          </div>
        </div>
        <div 
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ 
            backgroundColor: `#${theme.borderColor}20`,
            color: `#${theme.borderColor}`
          }}
        >
          {item.status}
        </div>
      </div>
    ))}
  </div>
);

export default ExploreContent;