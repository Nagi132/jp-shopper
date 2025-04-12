'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Search, RefreshCw, ChevronDown } from 'lucide-react';
import WindowContainer from '@/components/ui/WindowContainer';
import ApplicationFooter from '@/components/layouts/ApplicationFooter';
import MasonryGrid from '@/components/explore/MasonryGrid';
import { Button } from '@/components/ui/button';

export default function ExplorePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortOption, setSortOption] = useState('relevant');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [theme, setTheme] = useState({ borderColor: '69EFD7', bgColor: 'FED1EB' });
  const router = useRouter();

  // Handle theme changes from the footer
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

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
    
    // Load theme from localStorage
    try {
      const savedTheme = localStorage.getItem('y2kTheme');
      if (savedTheme) {
        setTheme(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
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

  return (
    <div className="pb-16 flex flex-col h-[calc(100vh-64px)]">
      {/* Main Content with Windows 2000 Window */}
      <WindowContainer 
        className="flex-1 mb-2"
        contentClassName="p-0 overflow-auto"
        borderColor={theme.borderColor}
        bgColor={theme.bgColor}
        statusText={loading ? "Loading items..." : `${filteredAndSortedItems.length} items found`}
      >
        {/* Tab Navigation and Search Bar */}
        <div className="sticky top-0 z-10 bg-white py-2 border-b border-gray-200">
          {/* Tabs */}
          <div className="flex px-4 gap-1 mb-2 border-b">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'all' 
                  ? 'border-[#C999F8] text-[#C999F8]' 
                  : 'border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('all')}
            >
              ALL
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'available' 
                  ? 'border-[#C999F8] text-[#C999F8]' 
                  : 'border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('available')}
            >
              AVAILABLE
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'sold' 
                  ? 'border-[#C999F8] text-[#C999F8]' 
                  : 'border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('sold')}
            >
              SOLD
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'requested' 
                  ? 'border-[#C999F8] text-[#C999F8]' 
                  : 'border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('requested')}
            >
              REQUESTED
            </button>
          </div>
          
          {/* Search & Sort Row */}
          <div className="flex items-center px-4 gap-2">
            {/* Search Box */}
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 px-2 py-1 border border-gray-400 text-sm rounded-sm"
              />
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={toggleSortDropdown}
                className="flex items-center text-sm border border-gray-300 px-2 py-1 bg-gray-100 rounded-sm"
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
                <div className="absolute right-0 mt-1 bg-white border border-gray-300 shadow-lg z-20 w-48 py-1">
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${sortOption === 'relevant' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      setSortOption('relevant');
                      setSortDropdownOpen(false);
                    }}
                  >
                    Relevance
                  </button>
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${sortOption === 'lowToHigh' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      setSortOption('lowToHigh');
                      setSortDropdownOpen(false);
                    }}
                  >
                    Price: Low to High
                  </button>
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${sortOption === 'highToLow' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      setSortOption('highToLow');
                      setSortDropdownOpen(false);
                    }}
                  >
                    Price: High to Low
                  </button>
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${sortOption === 'newest' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      setSortOption('newest');
                      setSortDropdownOpen(false);
                    }}
                  >
                    Newly Listed
                  </button>
                </div>
              )}
            </div>
            
            {/* Refresh Button */}
            <Button
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-10 h-10 border-t-2 border-r-2 border-[#69EFD7] rounded-full animate-spin mb-3"></div>
            <p className="text-sm">Loading items...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-600 rounded">
            <p className="font-bold mb-2">Error loading items</p>
            <p>{error}</p>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="p-6 text-center">
            <p className="mb-2">No items found matching your search</p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <MasonryGrid items={filteredAndSortedItems} />
        )}
      </WindowContainer>
      
      {/* Footer with Theme Customizer */}
      <ApplicationFooter onThemeChange={handleThemeChange} />
    </div>
  );
}