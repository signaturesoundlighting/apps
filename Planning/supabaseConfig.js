// Supabase Configuration
// Wrap in IIFE to prevent variable redeclaration errors
(function() {
    'use strict';
    
    const SUPABASE_URL = 'https://grduintobeybnvrwmyty.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZHVpbnRvYmV5Ym52cndteXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjgxOTYsImV4cCI6MjA3NzQwNDE5Nn0._crbCRqRaQfAJwZplc-7RWD4AbaA63lliCsGjTCESV0';

    // Initialize Supabase client
    let supabase = null;

    // Function to initialize Supabase
    function initializeSupabase() {
        if (typeof window !== 'undefined' && window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabaseClient = supabase;
            console.log('Supabase initialized');
            return true;
        } else {
            console.error('Supabase JS library not loaded. Make sure to include it in index.html');
            return false;
        }
    }

    // Try to initialize immediately if library is already loaded
    // Skip if already initialized to prevent reinitialization
    if (typeof window !== 'undefined' && !window.supabaseClient) {
        if (window.supabase) {
            initializeSupabase();
        } else {
            // Wait for library to load
            const checkSupabase = setInterval(() => {
                if (window.supabase) {
                    initializeSupabase();
                    clearInterval(checkSupabase);
                }
            }, 100);
            
            // Stop checking after 5 seconds
            setTimeout(() => {
                clearInterval(checkSupabase);
                if (!supabase && typeof window !== 'undefined') {
                    console.error('Supabase library failed to load after 5 seconds');
                }
            }, 5000);
        }
    } else if (typeof window !== 'undefined' && window.supabaseClient) {
        // Already initialized, just log
        console.log('Supabase already initialized');
    }

    // Export for use in other files (only if not already set)
    if (typeof window !== 'undefined' && !window.supabaseClient) {
        window.supabaseClient = supabase;
    }
})();

