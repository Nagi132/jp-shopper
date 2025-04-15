'use client';

import React from 'react';
import { useTheme } from '@/components/layouts/ThemeProvider';
import HomePage from './HomePage';

/**
 * ExplorePage - Content for the explore window
 */
export const ExplorePage = () => {
  const { theme } = useTheme();
  
  return (
    <div className="p-6">
      <h1 
        className="text-2xl font-bold mb-4"
        style={{ color: `#${theme.borderColor}` }}
      >
        Explore
      </h1>
      <p>Browse items from Japan. This content would normally show a masonry layout of items.</p>
      
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
          <div 
            key={item}
            className="aspect-square rounded flex items-center justify-center"
            style={{ 
              backgroundColor: `#${theme.borderColor}${item * 10}`,
              color: '#FFFFFF'
            }}
          >
            Item {item}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * MessagesPage - Content for the messages window
 */
export const MessagesPage = () => {
  const { theme } = useTheme();
  
  return (
    <div className="flex h-full">
      {/* Conversations list */}
      <div 
        className="w-1/3 border-r p-2"
        style={{ borderColor: `#${theme.borderColor}40` }}
      >
        <h2 
          className="text-lg font-bold mb-2"
          style={{ color: `#${theme.borderColor}` }}
        >
          Conversations
        </h2>
        
        {['John Doe', 'Jane Smith', 'Hiroshi Tanaka', 'Mary Johnson'].map((name) => (
          <div 
            key={name}
            className="p-2 mb-1 rounded cursor-pointer"
            style={{ backgroundColor: `#${theme.borderColor}20` }}
          >
            {name}
          </div>
        ))}
      </div>
      
      {/* Message content */}
      <div className="flex-1 flex flex-col">
        <div 
          className="border-b p-2"
          style={{ borderColor: `#${theme.borderColor}40` }}
        >
          <h3 
            className="font-bold"
            style={{ color: `#${theme.borderColor}` }}
          >
            Hiroshi Tanaka
          </h3>
        </div>
        
        <div className="flex-1 p-3 overflow-auto">
          <div className="flex flex-col space-y-2">
            <div 
              className="self-start bg-gray-100 rounded-lg p-2 max-w-xs"
              style={{ backgroundColor: `#${theme.bgColor}40` }}
            >
              Hello! I found the Pokemon cards you were looking for.
            </div>
            
            <div 
              className="self-end rounded-lg p-2 max-w-xs text-white"
              style={{ backgroundColor: `#${theme.borderColor}` }}
            >
              That's great! How much are they?
            </div>
            
            <div 
              className="self-start bg-gray-100 rounded-lg p-2 max-w-xs"
              style={{ backgroundColor: `#${theme.bgColor}40` }}
            >
              They're 5000 yen. Would you like me to purchase them for you?
            </div>
          </div>
        </div>
        
        <div className="p-2 flex">
          <input 
            type="text" 
            className="flex-1 border rounded-l px-2 py-1"
            placeholder="Type a message..."
            style={{ borderColor: `#${theme.borderColor}` }}
          />
          <button 
            className="px-3 py-1 rounded-r text-white"
            style={{ backgroundColor: `#${theme.borderColor}` }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * RequestsPage - Content for the requests window
 */
export const RequestsPage = () => {
  const { theme } = useTheme();
  
  return (
    <div className="p-6">
      <h1 
        className="text-2xl font-bold mb-4"
        style={{ color: `#${theme.borderColor}` }}
      >
        My Requests
      </h1>
      
      <div className="space-y-4">
        {['Pokemon Cards', 'Gundam Model', 'Nintendo Limited Edition', 'Manga Collection'].map((item) => (
          <div 
            key={item}
            className="border p-4 rounded"
            style={{ 
              borderColor: `#${theme.borderColor}60`,
              backgroundColor: `#${theme.bgColor}20`
            }}
          >
            <h3 
              className="font-bold text-lg"
              style={{ color: `#${theme.borderColor}` }}
            >
              {item}
            </h3>
            <p className="opacity-80 text-sm">
              Status: <span style={{ color: `#${theme.borderColor}` }}>In Progress</span>
            </p>
            <div className="mt-2 flex justify-end">
              <button 
                className="px-3 py-1 text-sm mr-2 border rounded"
                style={{ 
                  borderColor: `#${theme.borderColor}60`,
                  color: `#${theme.borderColor}`
                }}
              >
                View Details
              </button>
              <button 
                className="px-3 py-1 text-sm text-white rounded"
                style={{ backgroundColor: `#${theme.borderColor}` }}
              >
                Track Progress
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * FavoritesPage - Content for the favorites window
 */
export const FavoritesPage = () => {
  const { theme } = useTheme();
  
  return (
    <div className="p-6">
      <h1 
        className="text-2xl font-bold mb-4"
        style={{ color: `#${theme.borderColor}` }}
      >
        My Favorites
      </h1>
      
      <div className="grid grid-cols-2 gap-4">
        {['Anime Figurine', 'Nintendo Switch Game', 'Vintage Manga', 'Studio Ghibli Collection', 'Japanese Snacks', 'Traditional Tea Set'].map((item) => (
          <div 
            key={item}
            className="border p-3 rounded flex items-center"
            style={{ 
              borderColor: `#${theme.borderColor}40`,
              backgroundColor: `#${theme.bgColor}10`
            }}
          >
            <div 
              className="w-12 h-12 rounded mr-3 flex items-center justify-center"
              style={{ backgroundColor: `#${theme.borderColor}30` }}
            >
              ♥
            </div>
            <div>
              <h3 className="font-bold">{item}</h3>
              <p className="text-sm opacity-70">Added yesterday</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * NotificationsPage - Content for the notifications window
 */
export const NotificationsPage = () => {
  const { theme } = useTheme();
  
  return (
    <div className="p-6">
      <h1 
        className="text-2xl font-bold mb-4"
        style={{ color: `#${theme.borderColor}` }}
      >
        Notifications
      </h1>
      
      <div className="space-y-2">
        {[
          'Your order has been shipped!',
          'New message from Hiroshi',
          'Payment confirmed for your last request',
          'Price alert: Item on your wishlist is now available',
          'Your shopper has found the requested item'
        ].map((notification, i) => (
          <div 
            key={i}
            className="p-3 rounded border-l-4"
            style={{ 
              borderLeftColor: `#${theme.borderColor}`,
              backgroundColor: `#${theme.bgColor}20`
            }}
          >
            <p>{notification}</p>
            <p 
              className="text-xs opacity-70 mt-1"
              style={{ color: `#${theme.borderColor}` }}
            >
              {i === 0 ? 'Just now' : i === 1 ? '5 minutes ago' : i === 2 ? '1 hour ago' : i === 3 ? 'Yesterday' : '2 days ago'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * SettingsPage - Content for the settings window
 */
export const SettingsPage = () => {
  const { theme } = useTheme();
  
  return (
    <div className="p-6">
      <h1 
        className="text-2xl font-bold mb-4"
        style={{ color: `#${theme.borderColor}` }}
      >
        Settings
      </h1>
      
      <div 
        className="border rounded p-4 mb-4"
        style={{ 
          borderColor: `#${theme.borderColor}40`,
          backgroundColor: `#${theme.bgColor}10`
        }}
      >
        <h2 
          className="text-lg font-bold mb-2"
          style={{ color: `#${theme.borderColor}` }}
        >
          Account Settings
        </h2>
        
        <div className="space-y-3">
          <div>
            <label 
              className="block text-sm font-medium mb-1"
              style={{ color: `#${theme.borderColor}` }}
            >
              Email
            </label>
            <input 
              type="email" 
              className="w-full border rounded px-3 py-2"
              defaultValue="user@example.com"
              style={{ borderColor: `#${theme.borderColor}40` }}
            />
          </div>
          
          <div>
            <label 
              className="block text-sm font-medium mb-1"
              style={{ color: `#${theme.borderColor}` }}
            >
              Password
            </label>
            <input 
              type="password" 
              className="w-full border rounded px-3 py-2"
              defaultValue="********"
              style={{ borderColor: `#${theme.borderColor}40` }}
            />
          </div>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="notifications" 
              className="mr-2"
              defaultChecked
            />
            <label htmlFor="notifications">Enable email notifications</label>
          </div>
        </div>
      </div>
      
      <div 
        className="border rounded p-4"
        style={{ 
          borderColor: `#${theme.borderColor}40`,
          backgroundColor: `#${theme.bgColor}10`
        }}
      >
        <h2 
          className="text-lg font-bold mb-2"
          style={{ color: `#${theme.borderColor}` }}
        >
          Theme Settings
        </h2>
        
        <p className="mb-2">Choose your desktop theme</p>
        
        <div className="grid grid-cols-3 gap-2">
          {['Mint & Pink', 'Neon', 'Vaporwave', 'Kawaii', 'Millennium', 'Pixel Pop'].map((themeName) => (
            <div 
              key={themeName}
              className="border p-2 rounded text-center cursor-pointer"
              style={{ 
                borderColor: themeName === 'Mint & Pink' ? `#${theme.borderColor}` : 'transparent',
                backgroundColor: themeName === 'Mint & Pink' ? `#${theme.borderColor}20` : 'transparent'
              }}
            >
              {themeName}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * HelpPage - Content for the help window
 */
export const HelpPage = () => {
  const { theme } = useTheme();
  
  return (
    <div className="p-6">
      <h1 
        className="text-2xl font-bold mb-4"
        style={{ color: `#${theme.borderColor}` }}
      >
        Help & Support
      </h1>
      
      <div 
        className="border rounded p-4 mb-4"
        style={{ 
          borderColor: `#${theme.borderColor}40`,
          backgroundColor: `#${theme.bgColor}10`
        }}
      >
        <h2 
          className="text-lg font-bold mb-2"
          style={{ color: `#${theme.borderColor}` }}
        >
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-3">
          <div>
            <h3 
              className="font-bold"
              style={{ color: `#${theme.borderColor}` }}
            >
              How do I create a new request?
            </h3>
            <p className="text-sm">
              To create a new request, click on the "Create Request" button on your dashboard or go to Requests → New Request.
            </p>
          </div>
          
          <div>
            <h3 
              className="font-bold"
              style={{ color: `#${theme.borderColor}` }}
            >
              How do payments work?
            </h3>
            <p className="text-sm">
              We use secure payment processing. You'll only be charged when a shopper has found your item and you approve the purchase.
            </p>
          </div>
          
          <div>
            <h3 
              className="font-bold"
              style={{ color: `#${theme.borderColor}` }}
            >
              What if my item gets lost during shipping?
            </h3>
            <p className="text-sm">
              All shipments are insured. If your item gets lost, please contact support and we'll help resolve the issue.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="mb-2">Still need help?</p>
        <button 
          className="px-4 py-2 rounded text-white font-bold"
          style={{ backgroundColor: `#${theme.borderColor}` }}
        >
          Contact Support
        </button>
      </div>
    </div>
  );
};

// Export the Home page
export { HomePage };