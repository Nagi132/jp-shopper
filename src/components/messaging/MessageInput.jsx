import React, { useRef } from 'react';
import { Camera, Mic, Image, Smile, Send } from 'lucide-react';

/**
 * Simple, clean message input component
 */
export default function MessageInput({
  messageText,
  onMessageChange,
  onSendMessage,
  onFileSelect,
  onEmojiSelect,
  onAudioRecord,
  onCameraOpen,
  isDisabled = false
}) {
  const fileInputRef = useRef(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage(e);
  };
  
  return (
    <div className="message-input-container">
      {/* Camera button */}
      <button
        type="button"
        className="message-input-button"
        onClick={onCameraOpen}
        disabled={isDisabled}
      >
        <Camera size={22} />
      </button>
      
      {/* Main input form */}
      <form 
        className="message-input-form" 
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          value={messageText}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Message..."
          disabled={isDisabled}
          className="message-input-field"
        />
        
        {/* Emoji button */}
        <button
          type="button"
          className="message-input-button"
          onClick={onEmojiSelect}
          disabled={isDisabled}
        >
          <Smile size={22} />
        </button>
        
        {/* Image button */}
        <button
          type="button"
          className="message-input-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
        >
          <Image size={22} />
        </button>
        
        {/* Send button - only shown when there's text */}
        {messageText.trim() && (
          <button
            type="submit"
            className="message-input-button send-button"
            disabled={isDisabled}
          >
            <Send size={22} />
          </button>
        )}
        
        {/* Mic button - only shown when there's no text */}
        {!messageText.trim() && (
          <button
            type="button"
            className="message-input-button"
            onClick={onAudioRecord}
            disabled={isDisabled}
          >
            <Mic size={22} />
          </button>
        )}
      </form>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => onFileSelect(e)}
        disabled={isDisabled}
      />
    </div>
  );
}