'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

const RequestDetail = ({ id }) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  // Extract ID from either props or route params
  const requestId = id || useParams()?.id;
  
  // Clean the ID (remove 'request-' prefix if present)
  const cleanId = requestId?.startsWith('request-') 
    ? requestId.replace('request-', '') 
    : requestId;
  
  // Fetch the request data
  useEffect(() => {
    const fetchRequest = async () => {
      if (!cleanId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .eq('id', cleanId)
          .single();
          
        if (error) throw error;
        if (!data) throw new Error('Request not found');
        
        setRequest(data);
      } catch (err) {
        console.error('Error fetching request:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequest();
  }, [cleanId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading request details...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md m-4">
        <h2 className="text-lg font-medium mb-2">Error Loading Request</h2>
        <p className="mb-4">{error}</p>
        <button 
          onClick={() => router.back()} 
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  if (!request) {
    return (
      <div className="p-4">
        <h2 className="text-lg">Request not found</h2>
      </div>
    );
  }
  
  return (
    <div className="p-4 h-full overflow-auto">
      <h1 className="text-xl font-bold mb-2">{request.title}</h1>
      
      <div className="mb-4">
        <span className="inline-block px-2 py-1 text-xs rounded-full capitalize bg-gray-100">
          {request.status}
        </span>
        <span className="ml-3">
          Budget: {request.budget ? `¥${request.budget.toLocaleString()}` : 'Flexible'}
        </span>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">Description</h2>
        <p className="whitespace-pre-wrap">{request.description}</p>
      </div>
      
      {request.images && request.images.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {request.images.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Reference ${index + 1}`}
                className="w-full h-32 object-cover rounded-md"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetail;