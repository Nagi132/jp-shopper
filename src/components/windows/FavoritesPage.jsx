'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  Heart, 
  Search, 
  Grid, 
  List, 
  Trash2, 
  ArrowDownAZ, 
  ArrowUp01, 
  LayoutGrid,
  Calendar,
  Clock,
  X,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { useApp } from '@/contexts/AppContext';

/**
 * FavoritesPage - Window content for favorites in Y2K/Windows 2000 style
 */
const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, name, price
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();
  const { openWindow } = useApp();
  
  // Get theme colors
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
  // Function to determine text color based on background
  const getContrastText = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };
  
  const textColor = theme?.textColor || getContrastText(bgColor);
  
  // Mock categories
  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'collectibles', name: 'Collectibles' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'games', name: 'Games' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'books', name: 'Books & Manga' }
  ];
  
  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        // In a real app, you would fetch from your database
        // For now, let's use mock data
        const mockFavorites = [
          {
            id: '1',
            itemId: 'item-1',
            title: 'Limited Edition Mario Figure',
            seller: 'TokyoCollectibles',
            price: 12500,
            image: '/api/placeholder/400/400',
            category: 'collectibles',
            dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() // 3 days ago
          },
          {
            id: '2',
            itemId: 'item-2',
            title: 'Gundam Model Kit RX-78-2',
            seller: 'ModelShopTokyo',
            price: 4500,
            image: '/api/placeholder/400/400',
            category: 'collectibles',
            dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
          },
          {
            id: '3',
            itemId: 'item-3',
            title: 'Japanese Streetwear Hoodie',
            seller: 'TokyoFashion',
            price: 8900,
            image: '/api/placeholder/400/400',
            category: 'clothing',
            dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() // 5 days ago
          },
          {
            id: '4',
            itemId: 'item-4',
            title: 'Vintage Pokemon Crystal Game',
            seller: 'RetroGameJP',
            price: 6500,
            image: '/api/placeholder/400/400',
            category: 'games',
            dateAdded: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
          },
          {
            id: '5',
            itemId: 'item-5',
            title: 'Anime Art Book Collection',
            seller: 'MangaWorld',
            price: 3200,
            image: '/api/placeholder/400/400',
            category: 'books',
            dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
          },
          {
            id: '6',
            itemId: 'item-6',
            title: 'Sailor Moon Wand Replica',
            seller: 'AnimeTreasures',
            price: 7800,
            image: '/api/placeholder/400/400',
            category: 'collectibles',
            dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() // 12 hours ago
          }
        ];
        
        setFavorites(mockFavorites);
      } catch (err) {
        console.error('Error loading favorites:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, [router]);
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // In a real app, re-fetch from database
      // For now, we'll just simulate a refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error('Error refreshing favorites:', err);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Filter and sort favorites
  const filteredAndSortedFavorites = favorites
    // Filter by category
    .filter(favorite => 
      selectedCategory === 'all' || favorite.category === selectedCategory
    )
    // Filter by search query
    .filter(favorite => 
      favorite.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.seller.toLowerCase().includes(searchQuery.toLowerCase())
    )
    // Sort
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.dateAdded) - new Date(a.dateAdded);
        case 'name':
          return a.title.localeCompare(b.title);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return new Date(b.dateAdded) - new Date(a.dateAdded);
      }
    });
  
  // Remove a favorite
  const removeFavorite = (id, e) => {
    e.stopPropagation();
    
    if (window.confirm('Remove this item from your favorites?')) {
      // In a real app, you would call the API
      // For now, just update the state
      setFavorites(favorites.filter(fav => fav.id !== id));
    }
  };
  
  // Open item detail
  const openItemDetail = (itemId, title) => {
    openWindow(`item-${itemId}`, 'ItemDetail', title);
  };
  
  // Format date added relative to now
  const formatDateAdded = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin}m ago`;
    } else if (diffHour < 24) {
      return `${diffHour}h ago`;
    } else {
      return `${diffDay}d ago`;
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div 
          className="w-10 h-10 rounded-full animate-spin"
          style={{ 
            borderWidth: '4px',
            borderStyle: 'solid',
            borderColor: `transparent #${borderColor} #${borderColor} #${borderColor}`
          }}
        ></div>
        <span className="ml-2 font-futura-medium">Loading favorites...</span>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="p-4 m-4 border-2 rounded shadow-md" style={{ borderColor: `#${borderColor}` }}>
        <h2 className="text-lg font-futura-bold mb-2" style={{ color: `#${borderColor}` }}>Error Loading Favorites</h2>
        <p>{error}</p>
        <button 
          className="mt-4 px-4 py-1 text-sm rounded-sm shadow"
          style={{ 
            backgroundColor: `#${borderColor}`,
            color: getContrastText(borderColor)
          }}
          onClick={handleRefresh}
        >
          <RefreshCw size={14} className="inline mr-1" />
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with title and refresh button */}
      <div 
        className="border-b flex justify-between items-center py-2 px-4"
        style={{ 
          backgroundColor: `#${bgColor}30`,
          borderColor: `#${borderColor}40` 
        }}
      >
        <h1 
          className="text-xl font-futura-bold flex items-center"
          style={{ 
            color: `#${borderColor}`,
            textShadow: '1px 1px 0px rgba(255,255,255,0.5)'
          }}
        >
          <Heart size={20} className="mr-2" />
          Favorites
        </h1>
        
        <button 
          className="px-2 py-1 text-sm rounded-sm flex items-center shadow"
          style={{ 
            backgroundColor: `#${borderColor}`,
            color: getContrastText(borderColor) === '#000000' ? '#000000' : '#FFFFFF'
          }}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {/* Toolbar with search, sort, and view options */}
      <div 
        className="border-b py-2 px-4 flex flex-wrap gap-2"
        style={{ 
          backgroundColor: `#${bgColor}20`,
          borderColor: `#${borderColor}40` 
        }}
      >
        {/* Search */}
        <div className="relative flex-grow max-w-xs">
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-1 pl-8 pr-2 text-sm border rounded-sm"
            style={{ 
              borderColor: `#${borderColor}70`,
              backgroundColor: 'white',
            }}
          />
          <Search 
            size={14} 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-1 pl-8 pr-2 text-sm border rounded-sm bg-white appearance-none cursor-pointer"
            style={{ 
              borderColor: `#${borderColor}70`,
              minWidth: '130px'
            }}
          >
            <option value="recent">Recently Added</option>
            <option value="name">Name (A-Z)</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
          <ArrowDownAZ 
            size={14} 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
        </div>
        
        {/* View toggle */}
        <div 
          className="flex border rounded-sm overflow-hidden shadow-sm"
          style={{ borderColor: `#${borderColor}70` }}
        >
          <button
            className={`w-8 h-8 flex items-center justify-center ${viewMode === 'grid' ? 'bg-gray-200' : 'bg-white'}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            className={`w-8 h-8 flex items-center justify-center ${viewMode === 'list' ? 'bg-gray-200' : 'bg-white'}`}
            onClick={() => setViewMode('list')}
          >
            <List size={14} />
          </button>
        </div>
      </div>
      
      {/* Category tabs */}
      <div 
        className="border-b overflow-x-auto whitespace-nowrap py-1 px-4 flex"
        style={{ 
          backgroundColor: `#${bgColor}10`,
          borderColor: `#${borderColor}40` 
        }}
      >
        {categories.map(category => (
          <button
            key={category.id}
            className={`px-3 py-1 text-sm mr-1 rounded-sm border ${
              selectedCategory === category.id ? 'font-medium' : ''
            }`}
            style={{ 
              backgroundColor: selectedCategory === category.id ? `#${borderColor}30` : 'white',
              borderColor: `#${borderColor}50`,
              color: selectedCategory === category.id ? `#${borderColor}` : 'inherit',
              boxShadow: selectedCategory === category.id ? 'none' : '1px 1px 2px rgba(0,0,0,0.1)'
            }}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name} 
            {category.id === 'all' ? '' : ` (${favorites.filter(f => f.category === category.id).length})`}
          </button>
        ))}
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 win2k-scrollbar">
        {filteredAndSortedFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Heart size={40} className="mb-2 opacity-30" />
            <p className="text-gray-500 mb-2">No favorites found</p>
            {searchQuery || selectedCategory !== 'all' ? (
              <button
                className="px-3 py-1 text-sm border rounded-sm"
                style={{ borderColor: `#${borderColor}` }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Clear filters
              </button>
            ) : (
              <p className="text-sm text-gray-400">Start adding items to your favorites!</p>
            )}
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredAndSortedFavorites.map(favorite => (
                <GridItem 
                  key={favorite.id}
                  favorite={favorite}
                  onRemove={(e) => removeFavorite(favorite.id, e)}
                  onClick={() => openItemDetail(favorite.itemId, favorite.title)}
                  formatDateAdded={formatDateAdded}
                  borderColor={borderColor}
                  bgColor={bgColor}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedFavorites.map(favorite => (
                <ListItem 
                  key={favorite.id}
                  favorite={favorite}
                  onRemove={(e) => removeFavorite(favorite.id, e)}
                  onClick={() => openItemDetail(favorite.itemId, favorite.title)}
                  formatDateAdded={formatDateAdded}
                  borderColor={borderColor}
                  bgColor={bgColor}
                />
              ))}
            </div>
          )
        )}
      </div>
      
      {/* Status bar */}
      <div 
        className="border-t px-4 py-1 text-xs flex justify-between"
        style={{ 
          backgroundColor: `#${bgColor}20`,
          borderColor: `#${borderColor}40` 
        }}
      >
        <span>
          {filteredAndSortedFavorites.length} 
          {filteredAndSortedFavorites.length === 1 ? ' item' : ' items'} displayed
        </span>
        
        <div className="flex items-center">
          <Calendar size={12} className="mr-1" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

// Grid item component
const GridItem = ({ favorite, onRemove, onClick, formatDateAdded, borderColor, bgColor }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div 
      className="border-2 rounded-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      style={{ 
        borderColor: `#${borderColor}40`,
        backgroundColor: 'white',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="aspect-square relative">
        <img 
          src={favorite.image} 
          alt={favorite.title} 
          className="w-full h-full object-cover"
        />
        
        {/* Remove button */}
        <button
          className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 text-red-500 hover:bg-red-500 hover:text-white transition-colors ${hovered ? 'opacity-100' : 'opacity-0'}`}
          onClick={onRemove}
          aria-label="Remove from favorites"
        >
          <Trash2 size={14} />
        </button>
        
        {/* Date added badge */}
        <div 
          className="absolute bottom-2 left-2 px-2 py-0.5 text-xs rounded-sm"
          style={{ 
            backgroundColor: `#${bgColor}D0`,
            color: '#000000',
            backdropFilter: 'blur(2px)',
            boxShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          <Clock size={10} className="inline mr-1" />
          {formatDateAdded(favorite.dateAdded)}
        </div>
      </div>
      
      {/* Item details */}
      <div className="p-2">
        <h3 className="font-medium text-sm truncate">{favorite.title}</h3>
        <div className="flex justify-between items-baseline">
          <span className="text-xs opacity-70">@{favorite.seller}</span>
          <span className="font-medium">¥{favorite.price.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

// List item component
const ListItem = ({ favorite, onRemove, onClick, formatDateAdded, borderColor, bgColor }) => {
  return (
    <div 
      className="border-2 rounded-md overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
      style={{ 
        borderColor: `#${borderColor}40`,
        backgroundColor: 'white',
      }}
      onClick={onClick}
    >
      <div className="flex p-2">
        {/* Image */}
        <div className="w-16 h-16 flex-shrink-0 bg-gray-100">
          <img 
            src={favorite.image} 
            alt={favorite.title} 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Item details */}
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex justify-between">
            <h3 className="font-medium text-sm truncate">{favorite.title}</h3>
            <button
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500"
              onClick={onRemove}
              aria-label="Remove from favorites"
            >
              <Trash2 size={14} />
            </button>
          </div>
          
          <div className="flex justify-between items-baseline mt-1">
            <span className="text-xs opacity-70">@{favorite.seller}</span>
            <span className="font-medium">¥{favorite.price.toLocaleString()}</span>
          </div>
          
          <div 
            className="inline-block mt-1 px-2 py-0.5 text-xs rounded-sm"
            style={{ 
              backgroundColor: `#${bgColor}30`,
              color: `#${borderColor}`,
            }}
          >
            <Clock size={10} className="inline mr-1" />
            {formatDateAdded(favorite.dateAdded)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;