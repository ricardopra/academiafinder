const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aedkngafdsexqblzfuhv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZGtuZ2FmZHNleHFibHpmdWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDg3MDksImV4cCI6MjA5MDc4NDcwOX0.iBJtDZbGrbRE-GuETM5EuTRWV-ySjMERi6d90xnfb2A';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;