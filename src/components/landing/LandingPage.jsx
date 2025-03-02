// app/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, Search, Plus, User, Menu } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
// Import the Explore page component (we'll create this next)
import ExplorePage from '@/components/explore/ExplorePage';

// Custom hook for masonry layout
const useMasonryLayout = (items) => {
  const [columns, setColumns] = useState([[], [], []]);
  
  useEffect(() => {
    // Determine optimal number of columns based on screen width
    const getColumnCount = () => {
      if (window.innerWidth < 640) return 2;
      if (window.innerWidth < 1024) return 3;
      return 4;
    };

    const updateLayout = () => {
      const columnCount = getColumnCount();
      const newColumns = Array(columnCount).fill().map(() => []);
      
      items.forEach((item, index) => {
        const columnIndex = index % columnCount;
        newColumns[columnIndex].push(item);
      });
      
      setColumns(newColumns);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [items]);

  return columns;
};

// Sample post data
const samplePosts = [
  {
    id: 1,
    image: '/api/placeholder/600/800',
    title: 'Limited Edition Gundam Model Kit',
    likes: 245,
    comments: 42
  },
  {
    id: 2,
    image: '/api/placeholder/600/600',
    title: 'Vintage Pokémon Cards Collection',
    likes: 187,
    comments: 31
  },
  {
    id: 3,
    image: '/api/placeholder/500/700',
    title: 'Sailor Moon Exclusive Merch',
    likes: 312,
    comments: 56
  },
  {
    id: 4,
    image: '/api/placeholder/600/500',
    title: 'Limited Studio Ghibli Art Book',
    likes: 432,
    comments: 87
  },
  {
    id: 5,
    image: '/api/placeholder/600/900',
    title: 'Rare Japanese Snack Box',
    likes: 156,
    comments: 24
  },
  {
    id: 6,
    image: '/api/placeholder/500/800',
    title: 'Exclusive Tokyo Fashion Items',
    likes: 289,
    comments: 47
  },
  {
    id: 7,
    image: '/api/placeholder/700/500',
    title: 'Anime Convention Exclusive Figure',
    likes: 378,
    comments: 63
  },
  {
    id: 8,
    image: '/api/placeholder/600/700',
    title: 'Japanese Street Fashion Accessories',
    likes: 201,
    comments: 39
  },
  {
    id: 9,
    image: '/api/placeholder/500/600',
    title: 'Nintendo Limited Edition Console',
    likes: 523,
    comments: 91
  },
  {
    id: 10,
    image: '/api/placeholder/600/400',
    title: 'Handmade Kimono Fabric Accessories',
    likes: 167,
    comments: 28
  },
  {
    id: 11,
    image: '/api/placeholder/500/500',
    title: 'Japanese Stationery Collection',
    likes: 198,
    comments: 34
  },
  {
    id: 12,
    image: '/api/placeholder/700/900',
    title: 'Exclusive Idol Group Merchandise',
    likes: 342,
    comments: 58
  }
];

// Post component with hover effects
const Post = ({ post }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="relative mb-0 overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img 
        src={post.image} 
        alt={post.title} 
        className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 transform transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <h3 className="text-white text-sm font-medium truncate">{post.title}</h3>
        <div className="flex items-center mt-1 space-x-3">
          <div className="flex items-center text-white text-xs">
            <Heart size={12} className="mr-1" />
            <span>{post.likes}</span>
          </div>
          <div className="flex items-center text-white text-xs">
            <MessageCircle size={12} className="mr-1" />
            <span>{post.comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bottom navigation bar component
const BottomNav = ({ isVisible, onToggle }) => {
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-lg transition-transform duration-300 z-50 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="flex justify-around items-center p-3">
        {/* Home */}
        <button className="w-12 h-12 flex flex-col items-center justify-center rounded-full bg-pink-50 text-pink-500">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10.25V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V10.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3L2 11H22L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs mt-1">Home</span>
        </button>
        
        {/* Search */}
        <button className="w-12 h-12 flex flex-col items-center justify-center rounded-full bg-blue-50 text-blue-500">
          <Search size={20} />
          <span className="text-xs mt-1">Search</span>
        </button>
        
        {/* Create Post */}
        <button className="w-16 h-16 flex flex-col items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white -mt-6 shadow-lg">
          <Plus size={24} />
          <span className="text-xs mt-1">Post</span>
        </button>
        
        {/* Messages */}
        <button className="w-12 h-12 flex flex-col items-center justify-center rounded-full bg-green-50 text-green-500">
          <MessageCircle size={20} />
          <span className="text-xs mt-1">Chat</span>
        </button>
        
        {/* Profile */}
        <button className="w-12 h-12 flex flex-col items-center justify-center rounded-full bg-purple-50 text-purple-500">
          <User size={20} />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [navVisible, setNavVisible] = useState(false);
  const columns = useMasonryLayout(samplePosts);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        
        if (data.user) {
          // User is logged in, set the user state
          setUser(data.user);
        }
        // Always set loading to false regardless of login state
        setLoading(false);
      } catch (error) {
        console.error('Auth error:', error);
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mr-3"></div>
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // If user is logged in, show the Explore page
  if (user) {
    return <ExplorePage user={user} />;
  }

  // Otherwise, show the landing page
  return (
    <div className="bg-white min-h-screen pb-20">
      {/* App bar with toggle */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button
              onClick={() => setNavVisible(!navVisible)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-purple-200 text-purple-700"
            >
              <Menu size={20} />
            </button>
          </div>
          
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-transparent bg-clip-text">JapanShopper</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button size="sm" variant="ghost">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Hero section */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-16 px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Your Personal Shopper in Japan
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Get exclusive Japanese items delivered to your door. Connect with local shoppers who can find rare and limited edition collectibles.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/register">
              <Button className="px-8 py-3 rounded-md shadow">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="ml-4 px-8 py-3 rounded-md">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Masonry layout */}
      <div className="px-1 pt-2">
        <h2 className="text-2xl font-bold text-center mb-6">Trending Items</h2>
        <div className="flex">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="flex-1 px-0.5">
              {column.map(post => (
                <Post key={post.id} post={post} />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Features section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 mt-12">
        <div className="max-w-xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">How It Works</h2>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <Search className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">1. Create a Request</h3>
            <p className="text-gray-500">Describe the item you want and set your budget. Add reference images to help shoppers find exactly what you need.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <MessageCircle className="text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">2. Connect with Shoppers</h3>
            <p className="text-gray-500">Local shoppers in Japan will send you proposals. Choose the one you like and communicate directly.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mb-4">
              <Heart className="text-pink-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">3. Receive Your Items</h3>
            <p className="text-gray-500">Your shopper purchases and ships the item to you. Payments are held safely until you confirm receipt.</p>
          </div>
        </div>
      </div>
      
      {/* CTA section */}
      <div className="bg-indigo-600 py-12 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white">Ready to find your Japanese treasures?</h2>
          <p className="mt-4 text-lg text-indigo-100">
            Join thousands of collectors who have found rare items through our marketplace.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-md shadow-md">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Bottom navigation bar */}
      <BottomNav isVisible={navVisible} onToggle={() => setNavVisible(!navVisible)} />
      
      {/* Quick nav toggle at bottom */}
      {!navVisible && (
        <button 
          onClick={() => setNavVisible(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg z-50"
        >
          <Menu size={20} />
        </button>
      )}
    </div>
  );
}