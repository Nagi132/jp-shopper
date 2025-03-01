import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeOff, MessageSquare } from 'lucide-react';

/**
 * Enhanced message header component
 */
export default function MessageHeader({ 
  otherPersonName, 
  isCustomer, 
  hasNewMessages,
  newMessageCount, 
  soundEnabled, 
  onToggleSound 
}) {
  return (
    <CardHeader 
      className={`message-header ${hasNewMessages ? 'has-new-messages' : ''} 
                 border-b relative transition-colors duration-300 pb-3`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-indigo-100 rounded-full p-1.5 mr-3">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="flex items-center text-lg">
              Messages
              {newMessageCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5">
                  {newMessageCount}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {otherPersonName
                ? `Communicate with ${otherPersonName}`
                : isCustomer
                  ? 'Communicate with your shopper'
                  : 'Communicate with the customer'
              }
            </CardDescription>
          </div>
        </div>

        {/* Chat controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSound}
            title={soundEnabled ? "Mute notifications" : "Enable sound notifications"}
            className="relative rounded-full hover:bg-indigo-50"
          >
            {soundEnabled ? 
              <Volume2 size={18} className="text-indigo-600" /> : 
              <VolumeOff size={18} className="text-gray-500" />
            }
          </Button>
        </div>
      </div>
      
      {/* Animated indicator when new messages */}
      {hasNewMessages && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" 
             style={{ animation: 'pulse 2s infinite' }}></div>
      )}
    </CardHeader>
  );
}