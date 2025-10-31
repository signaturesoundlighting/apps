// Supabase Configuration
// IMPORTANT: Replace these values with your actual Supabase project credentials
// Get them from: Supabase Dashboard → Settings → API

const SUPABASE_URL = 'YOUR_PROJECT_URL_HERE'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Your anon public key

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

