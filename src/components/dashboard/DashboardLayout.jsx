'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

export default function DashboardLayout({ 
  children, 
  profile, 
  refreshing, 
  onRefresh 
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Welcome, {profile.full_name || profile.username}!
        </h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh} 
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      {children}
    </div>
  );
}