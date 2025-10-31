# Supabase Integration Guide

## Overview
This guide will help you integrate Supabase as your backend database for the Planning app.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login
3. Click "New Project"
4. Fill in:
   - **Name**: Signature Sound & Lighting (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
5. Wait for project to be created (~2 minutes)

## Step 2: Get Your API Keys

Once your project is created:
1. Go to **Settings** → **API**
2. Copy these values (you'll need them):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## Step 3: Database Schema

Run this SQL in Supabase SQL Editor (Tools → SQL Editor):

```sql
-- Events table (wedding timeline events)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    event_order INTEGER NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    time TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table (main client/event information)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_date DATE NOT NULL,
    client_name TEXT,
    client_phone TEXT,
    client_address TEXT,
    venue_name TEXT,
    venue_address TEXT,
    services TEXT,
    total_balance DECIMAL(10, 2),
    signature TEXT,
    signature_date TIMESTAMP WITH TIME ZONE,
    deposit_paid BOOLEAN DEFAULT FALSE,
    payment_intent_id TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- General info table (venue and planner details)
CREATE TABLE general_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    venue_name TEXT,
    venue_address TEXT,
    different_ceremony_venue BOOLEAN DEFAULT FALSE,
    ceremony_venue_name TEXT,
    ceremony_venue_address TEXT,
    planner_name TEXT,
    planner_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_order ON events(client_id, event_order);
CREATE INDEX idx_general_info_client_id ON general_info(client_id);

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_info ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can restrict later)
CREATE POLICY "Allow all operations" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON events FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON general_info FOR ALL USING (true);
```

## Step 4: Install Supabase Client

You'll need to install the Supabase JavaScript client. Since this appears to be a static site, you can either:

**Option A: Use CDN (Recommended for static sites)**
Add to `index.html` before your scripts:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

**Option B: Use npm (if you have a build process)**
```bash
npm install @supabase/supabase-js
```

## Step 5: Configuration File

Create `supabaseConfig.js` with your credentials:

```javascript
// Supabase Configuration
const SUPABASE_URL = 'YOUR_PROJECT_URL'; // Replace with your Supabase project URL
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'; // Replace with your anon public key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

## Step 6: Integration Points

You'll need to update these files to use Supabase:

1. **serviceAgreement.js** - Load/save client data
2. **depositPayment.js** - Update payment status
3. **data.js** - Load events and general info
4. **modal.js** - Save event details
5. **ui.js** - Load initial data

## Step 7: Authentication (Optional)

If you want user authentication later:
1. Go to **Authentication** → **Providers**
2. Enable email/password or other providers
3. Use Supabase Auth for login/signup

## Security Notes

- The `anon` key is safe to expose in frontend code
- Row Level Security (RLS) policies control data access
- Never expose your `service_role` key in frontend code
- For Stripe webhooks, create a separate API endpoint (server-side)

## Next Steps After Setup

1. Create the database tables using the SQL above
2. Create `supabaseConfig.js` with your credentials
3. Update functions to load from/save to Supabase instead of localStorage
4. Test with a test client record

