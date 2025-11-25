import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 DEBUG KONTROL:");
console.log("URL:", supabaseUrl);
console.log("KEY:", supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL veya Anon Key eksik! .env dosyasını kontrol et.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);