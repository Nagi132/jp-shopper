// lib/hooks/useCustomerRequests.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useCustomerRequests(userId) {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ open: 0, active: 0, completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all customer requests with detailed filtering
      const { data: customerRequests, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(15);  // Limit to prevent overfetching

      if (requestsError) throw requestsError;

      // Categorize requests
      const openRequests = customerRequests.filter(r => r.status === 'open');
      const activeRequests = customerRequests.filter(r => 
        ['assigned', 'paid', 'purchased', 'shipped'].includes(r.status)
      );
      const completedRequests = customerRequests.filter(r => r.status === 'completed');

      // Set requests and stats
      setRequests(customerRequests);
      setStats({
        open: openRequests.length,
        active: activeRequests.length,
        completed: completedRequests.length,
        total: customerRequests.length
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching customer requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [userId]);

  return { 
    requests, 
    stats, 
    loading, 
    error, 
    refresh: fetchRequests,
    // Helper methods for filtering
    getOpenRequests: () => requests.filter(r => r.status === 'open'),
    getActiveRequests: () => requests.filter(r => 
      ['assigned', 'paid', 'purchased', 'shipped'].includes(r.status)
    ),
    getCompletedRequests: () => requests.filter(r => r.status === 'completed')
  };
}