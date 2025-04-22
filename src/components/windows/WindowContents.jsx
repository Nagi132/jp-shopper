'use client';

// Import window content components
import HomePage from './HomePage';
import ExplorePage from './ExplorePage';
import MessagesPage from './MessagesPage';
import RequestsPage from './RequestsPage';
import FavoritesPage from './FavoritesPage';
import NotificationsPage from './NotificationsPage';
import SettingsPage from './SettingsPage';
import HelpPage from './HelpPage';
import RequestDetailPage from './RequestDetailPage';
import NewRequestPage from './NewRequestPage';
import ProfilePage from './ProfilePage';

// Export all components for use in the window manager
export {
  HomePage,
  ExplorePage,
  MessagesPage,
  RequestsPage,
  FavoritesPage,
  NotificationsPage,
  SettingsPage,
  HelpPage,
  RequestDetailPage as RequestDetail, // Alias to match what's expected in WindowManager
  NewRequestPage,
  ProfilePage
};