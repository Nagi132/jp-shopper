'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { useApp } from '@/contexts/AppContext';
import { useDialog } from '@/components/windows/MessageBox';
import { 
  Loader2, AlertCircle, CheckCircle, Clock, User, ShoppingBag, Truck, 
  MessageSquare, DollarSign, X, ExternalLink, ArrowLeft, ThumbsUp
} from 'lucide-react';

/**
 * RequestDetailPage - Windows-styled component to display request details
 * Used in both Window and standalone contexts
 */
const RequestDetailPage = ({ requestId, isWindowView = true }) => {
  // Clean the ID (remove 'request-' prefix if present)
  const cleanId = requestId?.startsWith('request-') 
    ? requestId.replace('request-', '') 
    : requestId;
    
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCustomer, setIsCustomer] = useState(false);
  const [isShopper, setIsShopper] = useState(false);
  const [shopperName, setShopperName] = useState(null);
  const [user, setUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const router = useRouter();
  const { theme } = useTheme();
  const { openWindow } = useApp();
  const { showConfirm, showInfo, showError } = useDialog();
  
  // Get theme colors
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
  // Determine text color based on background color
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
  
  const textColor = theme?.textColor || getContrastText(bgColor);

  // Load request data
  useEffect(() => {
    const fetchRequestData = async () => {
      if (!cleanId) return;
      
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
        
        // Fetch the request
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .eq('id', cleanId)
          .single();
          
        if (error) throw error;
        if (!data) throw new Error('Request not found');
        
        setRequest(data);
        
        // Determine if current user is the customer
        setIsCustomer(user.id === data.customer_id);
        
        // If request has a shopper, determine if current user is the shopper
        if (data.shopper_id) {
          // Get the shopper profile
          const { data: shopperProfile, error: shopperProfileError } = await supabase
            .from('shopper_profiles')
            .select('user_id')
            .eq('id', data.shopper_id)
            .single();
            
          if (!shopperProfileError && shopperProfile) {
            // Check if current user is the shopper
            setIsShopper(user.id === shopperProfile.user_id);
            
            // Get shopper name for display
            try {
              const { data: shopperUserProfile } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('user_id', shopperProfile.user_id)
                .single();
                
              if (shopperUserProfile) {
                setShopperName(shopperUserProfile.full_name || shopperUserProfile.username);
              }
            } catch (err) {
              console.error('Error fetching shopper name:', err);
            }
          }
        }
        
        // Fetch messages if request is assigned or further
        if (data.status !== 'open' && data.status !== 'cancelled') {
          fetchMessages(cleanId);
        }
        
      } catch (err) {
        console.error('Error fetching request:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequestData();
  }, [cleanId, router, isWindowView]);
  
  // Fetch messages
  const fetchMessages = async (requestId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      setMessages(data || []);
      
      // Mark messages as read if they're not from the current user
      if (user) {
        const unreadMessages = data?.filter(msg => 
          msg.sender_id !== user.id && !msg.is_read
        ) || [];
        
        if (unreadMessages.length > 0) {
          // Update messages to mark them as read
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map(msg => msg.id));
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };
  
  // Send a new message
  const sendMessage = async (e) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || !user || !request) return;
    
    setSendingMessage(true);
    
    try {
      // Determine the recipient
      const recipientId = isCustomer ? 
        (shopperProfile ? shopperProfile.user_id : null) : 
        request.customer_id;
        
      if (!recipientId) {
        throw new Error('Recipient not found');
      }
      
      // Create the message
      const { error } = await supabase
        .from('messages')
        .insert({
          request_id: cleanId,
          sender_id: user.id,
          recipient_id: recipientId,
          message: newMessage.trim(),
          is_read: false
        });
        
      if (error) throw error;
      
      // Clear the message input
      setNewMessage('');
      
      // Refresh messages
      fetchMessages(cleanId);
      
    } catch (err) {
      console.error('Error sending message:', err);
      showError('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Update request status
  const handleUpdateStatus = async (newStatus) => {
    const confirmMessage = `Are you sure you want to mark this request as ${newStatus}?`;
    const result = await showConfirm(confirmMessage);
    
    if (result !== 'OK') return;
    
    setActionLoading(true);
    
    try {
      // Create update data object
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // Special handling for different status transitions
      if (newStatus === 'purchased' && request?.status === 'paid') {
        // No special fields needed
      }
      else if (newStatus === 'shipped' && request?.status === 'purchased') {
        // For simplicity, we'll just update the status
        // In a real app, this would include shipping verification
      }
      
      // Execute the update
      const { error } = await supabase
        .from('requests')
        .update(updateData)
        .eq('id', cleanId);
        
      if (error) throw error;
      
      // Update local state
      setRequest(prev => ({
        ...prev,
        ...updateData
      }));
      
      showInfo(`Request has been marked as ${newStatus}`);
      
    } catch (err) {
      console.error(`Error updating request status:`, err);
      showError(`Failed to update request status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Cancel request
  const handleCancelRequest = async () => {
    const result = await showConfirm('Are you sure you want to cancel this request?');
    if (result !== 'OK') return;
    
    setActionLoading(true);
    
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'cancelled' })
        .eq('id', cleanId);
        
      if (error) throw error;
      
      // Update local state
      setRequest(prev => ({ ...prev, status: 'cancelled' }));
      showInfo('Request has been cancelled');
      
    } catch (err) {
      console.error('Error cancelling request:', err);
      showError('Failed to cancel request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle shopper accepting request
  const handleAcceptRequest = async () => {
    const result = await showConfirm('Are you sure you want to accept this request?');
    if (result !== 'OK') return;
    
    setActionLoading(true);
    
    try {
      // Get shopper profile id
      const { data: shopperProfile, error: profileError } = await supabase
        .from('shopper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Update the request
      const { error } = await supabase
        .from('requests')
        .update({ 
          shopper_id: shopperProfile.id,
          status: 'assigned'
        })
        .eq('id', cleanId);
        
      if (error) throw error;
      
      // Fetch updated request data
      const { data: updatedRequest } = await supabase
        .from('requests')
        .select('*')
        .eq('id', cleanId)
        .single();
        
      if (updatedRequest) {
        setRequest(updatedRequest);
        setIsShopper(true);
      }
      
      showInfo('You have successfully accepted this request!');
      
    } catch (err) {
      console.error('Error accepting request:', err);
      showError('Failed to accept request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Go back
  const handleGoBack = () => {
    if (isWindowView) {
      // Close this window and open requests window
      openWindow('requests', 'RequestsPage', 'My Requests', true);
    } else {
      router.push('/requests');
    }
  };
  
  // Get appropriate action buttons based on user role and request status
  const getActionButtons = () => {
    if (!request) return null;
    
    // Customer action buttons
    if (isCustomer) {
      switch (request.status) {
        case 'open':
          return (
            <button
              className="px-3 py-1.5 text-sm rounded-sm"
              style={{ 
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: '1px solid #DC2626',
                boxShadow: '1px 1px 0 rgba(0,0,0,0.1)'
              }}
              onClick={handleCancelRequest}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Cancel Request
                </>
              )}
            </button>
          );
        case 'assigned':
          return (
            <button
              className="px-3 py-1.5 text-sm rounded-sm"
              style={{ 
                backgroundColor: `#${borderColor}`,
                color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
                border: `1px solid #${borderColor}`,
                boxShadow: '1px 1px 0 rgba(0,0,0,0.1)'
              }}
              onClick={() => showInfo('Payment functionality coming soon!')}
              disabled={actionLoading}
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Make Payment
            </button>
          );
        case 'shipped':
          return (
            <button
              className="px-3 py-1.5 text-sm rounded-sm"
              style={{ 
                backgroundColor: `#${borderColor}`,
                color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
                border: `1px solid #${borderColor}`,
                boxShadow: '1px 1px 0 rgba(0,0,0,0.1)'
              }}
              onClick={() => handleUpdateStatus('completed')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Mark as Received
                </>
              )}
            </button>
          );
        default:
          return null;
      }
    }
    
    // Shopper action buttons
    if (isShopper) {
      switch (request.status) {
        case 'paid':
          return (
            <button
              className="px-3 py-1.5 text-sm rounded-sm"
              style={{ 
                backgroundColor: `#${borderColor}`,
                color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
                border: `1px solid #${borderColor}`,
                boxShadow: '1px 1px 0 rgba(0,0,0,0.1)'
              }}
              onClick={() => handleUpdateStatus('purchased')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  Mark as Purchased
                </>
              )}
            </button>
          );
        case 'purchased':
          return (
            <button
              className="px-3 py-1.5 text-sm rounded-sm"
              style={{ 
                backgroundColor: `#${borderColor}`,
                color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
                border: `1px solid #${borderColor}`,
                boxShadow: '1px 1px 0 rgba(0,0,0,0.1)'
              }}
              onClick={() => handleUpdateStatus('shipped')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 mr-1" />
                  Mark as Shipped
                </>
              )}
            </button>
          );
        default:
          return null;
      }
    }
    
    // Not customer or shopper, but request is open
    if (request.status === 'open' && !isCustomer && !isShopper) {
      return (
        <button
          className="px-3 py-1.5 text-sm rounded-sm"
          style={{ 
            backgroundColor: `#${borderColor}`,
            color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
            border: `1px solid #${borderColor}`,
            boxShadow: '1px 1px 0 rgba(0,0,0,0.1)'
          }}
          onClick={handleAcceptRequest}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-1" />
              Accept Request
            </>
          )}
        </button>
      );
    }
    
    return null;
  };
  
  // Get status badge style
  const getStatusBadge = () => {
    if (!request) return null;
    
    let bgColor, icon;
    
    switch (request.status) {
      case 'open':
        bgColor = '#22C55E';
        icon = <Clock className="w-3 h-3 mr-1" />;
        break;
      case 'assigned':
        bgColor = '#3B82F6';
        icon = <User className="w-3 h-3 mr-1" />;
        break;
      case 'paid':
        bgColor = '#8B5CF6';
        icon = <DollarSign className="w-3 h-3 mr-1" />;
        break;
      case 'purchased':
        bgColor = '#F59E0B';
        icon = <ShoppingBag className="w-3 h-3 mr-1" />;
        break;
      case 'shipped':
        bgColor = '#6366F1';
        icon = <Truck className="w-3 h-3 mr-1" />;
        break;
      case 'completed':
        bgColor = '#10B981';
        icon = <CheckCircle className="w-3 h-3 mr-1" />;
        break;
      case 'cancelled':
        bgColor = '#EF4444';
        icon = <X className="w-3 h-3 mr-1" />;
        break;
      default:
        bgColor = '#6B7280';
        icon = null;
    }
    
    return (
      <span 
        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-white"
        style={{ backgroundColor: bgColor }}
      >
        {icon}
        <span className="capitalize">{request.status}</span>
      </span>
    );
  };
  
  // Show a nice formatted date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Show loading indicator
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div 
          className="w-10 h-10 rounded-full animate-spin mb-3"
          style={{ 
            borderTopWidth: '3px',
            borderRightWidth: '3px',
            borderStyle: 'solid',
            borderColor: `#${borderColor}` 
          }}
        ></div>
        <span className="ml-2">Loading request details...</span>
      </div>
    );
  }
  
  // Show error
  if (error) {
    return (
      <div className="h-full p-4 flex flex-col items-center justify-center">
        <div 
          className="p-4 rounded-sm max-w-md border-l-4 border-red-500"
          style={{ backgroundColor: '#FEF2F2' }}
        >
          <div className="flex">
            <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
            <div>
              <h3 className="text-red-800 font-semibold">Error Loading Request</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                className="mt-3 px-3 py-1 text-sm rounded-sm bg-red-500 text-white"
                onClick={handleGoBack}
              >
                <ArrowLeft className="w-4 h-4 mr-1 inline" />
                Back to Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show 404 if request not found
  if (!request) {
    return (
      <div className="h-full p-4 flex flex-col items-center justify-center">
        <div 
          className="p-4 rounded-sm max-w-md border-l-4"
          style={{ 
            backgroundColor: `#${bgColor}20`,
            borderLeftColor: `#${borderColor}`
          }}
        >
          <h3 className="font-semibold">Request Not Found</h3>
          <p className="mt-1">The request you're looking for doesn't exist or has been removed.</p>
          <button
            className="mt-3 px-3 py-1 text-sm rounded-sm"
            style={{ 
              backgroundColor: `#${borderColor}`,
              color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
            }}
            onClick={handleGoBack}
          >
            <ArrowLeft className="w-4 h-4 mr-1 inline" />
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div 
        className="py-2 px-4 flex items-center justify-between border-b"
        style={{ 
          backgroundColor: `#${bgColor}30`, 
          borderColor: `#${borderColor}40` 
        }}
      >
        <div className="flex items-center">
          <button
            className="w-7 h-7 flex items-center justify-center rounded-sm mr-2"
            style={{ 
              backgroundColor: `#${borderColor}20`,
              color: `#${borderColor}`,
              border: `1px solid #${borderColor}40`
            }}
            onClick={handleGoBack}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-medium truncate">
            {request.title || 'Untitled Request'}
          </h2>
        </div>
        
        {/* Status badge */}
        {getStatusBadge()}
      </div>
      
      {/* Split view for details and messages */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Request details */}
        <div 
          className="w-1/2 overflow-auto border-r"
          style={{ borderColor: `#${borderColor}30` }}
        >
          <div className="p-4 space-y-6">
            {/* Info bar */}
            <div 
              className="p-3 rounded-sm border flex flex-col"
              style={{ 
                backgroundColor: `#${bgColor}20`,
                borderColor: `#${borderColor}40`
              }}
            >
              <div className="flex justify-between">
                <div>
                  <span className="text-xs opacity-70">Budget</span>
                  <div className="text-lg font-medium">
                    {request.budget ? `¥${request.budget.toLocaleString()}` : 'Flexible'}
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-xs opacity-70">Date Created</span>
                  <div className="text-sm">{formatDate(request.created_at)}</div>
                </div>
              </div>
              
              {request.status !== 'open' && shopperName && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: `#${borderColor}30` }}>
                  <span className="text-xs opacity-70">Shopper</span>
                  <div className="text-sm font-medium">{shopperName}</div>
                </div>
              )}
            </div>
            
            {/* Description */}
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <div 
                className="p-3 rounded-sm border"
                style={{ borderColor: `#${borderColor}40` }}
              >
                <p className="whitespace-pre-wrap text-sm">
                  {request.description || 'No description provided.'}
                </p>
              </div>
            </div>
            
            {/* Images */}
            {request.images && request.images.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Reference Images</h3>
                <div className="grid grid-cols-2 gap-2">
                  {request.images.map((url, index) => (
                    <div 
                      key={index}
                      className="relative border rounded-sm overflow-hidden"
                      style={{ borderColor: `#${borderColor}40` }}
                    >
                      <img
                        src={url}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <a 
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-1 right-1 p-1 rounded-full"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.8)',
                          color: `#${borderColor}`
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-center">
              {getActionButtons()}
            </div>
          </div>
        </div>
        
        {/* Right side - Messages */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          {/* Messages header */}
          <div 
            className="px-4 py-2 border-b flex items-center"
            style={{ 
              backgroundColor: `#${bgColor}20`,
              borderColor: `#${borderColor}30`
            }}
          >
            <MessageSquare className="w-4 h-4 mr-2" style={{ color: `#${borderColor}` }} />
            <h3 className="text-sm font-medium">Messages</h3>
          </div>
          
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div 
                className="h-full flex flex-col items-center justify-center text-center p-4"
                style={{ color: `#${textColor}80` }}
              >
                <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">
                  {request.status === 'open' ? 
                    'Messages will be available once a shopper accepts this request.' : 
                    'No messages yet. Start the conversation!'}
                </p>
              </div>
            ) : (
              messages.map(message => {
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
                        backgroundColor: isCurrentUser ? `#${borderColor}40` : `#${bgColor}40`,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: isCurrentUser ? `#${borderColor}40` : `#${bgColor}50`
                      }}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      <div className="text-xs mt-1 opacity-60 text-right">
                        {formatDate(message.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Message input */}
          {request.status !== 'open' && request.status !== 'cancelled' && (isCustomer || isShopper) && (
            <form 
              className="p-2 border-t flex"
              style={{ borderColor: `#${borderColor}30` }}
              onSubmit={sendMessage}
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
                  'Send'
                )}
              </button>
            </form>
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
        <span>Request #{request.id}</span>
        <span>Status: {request.status}</span>
      </div>
    </div>
  );
};

export default RequestDetailPage;