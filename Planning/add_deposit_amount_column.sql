-- Add deposit_amount column to clients table
-- Run this SQL in Supabase SQL Editor

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2);

-- Add a comment to the column (optional)
COMMENT ON COLUMN clients.deposit_amount IS 'Deposit amount required for the event';

