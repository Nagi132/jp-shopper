// src/lib/supabase/admin.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will fail.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);