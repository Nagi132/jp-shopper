import React from 'react';
import { hasImageUrl, extractImageUrl, extractMessageText } from '@/utils/messageUtils';

/**
 * A clean, custom message bubble component
 */
export default function MessageBubble({ 
  message, 
  isCurrentUser, 
  showAvatar = false,
  showTime = true,
  onImageClick,
  onReact
}) {
  // Guard against undefined message
  if (!message || !message.content) {
    return null;
  }

  const imageUrl = hasImageUrl(message.content) ? extractImageUrl(message.content) : null;
  const messageText = imageUrl 
    ? extractMessageText(message.content)
    : message.content;

  // Format timestamp to show only hour and minute
  const formattedTime = message.created_at 
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }) 
    : '';
    
  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`message-wrapper`}>
      <div className={`message-container ${isCurrentUser ? 'message-container-sent' : 'message-container-received'}`}>
        {/* Avatar for received messages */}
        {showAvatar && !isCurrentUser && (
          <div className="avatar-container">
            <div className="message-avatar">
              {getInitials(message.senderName)}
            </div>
          </div>
        )}
        
        {/* Message bubble */}
        <div className={`message-bubble ${isCurrentUser
              ? 'message-bubble-sent'
              : 'message-bubble-received'
          }`}
        >
          {/* Show image if present */}
          {imageUrl && (
            <div className="message-image">
              <img
                src={imageUrl}
                alt="Attachment"
                className="cursor-pointer rounded-md max-w-full"
                onClick={() => onImageClick?.(imageUrl)}
              />
            </div>
          )}

          {/* Show message text if exists */}
          {messageText && (
            <div>{messageText}</div>
          )}
          
          {/* Show reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`message-reactions ${isCurrentUser ? 'message-reactions-sent' : 'message-reactions-received'}`}>
              {message.reactions.map((reaction, i) => (
                <div key={i} className="message-reaction">{reaction.emoji}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Timestamp */}
      {showTime && (
        <div className={`message-time ${isCurrentUser ? 'message-time-sent' : 'message-time-received'}`}>
          {formattedTime}
        </div>
      )}
    </div>
  );
}