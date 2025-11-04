-- SQL INSERT statements for importing events into Supabase clients table
-- IMPORTANT: Update event_date values with actual dates before running!
-- Replace 'YYYY-MM-DD' placeholders below with actual event dates

-- Event 1: FVMS Dance
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone, 
    venue_name, venue_address, services, deposit_amount, total_balance, 
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'School', 'FVMS Dance', 'Joni Barnwell', NULL, '(919) 616-9525',
    'Fuquay-Varina Middle School Gymnasium', '1201 Bowling Rd, Fuquay Varina, NC. 27526',
    'Standard DJ Package', 0.00, 450.00,
    false, false, NULL, false, false, '2025-11-07'
);

-- Event 2: Ice Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Ice Wedding', NULL, NULL, NULL,
    'Campbell Lodge', 'Campbell Lodge in Durant Nature Preserve',
    'Reception Package, Ceremony Package', 400.00, 2050.00,
    true, false, 'completed', false, false, '2025-11-15'
);

-- Event 3: Kayla's Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Kayla''s Wedding', 'Kayla Gregory', NULL, NULL,
    'Birdsong Chapel at Cornealius Properties', '1536 Old Smithfield Rd, Goldsboro, NC 27530, USA',
    'Ceremony Package, Reception Package, Digital Photo Booth', 1000.00, 1950.00,
    true, false, 'completed', false, false, '2025-11-22'
);

-- Event 4: Lauren's Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Lauren''s Wedding', 'Lauren Patterson', NULL, '(919) 414-6255',
    'Daniel''s Ridge', '1851 Avents Ferry Rd, Sanford, NC 27330',
    'Ceremony Package, Reception Package', 400.00, 1950.00,
    true, false, 'completed', false, false, '2025-12-07'
);

-- Event 5: Middle School Glow Party - Peak Charter
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'School', 'Middle School Glow Party - Peak Charter', 'Stephanie Robbins', NULL, NULL,
    'Peak Charter Academy', '1601 Orchard Villas Ave, Apex, NC 27502',
    'Standard DJ Package, Print Photo Booth', 0.00, 750.00,
    false, false, NULL, false, false, '2025-12-12'
);

-- Event 6: Adams Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Adams Wedding', 'Samuel Adams', NULL, NULL,
    'Chatham Station', '110 N Walker St, Cary, NC 27511, United States',
    'Reception Package', 400.00, 1700.00,
    false, false, 'completed', false, false, '2025-12-13'
);

-- Event 7: Ceremony Audio
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Other', 'Ceremony Audio', NULL, NULL, NULL,
    'Donovan Manor', '5733 Hilltop Rd, Fuquay-Varina, NC 27526, United States',
    'Ceremony Package', 0.00, 500.00,
    false, false, 'completed', false, false, '2025-12-14'
);

-- Event 8: K-2 School Dance - Kings & Queens Dance - Peak Charter
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'School', 'K-2 School Dance - Kings & Queens Dance - Peak Charter', 'Stephanie Robbins', NULL, NULL,
    'Peak Charter Academy', '1601 Orchard Villas Ave, Apex, NC 27502',
    'Standard DJ Package, Print Photo Booth', 0.00, 750.00,
    false, false, NULL, false, false, '2026-01-30'
);

-- Event 9: Cary High School NJROTC Ball
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'School', 'Cary High School NJROTC Ball', 'Amy Kohn', NULL, NULL,
    'MacGregor Downs Country Club', '430 St Andrews Ln, Cary, NC 27511',
    'Standard DJ Package', 0.00, 780.00,
    false, false, NULL, false, false, '2026-02-14'
);

-- Event 10: Lauren & Cullen's Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Lauren & Cullen''s Wedding', 'Lauren Jillson', 'Cullen', '(336) 409-1590',
    'Market Hall', '214 E Martin St, Raleigh, NC 27601',
    'Ceremony Package, Reception Package, Free Add-on (Undecided)', 400.00, 2050.00,
    true, false, 'completed', false, false, '2026-02-28'
);

-- Event 11: Cassie & Drew's Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Cassie & Drew''s Wedding', 'Cassie', 'Drew', NULL,
    'Chatham Station', NULL,
    'Reception Package, Ceremony Package', 400.00, 1700.00,
    true, false, 'completed', false, false, '2026-03-08'
);

-- Event 12: Grades 3-5 Dance - Hollywood Party - Peak Charter
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'School', 'Grades 3-5 Dance - Hollywood Party - Peak Charter', 'Stephanie Robbins', NULL, NULL,
    'Peak Charter Academy', NULL,
    'Standard DJ Package, Print Photo Booth', 0.00, 750.00,
    false, false, NULL, false, false, '2026-04-17'
);

-- Event 13: Ashwin & Jocelyn's Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Ashwin & Jocelyn''s Wedding', 'Ashwin', 'Jocelyn', NULL,
    NULL, NULL,
    'Reception Package, Ceremony Package, Digital Photo Booth', 400.00, 2050.00,
    true, false, 'completed', false, false, '2026-04-18'
);

-- Event 14: Kate & Dakota's Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Kate & Dakota''s Wedding', 'Kate Piercy', 'Dakota', '(919) 480-9285',
    'The Pavilion at Carriage Farm', '1913 Pagan Rd Raleigh, NC 27603 United States',
    'Reception Package, Ceremony Package, Digital Photo Booth', 400.00, 2050.00,
    true, false, 'completed', false, false, '2026-05-24'
);

-- Event 15: Tommy & Emily's Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Tommy & Emily''s Wedding', 'Tommy', 'Emily', NULL,
    NULL, NULL,
    'Reception Package, Ceremony Package, Digital Photo Booth', 400.00, 2000.00,
    false, false, 'completed', false, false, '2026-05-24'
);

-- Event 16: Taylor & Holden's Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Taylor & Holden''s Wedding', NULL, NULL, NULL,
    'Landon Estate', '2035 Indian Camp Rd, Clayton, NC 27520',
    'Reception Package, Ceremony Package', 400.00, 2050.00,
    true, false, 'completed', false, false, '2026-06-13'
);

-- Event 17: Henry & Hunter's Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Henry & Hunter''s Wedding', NULL, NULL, NULL,
    NULL, NULL,
    'Reception Package, Ceremony Package', 850.00, 1700.00,
    true, false, 'completed', false, false, '2026-08-08'
);

-- Event 18: Jordyn's Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Jordyn''s Wedding', 'Jordyn Rennox', NULL, '(512) 758-5165',
    'The Champion Estates', '3406 Stagecoach Rd. Durham, NC 27713',
    'Standard DJ Package, Digital Photo Booth, Ceremony Package', 400.00, 2050.00,
    false, false, 'completed', false, false, '2026-09-05'
);

-- Event 19: Sam & Anna's Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Sam & Anna''s Wedding', NULL, NULL, NULL,
    'Twin Fields Farms', '1855 N May Street, Southern Pines NC',
    'Reception Package, Ceremony Package', 400.00, 2050.00,
    true, false, 'completed', false, false, '2026-10-17'
);

-- Event 20: Megan's Wedding
INSERT INTO clients (
    event_type, event_name, client_name, fiance_name, client_phone,
    venue_name, venue_address, services, deposit_amount, total_balance,
    deposit_paid, remaining_balance_paid, signature, archived, onboarding_completed, event_date
) VALUES (
    'Wedding', 'Megan''s Wedding', 'Megan', NULL, NULL,
    NULL, NULL,
    'Reception Package, Digital Photo Booth', 400.00, 2050.00,
    true, false, 'completed', false, false, '2026-10-21'
);

-- IMPORTANT NOTES:
-- 1. All event_date values have been added in YYYY-MM-DD format
-- 
-- 2. For events where "Status" is "Booked", I've set signature = 'completed'
--    If the signature hasn't been collected yet, change to signature = NULL
--
-- 3. Some weddings have names in the event_name that could be split into client_name and fiance_name
--    Review these and update if needed (e.g., "Tommy & Emily's Wedding" -> client_name='Tommy', fiance_name='Emily')
--
-- 4. Double-check all currency values - they've been converted from $1,000.00 format to 1000.00
--
-- 5. Boolean values have been converted: TRUE -> true, FALSE -> false
--
-- 6. Event dates converted from MM/DD/YYYY format to YYYY-MM-DD format for SQL compatibility
--
-- 7. Ready to run! Copy and paste these statements into Supabase SQL Editor

