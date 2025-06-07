// src/lib/supabase/server.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log the connection details to verify (sanitized for security)
console.log('Initializing server Supabase client with:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'undefined',
    keyProvided: !!supabaseServiceKey
  });
  
export const supabase = createClient(supabaseUrl, supabaseServiceKey);