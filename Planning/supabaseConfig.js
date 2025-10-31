// Supabase Configuration
const SUPABASE_URL = 'https://grduintobeybnvrwmyty.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZHVpbnRvYmV5Ym52cndteXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjgxOTYsImV4cCI6MjA3NzQwNDE5Nn0._crbCRqRaQfAJwZplc-7RWD4AbaA63lliCsGjTCESV0';

// Initialize Supabase client
let supabase = null;

// Initialize Supabase when script loads
if (typeof window !== 'undefined' && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase initialized');
} else {
    console.error('Supabase JS library not loaded. Make sure to include it in index.html');
}

// Export for use in other files
window.supabaseClient = supabase;

