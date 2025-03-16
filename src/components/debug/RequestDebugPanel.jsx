// src/components/debug/RequestDebugPanel.jsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function RequestDebugPanel({ requestId, currentStatus }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Force status update function
  const forceStatusUpdate = async (newStatus) => {
    if (!confirm(`DEBUG: Force status to "${newStatus}"?`)) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();
        
      if (error) throw error;
      
      setResult({
        success: true,
        message: `Status updated to: ${newStatus}`,
        data
      });
      
      // Reload after 2 seconds
      setTimeout(() => window.location.reload(), 2000);
      
    } catch (err) {
      console.error('Debug status update error:', err);
      setResult({
        success: false,
        message: `Error: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Only show in development
  if (process.env.NODE_ENV === 'production') return null;
  
  return (
    <Card className="bg-gray-100 border-gray-300 mt-6">
      <CardHeader className="bg-gray-200">
        <CardTitle className="text-sm">Debug Panel (Dev Only)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs mb-2">Current status: <span className="font-mono">{currentStatus}</span></div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => forceStatusUpdate('open')} disabled={loading}>
            Set: open
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => forceStatusUpdate('assigned')} disabled={loading}>
            Set: assigned
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => forceStatusUpdate('paid')} disabled={loading}>
            Set: paid
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => forceStatusUpdate('purchased')} disabled={loading}>
            Set: purchased
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => forceStatusUpdate('shipped')} disabled={loading}>
            Set: shipped
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => forceStatusUpdate('completed')} disabled={loading}>
            Set: completed
          </Button>
        </div>
        
        {result && (
          <div className={`text-xs p-2 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {result.message}
          </div>
        )}
        
        {loading && (
          <div className="flex items-center text-xs text-blue-600">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing...
          </div>
        )}
      </CardContent>
    </Card>
  );
}