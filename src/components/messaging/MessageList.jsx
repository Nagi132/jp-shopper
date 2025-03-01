import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowDown, ChevronsDown } from 'lucide-react';
import MessageBubble from './MessageBubble';

/**
 * Enhanced message list component with improved scrollbar
 */
export default function MessageList({
    messages,
    userId,
    loadingMessages,
    isCustomer,
    isAtBottom,
    newMessageCount,
    showNewMessagesDivider,
    dividerPosition,
    onImageClick,
    onScrollToBottom,
    onScrollToNewMessages,
    onScroll
}) {
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Set up scroll handler
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', onScroll);
            return () => container.removeEventListener('scroll', onScroll);
        }
    }, [onScroll]);

    // Auto-scroll to bottom on initial load
    useEffect(() => {
        if (messagesEndRef.current && messages.length > 0) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, []);

    if (loadingMessages) {
        return (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-sm text-gray-500 font-medium">Loading conversation...</span>
            </div>
        );
    }

    if (!messages || messages.length === 0) {
        return (
            <div className="text-center py-10 px-4">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                </div>
                <p className="text-gray-600 font-medium mb-2">No messages yet</p>
                <p className="text-sm text-gray-500">
                    {isCustomer
                        ? "Start the conversation with your shopper"
                        : "Start the conversation with the customer"}
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Messages container with custom scrollbar - fixed padding */}
            <div
                ref={messagesContainerRef}
                className="messages-container space-y-4 max-h-96 overflow-y-auto pr-2 pl-2 pb-3 pt-1"
            >
                {/* Render messages */}
                {messages.map((message, index) => {
                    // Skip rendering if message is invalid
                    if (!message || !message.id) {
                        console.warn('Invalid message found in messages array', message);
                        return null;
                    }

                    const isPreviousSameSender = index > 0 &&
                        messages[index - 1] &&
                        messages[index - 1].sender_id === message.sender_id;

                    const shouldShowSenderName = !isPreviousSameSender ||
                        (new Date(message.created_at) - new Date(messages[index - 1]?.created_at || 0)) > 5 * 60 * 1000; // 5 minutes

                    // Show divider before this message if it's the first new message
                    const showDividerHere = showNewMessagesDivider && index === dividerPosition;

                    return (
                        <div key={message.id || `msg-${index}`} id={`message-${message.id}`}>
                            {/* New messages divider - only show if not at bottom */}
                            {showDividerHere && !isAtBottom && (
                                <div className="new-message-divider flex items-center my-4">
                                    <div className="flex-grow h-px bg-blue-100"></div>
                                    <span className="mx-4 text-xs">
                                        {messages.length - dividerPosition} new {messages.length - dividerPosition === 1 ? 'message' : 'messages'}
                                    </span>
                                    <div className="flex-grow h-px bg-blue-100"></div>
                                </div>
                            )}

                            {/* Message bubble */}
                            <MessageBubble
                                message={message}
                                isCurrentUser={message.sender_id === userId}
                                showSenderName={shouldShowSenderName}
                                onImageClick={onImageClick}
                            />
                        </div>
                    );
                })}

                <div ref={messagesEndRef} id="messages-end" />
            </div>

            {/* "X new messages" pill at bottom - only show when user is scrolled up */}
            {(newMessageCount > 0 && !isAtBottom) && (
                <div
                    className="new-message-pill sticky bottom-4 mx-auto w-fit z-10 bg-indigo-600 text-white py-2 px-5 rounded-full 
                     font-medium cursor-pointer hover:bg-indigo-700 shadow-lg flex items-center gap-2 
                     transition-all duration-200 hover:shadow-xl"
                    onClick={onScrollToNewMessages}
                >
                    <ArrowDown className="w-4 h-4" />
                    <span>{newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'}</span>
                </div>
            )}

            {/* Persistent scroll to bottom button - only visible when not at bottom */}
            {!isAtBottom && (
                <div className="flex justify-center mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onScrollToBottom}
                        className="scroll-button rounded-full flex items-center gap-1 bg-white shadow-md hover:bg-gray-50"
                    >
                        <ChevronsDown className="w-4 h-4" />
                        <span>Scroll to bottom</span>
                    </Button>
                </div>
            )}
        </div>
    );
}