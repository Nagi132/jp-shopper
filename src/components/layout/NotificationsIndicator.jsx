'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationsIndicator() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get user's requests (as customer)
      const { data: customerRequests } = await supabase
        .from('requests')
        .select('id')
        .eq('customer_id', user.id);
        
      // Get requests where user is shopper
      const { data: profile } = await supabase
        .from('profiles')
        .select('shopper_profiles(id)')
        .eq('user_id', user.id)
        .single();
        
      const shopperProfileId = profile?.shopper_profiles?.id;
      
      if (shopperProfileId) {
        const { data: shopperRequests } = await supabase
          .from('requests')
          .select('id')
          .eq('shopper_id', shopperProfileId);
          
        const allRequestIds = [
          ...(customerRequests || []).map(r => r.id),
          ...(shopperRequests || []).map(r => r.id)
        ];
        
        if (allRequestIds.length > 0) {
          const { data: unreadMessages, error } = await supabase
            .from('messages')
            .select('id')
            .in('request_id', allRequestIds)
            .eq('is_read', false)
            .neq('sender_id', user.id);
            
          if (!error) {
            setCount(unreadMessages.length);
          }
        }
      }
    };
    
    fetchUnreadCount();
    
    // Set up subscription for new messages
    const subscription = supabase
      .channel('unread_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return (
    <Button variant="ghost" size="icon" className="relative">
      <Bell size={20} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Button>
  );
}