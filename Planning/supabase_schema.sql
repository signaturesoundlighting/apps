-- Supabase Database Schema
-- IMPORTANT: Run this SQL in order (clients must be created first)

-- Clients table (main client/event information) - CREATE THIS FIRST
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

-- Events table (wedding timeline events) - CREATE THIS SECOND (references clients)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    event_order INTEGER NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    time TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- General info table (venue and planner details) - CREATE THIS THIRD (references clients)
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

