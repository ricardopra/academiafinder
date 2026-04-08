const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://aedkngafdsexqblzfuhv.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  throw new Error(
    'Supabase key not configured. Set SUPABASE_SERVICE_ROLE_KEY for the backend or fallback to SUPABASE_ANON_KEY.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
