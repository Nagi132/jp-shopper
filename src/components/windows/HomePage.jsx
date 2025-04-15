'use client';

import React from 'react';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { Card } from '@/components/ui/card';
import { ShoppingBag, Heart, MessageSquare, Clock } from 'lucide-react';

/**
 * HomePage - Content for the home window
 */
const HomePage = () => {
  const { theme } = useTheme();
  
  // Get contrasting text color for the current theme
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
  
  // Quick stats for the dashboard
  const stats = [
    { icon: <ShoppingBag />, label: 'Active Requests', value: '3' },
    { icon: <Heart />, label: 'Favorites', value: '12' },
    { icon: <MessageSquare />, label: 'Messages', value: '5' },
    { icon: <Clock />, label: 'Recent Items', value: '24' }
  ];

  return (
    <div className="p-6 h-full overflow-auto">
      <h1 
        className="text-2xl font-bold mb-4"
        style={{ color: `#${theme.borderColor}` }}
      >
        Welcome to JapanShopper
      </h1>
      
      <p 
        className="mb-6"
        style={{ color: `#${textColor}` }}
      >
        Your personal shopping assistant for items from Japan.
      </p>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card 
            key={index}
            className="p-4 flex items-center border-l-4"
            style={{ 
              borderLeftColor: `#${theme.borderColor}`,
              backgroundColor: `#${theme.bgColor}20`,
              color: `#${textColor}`
            }}
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
              style={{ 
                backgroundColor: `#${theme.borderColor}20`,
                color: `#${theme.borderColor}`
              }}
            >
              {stat.icon}
            </div>
            <div>
              <h3 className="font-bold">{stat.label}</h3>
              <p className="text-2xl font-light">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Quick Actions */}
      <div 
        className="rounded-md p-4 mb-6"
        style={{ 
          backgroundColor: `#${theme.borderColor}10`,
          borderLeft: `4px solid #${theme.borderColor}`
        }}
      >
        <h2 
          className="text-lg font-bold mb-2"
          style={{ color: `#${theme.borderColor}` }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <QuickActionButton 
            label="New Request" 
            theme={theme}
            onClick={() => alert('New Request')}
          />
          <QuickActionButton 
            label="Browse Items" 
            theme={theme}
            onClick={() => alert('Browse Items')}
          />
          <QuickActionButton 
            label="Messages" 
            theme={theme}
            onClick={() => alert('Messages')}
          />
          <QuickActionButton 
            label="My Profile" 
            theme={theme}
            onClick={() => alert('My Profile')}
          />
          <QuickActionButton 
            label="Favorites" 
            theme={theme}
            onClick={() => alert('Favorites')}
          />
          <QuickActionButton 
            label="Settings" 
            theme={theme}
            onClick={() => alert('Settings')}
          />
        </div>
      </div>
      
      {/* Recent Activity */}
      <div>
        <h2 
          className="text-lg font-bold mb-2"
          style={{ color: `#${theme.borderColor}` }}
        >
          Recent Activity
        </h2>
        <div 
          className="border rounded-md p-2"
          style={{ 
            borderColor: `#${theme.borderColor}40`,
            backgroundColor: `#${theme.bgColor}10`
          }}
        >
          <ActivityItem 
            text="New message received regarding your Gundam figure request" 
            time="5m ago"
            theme={theme}
          />
          <ActivityItem 
            text="Your shopping request for Pokemon cards has been accepted"
            time="2h ago" 
            theme={theme}
          />
          <ActivityItem 
            text="Payment successful for Nintendo Limited Edition item"
            time="Yesterday" 
            theme={theme}
          />
          <ActivityItem 
            text="New items added to your favorites"
            time="3 days ago" 
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};

// Quick action button component
const QuickActionButton = ({ label, onClick, theme }) => {
  return (
    <button
      className="py-2 px-4 rounded text-sm text-center transition-colors"
      style={{
        backgroundColor: `#${theme.borderColor}30`,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `#${theme.borderColor}60`,
        color: `#${theme.borderColor}`,
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

// Activity item component
const ActivityItem = ({ text, time, theme }) => {
  return (
    <div 
      className="py-2 px-3 mb-1 rounded"
      style={{
        backgroundColor: `#${theme.bgColor}20`,
        borderLeft: `3px solid #${theme.borderColor}`
      }}
    >
      <p className="text-sm">{text}</p>
      <span 
        className="text-xs opacity-70"
        style={{ color: `#${theme.borderColor}` }}
      >
        {time}
      </span>
    </div>
  );
};

export default HomePage;