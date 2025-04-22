'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { Bell, X, ShoppingCart, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// Mock notification data
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'request_update',
    title: 'Request Fulfilled',
    message: 'Your request for "Japanese Snack Box" has been fulfilled.',
    icon: <ShoppingCart className="w-5 h-5 text-green-600" />,
    timestamp: '2023-09-15T14:30:00Z',
    read: false
  },
  {
    id: 2,
    type: 'message',
    title: 'New Message',
    message: 'You have a new message from TokyoShopper88.',
    icon: <MessageSquare className="w-5 h-5 text-blue-600" />,
    timestamp: '2023-09-14T09:15:00Z',
    read: false
  },
  {
    id: 3,
    type: 'warning',
    title: 'Payment Issue',
    message: 'There was an issue processing your payment for order #12345.',
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    timestamp: '2023-09-13T22:45:00Z',
    read: true
  },
  {
    id: 4,
    type: 'info',
    title: 'Account Verified',
    message: 'Your account has been successfully verified. You now have full access.',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    timestamp: '2023-09-10T11:20:00Z',
    read: true
  },
  {
    id: 5,
    type: 'reminder',
    title: 'Shipping Soon',
    message: 'Your order #54321 will be shipped tomorrow.',
    icon: <Clock className="w-5 h-5 text-purple-600" />,
    timestamp: '2023-09-08T16:50:00Z',
    read: true
  }
];

const NotificationsPage = ({ isWindowView = true }) => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState('all');
  
  // Format timestamp to local date and time
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Mark a notification as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Delete a notification
  const deleteNotification = (id) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };

  // Filter notifications
  const filteredNotifications = filter === 'all' 
    ? notifications
    : filter === 'unread'
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.read);

  // Get count of unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div 
      className={`${isWindowView ? 'p-4' : 'p-6 bg-white rounded-lg shadow'}`}
      style={isWindowView ? { backgroundColor: `#${theme.bgColor}` } : {}}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: `#${theme.textColor}` }}>
          <Bell className="w-5 h-5" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span 
              className="ml-2 px-2 py-0.5 text-xs rounded-full"
              style={{ 
                backgroundColor: `#${theme.borderColor}`,
                color: 'white' 
              }}
            >
              {unreadCount}
            </span>
          )}
        </h1>
        
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-sm border rounded p-1"
            style={{
              backgroundColor: `#${theme.bgColor}`,
              color: `#${theme.textColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-xs"
            style={{
              backgroundColor: `#${theme.buttonBgColor}`,
              color: `#${theme.textColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            Mark All as Read
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div 
            className="p-4 text-center border rounded"
            style={{ 
              borderColor: `#${theme.borderColor}`,
              color: `#${theme.textColor}`
            }}
          >
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No notifications to display.</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`border px-4 py-3 rounded-sm flex items-start ${notification.read ? 'opacity-80' : ''}`}
              style={{ 
                backgroundColor: notification.read ? `#${theme.bgColor}` : `#${theme.borderColor}10`,
                borderColor: `#${theme.borderColor}`,
                borderLeftWidth: !notification.read ? '4px' : '1px',
              }}
            >
              <div className="flex-shrink-0 mr-3 mt-1">
                {notification.icon}
              </div>
              
              <div className="flex-1" style={{ color: `#${theme.textColor}` }}>
                <div className="flex justify-between">
                  <h3 className="font-medium">{notification.title}</h3>
                  <span className="text-xs opacity-70">{formatTimestamp(notification.timestamp)}</span>
                </div>
                <p className="text-sm mt-1">{notification.message}</p>
                
                <div className="flex justify-between mt-2">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => markAsRead(notification.id)}
                      style={{ color: `#${theme.borderColor}` }}
                    >
                      Mark as read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs ml-auto"
                    onClick={() => deleteNotification(notification.id)}
                    style={{ color: `#${theme.textColor}80` }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Windows 2000 action bar */}
      <div 
        className="mt-4 pt-4 border-t flex justify-end"
        style={{ borderColor: `#${theme.borderColor}` }}
      >
        <Button
          variant="outline"
          className="text-sm"
          style={{
            backgroundColor: `#${theme.buttonBgColor}`,
            color: `#${theme.textColor}`,
            borderColor: `#${theme.borderColor}`
          }}
        >
          Notification Settings
        </Button>
      </div>
    </div>
  );
};

export default NotificationsPage;