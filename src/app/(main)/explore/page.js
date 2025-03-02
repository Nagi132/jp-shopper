'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import ExplorePage from '@/components/explore/ExplorePage';

export default function ExplorePageRoute() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    getUser();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return <ExplorePage user={user} />;
}