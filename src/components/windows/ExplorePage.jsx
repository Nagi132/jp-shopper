'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { supabase } from '@/lib/supabase/client';
import { Search, RefreshCw, Grid, List } from 'lucide-react';
import MasonryGrid from '@/components/explore/MasonryGrid';

/**
 * ExplorePage - Content for the explore window
 * Enhanced to work with the Windows desktop system
 */
const ExplorePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const { theme } = useTheme();
  
  // Fetch items from Supabase
  const fetchItems = async () => {
    try {
      setLoading(true);
      
      // Fetch requests to display as items
      const { data: requestsData, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      
      console.log('Fetched data:', requestsData);
      setItems(requestsData || []);
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

  // Filter items based on active tab and search query
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Apply tab filter
      let tabMatch = true;
      if (activeTab === 'available') {
        tabMatch = item.status === 'open' && item.shopper_id === null;
      } else if (activeTab === 'sold') {
        tabMatch = item.status === 'completed';
      } else if (activeTab === 'requested') {
        tabMatch = item.status === 'open' && item.shopper_id !== null;
      }
      
      // Apply search filter
      const searchMatch = !searchQuery || 
        (item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         item.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return tabMatch && searchMatch;
    });
  }, [items, activeTab, searchQuery]);

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

  return (
    <div className="p-2 h-full flex flex-col">
      {/* Header with tabs and search */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex">
          <TabButton 
            active={activeTab === 'all'} 
            onClick={() => setActiveTab('all')}
            theme={theme}
          >
            All
          </TabButton>
          <TabButton 
            active={activeTab === 'available'} 
            onClick={() => setActiveTab('available')}
            theme={theme}
          >
            Available
          </TabButton>
          <TabButton 
            active={activeTab === 'sold'} 
            onClick={() => setActiveTab('sold')}
            theme={theme}
          >
            Sold
          </TabButton>
        </div>
        
        <div className="flex items-center">
          {/* View mode toggle */}
          <div className="flex mr-2 border rounded-sm overflow-hidden" style={{ borderColor: `#${theme.borderColor}40` }}>
            <button
              onClick={() => setViewMode('grid')}
              className="h-6 w-6 flex items-center justify-center"
              style={{ 
                backgroundColor: viewMode === 'grid' ? `#${theme.borderColor}30` : 'transparent',
                borderRight: `1px solid #${theme.borderColor}40`
              }}
            >
              <Grid className="h-3 w-3" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="h-6 w-6 flex items-center justify-center"
              style={{ 
                backgroundColor: viewMode === 'list' ? `#${theme.borderColor}30` : 'transparent',
              }}
            >
              <List className="h-3 w-3" />
            </button>
          </div>
          
          {/* Search box */}
          <div className="relative mr-2">
            <Search 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3" 
              style={{ opacity: 0.6 }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 h-6 pl-7 px-2 py-1 text-xs border rounded-sm"
              style={{ 
                borderColor: `#${theme.borderColor}`,
                backgroundColor: 'white',
              }}
            />
          </div>
          
          {/* Refresh button */}
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-6 w-6 flex items-center justify-center rounded-sm"
            style={{ 
              backgroundColor: `#${theme.borderColor}30`,
              border: `1px solid #${theme.borderColor}`
            }}
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div 
              className="w-8 h-8 rounded-full animate-spin mb-2"
              style={{ 
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: `transparent #${theme.borderColor} #${theme.borderColor} #${theme.borderColor}`
              }}
            />
            <span className="text-sm">Loading items...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p 
              className="mb-2 text-red-600"
              style={{ color: '#cc0000' }}
            >
              Error loading items: {error}
            </p>
            <button 
              onClick={handleRefresh}
              className="px-2 py-1 text-xs"
              style={{ 
                backgroundColor: `#${theme.borderColor}`,
                color: '#ffffff',
                border: `1px solid #${theme.borderColor}`
              }}
            >
              Try Again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="mb-2 text-sm">No items found</p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="px-2 py-1 text-xs"
                style={{ 
                  backgroundColor: `#${theme.borderColor}`,
                  color: '#ffffff',
                  border: `1px solid #${theme.borderColor}`
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          viewMode === 'grid' ? (
            <MasonryGrid items={filteredItems} theme={theme} />
          ) : (
            <ListView items={filteredItems} theme={theme} />
          )
        )}
      </div>
      
      {/* Status bar */}
      <div 
        className="h-5 mt-1 px-2 text-xs flex items-center"
        style={{ 
          backgroundColor: `#${theme.bgColor}20`,
          borderTop: `1px solid #${theme.borderColor}40`
        }}
      >
        <span>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} • 
          {activeTab === 'all' ? ' All categories' : 
           activeTab === 'available' ? ' Available only' : 
           activeTab === 'sold' ? ' Sold items' : 
           ' Requested items'}
        </span>
      </div>
    </div>
  );
};

// Tab button component
const TabButton = ({ children, active, onClick, theme }) => (
  <button
    className={`px-3 py-1 text-xs border-b-2 transition-colors`}
    style={{
      borderColor: active ? `#${theme.borderColor}` : 'transparent',
      color: active ? `#${theme.borderColor}` : `#${theme.textColor || '000000'}80`,
    }}
    onClick={onClick}
  >
    {children}
  </button>
);

// List view component
const ListView = ({ items, theme }) => (
  <div className="w-full border rounded-sm overflow-hidden" style={{ borderColor: `#${theme.borderColor}40` }}>
    {items.map((item, index) => (
      <div 
        key={item.id || index}
        className="flex items-center p-2 hover:bg-gray-100"
        style={{ 
          borderBottom: index < items.length - 1 ? `1px solid #${theme.borderColor}20` : 'none'
        }}
      >
        <div 
          className="w-8 h-8 mr-3 rounded-sm bg-cover bg-center"
          style={{ 
            backgroundImage: item.images?.length > 0 ? 
              `url(${item.images[0]})` : 
              `url(https://placehold.jp/80/${theme.borderColor}/ffffff/80x80.png?text=${encodeURIComponent(item.title?.substring(0, 2) || 'Item')})`,
            backgroundColor: `#${theme.borderColor}30`
          }}
        />
        <div className="flex-1">
          <div className="text-sm font-medium">{item.title || 'Untitled Item'}</div>
          <div className="text-xs opacity-70">
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

export default ExplorePage;