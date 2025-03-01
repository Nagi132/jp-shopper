import React from 'react';
import { hasImageUrl, extractImageUrl, extractMessageText } from '@/utils/messageUtils';

/**
 * A single message bubble component with enhanced styling
 */
export default function MessageBubble({ 
  message, 
  isCurrentUser, 
  showSenderName, 
  onImageClick 
}) {
  // Guard against undefined message
  if (!message || !message.content) {
    console.warn('Received undefined message or message without content');
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

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} relative`}>
      <div className="max-w-xs sm:max-w-md">
        <div
          className={`message-bubble px-4 py-3 
            ${isCurrentUser
              ? 'message-bubble-sent'
              : 'message-bubble-received'
            } 
            mb-2`}
        >
          {showSenderName && (
            <div className="text-xs mb-1 font-semibold">
              {message.senderName}
            </div>
          )}

          {/* Show image if present */}
          {imageUrl && (
            <div className="message-image mb-2">
              <img
                src={imageUrl}
                alt="Attachment"
                className="rounded-lg max-w-full cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => onImageClick(imageUrl)}
              />
            </div>
          )}

          {/* Show message text if exists */}
          {messageText && (
            <p className="text-sm leading-relaxed">{messageText}</p>
          )}

          <div className="flex justify-end items-center mt-1">
            <div className="message-time">
              {formattedTime}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}