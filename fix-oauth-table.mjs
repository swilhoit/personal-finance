import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Add the missing provider column using raw SQL via the REST API
const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
  method: 'POST',
  headers: {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: "ALTER TABLE public.oauth_states ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'discord';"
  })
});

console.log('Response status:', response.status);
const text = await response.text();
console.log('Response:', text);
