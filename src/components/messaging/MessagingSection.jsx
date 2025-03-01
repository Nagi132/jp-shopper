'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

// Import our helper utilities
import soundManager from '@/utils/soundManager';
import { convertToWebP } from '@/utils/messageUtils';

// Import our components
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import ImageLightbox from './ImageLightbox';

// Import styles
import '@/styles/custom-messaging.css';

// Common quick replies
const QUICK_REPLIES = {
  shopper: [
    "I'll check the store for this item today.",
    "This item is available. Would you like me to purchase it?",
    "I found the item, but it's a different color/version. Is that acceptable?",
    "The item is out of stock. Would you like me to check other stores?",
    "The shipping will cost ¥X. Is that okay?",
    "I'll send photos once I find the item."
  ],
  customer: [
    "Thank you for checking!",
    "Yes, please go ahead and purchase it.",
    "Could I see photos before you purchase?",
    "Yes, different color/version is fine.",
    "Please check other stores if possible.",
    "When do you think you can ship the item?"
  ]
};

/**
 * Enhanced messaging section with Instagram-like features
 */
export default function MessagingSection({
  requestId,
  userId,
  requestStatus,
  otherPersonName,
  isCustomer,
  className = ""
}) {
  // Message state
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');

  // UI state
  const [showImageError, setShowImageError] = useState(false);
  const [imageErrorMessage, setImageErrorMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("message");

  // Messaging indicators
  const [unreadMessageIds, setUnreadMessageIds] = useState(new Set());
  const [lastReadMessageId, setLastReadMessageId] = useState(null);
  const [showNewMessagesDivider, setShowNewMessagesDivider] = useState(false);
  const [dividerPosition, setDividerPosition] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  // Image handling
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);

  // Expanded content state
  const [expandedImages, setExpandedImages] = useState({});

  // Refs
  const previousMessagesLengthRef = useRef(0);
  const userScrolledRef = useRef(false);

  // Initialize sound manager
  useEffect(() => {
    soundManager.initialize();
    return () => soundManager.cleanup();
  }, []);

  // Handle scroll event in the message container
  const handleScroll = (e) => {
    if (!e.target) return;

    userScrolledRef.current = true;

    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(isScrolledToBottom);

    // Clear notifications when scrolled to bottom
    if (isScrolledToBottom) {
      setHasNewMessages(false);
      setNewMessageCount(0);
      setUnreadMessageIds(new Set());
      setShowNewMessagesDivider(false);

      // Set last read message
      if (messages.length > 0) {
        setLastReadMessageId(messages[messages.length - 1].id);
      }
    }
  };
  
  // Fetch messages from the database
  const fetchMessages = async (isInitialLoad = false) => {
    if (!requestId || !userId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check for new messages
      const newMessagesCount = data ? data.length - previousMessagesLengthRef.current : 0;

      if (data) {
        // Process messages with sender names
        const processedMessages = data.map(msg => ({
          ...msg,
          senderName: msg.sender_id === userId ? 'You' : otherPersonName || 'Other person',
          hasImage: msg.content && msg.content.includes('📷 [Image]')
        }));

        // Set divider position for new messages
        if (newMessagesCount > 0 && previousMessagesLengthRef.current > 0 && !isInitialLoad && !isAtBottom) {
          setShowNewMessagesDivider(true);
          setDividerPosition(previousMessagesLengthRef.current);
        } else {
          setShowNewMessagesDivider(false);
        }

        // Set initial last read message
        if (isInitialLoad && lastReadMessageId === null && data.length > 0) {
          setLastReadMessageId(data[data.length - 1].id);
        }

        setMessages(processedMessages);

        // Handle notifications for new messages
        if (!isInitialLoad && newMessagesCount > 0) {
          const newMessagesList = processedMessages.slice(-newMessagesCount);
          const otherPersonNewMessages = newMessagesList.filter(msg => msg.sender_id !== userId);

          if (otherPersonNewMessages.length > 0) {
            // Play sound notification
            if (soundEnabled) {
              soundManager.playNotification();
            }

            // Update unread message indicators if not at bottom
            if (!isAtBottom) {
              const newUnreadIds = new Set(unreadMessageIds);
              otherPersonNewMessages.forEach(msg => newUnreadIds.add(msg.id));

              setNewMessageCount(newUnreadIds.size);
              setUnreadMessageIds(newUnreadIds);

              // Update notification preview
              if (userScrolledRef.current && !isAtBottom) {
                setHasNewMessages(true);
                // Flash the title
                document.title = `💬 New Message! - ${document.title.replace('💬 New Message! - ', '')}`;
                setTimeout(() => {
                  document.title = document.title.replace('💬 New Message! - ', '');
                }, 3000);
              }
            } else {
              // Clear notifications if at bottom
              setHasNewMessages(false);
              setNewMessageCount(0);
              setUnreadMessageIds(new Set());
            }
          }
        }

        previousMessagesLengthRef.current = data.length;

        // Mark messages as read
        const unreadIds = data
          .filter(msg => msg.sender_id !== userId && !msg.is_read)
          .map(msg => msg.id);

        if (unreadIds.length > 0) {
          supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadIds)
            .then()
            .catch(err => console.error('Error marking messages as read:', err));
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Load messages on component mount
  useEffect(() => {
    const loadInitial = async () => {
      setLoadingMessages(true);
      await fetchMessages(true);
      setLoadingMessages(false);
    };

    loadInitial();
  }, [requestId, userId]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(interval);
  }, [requestId, userId, isAtBottom]);

  // Handle emoji/reaction selection
  // Handle reactions to messages
  const handleReaction = async (messageId, emoji) => {
    // Find the message
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    // In a real app, you would update the database
    // For now, just update the UI optimistically
    const updatedMessages = messages.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions || [];
        return {
          ...m,
          reactions: [...reactions, { emoji, user_id: userId }]
        };
      }
      return m;
    });

    setMessages(updatedMessages);
  };

  // Toggle expanded state for images
  const handleExpandImage = (messageId) => {
    setExpandedImages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Send a text message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    // If we have a selected image, use the image upload function
    if (selectedImage) {
      await handleSendWithImage();
      return;
    }

    // Otherwise continue with normal text message
    if (!messageText.trim()) return;

    const trimmedMessage = messageText.trim();
    setMessageText('');

    // Add message to UI optimistically
    const tempMessage = {
      id: `temp-${Date.now()}`,
      request_id: requestId,
      sender_id: userId,
      content: trimmedMessage,
      created_at: new Date().toISOString(),
      senderName: 'You'
    };

    setMessages(prev => [...prev, tempMessage]);

    // Scroll to bottom
    scrollToBottom('smooth');

    try {
      const messageData = {
        request_id: requestId,
        sender_id: userId,
        content: trimmedMessage,
        is_read: false
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
      setMessageText(trimmedMessage);
    }
  };

  // Handle file selection for image upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setImageErrorMessage('File size exceeds 5MB limit');
      setShowImageError(true);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setImageErrorMessage('Only image files are supported');
      setShowImageError(true);
      return;
    }

    // Clear any errors
    setImageErrorMessage("");
    setShowImageError(false);

    // Create preview immediately
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Convert to WebP in the background
    convertToWebP(file)
      .then(optimizedFile => {
        setSelectedImage(optimizedFile);
      })
      .catch(err => {
        console.error('Error in WebP conversion:', err);
        setSelectedImage(file);
      });
  };

  // Handle canceling image selection
  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle sending a message with an image
  const handleSendWithImage = async () => {
    // Create loading message
    const loadingMessage = messageText.trim() ?
      `Uploading image with message: ${messageText.trim()}...` :
      'Uploading image...';

    // Add temporary message to UI
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      request_id: requestId,
      sender_id: userId,
      content: `📷 [Image] ${loadingMessage}`,
      created_at: new Date().toISOString(),
      senderName: 'You'
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom('smooth');

    try {
      // Check bucket exists by trying to upload a test file
      const testFile = new Uint8Array(1);
      const testPath = `test-${Date.now()}`;

      const { error: testError } = await supabase.storage
        .from('message-attachments')
        .upload(testPath, testFile, { upsert: true });

      if (testError) {
        throw new Error(`Storage bucket 'message-attachments' doesn't exist or is not accessible.`);
      }

      // Clean up test file
      await supabase.storage
        .from('message-attachments')
        .remove([testPath]);

      // Upload the image file
      let imageToUpload = selectedImage;
      const fileExtension = imageToUpload.name.split('.').pop();
      const safeFileName = `${Date.now()}-${requestId.substring(0, 8)}.${fileExtension}`;
      const fileName = `${requestId}/${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, imageToUpload);

      if (uploadError) throw uploadError;

      // Get a signed URL with 7-day expiration
      const { data: urlData, error: signedError } = await supabase.storage
        .from('message-attachments')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7);

      if (signedError) throw signedError;

      // Format the content with image URL and optional text
      let content = `📷 [Image]`;
      if (messageText.trim()) {
        content += `||${messageText.trim()}`;
      }
      content += `||${urlData.signedUrl}`;

      // Insert message with image into database
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          request_id: requestId,
          sender_id: userId,
          content: content,
          is_read: false
        });

      if (msgError) throw msgError;

      // Clean up after successful upload
      setSelectedImage(null);
      setImagePreview(null);
      setMessageText('');

      // Remove temp message and refresh to get the actual message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      fetchMessages(false);

    } catch (err) {
      console.error('Error uploading image:', err);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setImageErrorMessage(err.message || 'Failed to upload image. Please try again.');
      setShowImageError(true);
    } finally {
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  // Handle quick reply selection
  const handleQuickReplySelect = (text) => {
    setMessageText(text);
    setActiveTab("message");
  };

  // Emoji selector handler
  const handleEmojiSelect = () => {
    // In a real app, you would show an emoji picker
    // For now, just add a smile emoji
    setMessageText(prev => prev + '😊');
  };

  // Audio recording handler
  const handleAudioRecord = () => {
    // In a real app, you would implement audio recording
    alert('Audio recording would start here');
  };

  // Camera open handler
  const handleCameraOpen = () => {
    // In a real app, you would open the camera
    alert('Camera would open here');
  };

  // Toggle sound notifications
  const handleToggleSound = () => {
    const newState = soundManager.toggleSound();
    setSoundEnabled(newState);
  };

  // Scroll to bottom of messages
  const scrollToBottom = (behavior = 'auto') => {
    const messagesEnd = document.getElementById('messages-end');
    if (messagesEnd) {
      messagesEnd.scrollIntoView({ behavior });
      userScrolledRef.current = false;
      setIsAtBottom(true);
      setHasNewMessages(false);
      setNewMessageCount(0);
      setUnreadMessageIds(new Set());
      setShowNewMessagesDivider(false);

      // Update last read message
      if (messages.length > 0) {
        setLastReadMessageId(messages[messages.length - 1].id);
      }
    }
  };

  // Scroll to new messages divider
  const scrollToNewMessages = () => {
    if (dividerPosition !== null && messages.length > dividerPosition) {
      // Find the first new message
      const messageElement = document.getElementById(`message-${messages[dividerPosition].id}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Fallback to bottom
      scrollToBottom('smooth');
    }

    // Clear notifications
    setHasNewMessages(false);
    setNewMessageCount(0);
  };

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardContent className="p-0">
        <MessageList 
          messages={messages}
          userId={userId}
          loadingMessages={loadingMessages}
          isCustomer={isCustomer}
          isAtBottom={isAtBottom}
          newMessageCount={newMessageCount}
          onImageClick={(url) => {
            setLightboxImage(url);
            setShowLightbox(true);
          }}
          onScrollToBottom={() => scrollToBottom('smooth')}
          onScrollToNewMessages={scrollToNewMessages}
          onReact={handleReaction}
          onScroll={handleScroll}
        />
        
        <MessageComposer
          messageText={messageText}
          onMessageChange={setMessageText}
          onSendMessage={handleSendMessage}
          onFileSelect={handleFileUpload}
          imagePreview={imagePreview}
          onCancelImage={handleCancelImage}
          isCompleted={requestStatus === 'completed'}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          quickReplies={QUICK_REPLIES}
          onQuickReplySelect={handleQuickReplySelect}
          isCustomer={isCustomer}
          showError={showImageError}
          errorMessage={imageErrorMessage}
          onErrorClose={() => setShowImageError(false)}
        />
      </CardContent>
      
      {showLightbox && (
        <ImageLightbox 
          imageUrl={lightboxImage}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </Card>
  );
}