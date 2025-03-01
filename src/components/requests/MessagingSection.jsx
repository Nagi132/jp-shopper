'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Send, ArrowDown, Image as ImageIcon, Volume2, VolumeOff, ChevronsDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

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
const DEBUG_PREFIX = "📢 [SOUND]";

// Explicit debug logging function
const debugLog = (message, data = null) => {
  if (data) {
    console.log(`${DEBUG_PREFIX} ${message}`, data);
  } else {
    console.log(`${DEBUG_PREFIX} ${message}`);
  }
};

export default function MessagingSection({
  requestId,
  userId,
  requestStatus,
  otherPersonName,
  isCustomer,
  className = ""
}) {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [activeTab, setActiveTab] = useState("message");
  const [showImageError, setShowImageError] = useState(false);
  const [imageErrorMessage, setImageErrorMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundPermissionGranted, setSoundPermissionGranted] = useState(false);
  const [unreadMessageIds, setUnreadMessageIds] = useState(new Set());
  const [lastReadMessageId, setLastReadMessageId] = useState(null);
  const [showNewMessagesDivider, setShowNewMessagesDivider] = useState(false);
  const [dividerPosition, setDividerPosition] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [newMessagePreview, setNewMessagePreview] = useState("");
  const previousMessagesLengthRef = useRef(0);
  const userScrolledRef = useRef(false);
  const soundEnabledRef = useRef(true);
  const soundPermissionGrantedRef = useRef(false);
  const userInteractedRef = useRef(false);
  const currentSoundRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);

  // Sound initialization - with user interaction detection
  // Change the initialization code in useEffect to this:
  useEffect(() => {
    try {
      debugLog("Sound system initialized (enabled by default)");

      // Function to silently attempt to get sound permission on any user interaction
      const tryEnableSound = () => {
        if (soundPermissionGrantedRef.current) return; // Already have permission

        debugLog("User interaction detected - attempting to get sound permission silently");
        userInteractedRef.current = true;

        // Create a truly silent audio context instead of playing an actual sound file
        try {
          // Create a silent audio context
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          // Set the gain to 0 (completely silent)
          gainNode.gain.value = 0;

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          // Start and immediately stop
          oscillator.start(0);
          oscillator.stop(0.001);

          // If we get here, we have permission
          debugLog("✅ Sound permission granted silently");
          setSoundPermissionGranted(true);
          soundPermissionGrantedRef.current = true;
        } catch (err) {
          debugLog(`❌ Silent permission check failed: ${err.message}`);
        }
      };

      // Add event listeners for user interaction
      document.addEventListener('click', tryEnableSound);
      document.addEventListener('keydown', tryEnableSound);

      // Clean up
      return () => {
        document.removeEventListener('click', tryEnableSound);
        document.removeEventListener('keydown', tryEnableSound);
      };
    } catch (err) {
      console.error("Error initializing sound:", err);
      setSoundEnabled(false);
      soundEnabledRef.current = false;
    }
  }, []);
  // Helper function to format bytes to human-readable form
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  // Stop any playing sound
  const stopAllSounds = () => {
    if (currentSoundRef.current) {
      debugLog("Stopping currently playing sound");
      try {
        currentSoundRef.current.pause();
        currentSoundRef.current.currentTime = 0;
      } catch (err) {
        debugLog(`Error stopping sound: ${err.message}`);
      }
      currentSoundRef.current = null;
    }
  };

  // Handle scroll event
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    userScrolledRef.current = true;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(isScrolledToBottom);

    // Only clear notifications when we actually reach the bottom
    if (isScrolledToBottom) {
      setHasNewMessages(false);
      setNewMessageCount(0);
      setUnreadMessageIds(new Set());
      setShowNewMessagesDivider(false); // Hide the divider when scrolled to bottom

      // When scrolling to bottom, set the last read message to the last message
      if (messages.length > 0) {
        setLastReadMessageId(messages[messages.length - 1].id);
      }
    }
  };

  // Fetch messages
  const fetchMessages = async (isInitialLoad = false) => {
    if (!requestId || !userId) return;

    try {
      debugLog("Fetching messages...");
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check for new messages
      const newMessagesCount = data ? data.length - previousMessagesLengthRef.current : 0;
      debugLog(`Found ${newMessagesCount} new messages`);

      if (data) {
        // Process messages
        const processedMessages = data.map(msg => ({
          ...msg,
          senderName: msg.sender_id === userId ? 'You' : otherPersonName || 'Other person'
        }));

        // Only set divider if user is not at bottom and there are new messages
        if (newMessagesCount > 0 && previousMessagesLengthRef.current > 0 && !isInitialLoad && !isAtBottom) {
          setShowNewMessagesDivider(true);
          setDividerPosition(previousMessagesLengthRef.current);
        } else {
          // If user is at bottom, don't show the divider
          setShowNewMessagesDivider(false);
        }

        // Set initial last read message ID if not set yet
        if (isInitialLoad && lastReadMessageId === null && data.length > 0) {
          setLastReadMessageId(data[data.length - 1].id);
        }

        setMessages(processedMessages);

        // Handle new messages
        if (!isInitialLoad && newMessagesCount > 0) {
          // Get the actual new messages
          const newMessagesList = processedMessages.slice(-newMessagesCount);

          // Only process messages from the other person
          const otherPersonNewMessages = newMessagesList.filter(msg => msg.sender_id !== userId);

          debugLog(`Found ${otherPersonNewMessages.length} new messages from other person`);

          if (otherPersonNewMessages.length > 0) {
            debugLog(`Received ${otherPersonNewMessages.length} new messages`);

            // Check the real-time sound state from refs (more reliable)
            const currentSoundEnabled = soundEnabledRef.current;
            const currentPermissionGranted = soundPermissionGrantedRef.current;

            debugLog(`Current REAL sound state: ${currentSoundEnabled ? 'ENABLED' : 'MUTED'}`);
            debugLog(`Current REAL permission state: ${currentPermissionGranted ? 'GRANTED' : 'NOT GRANTED'}`);

            // Only play if sound is enabled and permission granted (using refs)
            if (currentSoundEnabled && (currentPermissionGranted || userInteractedRef.current)) {
              debugLog("Sound is enabled, playing notification...");

              try {
                // First stop any playing sound
                stopAllSounds();

                // Create fresh Audio instance and store reference
                const notificationSound = new Audio('/sounds/message.mp3');
                notificationSound.volume = 0.5;
                currentSoundRef.current = notificationSound;

                debugLog("Starting sound playback...");
                const playPromise = notificationSound.play();

                if (playPromise) {
                  playPromise
                    .then(() => {
                      debugLog("✅ Sound played for new message");
                      // Mark permission as granted since it worked
                      setSoundPermissionGranted(true);
                      soundPermissionGrantedRef.current = true;
                    })
                    .catch(err => {
                      debugLog(`❌ Sound failed to play: ${err.message}`);
                      if (err.name === "NotAllowedError") {
                        debugLog("Browser requires user interaction first");
                        soundPermissionGrantedRef.current = false;
                        setSoundPermissionGranted(false);
                      }
                    });
                }
              } catch (err) {
                debugLog(`❌ Error playing notification sound: ${err.message}`);
              }
            } else {
              debugLog(`Sound is ${!currentSoundEnabled ? 'MUTED' : 'ENABLED'} and permission is ${!currentPermissionGranted ? 'NOT GRANTED' : 'GRANTED'} - not playing`);
            }

            // Update unread message count - only if user is not at bottom
            if (!isAtBottom) {
              const newUnreadIds = new Set(unreadMessageIds);

              // Add to unread IDs
              otherPersonNewMessages.forEach(msg => newUnreadIds.add(msg.id));

              // Update state - ALWAYS update the notification counter
              setNewMessageCount(newUnreadIds.size);
              setUnreadMessageIds(newUnreadIds);

              // Set preview of latest message
              const latestMessage = otherPersonNewMessages[otherPersonNewMessages.length - 1];

              // Only show notifications if user is scrolled up
              if (userScrolledRef.current && !isAtBottom) {
                setHasNewMessages(true);

                setNewMessagePreview(latestMessage.content.slice(0, 50) + (latestMessage.content.length > 50 ? "..." : ""));

                // Flash the title bar to notify the user
                document.title = `💬 New Message! - ${document.title.replace('💬 New Message! - ', '')}`;
                setTimeout(() => {
                  document.title = document.title.replace('💬 New Message! - ', '');
                }, 3000);
              }
            } else {
              // If user is at bottom, clear any notifications
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

        // Only auto-scroll on initial load
        if (isInitialLoad) {
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
            }
          }, 100);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
      setLoadingMessages(true);
      await fetchMessages(true);
      setLoadingMessages(false);
    };

    loadInitial();
  }, [requestId, userId]);

  // Set up polling
  useEffect(() => {
    const interval = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(interval);
  }, [requestId, userId, isAtBottom]); // Add isAtBottom as dependency for proper divider behavior

  // Setup scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

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

    // Add message to UI
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
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        userScrolledRef.current = false;
        setIsAtBottom(true);
        setHasNewMessages(false);
        setNewMessageCount(0);
        setUnreadMessageIds(new Set());
        setShowNewMessagesDivider(false); // Hide divider when sending message

        // Update last read message
        if (messages.length > 0) {
          setLastReadMessageId(messages[messages.length - 1].id);
        }
      }
    }, 100);

    try {
      // Keep the payload minimal to avoid issues with missing fields
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

    // Show loading state
    setImageErrorMessage("");
    setShowImageError(false);

    // Create a preview immediately with the original image
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Convert to WebP in the background
    convertToWebP(file)
      .then(optimizedFile => {
        // Store the optimized file for sending
        setSelectedImage(optimizedFile);

        // Switch to the message tab to show preview
        setActiveTab("message");
      })
      .catch(err => {
        console.error('Error in WebP conversion:', err);
        // Fallback to original file
        setSelectedImage(file);
      });
  };

  // Add this function to handle image upload and sending
  const handleSendWithImage = async () => {
    // Create loading message
    const loadingMessage = messageText.trim() ?
      `Uploading image with message: ${messageText.trim()}...` :
      'Uploading image...';

    // Add temporary message to UI to show loading state
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

    // Scroll to show the loading message
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);

    try {
      // Check if bucket exists
      const testFile = new Uint8Array(1);
      const testPath = `test-${Date.now()}`;

      const { error: testError } = await supabase.storage
        .from('message-attachments')
        .upload(testPath, testFile, { upsert: true });

      if (testError) {
        throw new Error(`Storage bucket 'message-attachments' doesn't exist or is not accessible. Please create it in your Supabase dashboard.`);
      }

      // Clean up test file
      await supabase.storage
        .from('message-attachments')
        .remove([testPath]);

      // Convert to WebP if possible for smaller file size
      let imageToUpload = selectedImage;

      // Only convert if not already WebP
      if (!selectedImage.type.includes('webp')) {
        try {
          const optimizedImage = await convertToWebP(selectedImage);
          if (optimizedImage) {
            console.log(`Optimized: ${selectedImage.size} → ${optimizedImage.size} bytes (${Math.round((1 - optimizedImage.size / selectedImage.size) * 100)}% smaller)`);
            imageToUpload = optimizedImage;
          }
        } catch (convErr) {
          console.warn("WebP conversion failed, using original image", convErr);
          // Continue with original image if conversion fails
        }
      }

      // Upload the file (original or WebP-converted)
      const fileExtension = imageToUpload.name.split('.').pop();
      const safeFileName = `${Date.now()}-${requestId.substring(0, 8)}.${fileExtension}`;
      const fileName = `${requestId}/${safeFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, imageToUpload);

      if (uploadError) throw uploadError;

      // Use signed URL with 7-day expiration
      const { data: urlData, error: signedError } = await supabase.storage
        .from('message-attachments')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days in seconds

      if (signedError) throw signedError;

      // IMPORTANT: Format the content properly to avoid URL parsing issues
      // Use consistent separator (||) between message text and image URL
      let content = `📷 [Image]`;
      if (messageText.trim()) {
        content += `||${messageText.trim()}`;
      }
      content += `||${urlData.signedUrl}`;

      // Send message with image URL and optional text
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          request_id: requestId,
          sender_id: userId,
          content: content,
          is_read: false
        });

      if (msgError) throw msgError;

      // Clear image selection and preview
      setSelectedImage(null);
      setImagePreview(null);
      setMessageText('');

      // Remove the temp message and refresh
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      fetchMessages(false);

    } catch (err) {
      console.error('Error uploading image:', err);

      // Remove the temp loading message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));

      setImageErrorMessage(err.message || 'Failed to upload image. Please try again.');
      setShowImageError(true);

      // Keep the image preview in case user wants to retry
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // This is the WebP conversion utility function that should be added outside the component
  const convertToWebP = (file) => {
    return new Promise((resolve, reject) => {
      // Skip if file is already WebP or SVG
      if (file.type.includes('webp') || file.type.includes('svg')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          // Check if WebP is supported
          if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
            // Convert to WebP (0.8 quality gives good balance)
            canvas.toBlob((blob) => {
              if (!blob) {
                resolve(file); // Fallback to original if conversion fails
                return;
              }

              // Create new file from blob
              const webpFile = new File([blob],
                file.name.replace(/\.(jpe?g|png|gif)$/i, '.webp'),
                { type: 'image/webp' }
              );
              resolve(webpFile);
            }, 'image/webp', 0.8);
          } else {
            resolve(file); // WebP not supported, use original
          }
        };
        img.onerror = () => {
          reject(new Error("Failed to load image for conversion"));
        };
        img.src = event.target.result;
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(file);
    });
  };

  // Update the hasImageUrl and extractImageUrl functions to use the new format:
  const hasImageUrl = (content) => {
    return content.includes('📷 [Image]');
  };

  const extractImageUrl = (content) => {
    if (hasImageUrl(content)) {
      // Split by || separator and get the last part which is the URL
      const parts = content.split('||');
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
      return null;
    }
    return null;
  };


  // Scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });

      // Clear notifications when scrolling to bottom
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

  // Scroll to new messages
  const scrollToNewMessages = () => {
    if (dividerPosition !== null && messages.length > dividerPosition) {
      // Scroll to the first new message
      const messageElement = document.getElementById(`message-${messages[dividerPosition].id}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Fallback to scroll to bottom if we don't have a divider position
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Clear notifications
    setHasNewMessages(false);
    setNewMessageCount(0);
  };

  return (
    <Card className={className}>
      <CardHeader className={`${hasNewMessages ? 'bg-blue-50' : 'bg-gray-50'} border-b relative transition-colors duration-300`}>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              Messages
              {newMessageCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5">
                  {newMessageCount}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {otherPersonName
                ? `Communicate with ${otherPersonName}`
                : isCustomer
                  ? 'Communicate with your shopper'
                  : 'Communicate with the customer'
              }
            </CardDescription>
          </div>

          {/* Chat controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Toggle the sound state
                const newSoundEnabled = !soundEnabled;
                debugLog(`Sound toggled to: ${newSoundEnabled ? 'ENABLED' : 'MUTED'}`);

                // Stop any playing sounds immediately when muted
                if (!newSoundEnabled) {
                  stopAllSounds();
                }

                // Update both state and ref
                setSoundEnabled(newSoundEnabled);
                soundEnabledRef.current = newSoundEnabled;
              }}
              title={soundEnabled ? "Mute notifications" : "Enable sound notifications"}
              className="relative"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeOff size={16} />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-6">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">
              {isCustomer
                ? "Start the conversation with your shopper"
                : "Start the conversation with the customer"}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Messages container */}
            <div
              ref={messagesContainerRef}
              className="space-y-4 max-h-96 overflow-y-auto mb-4 p-2"
            >
              {/* Render messages with proper keys */}
              {messages.map((message, index) => {
                const isPreviousSameSender = index > 0 && messages[index - 1].sender_id === message.sender_id;
                const isNextSameSender = index < messages.length - 1 && messages[index + 1].sender_id === message.sender_id;
                const shouldShowFullMessage = !isPreviousSameSender || (new Date(message.created_at) - new Date(messages[index - 1].created_at)) > 5 * 60 * 1000; // 5 minutes
                const imageUrl = hasImageUrl(message.content) ? extractImageUrl(message.content) : null;
                const displayContent = message.content || '';

                // Show divider before this message if it's the first new message
                const showDividerHere = showNewMessagesDivider && index === dividerPosition;

                return (
                  <div key={message.id || `msg-${index}`}>
                    {/* New messages divider - only show if not at bottom */}
                    {showDividerHere && !isAtBottom && (
                      <div className="flex items-center my-4">
                        <div className="flex-grow h-px bg-gray-300"></div>
                        <div className="mx-4 text-xs text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                          {messages.length - dividerPosition} new {messages.length - dividerPosition === 1 ? 'message' : 'messages'}
                        </div>
                        <div className="flex-grow h-px bg-gray-300"></div>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      id={`message-${message.id}`}
                      className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'} relative`}
                    >
                      <div className="max-w-xs sm:max-w-md">
                        <div
                          className={`px-4 py-2 rounded-lg ${message.sender_id === userId
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                            } ${!isNextSameSender ? 'mb-2' : 'mb-1'} shadow-sm transition-all duration-200`}
                        >
                          {shouldShowFullMessage && (
                            <div className="text-xs mb-1 font-medium">
                              {message.senderName}
                            </div>
                          )}

                          {/* Show image if present */}
                          {imageUrl && (
                            <div className="mb-2">
                              <img
                                src={imageUrl}
                                alt="Attachment"
                                className="rounded-md max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  setLightboxImage(imageUrl);
                                  setShowLightbox(true);
                                }}
                              />
                            </div>
                          )}

                          {/* Only show the content if it's not just the image marker */}
                          {!imageUrl || displayContent.trim() !== '' ? (
                            <p className="text-sm">
                              {imageUrl ?
                                // If this is an image message, extract any message text
                                message.content.split('||').length > 2 ? message.content.split('||')[1] : ''
                                :
                                // Otherwise just show the content
                                message.content}
                            </p>
                          ) : null}

                          <div className="flex justify-between items-center mt-1">
                            <div className="text-xs opacity-70">
                              {message.created_at ? new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* "X new messages" pill at bottom - only show when user is scrolled up */}
            {(newMessageCount > 0 && !isAtBottom) && (
              <div
                className="sticky bottom-4 mx-auto w-fit z-10 bg-blue-600 text-white py-2 px-4 rounded-full font-medium cursor-pointer hover:bg-blue-700 shadow-lg flex items-center gap-2 transition-all duration-200 hover:shadow-xl"
                onClick={scrollToNewMessages}
              >
                <ArrowDown className="w-4 h-4" />
                <span>{newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'}</span>
              </div>
            )}
          </div>
        )}

        {/* Persistent scroll to bottom button - only visible when not at bottom */}
        {!isAtBottom && (
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToBottom}
              className="rounded-full flex items-center gap-1 bg-white shadow-md hover:bg-blue-50"
            >
              <ChevronsDown className="w-4 h-4" />
              <span>Scroll to bottom</span>
            </Button>
          </div>
        )}

        {/* Show image error if any */}
        {showImageError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{imageErrorMessage}</span>
            <button
              className="absolute top-0 right-0 px-4 py-3"
              onClick={() => setShowImageError(false)}
            >
              <span className="text-red-500">×</span>
            </button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2 mb-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="message">Message</TabsTrigger>
            <TabsTrigger value="quickReplies">Quick Replies</TabsTrigger>
          </TabsList>

          <TabsContent value="message" className="mt-2">
            {/* Image preview */}
            {imagePreview && (
              <div className="mb-4 relative border rounded-md p-2">
                <img
                  src={imagePreview}
                  alt="Selected image"
                  className="w-full max-h-60 object-contain rounded-md"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-white rounded-full h-8 w-8 p-0 flex items-center justify-center shadow-sm"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <span className="text-red-500">×</span>
                </Button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (messageText.trim()) {
                      handleSendMessage(e);
                    }
                  }
                }}
                placeholder="Type your message..."
                disabled={requestStatus === 'completed'}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={(!(selectedImage || messageText.trim())) || requestStatus === 'completed'}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>

            {/* Basic attachment button */}
            <div className="mt-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center"
                onClick={() => fileInputRef.current?.click()}
                disabled={requestStatus === 'completed'}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Add Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={requestStatus === 'completed'}
              />
            </div>
          </TabsContent>

          <TabsContent value="quickReplies" className="mt-2">
            <div className="grid grid-cols-1 gap-2">
              {(isCustomer ? QUICK_REPLIES.customer : QUICK_REPLIES.shopper).map((reply, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto py-2 text-sm hover:bg-blue-50 transition-colors"
                  onClick={() => {
                    setMessageText(reply);
                    setActiveTab("message");
                  }}
                >
                  {reply}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      {/* Image Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <img
              src={lightboxImage}
              alt="Full size attachment"
              className="object-contain w-full h-full max-h-[80vh] rounded-lg"
            />
            <button
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setShowLightbox(false);
              }}
            >
              ×
            </button>
            <button
              className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white rounded-md px-3 py-1 text-sm flex items-center justify-center hover:bg-opacity-70 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                window.open(lightboxImage, '_blank');
              }}
            >
              Open in new tab
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}