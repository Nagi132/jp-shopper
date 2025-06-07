'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { useApp } from '@/contexts/AppContext';
import { getThemeStyles } from '@/lib/theme-utils';
import { WindowLoadingState, WindowErrorState, WindowEmptyState, WindowSearchEmptyState } from '@/components/ui/window-states';
import { WindowContainer, WindowSection } from '@/components/ui/window-container';
import { WindowButton } from '@/components/ui/window-button';
import { 
  MessageSquare, Search, ChevronRight, 
  RefreshCw, User, Clock, Check, Circle, Send
} from 'lucide-react';

/**
 * MessagesPage - Windows-styled messaging center component
 * Used in both Window and standalone contexts
 */
const MessagesPage = ({ isWindowView = true }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  
  const router = useRouter();
  const { theme } = useTheme();
  const { openWindow } = useApp();
  
  // Get theme styles using utility functions
  const themeStyles = getThemeStyles(theme);
  const primaryStyles = getThemeStyles(theme, 'primary');
  const mutedStyles = getThemeStyles(theme, 'muted');
  
  // Legacy theme variables for components that haven't been updated yet
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';

  // Load user and conversations
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!isWindowView) {
            router.push('/login');
          }
          return;
        }
        
        setUser(user);
        
        // Get user's request IDs (both as customer and shopper)
        const { data: customerRequests } = await supabase
          .from('requests')
          .select('id, title, status')
          .eq('customer_id', user.id);
          
        // Get shopper profile
        const { data: shopperProfile } = await supabase
          .from('shopper_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        // Get requests where user is shopper
        let shopperRequests = [];
        if (shopperProfile?.id) {
          const { data: shopperReqs } = await supabase
            .from('requests')
            .select('id, title, status')
            .eq('shopper_id', shopperProfile.id);
            
          shopperRequests = shopperReqs || [];
        }
        
        // Combine all request IDs
        const allRequests = [...(customerRequests || []), ...shopperRequests];
        
        // If no requests, we have no conversations
        if (allRequests.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }
        
        // For each request, get last message and other party's info
        const conversationsData = await Promise.all(
          allRequests.map(async (request) => {
            // Get last message for this request
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('*')
              .eq('request_id', request.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
              
            // Skip if no messages
            if (!lastMessage) return null;
            
            // Determine other party (customer or shopper)
            const isCustomer = request.customer_id === user.id;
            const otherPartyId = isCustomer 
              ? lastMessage.sender_id === user.id 
                ? lastMessage.recipient_id 
                : lastMessage.sender_id
              : request.customer_id;
              
            // Get other party's profile
            const { data: otherProfile } = await supabase
              .from('profiles')
              .select('username, full_name')
              .eq('user_id', otherPartyId)
              .maybeSingle();
              
            // Count unread messages
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('id', { count: 'exact' })
              .eq('request_id', request.id)
              .eq('recipient_id', user.id)
              .eq('is_read', false);
              
            return {
              requestId: request.id,
              requestTitle: request.title,
              requestStatus: request.status,
              otherPartyName: otherProfile?.full_name || otherProfile?.username || 'Unknown User',
              lastMessage: lastMessage,
              unreadCount: unreadCount || 0,
              isCustomer: isCustomer
            };
          })
        );
        
        // Filter out null values and sort by last message date
        const validConversations = conversationsData
          .filter(Boolean)
          .sort((a, b) => 
            new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
          );
          
        setConversations(validConversations);
        
        // If we have conversations and none is active, select the first one
        if (validConversations.length > 0 && !activeConversation) {
          setActiveConversation(validConversations[0]);
          await loadConversationMessages(validConversations[0].requestId, user.id);
        }
        
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [router, isWindowView, activeConversation?.requestId]);

  // Load messages for a specific conversation
  const loadConversationMessages = async (requestId, userId) => {
    try {
      // Get all messages for this request
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      setMessages(messagesData || []);
      
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('request_id', requestId)
        .eq('recipient_id', userId)
        .eq('is_read', false);
        
      // Update unread count in conversations
      setConversations(prev => 
        prev.map(conv => 
          conv.requestId === requestId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
      
    } catch (err) {
      console.error('Error loading conversation messages:', err);
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Re-load everything
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      if (activeConversation) {
        await loadConversationMessages(activeConversation.requestId, user.id);
      }
      
      // Reload conversations
      const { data: customerRequests } = await supabase
        .from('requests')
        .select('id, title, status')
        .eq('customer_id', user.id);
        
      // Get shopper profile
      const { data: shopperProfile } = await supabase
        .from('shopper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
        
      // Get requests where user is shopper
      let shopperRequests = [];
      if (shopperProfile?.id) {
        const { data: shopperReqs } = await supabase
          .from('requests')
          .select('id, title, status')
          .eq('shopper_id', shopperProfile.id);
          
        shopperRequests = shopperReqs || [];
      }
      
      // Combine all request IDs
      const allRequests = [...(customerRequests || []), ...shopperRequests];
      
      // If no requests, we have no conversations
      if (allRequests.length === 0) {
        setConversations([]);
        return;
      }
      
      // For each request, get last message and other party's info
      const conversationsData = await Promise.all(
        allRequests.map(async (request) => {
          // Get last message for this request
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('request_id', request.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          // Skip if no messages
          if (!lastMessage) return null;
          
          // Determine other party (customer or shopper)
          const isCustomer = request.customer_id === user.id;
          const otherPartyId = isCustomer 
            ? lastMessage.sender_id === user.id 
              ? lastMessage.recipient_id 
              : lastMessage.sender_id
            : request.customer_id;
            
          // Get other party's profile
          const { data: otherProfile } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('user_id', otherPartyId)
            .maybeSingle();
            
          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact' })
            .eq('request_id', request.id)
            .eq('recipient_id', user.id)
            .eq('is_read', false);
            
          return {
            requestId: request.id,
            requestTitle: request.title,
            requestStatus: request.status,
            otherPartyName: otherProfile?.full_name || otherProfile?.username || 'Unknown User',
            lastMessage: lastMessage,
            unreadCount: unreadCount || 0,
            isCustomer: isCustomer
          };
        })
      );
      
      // Filter out null values and sort by last message date
      const validConversations = conversationsData
        .filter(Boolean)
        .sort((a, b) => 
          new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
        );
        
      setConversations(validConversations);
      
    } catch (err) {
      console.error('Error refreshing messages:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle selecting a conversation
  const handleSelectConversation = async (conversation) => {
    setActiveConversation(conversation);
    if (user) {
      await loadConversationMessages(conversation.requestId, user.id);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeConversation) return;
    
    setSendingMessage(true);
    
    try {
      // Determine recipient
      // This simplified logic assumes there are only two parties in a conversation
      const recipientId = messages.length > 0
        ? messages[0].sender_id === user.id 
          ? messages[0].recipient_id 
          : messages[0].sender_id
        : null;
        
      if (!recipientId) {
        throw new Error('Unable to determine message recipient');
      }
      
      // Send the message
      const { error } = await supabase
        .from('messages')
        .insert({
          request_id: activeConversation.requestId,
          sender_id: user.id,
          recipient_id: recipientId,
          message: newMessage.trim(),
          is_read: false
        });
        
      if (error) throw error;
      
      // Clear the input
      setNewMessage('');
      
      // Refresh messages
      await loadConversationMessages(activeConversation.requestId, user.id);
      
      // Update last message in conversations
      const now = new Date().toISOString();
      setConversations(prev => 
        prev.map(conv => 
          conv.requestId === activeConversation.requestId 
            ? { 
                ...conv, 
                lastMessage: {
                  ...conv.lastMessage,
                  sender_id: user.id,
                  recipient_id: recipientId,
                  message: newMessage.trim(),
                  created_at: now
                } 
              } 
            : conv
        ).sort((a, b) => 
          new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
        )
      );
      
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // View request details
  const handleViewRequest = (requestId) => {
    if (isWindowView) {
      openWindow(`request-${requestId}`, 'RequestDetailPage', `Request #${requestId}`);
    } else {
      router.push(`/requests/${requestId}`);
    }
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const search = searchQuery.toLowerCase();
    return (
      conversation.requestTitle?.toLowerCase().includes(search) ||
      conversation.otherPartyName?.toLowerCase().includes(search)
    );
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format different depending on how recent the message is
    if (date.toDateString() === now.toDateString()) {
      // Today - show time only
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      // Yesterday
      return 'Yesterday';
    } else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      // Within the last week - show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Format message time
  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show loading indicator
  if (loading) {
    return (
      <WindowLoadingState 
        message="Loading your messages..."
        size="lg"
      />
    );
  }

  // Show error
  if (error) {
    return (
      <WindowErrorState
        title="Error Loading Messages"
        message={error}
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <WindowContainer>
      {/* Header */}
      <div 
        className="py-3 px-4 flex items-center justify-between border-b"
        style={mutedStyles}
      >
        <div className="flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" style={{ color: themeStyles.color }} />
          <h2 className="text-lg font-semibold" style={{ color: themeStyles.color }}>Messages</h2>
        </div>
        
        <WindowButton
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </WindowButton>
      </div>
      
      {/* Split view for conversations and messages */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Conversations list */}
        <div 
          className="w-1/3 border-r flex flex-col overflow-hidden"
          style={{ borderColor: `#${borderColor}40` }}
        >
          {/* Search bar */}
          <div 
            className="p-2 border-b"
            style={{ borderColor: `#${borderColor}40` }}
          >
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-sm"
                style={{ borderColor: `#${borderColor}40` }}
              />
            </div>
          </div>
          
          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              searchQuery ? (
                <WindowSearchEmptyState
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery('')}
                />
              ) : (
                <WindowEmptyState
                  icon={MessageSquare}
                  title="No conversations yet"
                  message="Start a conversation by creating a request or accepting one as a shopper."
                  actionLabel="Browse Requests"
                  onAction={() => router.push('/requests')}
                />
              )
            ) : (
              <div className="divide-y" style={{ borderColor: `#${borderColor}30` }}>
                {filteredConversations.map((conversation) => (
                  <div 
                    key={conversation.requestId}
                    className={`p-3 cursor-pointer flex hover:bg-gray-50 ${
                      activeConversation?.requestId === conversation.requestId 
                        ? `bg-[#${borderColor}10]` 
                        : ''
                    }`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    {/* Avatar placeholder */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                      style={{ 
                        backgroundColor: `#${borderColor}30`,
                        color: `#${borderColor}`
                      }}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium truncate">
                          {conversation.otherPartyName}
                        </h4>
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {formatDate(conversation.lastMessage.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage.sender_id === user?.id ? (
                          <span className="text-xs text-gray-400 mr-1">You:</span>
                        ) : null}
                        {conversation.lastMessage.message}
                      </p>
                      
                      <div className="flex justify-between items-center mt-1">
                        <span 
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: `#${borderColor}20`,
                            color: `#${borderColor}`
                          }}
                        >
                          {conversation.requestTitle}
                        </span>
                        
                        {conversation.unreadCount > 0 && (
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                            style={{ backgroundColor: `#${borderColor}` }}
                          >
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Active conversation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeConversation ? (
            <>
              {/* Conversation header */}
              <div 
                className="p-3 border-b flex justify-between items-center"
                style={{ 
                  backgroundColor: `#${bgColor}20`,
                  borderColor: `#${borderColor}40` 
                }}
              >
                <div>
                  <h3 className="font-medium">{activeConversation.otherPartyName}</h3>
                  <p className="text-xs text-gray-500">
                    {activeConversation.requestTitle} • 
                    <span className="capitalize ml-1">{activeConversation.requestStatus}</span>
                  </p>
                </div>
                
                <button
                  className="flex items-center text-sm px-2 py-1 rounded-sm"
                  style={{ 
                    backgroundColor: `#${borderColor}20`,
                    color: `#${borderColor}`,
                    border: `1px solid #${borderColor}40`
                  }}
                  onClick={() => handleViewRequest(activeConversation.requestId)}
                >
                  View Request
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = message.sender_id === user?.id;
                    return (
                      <div 
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            isCurrentUser ? '' : ''
                          }`}
                          style={{ 
                            backgroundColor: isCurrentUser ? `#${borderColor}30` : `#${bgColor}30`,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: isCurrentUser ? `#${borderColor}30` : `#${bgColor}40`
                          }}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          <div className="flex items-center justify-end mt-1 space-x-1">
                            <span className="text-xs opacity-60">
                              {formatMessageTime(message.created_at)}
                            </span>
                            {isCurrentUser && (
                              <div className="text-xs opacity-70">
                                {message.is_read ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Circle className="w-3 h-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message input */}
              <form 
                className="p-2 border-t flex"
                style={{ borderColor: `#${borderColor}40` }}
                onSubmit={handleSendMessage}
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-1.5 text-sm border rounded-sm"
                  style={{ borderColor: `#${borderColor}40` }}
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  className="ml-2 px-3 py-1.5 text-sm rounded-sm"
                  style={{ 
                    backgroundColor: `#${borderColor}`,
                    color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
                    border: `1px solid #${borderColor}`,
                  }}
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <MessageSquare className="w-16 h-16 mb-3 opacity-20" />
              <p className="text-lg font-medium mb-1">No conversation selected</p>
              <p className="text-sm text-gray-500">
                Select a conversation from the list to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Status bar */}
      <div 
        className="h-5 text-xs px-2 flex items-center justify-between"
        style={{ 
          backgroundColor: `#${bgColor}20`,
          borderTop: `1px solid #${borderColor}40`
        }}
      >
        <span>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </span>
        <span>
          {activeConversation ? `Request #${activeConversation.requestId}` : 'No active conversation'}
        </span>
      </div>
    </WindowContainer>
  );
};

export default MessagesPage;