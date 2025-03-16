'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Heart, MessageCircle, RefreshCw, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ExplorePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  // Function to fetch items
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
        .limit(30);

      if (error) throw error;
      
      // Add placeholder images and engagement metrics
      const enhancedItems = requestsData.map(item => ({
        ...item,
        likes: item.likes || Math.floor(Math.random() * 50) + 5,
        comments: item.comments || Math.floor(Math.random() * 20) + 1,
        image: item.images && item.images.length > 0 
          ? item.images[0] 
          : `https://placehold.jp/80/c999f8/ffffff/500x500.png?text=${encodeURIComponent(item.title || 'Item')}`
      }));
      
      setItems(enhancedItems);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchItems();
  }, [router]);

  // Filter items based on search and filter
  const filteredItems = items.filter(item => {
    // Apply search filter
    const matchesSearch = !searchQuery || 
      (item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       item.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply status filter
    const matchesFilter = 
      filter === 'all' || 
      filter === item.status;
    
    return matchesSearch && matchesFilter;
  });

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  return (
    <div className="pb-16">
      {/* Filter & Search Bar */}
      <div className="bg-[#C0C0C0] border-b border-[#808080] p-2 flex flex-wrap items-center gap-2">
        {/* Filter Buttons */}
        <div className="flex">
          <button 
            className={`px-3 py-1 border-2 ${filter === 'all' 
              ? 'border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-[#d3d3d3]' 
              : 'border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0]'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`px-3 py-1 border-2 ${filter === 'open' 
              ? 'border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-[#d3d3d3]' 
              : 'border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0]'}`}
            onClick={() => setFilter('open')}
          >
            Open
          </button>
          <button 
            className={`px-3 py-1 border-2 ${filter === 'completed' 
              ? 'border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-[#d3d3d3]' 
              : 'border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0]'}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-grow"></div>
        
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0] p-1 flex items-center"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        
        {/* Search Box */}
        <div className="flex w-60 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 px-2 py-1 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white text-sm"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-10 h-10 border-t-2 border-r-2 border-[#C999F8] rounded-full animate-spin mb-3"></div>
          <p className="text-sm">Loading items...</p>
        </div>
      )}

      {/* No Results */}
      {!loading && filteredItems.length === 0 && (
        <div className="bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-6 text-center my-4 mx-2">
          <p className="mb-2">No items found matching your search.</p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setFilter('all');
            }}
            className="px-4 py-1 border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0]"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Items Grid */}
      {!loading && filteredItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 p-1">
          {filteredItems.map(item => (
            <Link 
              href={`/requests/${item.id}`} 
              key={item.id}
              className="block"
            >
              <div className="border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0] overflow-hidden group relative">
                {/* Item Image */}
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Tag */}
                  {item.status && (
                    <div className={`absolute top-2 left-2 px-2 py-0.5 text-xs uppercase ${
                      item.status === 'open' ? 'bg-green-500' : 
                      item.status === 'completed' ? 'bg-purple-500' : 
                      'bg-blue-500'
                    } text-white`}>
                      {item.status}
                    </div>
                  )}
                </div>
                
                {/* Item Details */}
                <div className="p-2">
                  <h3 className="text-sm font-bold truncate">
                    {item.title || 'Untitled Item'}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">
                      ¥{item.budget?.toLocaleString() || '???'}
                    </span>
                    <div className="flex space-x-2 text-xs">
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" />
                        {item.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {item.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}