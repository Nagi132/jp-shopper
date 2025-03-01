import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowDown, ChevronsDown } from 'lucide-react';
import MessageBubble from './MessageBubble';

/**
 * A custom message list component with modern features
 */
export default function MessageList({
  messages,
  userId,
  loadingMessages,
  isCustomer,
  isAtBottom,
  newMessageCount,
  onImageClick,
  onScrollToBottom,
  onScrollToNewMessages,
  onReact,
  onScroll
}) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const scrollTimerRef = useRef(null);

  // Set up scroll handler with auto-hiding scrollbar
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScrollEvent = (e) => {
      // Call the parent scroll handler
      if (onScroll) onScroll(e);
      
      // Add scrolling class to show scrollbar
      container.classList.add('is-scrolling');
      
      // Clear any existing timer
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      
      // Set a timer to remove the class after scrolling stops
      scrollTimerRef.current = setTimeout(() => {
        container.classList.remove('is-scrolling');
      }, 1500); // Hide after 1.5 seconds of inactivity
    };
    
    // Add scroll event listener
    container.addEventListener('scroll', handleScrollEvent);
    
    // Cleanup
    return () => {
      container.removeEventListener('scroll', handleScrollEvent);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [onScroll]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  // Group messages by date
  const groupMessagesByDate = (msgs) => {
    const groups = {};
    
    msgs.forEach(msg => {
      // Skip invalid messages
      if (!msg || !msg.id || !msg.created_at) return;
      
      const date = new Date(msg.created_at);
      const dateStr = formatMessageDate(date);
      
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(msg);
    });
    
    return groups;
  };
  
  // Format date in a simple way
  const formatMessageDate = (date) => {
    return date.toLocaleDateString(undefined, { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  if (loadingMessages) {
    return (
      <div className="flex flex-col items-center justify-center h-48 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading messages...</span>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-gray-600 font-medium mb-2">No messages yet</p>
        <p className="text-sm text-gray-500">
          {isCustomer
            ? "Start the conversation with your shopper"
            : "Start the conversation with the customer"}
        </p>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="relative">
      <div
        ref={messagesContainerRef}
        className="messages-container"
      >
        {/* Render messages grouped by date */}
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date} className="message-date-group">
            {/* Date divider */}
            <div className="date-divider">
              <div className="date-divider-line"></div>
              <span className="date-divider-text">{date}</span>
              <div className="date-divider-line"></div>
            </div>
            
            {msgs.map((message, index) => {
              // Skip rendering if message is invalid
              if (!message || !message.id) return null;

              const isPreviousSameSender = index > 0 && 
                msgs[index - 1] && 
                msgs[index - 1].sender_id === message.sender_id;

              const isNextSameSender = index < msgs.length - 1 && 
                msgs[index + 1] && 
                msgs[index + 1].sender_id === message.sender_id;
                
              const showAvatar = !isPreviousSameSender && message.sender_id !== userId;
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isCurrentUser={message.sender_id === userId}
                  showAvatar={showAvatar}
                  showTime={!isNextSameSender}
                  onImageClick={onImageClick}
                  onReact={(emoji) => onReact?.(message.id, emoji)}
                />
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} id="messages-end" />
      </div>

      {/* "X new messages" pill at bottom - only show when user is scrolled up */}
      {(newMessageCount > 0 && !isAtBottom) && (
        <div
          className="sticky bottom-4 mx-auto w-fit z-10 bg-blue-500 text-white py-2 px-5 rounded-full 
                     font-medium cursor-pointer hover:bg-blue-600 shadow-lg flex items-center gap-2 
                     transition-all duration-200"
          onClick={onScrollToNewMessages}
        >
          <ArrowDown className="w-4 h-4" />
          <span>{newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'}</span>
        </div>
      )}

      {/* Scroll to bottom button */}
      {!isAtBottom && (
        <div className="scroll-bottom-container">
          <Button
            variant="outline"
            size="sm"
            onClick={onScrollToBottom}
            className="scroll-bottom-button"
          >
            <ChevronsDown className="w-4 h-4" />
            <span>Scroll to bottom</span>
          </Button>
        </div>
      )}
    </div>
  );
}