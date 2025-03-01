import React, { useRef } from 'react';
import { TabsList, TabsTrigger, Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image as ImageIcon, AlertCircle } from 'lucide-react';
import ImagePreview from './ImagePreview';
import QuickReplies from './QuickReplies';

/**
 * Enhanced message composer component
 */
export default function MessageComposer({
  messageText,
  onMessageChange,
  onSendMessage,
  onFileSelect,
  imagePreview,
  onCancelImage,
  isCompleted,
  activeTab,
  onTabChange,
  quickReplies,
  onQuickReplySelect,
  isCustomer,
  showError,
  errorMessage,
  onErrorClose
}) {
  const fileInputRef = useRef(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    onSendMessage(e);
  };

  return (
    <div className="message-composer">
      {/* Show image error if any */}
      {showError && (
        <div className="flex items-start space-x-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 relative">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Upload Error</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
          <button
            className="text-red-400 hover:text-red-600 transition-colors"
            onClick={() => onErrorClose?.()}
            aria-label="Close error message"
          >
            <span className="text-xl font-medium">×</span>
          </button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={onTabChange} className="mt-2 mb-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="message" className="text-sm">Message</TabsTrigger>
          <TabsTrigger value="quickReplies" className="text-sm">Quick Replies</TabsTrigger>
        </TabsList>

        <TabsContent value="message" className="mt-3">
          {/* Image preview */}
          <ImagePreview imageUrl={imagePreview} onCancel={onCancelImage} />
          
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (messageText.trim() || imagePreview) {
                    handleSendMessage(e);
                  }
                }
              }}
              placeholder={isCompleted ? "This request is completed" : "Type your message..."}
              disabled={isCompleted}
              className="flex-1 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
            />
            <Button
              type="submit"
              disabled={(!messageText.trim() && !imagePreview) || isCompleted}
              className="bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Attachment button */}
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center text-gray-600 hover:text-indigo-700 hover:bg-indigo-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompleted}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Add Image
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => onFileSelect(e)}
              disabled={isCompleted}
            />
          </div>
        </TabsContent>

        <TabsContent value="quickReplies" className="mt-3">
          <QuickReplies 
            replies={quickReplies} 
            isCustomer={isCustomer} 
            onReplySelect={onQuickReplySelect} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}