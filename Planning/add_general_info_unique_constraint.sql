-- Add unique constraint on client_id to general_info table
-- This ensures one record per client and enables proper upsert behavior
ALTER TABLE general_info 
ADD CONSTRAINT general_info_client_id_unique UNIQUE (client_id);

