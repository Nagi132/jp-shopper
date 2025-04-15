'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Search, RefreshCw, ChevronDown } from 'lucide-react';
import MasonryGrid from '@/components/explore/MasonryGrid';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/layouts/ThemeProvider';

export default function ExplorePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortOption, setSortOption] = useState('relevant');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const { theme } = useTheme(); // Use the global theme
  const router = useRouter();

  // Fetch items from Supabase
  const fetchItems = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch requests to display as items
      const { data: requestsData, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

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
  }, [router]);

  // Filter items based on tabs, search query, and sort option
  const getFilteredAndSortedItems = () => {
    // First, filter items based on active tab and search query
    let filtered = items.filter(item => {
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
    
    // Then, sort the filtered items
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'lowToHigh':
          return (a.budget || 0) - (b.budget || 0);
        case 'highToLow':
          return (b.budget || 0) - (a.budget || 0);
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        default: // 'relevant' - could implement more sophisticated relevance later
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });
  };

  const filteredAndSortedItems = getFilteredAndSortedItems();

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
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      {/* Tab Navigation and Search Bar - Styled with theme colors */}
      <div 
        className="sticky top-0 z-10 rounded-t-lg border-2 border-b-0 shadow-sm mb-0"
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
          >
            ALL
          </TabButton>
          <TabButton 
            active={activeTab === 'available'} 
            onClick={() => setActiveTab('available')}
            borderColor={theme.borderColor}
            textColor={textColor}
          >
            AVAILABLE
          </TabButton>
          <TabButton 
            active={activeTab === 'sold'} 
            onClick={() => setActiveTab('sold')}
            borderColor={theme.borderColor}
            textColor={textColor}
          >
            SOLD
          </TabButton>
          <TabButton 
            active={activeTab === 'requested'} 
            onClick={() => setActiveTab('requested')}
            borderColor={theme.borderColor}
            textColor={textColor}
          >
            REQUESTED
          </TabButton>
        </div>
        
        {/* Search & Sort Row */}
        <div className="flex items-center px-4 py-2 gap-2">
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
              className="w-full pl-8 px-2 py-1 border text-sm rounded-sm"
              style={{ 
                borderColor: `#${theme.borderColor}`,
                backgroundColor: `#FFFFFF80`,
                color: `#${textColor}`,
              }}
            />
          </div>
          
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={toggleSortDropdown}
              className="flex items-center text-sm border px-2 py-1 rounded-sm"
              style={{ 
                borderColor: `#${theme.borderColor}`,
                backgroundColor: `#${theme.bgColor}80`,
                color: `#${textColor}`,
              }}
            >
              <span className="mr-1">
                {sortOption === 'relevant' ? 'Relevance' : 
                 sortOption === 'lowToHigh' ? 'Price: Low to High' :
                 sortOption === 'highToLow' ? 'Price: High to Low' :
                 'Newly Listed'}
              </span>
              <ChevronDown className="h-4 w-4" />
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
          <Button
            style={{ 
              backgroundColor: `#${theme.borderColor}`,
              color: getContrastText(theme.borderColor) === '000000' ? '#000000' : '#FFFFFF',
              borderColor: `#${theme.borderColor}80`,
            }}
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
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
            <Button 
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              style={{ 
                backgroundColor: `#${theme.borderColor}`,
                color: getContrastText(theme.borderColor) === '000000' ? '#000000' : '#FFFFFF',
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <MasonryGrid items={filteredAndSortedItems} theme={theme} />
        )}
      </div>
    </div>
  );
}

// Tab Button Component
const TabButton = ({ children, active, onClick, borderColor, textColor }) => (
  <button
    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors`}
    style={{
      borderColor: active ? `#${borderColor}` : 'transparent',
      color: active ? `#${borderColor}` : `#${textColor}80`,
    }}
    onClick={onClick}
  >
    {children}
  </button>
);

// Sort Option Component
const SortOption = ({ children, selected, onClick, borderColor, bgColor, textColor }) => (
  <button
    className={`block w-full text-left px-4 py-2 text-sm`}
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