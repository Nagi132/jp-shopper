'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ItemDetailPage from '@/components/item/ItemDetailPage';

/**
 * Item detail page that loads a specific listing
 */
export default function ItemPage() {
  const params = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seller, setSeller] = useState(null);
  const [sellerReviews, setSellerReviews] = useState([]);
  
  console.log('ItemPage rendering with ID:', params.id);

  // Fetch item and seller data
  useEffect(() => {
    async function fetchData() {
      try {
        if (!params.id) {
          setError('No item ID provided');
          setLoading(false);
          return;
        }

        // Fetch the listing data
        const { data, error: fetchError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', params.id)
          .single();
          
        console.log('Supabase listing query result:', { data, error: fetchError });
          
        if (fetchError) {
          throw new Error(fetchError.message);
        }
        
        if (!data) {
          throw new Error(`Item with ID ${params.id} not found`);
        }
        
        // Ensure photos is always an array
        if (!data.photos) {
          data.photos = [];
        }
        
        // If photos is a string (JSON), parse it
        if (typeof data.photos === 'string') {
          try {
            data.photos = JSON.parse(data.photos);
          } catch (e) {
            console.error('Error parsing photos JSON:', e);
            data.photos = [];
          }
        }
        
        // Make sure photos is an array
        if (!Array.isArray(data.photos)) {
          data.photos = [];
        }
        
        setItem(data);
        
        // Fetch seller data if available
        if (data.user_id) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user_id)
            .single();
            
          if (!userError) {
            setSeller(userData);
          }
          
          // Fetch reviews
          const { data: reviewsData } = await supabase
            .from('user_reviews')
            .select('*')
            .eq('reviewee_id', data.user_id)
            .order('created_at', { ascending: false })
            .limit(5);
            
          setSellerReviews(reviewsData || []);
        }
      } catch (err) {
        console.error('Error fetching item:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [params.id]);

  // Render loading, error state, or the ItemDetailPage component
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Item</h2>
          <p className="text-red-600">{error}</p>
          <div className="mt-4">
            <p className="text-sm text-gray-700">Debug info: Item ID = {params.id}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-4">
      <ItemDetailPage 
        item={item}
        seller={seller}
        reviews={sellerReviews}
        loading={loading}
        error={error}
      />
    </div>
  );
} 