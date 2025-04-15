'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import NavigationSidebar from '@/components/layouts/NavigationSidebar';
import WindowsDesktop from '@/components/windows/WindowsDesktop';
import { futuraCyrillicMedium, futuraCyrillicLight, futuraCyrillicBold } from '@/lib/fonts';
import ThemeProvider, { useTheme } from '@/components/layouts/ThemeProvider';
import { 
  HomePage, 
  ExplorePage, 
  MessagesPage, 
  RequestsPage,
  FavoritesPage,
  NotificationsPage,
  SettingsPage,
  HelpPage
} from '@/components/windows/WindowContents';

// Inner component that has access to the theme context
function MainLayoutInner({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          router.push('/login');
          return;
        }
        
        setUser(data.user);
        setLoading(false);
      } catch (err) {
        console.error('Error loading user profile:', err);
        setLoading(false);
      }
    };

    getUser();
  }, [router]);

  // Loading state with retro styling
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: `#${theme.bgColor}50`,
          backgroundImage: theme.pattern !== 'none' ? theme.pattern : undefined,
        }}
      >
        <div 
          className="border-2 p-8 flex flex-col items-center rounded-lg shadow-[5px_5px_0px_rgba(0,0,0,0.2)]"
          style={{
            backgroundColor: `#${theme.bgColor}`,
            borderColor: `#${theme.borderColor}`,
          }}
        >
          <div 
            className="w-10 h-10 rounded-full animate-spin mb-4"
            style={{
              borderTopWidth: '4px',
              borderRightWidth: '4px',
              borderStyle: 'solid',
              borderColor: `#${theme.borderColor}`,
              boxShadow: `0 0 10px #${theme.borderColor}80`
            }}
          ></div>
          <p className="font-futura-medium" style={{ color: `#${theme.textColor || '000000'}` }}>Loading JapanShopper...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`h-screen flex ${futuraCyrillicMedium.variable} ${futuraCyrillicLight.variable} ${futuraCyrillicBold.variable}`}
    >
      {/* Navigation Sidebar with theme */}
      <NavigationSidebar theme={theme} />
      
      {/* Main Content Area with Windows Desktop */}
      <div className="flex-1 md:ml-60">
        {/* Windows Desktop */}
        <WindowsDesktop>
          {/* All window content components */}
          <div id="HomePage">
            <HomePage />
          </div>
          
          <div id="ExplorePage">
            <ExplorePage />
          </div>
          
          <div id="MessagesPage">
            <MessagesPage />
          </div>
          
          <div id="RequestsPage">
            <RequestsPage />
          </div>
          
          <div id="FavoritesPage">
            <FavoritesPage />
          </div>
          
          <div id="NotificationsPage">
            <NotificationsPage />
          </div>
          
          <div id="SettingsPage">
            <SettingsPage />
          </div>
          
          <div id="HelpPage">
            <HelpPage />
          </div>
          
          {/* Other page content can still be rendered */}
          {children}
        </WindowsDesktop>
      </div>
    </div>
  );
}

// Outer component that provides the theme context
export default function MainLayout({ children }) {
  return (
    <ThemeProvider>
      <MainLayoutInner>
        {children}
      </MainLayoutInner>
    </ThemeProvider>
  );
}