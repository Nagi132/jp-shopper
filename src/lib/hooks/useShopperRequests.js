// lib/hooks/useShopperRequests.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useShopperRequests(shopperProfileId) {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ open: 0, active: 0, completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    if (!shopperProfileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch open requests
      const { data: openRequests, error: openRequestsError } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);

      if (openRequestsError) throw openRequestsError;

      // Fetch assigned requests
      const { data: assignedRequests, error: assignedRequestsError } = await supabase
        .from('requests')
        .select('*')
        .eq('shopper_id', shopperProfileId)
        .in('status', ['assigned', 'paid', 'purchased', 'shipped'])
        .order('updated_at', { ascending: false });

      if (assignedRequestsError) throw assignedRequestsError;

      // Fetch completed requests
      const { data: completedRequests, error: completedRequestsError } = await supabase
        .from('requests')
        .select('*')
        .eq('shopper_id', shopperProfileId)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (completedRequestsError) throw completedRequestsError;

      // Combine and set data
      const allRequests = [
        ...(openRequests || []),
        ...(assignedRequests || []),
        ...(completedRequests || [])
      ];

      setRequests(allRequests);
      
      // Update stats
      setStats({
        open: openRequests?.length || 0,
        active: assignedRequests?.length || 0,
        completed: completedRequests?.length || 0,
        total: (openRequests?.length || 0) + (assignedRequests?.length || 0) + (completedRequests?.length || 0)
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching shopper requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [shopperProfileId]);

  return { requests, stats, loading, error, refresh: fetchRequests };
}