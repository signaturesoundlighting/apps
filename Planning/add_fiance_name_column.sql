-- Add fiance_name column to clients table
-- Run this SQL in Supabase SQL Editor

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS fiance_name TEXT;

-- Add a comment to the column (optional)
COMMENT ON COLUMN clients.fiance_name IS 'Name of the fiance/fiancee for wedding events';

