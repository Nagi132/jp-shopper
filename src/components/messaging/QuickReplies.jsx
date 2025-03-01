import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Enhanced quick replies component
 */
export default function QuickReplies({ replies, isCustomer, onReplySelect }) {
  // Get the appropriate replies based on user type
  const appropriateReplies = isCustomer ? replies.customer : replies.shopper;
  
  return (
    <div className="grid grid-cols-1 gap-2 pb-2">
      {appropriateReplies.map((reply, index) => (
        <Button
          key={index}
          variant="outline"
          className="quick-reply-button justify-start h-auto py-3 px-4 text-sm hover:bg-indigo-50 transition-colors border-gray-200"
          onClick={() => onReplySelect(reply)}
        >
          {reply}
        </Button>
      ))}
    </div>
  );
}