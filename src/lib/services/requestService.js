// src/lib/services/requestService.js
import { supabase } from '@/lib/supabase/client';

export async function createRequest(requestData) {
  try {
    const { data, error } = await supabase
      .from('requests')
      .insert(requestData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
}

export async function updateRequestStatus(requestId, status) {
  try {
    const { data, error } = await supabase
      .from('requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
}

export async function fetchUserRequests(userId, options = {}) {
  const { 
    limit = 15, 
    status = null, 
    orderBy = 'created_at', 
    ascending = false 
  } = options;

  try {
    let query = supabase
      .from('requests')
      .select('*')
      .eq('customer_id', userId)
      .order(orderBy, { ascending });

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user requests:', error);
    throw error;
  }
}