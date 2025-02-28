'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function MessagingSection({ 
  requestId, 
  userId,
  requestStatus,
  shopperName,
  className = "" 
}) {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!requestId || !userId) return;

      setLoadingMessages(true);
      try {
        console.log('Fetching messages for request:', requestId);

        // First, fetch the messages themselves
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        if (!messagesData || messagesData.length === 0) {
          setMessages([]);
          setLoadingMessages(false);
          return;
        }

        // Then, fetch profiles for all senders in a separate query
        const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name')
          .in('user_id', senderIds);

        if (profilesError) throw profilesError;

        // Merge the data manually
        const enrichedMessages = messagesData.map(message => {
          const senderProfile = profilesData?.find(p => p.user_id === message.sender_id);
          return {
            ...message,
            sender: senderProfile || { username: 'Unknown User', full_name: null }
          };
        });

        console.log('Enriched messages:', enrichedMessages);
        setMessages(enrichedMessages);

        // Mark messages as read
        const unreadMessages = messagesData
          .filter(msg => msg.sender_id !== userId && !msg.is_read)
          .map(msg => msg.id);

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages);
        }
      } catch (err) {
        console.error('Error in message fetching:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`messages-${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `request_id=eq.${requestId}`
      }, (payload) => {
        console.log('New message received:', payload);
        fetchMessages(); // Refetch all messages
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from messages channel');
      channel.unsubscribe();
    };
  }, [requestId, userId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      const newMessage = {
        request_id: requestId,
        sender_id: userId,
        content: messageText.trim(),
        is_read: false,
        created_at: new Date().toISOString()
      };

      console.log('Sending message:', newMessage);

      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select();

      if (error) {
        console.error('Database error when saving message:', error);
        throw error;
      }

      console.log('Message saved successfully:', data);

      // Clear the input
      setMessageText('');

      // Update UI with the actual saved message (optional as subscription should handle this)
      if (data && data[0]) {
        // Add the sender info manually
        setMessages([...messages, {
          ...data[0],
          sender: {
            username: 'You',
            full_name: 'You'
          }
        }]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle>Messages</CardTitle>
        <CardDescription>
          {shopperName ? `Communicate with ${shopperName}` : 'Communication about this request'}
        </CardDescription>
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
            <p className="text-sm">Start the conversation with your shopper/customer</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto mb-4 p-2">
            {messages.map((message, index) => (
              <div
                key={message.id || `msg-${index}`}
                className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs sm:max-w-md rounded-lg px-4 py-2 ${
                    message.sender_id === userId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="text-xs mb-1">
                    {message.sender_id === userId 
                      ? 'You' 
                      : (message.sender?.full_name || message.sender?.username || 'User')}
                  </div>
                  <p className="text-sm">{message.content}</p>
                  <div className="text-xs text-right mt-1 opacity-70">
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        <form onSubmit={handleSendMessage} className="mt-4">
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              disabled={requestStatus === 'completed'}
            />
            <Button
              type="submit"
              disabled={!messageText.trim() || requestStatus === 'completed'}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}