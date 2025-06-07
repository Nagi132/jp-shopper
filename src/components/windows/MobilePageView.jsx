'use client';

import React, { useState } from 'react';
import { ArrowLeft, Menu, User, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import MobileDesktopIcons from './MobileDesktopIcons';
import MobileTaskbar from './MobileTaskbar';
import PersonalizationDialog from './PersonalizationDialog';

// Import page components
import { 
  HomePage,
  ExplorePage,
  MessagesPage,
  RequestsPage,
  FavoritesPage,
  NotificationsPage,
  SettingsPage,
  HelpPage,
  ProfilePage,
  NewRequestPage
} from './WindowContents';

/**
 * MobilePageView - Mobile-friendly desktop experience
 * Shows desktop icons, taskbar, and theme customization optimized for touch
 */
const MobilePageView = ({ pathname, theme }) => {
  const router = useRouter();
  const { openWindow } = useApp();
  const [showPersonalization, setShowPersonalization] = useState(false);

  // Route to component mapping
  const routeToComponent = {
    '/dashboard': { component: HomePage, title: 'Home' },
    '/explore': { component: ExplorePage, title: 'Explore' },
    '/requests': { component: RequestsPage, title: 'Requests' },
    '/requests/new': { component: NewRequestPage, title: 'Create Request' },
    '/messages': { component: MessagesPage, title: 'Messages' },
    '/favorites': { component: FavoritesPage, title: 'Favorites' },
    '/notifications': { component: NotificationsPage, title: 'Notifications' },
    '/profile': { component: ProfilePage, title: 'Profile' },
    '/settings': { component: SettingsPage, title: 'Settings' },
    '/help': { component: HelpPage, title: 'Help' }
  };

  // Mobile desktop items (touch-optimized)
  const mobileDesktopItems = [
    { 
      id: 'home', 
      name: 'Home', 
      icon: '/icons/home.svg', 
      route: '/dashboard',
      component: 'HomePage',
      title: 'Home'
    },
    { 
      id: 'explore', 
      name: 'Explore', 
      icon: '/icons/explore.svg', 
      route: '/explore',
      component: 'ExplorePage',
      title: 'Explore'
    },
    { 
      id: 'requests', 
      name: 'Requests', 
      icon: '/icons/requests.svg', 
      route: '/requests',
      component: 'RequestsPage',
      title: 'Requests'
    },
    { 
      id: 'messages', 
      name: 'Messages', 
      icon: '/icons/messages.svg', 
      route: '/messages',
      component: 'MessagesPage',
      title: 'Messages'
    },
    { 
      id: 'favorites', 
      name: 'Favorites', 
      icon: '/icons/favorites.svg', 
      route: '/favorites',
      component: 'FavoritesPage',
      title: 'Favorites'
    },
    { 
      id: 'profile', 
      name: 'Profile', 
      icon: '/icons/profile.svg', 
      route: '/profile',
      component: 'ProfilePage',
      title: 'Profile'
    },
    { 
      id: 'settings', 
      name: 'Settings', 
      icon: '/icons/settings.svg', 
      route: '/settings',
      component: 'SettingsPage',
      title: 'Settings'
    }
  ];

  // Get current page info
  const currentPage = routeToComponent[pathname];
  const PageComponent = currentPage?.component;
  const pageTitle = currentPage?.title;

  // Show desktop if no specific route matches or on home routes
  const showMobileDesktop = pathname === '/desktop' || pathname === '/' || pathname === '/dashboard' || !currentPage;

  // Handle back navigation
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/desktop');
    }
  };

  // Handle desktop icon tap
  const handleIconTap = (item) => {
    // Navigate to the route for mobile
    router.push(item.route);
  };

  // Mobile header component for pages
  const MobilePageHeader = ({ title }) => (
    <div 
      className="flex items-center justify-between p-4 border-b sticky top-0 z-10"
      style={{
        backgroundColor: `#${theme?.bgColor || 'ECE9D8'}`,
        borderColor: `#${theme?.borderColor || '69EFD7'}`,
        color: `#${theme?.textColor || '000000'}`
      }}
    >
      <div className="flex items-center">
        <button
          onClick={handleBack}
          className="p-2 rounded mr-2 border-2"
          style={{
            backgroundColor: `#${theme?.borderColor || '69EFD7'}20`,
            borderColor: `#${theme?.borderColor || '69EFD7'}`,
            color: `#${theme?.textColor || '000000'}`
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      
      <button
        onClick={() => setShowPersonalization(true)}
        className="p-2 rounded border-2"
        style={{
          backgroundColor: `#${theme?.borderColor || '69EFD7'}20`,
          borderColor: `#${theme?.borderColor || '69EFD7'}`,
          color: `#${theme?.textColor || '000000'}`
        }}
      >
        <Palette className="w-5 h-5" />
      </button>
    </div>
  );

  // Get desktop style for mobile
  const getMobileDesktopStyle = () => {
    const baseStyle = {
      backgroundColor: `#${theme?.bgColor || 'ECE9D8'}`,
    };

    // Handle background patterns and images
    if (theme?.pattern && theme.pattern !== 'none') {
      if (theme.pattern.startsWith('data:image/') || theme.pattern.startsWith('/desktop/')) {
        // Handle image backgrounds
        baseStyle.backgroundImage = `url(${theme.pattern})`;
        baseStyle.backgroundSize = 'cover';
        baseStyle.backgroundPosition = 'center';
        baseStyle.backgroundRepeat = 'no-repeat';
      } else {
        // Handle CSS pattern backgrounds
        baseStyle.backgroundImage = theme.pattern;
        baseStyle.backgroundSize = '20px 20px';
        baseStyle.backgroundRepeat = 'repeat';
      }
    }

    return baseStyle;
  };

  // Mobile desktop view
  const MobileDesktopView = () => (
    <div 
      className="h-full flex flex-col relative"
      style={getMobileDesktopStyle()}
    >
      {/* Desktop header with theme customization */}
      <div 
        className="flex items-center justify-between p-4 border-b"
        style={{
          backgroundColor: `#${theme?.bgColor || 'ECE9D8'}80`,
          borderColor: `#${theme?.borderColor || '69EFD7'}`,
          color: `#${theme?.textColor || '000000'}`
        }}
      >
        <h1 className="text-xl font-bold">JapanShopper</h1>
        <button
          onClick={() => setShowPersonalization(true)}
          className="p-2 rounded border-2"
          style={{
            backgroundColor: `#${theme?.borderColor || '69EFD7'}20`,
            borderColor: `#${theme?.borderColor || '69EFD7'}`,
            color: `#${theme?.textColor || '000000'}`
          }}
        >
          <Palette className="w-5 h-5" />
        </button>
      </div>
      
      {/* Mobile Desktop Icons */}
      <div className="flex-1 overflow-auto p-4">
        <MobileDesktopIcons
          items={mobileDesktopItems}
          onIconTap={handleIconTap}
          theme={theme}
        />
      </div>
      
      {/* Mobile Taskbar */}
      <MobileTaskbar theme={theme} />
    </div>
  );

  if (showMobileDesktop) {
    return (
      <>
        <MobileDesktopView />
        
        {/* Personalization Dialog */}
        {showPersonalization && (
          <PersonalizationDialog
            onClose={() => setShowPersonalization(false)}
            theme={theme}
            isMobile={true}
          />
        )}
      </>
    );
  }

  // Page view
  return (
    <>
      <div 
        className="h-full flex flex-col"
        style={{
          backgroundColor: `#${theme?.bgColor || 'ECE9D8'}10`,
          color: `#${theme?.textColor || '000000'}`
        }}
      >
        {/* Mobile Page Header */}
        <MobilePageHeader title={pageTitle} />
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <PageComponent isWindowView={false} />
        </div>
      </div>
      
      {/* Personalization Dialog */}
      {showPersonalization && (
        <PersonalizationDialog
          onClose={() => setShowPersonalization(false)}
          theme={theme}
          isMobile={true}
        />
      )}
    </>
  );
};

export default MobilePageView;