// src/app/(main)/explore/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Heart, MessageCircle, Search, Plus, User, Home, ShoppingBag, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRef } from 'react';
import { useMemo, useCallback } from 'react';
// Custom hook for masonry layout
const useMasonryLayout = (items) => {
    const [columns, setColumns] = useState([]);
    const itemsRef = useRef([]);
    const columnCountRef = useRef(3);
    
    // Update columns based on current items and column count
    const updateColumns = useCallback(() => {
      const colCount = columnCountRef.current;
      const newColumns = Array(colCount).fill().map(() => []);
      
      const currentItems = itemsRef.current;
      if (currentItems && currentItems.length > 0) {
        currentItems.forEach((item, index) => {
          const columnIndex = index % colCount;
          newColumns[columnIndex].push(item);
        });
      }
      
      setColumns(newColumns);
    }, []);
    
    // Helper function to determine column count
    const getColumnCount = useCallback(() => {
      if (window.innerWidth < 640) return 2;
      if (window.innerWidth < 1024) return 3;
      return 4;
    }, []);
    
    // Handle items change
    useEffect(() => {
      // Only update if the items array actually changed in content
      if (JSON.stringify(itemsRef.current) !== JSON.stringify(items)) {
        itemsRef.current = [...items]; // Create a new copy
        updateColumns();
      }
    }, [items, updateColumns]);
    
    // Handle resize and initial setup
    useEffect(() => {
      const handleResize = () => {
        const newColumnCount = getColumnCount();
        if (newColumnCount !== columnCountRef.current) {
          columnCountRef.current = newColumnCount;
          updateColumns();
        }
      };
      
      // Initial setup
      columnCountRef.current = getColumnCount();
      // Initial items assignment
      if (itemsRef.current.length === 0 && items.length > 0) {
        itemsRef.current = [...items];
      }
      updateColumns();
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [getColumnCount, updateColumns]);
    
    return columns;
  };
// Item card component with hover effects
const ItemCard = ({ item }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine image to show
  const image = item.images && item.images.length > 0 
    ? item.images[0] 
    : '/api/placeholder/600/600';
  
  // Determine status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'completed': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div 
      className="relative mb-1 overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/requests/${item.id}`}>
        <div className="relative overflow-hidden">
          <img 
            src={image}
            alt={item.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Only show status badge if it's an open request */}
          {item.status === 'open' && (
            <div className={`absolute top-2 right-2 px-2 py-1 text-xs text-white font-medium ${getStatusColor(item.status)}`}>
              {item.status}
            </div>
          )}
        </div>
        
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 transform transition-all duration-300 ${isHovered ? 'opacity-100 h-auto' : 'opacity-90 h-auto'}`}>
          <h3 className="text-white text-sm font-medium mb-1 truncate">{item.title}</h3>
          
          <div className="flex items-center justify-between mt-1">
            <div className="text-white text-xs font-medium">
              ¥{item.budget?.toLocaleString() || 'Flexible'}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-white text-xs">
                <Heart size={12} className="mr-1" />
                <span>{item.likes || 0}</span>
              </div>
              <div className="flex items-center text-white text-xs">
                <MessageCircle size={12} className="mr-1" />
                <span>{item.comments || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Bottom navigation bar component
const BottomNav = ({ isVisible }) => {
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-lg z-50 ${isVisible ? 'translate-y-0' : 'translate-y-full'} transition-transform duration-300`}>
      <div className="flex justify-around items-center p-3">
        <Link href="/dashboard" className="w-12 h-12 flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600">
          <Home size={20} />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link href="/explore" className="w-12 h-12 flex flex-col items-center justify-center text-indigo-600">
          <Search size={20} />
          <span className="text-xs mt-1">Explore</span>
        </Link>
        
        <Link href="/requests/new" className="w-16 h-16 flex flex-col items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white -mt-6 shadow-lg">
          <Plus size={24} />
          <span className="text-xs mt-1">Post</span>
        </Link>
        
        <Link href="/requests" className="w-12 h-12 flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600">
          <ShoppingBag size={20} />
          <span className="text-xs mt-1">Requests</span>
        </Link>
        
        <Link href="/profile" className="w-12 h-12 flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600">
          <User size={20} />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default function ExplorePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [navVisible, setNavVisible] = useState(true);
  
  const router = useRouter();
  
  // Filter items based on search query and filter selection
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Apply search filter
      const matchesSearch = searchQuery === '' || 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply status filter
      const matchesFilter = 
        filter === 'all' || 
        (filter === 'open' && item.status === 'open') ||
        (filter === 'completed' && item.status === 'completed');
      
      return matchesSearch && matchesFilter;
    });
  }, [items, searchQuery, filter]);
  
  // Apply masonry layout to filtered items
  const columns = useMasonryLayout(filteredItems);

  // Fetch data function - used for both initial load and refresh
  const fetchItems = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Use the more reliable query approach from the refresh function
      const { data: requestsData, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      
      // Add mock likes/comments
      const enhancedItems = requestsData.map(item => ({
        ...item,
        likes: item.likes || Math.floor(Math.random() * 50) + 5,
        comments: item.comments || Math.floor(Math.random() * 20) + 1
      }));
      
      setItems(enhancedItems);
      return enhancedItems;
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err.message);
      return [];
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchItems();
      setLoading(false);
    };
    
    loadData();
  }, [router]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mr-3"></div>
        <span className="text-lg">Loading items...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-bold">Error loading items</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-20">
      {/* Search and filter bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-2 px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button 
                variant={filter === 'all' ? 'default' : 'ghost'} 
                size="sm" 
                className="text-xs"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={filter === 'open' ? 'default' : 'ghost'} 
                size="sm" 
                className="text-xs"
                onClick={() => setFilter('open')}
              >
                Open
              </Button>
              <Button 
                variant={filter === 'completed' ? 'default' : 'ghost'} 
                size="sm" 
                className="text-xs"
                onClick={() => setFilter('completed')}
              >
                Completed
              </Button>
            </div>
            
            {/* Refresh button */}
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Masonry grid - pure collage style */}
      {filteredItems.length === 0 ? (
        <div className="text-center p-12">
          <p className="text-gray-500 mb-4">No items found matching your criteria</p>
          <Button variant="outline" onClick={() => {
            setSearchQuery('');
            setFilter('all');
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="px-0.5 pt-2">
          <div className="flex">
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="flex-1 px-0.5">
                {column.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Bottom navigation */}
      <BottomNav isVisible={navVisible} />
      
      {/* Quick nav toggle button - only shown when bottom nav is hidden */}
      {!navVisible && (
        <button 
          onClick={() => setNavVisible(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg z-50"
        >
          <Plus size={20} />
        </button>
      )}
    </div>
  );
}