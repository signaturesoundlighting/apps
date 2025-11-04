// Helper function to extract first name from full name
function getFirstName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return '';
    }
    // Split by space and take the first part
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || '';
}

// Update header with client data from Supabase
async function updateHeader() {
    const clientId = getClientIdFromUrl();
    
    const coupleNameEl = document.querySelector('.couple-name');
    const weddingDateEl = document.querySelector('.wedding-date');
    
    if (!clientId) {
        // No client ID - show defaults
        if (coupleNameEl) {
            coupleNameEl.textContent = 'John & Sarah';
            coupleNameEl.style.visibility = 'visible';
        }
        if (weddingDateEl) {
            weddingDateEl.textContent = '10/18/26';
            weddingDateEl.style.visibility = 'visible';
        }
        return;
    }
    
    // Load client data
    if (window.supabaseHelpers && window.supabaseHelpers.getClientData) {
        const clientData = await window.supabaseHelpers.getClientData(clientId);
        
        if (clientData) {
            // Update couple name (first names only)
            if (coupleNameEl) {
                const clientFirstName = getFirstName(clientData.client_name);
                const fianceFirstName = getFirstName(clientData.fiance_name);
                
                if (clientFirstName && fianceFirstName) {
                    coupleNameEl.textContent = `${clientFirstName} & ${fianceFirstName}`;
                } else if (clientFirstName) {
                    coupleNameEl.textContent = clientFirstName;
                } else if (fianceFirstName) {
                    coupleNameEl.textContent = fianceFirstName;
                } else {
                    // If both empty, use default
                    coupleNameEl.textContent = 'John & Sarah';
                }
                // Make visible once content is set
                coupleNameEl.style.visibility = 'visible';
            }
            
            // Update wedding date
            if (weddingDateEl) {
                if (clientData.event_date) {
                    const dateStr = clientData.event_date; // Format: YYYY-MM-DD
                    const [year, month, day] = dateStr.split('-');
                    const yy = year.substring(2); // Last 2 digits of year
                    weddingDateEl.textContent = `${month}/${day}/${yy}`;
                } else {
                    weddingDateEl.textContent = '10/18/26';
                }
                // Make visible once content is set
                weddingDateEl.style.visibility = 'visible';
            }
        } else {
            // No client data found - show defaults
            if (coupleNameEl) {
                coupleNameEl.textContent = 'John & Sarah';
                coupleNameEl.style.visibility = 'visible';
            }
            if (weddingDateEl) {
                weddingDateEl.textContent = '10/18/26';
                weddingDateEl.style.visibility = 'visible';
            }
        }
    } else {
        // Supabase helpers not available - show defaults
        if (coupleNameEl) {
            coupleNameEl.textContent = 'John & Sarah';
            coupleNameEl.style.visibility = 'visible';
        }
        if (weddingDateEl) {
            weddingDateEl.textContent = '10/18/26';
            weddingDateEl.style.visibility = 'visible';
        }
    }
}

// Initialize the app
async function init() {
    const clientId = getClientIdFromUrl();
    
    // Only initialize if we have a client ID and all requirements are met
    if (!clientId) {
        console.log('Waiting for client ID...');
        return;
    }
    
    // Update header with client data
    await updateHeader();
    
    // Load events from Supabase
    if (window.supabaseHelpers && window.supabaseHelpers.getEvents) {
        const supabaseEvents = await window.supabaseHelpers.getEvents(clientId);
        
        // Capture default events BEFORE we modify the events array
        // This preserves the original default events from data.js
        const defaultEvents = [
            { id: 1, type: 'ceremony', name: 'Ceremony', time: '', details: {} },
            { id: 2, type: 'cocktail-hour', name: 'Cocktail Hour', time: '', details: {} },
            { id: 3, type: 'intros', name: 'Wedding Party Introductions', time: '', details: {} },
            { id: 4, type: 'first-dance', name: 'First Dance', time: '', details: {} },
            { id: 5, type: 'special-dance-1', name: 'Special Dance #1', time: '', details: {} },
            { id: 6, type: 'special-dance-2', name: 'Special Dance #2', time: '', details: {} },
            { id: 7, type: 'blessing', name: 'Blessing', time: '', details: {} },
            { id: 8, type: 'welcome', name: 'Welcome', time: '', details: {} },
            { id: 9, type: 'dinner', name: 'Dinner', time: '', details: {} },
            { id: 10, type: 'toasts', name: 'Toasts', time: '', details: {} },
            { id: 11, type: 'cake-cutting', name: 'Cake Cutting', time: '', details: {} },
            { id: 12, type: 'photo-dash', name: 'Photo Dash', time: '', details: {} },
            { id: 13, type: 'shoe-game', name: 'Shoe Game', time: '', details: {} },
            { id: 14, type: 'open-dancing', name: 'Open Dancing', time: '', details: {} },
            { id: 15, type: 'last-group-dance', name: 'Last Group Dance', time: '', details: {} },
            { id: 16, type: 'private-last-dance', name: 'Private Last Dance', time: '', details: {} },
            { id: 17, type: 'grand-exit', name: 'Grand Exit', time: '', details: {} },
            { id: 18, type: 'end-of-wedding', name: 'End of Wedding', time: '', details: {} }
        ];
        
        if (supabaseEvents && supabaseEvents.length > 0) {
            // Convert Supabase events to local format
            events = supabaseEvents.map((supabaseEvent, index) => {
                return window.supabaseHelpers.convertSupabaseEventToLocal(supabaseEvent, index + 1);
            });
            
            // Update nextId to be higher than the highest local ID
            if (typeof nextId !== 'undefined') {
                nextId = Math.max(nextId, events.length + 1);
            }
            
            console.log('Loaded events from Supabase:', events.length);
            
            // Check if we have fewer events than expected defaults
            // If we have significantly fewer (less than half), initialize missing ones
            if (defaultEvents.length > 0 && events.length < defaultEvents.length * 0.5) {
                console.log(`Only ${events.length} events found, expected ~${defaultEvents.length}. Initializing missing default events...`);
                
                // Create a map of existing event types
                const existingTypes = new Set(events.map(e => e.type));
                
                // Find missing default events
                const missingEvents = defaultEvents.filter(defaultEvent => !existingTypes.has(defaultEvent.type));
                
                if (missingEvents.length > 0 && window.supabaseHelpers && window.supabaseHelpers.saveEvent) {
                    // Add missing events and save them
                    const savePromises = missingEvents.map((event, index) => {
                        // Insert in correct position based on default order
                        const insertIndex = defaultEvents.findIndex(e => e.type === event.type);
                        const actualIndex = insertIndex >= 0 ? insertIndex : events.length;
                        
                        // Add to events array at the correct position
                        if (insertIndex >= 0 && insertIndex <= events.length) {
                            events.splice(insertIndex, 0, { ...event });
                        } else {
                            events.push({ ...event });
                        }
                        
                        return window.supabaseHelpers.saveEvent(clientId, event, actualIndex);
                    });
                    
                    try {
                        const savedEvents = await Promise.all(savePromises);
                        
                        // Update events with their Supabase IDs
                        savedEvents.forEach((savedEvent, index) => {
                            const eventType = missingEvents[index].type;
                            const eventIndex = events.findIndex(e => e.type === eventType && !e.supabase_id);
                            if (savedEvent && eventIndex >= 0) {
                                events[eventIndex].supabase_id = savedEvent.id;
                            }
                        });
                        
                        // Re-sort events by their position in defaultEvents to maintain order
                        events.sort((a, b) => {
                            const aIndex = defaultEvents.findIndex(e => e.type === a.type);
                            const bIndex = defaultEvents.findIndex(e => e.type === b.type);
                            return (aIndex >= 0 ? aIndex : 999) - (bIndex >= 0 ? bIndex : 999);
                        });
                        
                        // Update event_order in Supabase to reflect correct order
                        if (window.supabaseHelpers && window.supabaseHelpers.updateEventOrder) {
                            await window.supabaseHelpers.updateEventOrder(clientId, events);
                        }
                        
                        console.log(`Initialized and saved ${savedEvents.length} missing default events to Supabase`);
                    } catch (error) {
                        console.error('Error saving missing default events to Supabase:', error);
                    }
                }
            }
        } else {
            // No events found in Supabase - initialize with default events and save them
            console.log('No events found in Supabase, initializing default events');
            
            // Events array should already have default events from data.js
            // Now we need to save them all to Supabase
            if (defaultEvents && defaultEvents.length > 0 && window.supabaseHelpers && window.supabaseHelpers.saveEvent) {
                console.log('Saving default events to Supabase...');
                
                // Use defaultEvents to ensure we have the right array
                events = defaultEvents.map((e, i) => ({ ...e, id: i + 1 }));
                
                // Save all default events to Supabase
                const savePromises = events.map((event, index) => {
                    return window.supabaseHelpers.saveEvent(clientId, event, index);
                });
                
                try {
                    const savedEvents = await Promise.all(savePromises);
                    
                    // Update events with their Supabase IDs
                    savedEvents.forEach((savedEvent, index) => {
                        if (savedEvent && events[index]) {
                            events[index].supabase_id = savedEvent.id;
                        }
                    });
                    
                    console.log(`Initialized and saved ${savedEvents.length} default events to Supabase`);
                } catch (error) {
                    console.error('Error saving default events to Supabase:', error);
                }
            }
        }
    }
    
    // Load general info from Supabase
    if (window.supabaseHelpers && window.supabaseHelpers.getGeneralInfo) {
        let supabaseGeneralInfo = null;
        try {
            supabaseGeneralInfo = await window.supabaseHelpers.getGeneralInfo(clientId);
        } catch (error) {
            console.error('Error loading general info from Supabase:', error);
            // Continue with null - will use fallback
        }
        
        if (typeof generalInfo !== 'undefined') {
            // Get client data to use as fallback for venue info
            let clientData = null;
            if (window.supabaseHelpers && window.supabaseHelpers.getClientData) {
                clientData = await window.supabaseHelpers.getClientData(clientId);
            }
            
            if (supabaseGeneralInfo) {
                // Map Supabase field names to local field names
                generalInfo.venueName = supabaseGeneralInfo.venue_name || '';
                generalInfo.venueAddress = supabaseGeneralInfo.venue_address || '';
                
                // If venue info is empty in general_info but exists in client data (contract), use it
                if ((!generalInfo.venueName || !generalInfo.venueAddress) && clientData) {
                    if (clientData.venue_name && !generalInfo.venueName) {
                        generalInfo.venueName = clientData.venue_name;
                    }
                    if (clientData.venue_address && !generalInfo.venueAddress) {
                        generalInfo.venueAddress = clientData.venue_address;
                    }
                    
                    // Save the updated venue info if we pulled it from client data
                    if ((clientData.venue_name && !supabaseGeneralInfo.venue_name) || 
                        (clientData.venue_address && !supabaseGeneralInfo.venue_address)) {
                        const generalInfoData = {
                            venue_name: generalInfo.venueName,
                            venue_address: generalInfo.venueAddress,
                            different_ceremony_venue: supabaseGeneralInfo.different_ceremony_venue || false,
                            ceremony_venue_name: supabaseGeneralInfo.ceremony_venue_name || '',
                            ceremony_venue_address: supabaseGeneralInfo.ceremony_venue_address || '',
                            planner_name: supabaseGeneralInfo.planner_name || '',
                            planner_email: supabaseGeneralInfo.planner_email || ''
                        };
                        
                        try {
                            await window.supabaseHelpers.saveGeneralInfo(clientId, generalInfoData);
                            console.log('Updated general info with venue data from contract');
                        } catch (error) {
                            console.error('Error updating general info with venue data:', error);
                        }
                    }
                }
                
                generalInfo.differentCeremonyVenue = supabaseGeneralInfo.different_ceremony_venue || false;
                generalInfo.ceremonyVenueName = supabaseGeneralInfo.ceremony_venue_name || '';
                generalInfo.ceremonyVenueAddress = supabaseGeneralInfo.ceremony_venue_address || '';
                generalInfo.plannerName = supabaseGeneralInfo.planner_name || '';
                generalInfo.plannerEmail = supabaseGeneralInfo.planner_email || '';
                
                console.log('Loaded general info from Supabase:', generalInfo);
            } else {
                // No general_info record exists yet, so check client data for venue info from contract
                console.log('No general info found in Supabase, checking client data for venue info');
                
                if (clientData) {
                        // Populate venue name and address from contract (client data)
                        generalInfo.venueName = clientData.venue_name || '';
                        generalInfo.venueAddress = clientData.venue_address || '';
                        // Keep other fields as defaults
                        generalInfo.differentCeremonyVenue = false;
                        generalInfo.ceremonyVenueName = '';
                        generalInfo.ceremonyVenueAddress = '';
                        generalInfo.plannerName = '';
                        generalInfo.plannerEmail = '';
                        
                        console.log('Loaded venue info from client data (contract):', {
                            venueName: generalInfo.venueName,
                            venueAddress: generalInfo.venueAddress
                        });
                        
                        // Save this to general_info table so it persists
                        if (window.supabaseHelpers && window.supabaseHelpers.saveGeneralInfo) {
                            const generalInfoData = {
                                venue_name: generalInfo.venueName,
                                venue_address: generalInfo.venueAddress,
                                different_ceremony_venue: generalInfo.differentCeremonyVenue,
                                ceremony_venue_name: generalInfo.ceremonyVenueName,
                                ceremony_venue_address: generalInfo.ceremonyVenueAddress,
                                planner_name: generalInfo.plannerName,
                                planner_email: generalInfo.plannerEmail
                            };
                            
                            try {
                                await window.supabaseHelpers.saveGeneralInfo(clientId, generalInfoData);
                                console.log('Initialized general info with venue data from contract');
                            } catch (error) {
                                console.error('Error saving initial general info:', error);
                            }
                        }
                    }
            }
        }
    }
    
    if (typeof renderEvents === 'function') {
        renderEvents();
    }
    if (typeof setupDragAndDrop === 'function') {
        setupDragAndDrop();
    }
    if (typeof updateOverallProgress === 'function') {
        updateOverallProgress();
    }
    if (typeof updateGeneralInfoCard === 'function') {
        updateGeneralInfoCard();
    }
}

// Get client ID from URL parameter
function getClientIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id');
    
    if (clientId) {
        localStorage.setItem('currentClientId', clientId);
        return clientId;
    }
    
    // Fallback to localStorage
    return localStorage.getItem('currentClientId');
}

// Check pre-onboarding requirements (service agreement & deposit) before onboarding
async function checkPreOnboardingRequirements() {
    const clientId = getClientIdFromUrl();
    
    // If no client ID in URL, show error or redirect
    if (!clientId) {
        console.error('No client_id parameter found in URL. Please provide a valid client ID.');
        // Optionally show an error message to the user
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; text-align: center; max-width: 500px;';
        errorMsg.innerHTML = `
            <h2 style="color: #dc3545; margin-bottom: 20px;">Invalid Link</h2>
            <p style="margin-bottom: 20px;">This link requires a valid client ID. Please contact your event coordinator for the correct link.</p>
            <p style="font-size: 14px; color: #666;">If you believe this is an error, please check the URL includes: ?client_id=...</p>
        `;
        document.body.appendChild(errorMsg);
        return;
    }
    
    // Load client data from Supabase to check completion status
    let clientData = null;
    if (window.supabaseHelpers && window.supabaseHelpers.getClientData) {
        clientData = await window.supabaseHelpers.getClientData(clientId);
        
        if (!clientData) {
            console.error('Client not found in database');
            const errorMsg = document.createElement('div');
            errorMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; text-align: center; max-width: 500px;';
            errorMsg.innerHTML = `
                <h2 style="color: #dc3545; margin-bottom: 20px;">Client Not Found</h2>
                <p style="margin-bottom: 20px;">The client ID in the URL does not exist in our system. Please contact your event coordinator.</p>
            `;
            document.body.appendChild(errorMsg);
            return;
        }
    }
    
    // Check service agreement status (must have a signature)
    const hasSignedAgreement = clientData?.signature && clientData.signature.trim() !== '';
    
    console.log('Service Agreement Status:', {
        hasSignature: !!clientData?.signature,
        signatureValue: clientData?.signature,
        hasSignedAgreement
    });
    
    if (!hasSignedAgreement) {
        console.log('Showing Service Agreement form');
        if (typeof showServiceAgreement === 'function') {
            await showServiceAgreement();
        }
        return;
    }
    
    // Check deposit payment status (must be explicitly true)
    const hasPaidDeposit = clientData?.deposit_paid === true;
    
    console.log('Deposit Payment Status:', {
        deposit_paid: clientData?.deposit_paid,
        hasPaidDeposit
    });
    
    if (!hasPaidDeposit) {
        console.log('Showing Deposit Payment form');
        if (typeof showDepositPayment === 'function') {
            await showDepositPayment();
        }
        return;
    }
    
    // Check event type - if not Wedding, show completion screen instead of planning
    const eventType = clientData?.event_type || '';
    const isWedding = eventType.toLowerCase() === 'wedding';
    
    console.log('Event Type:', {
        eventType: eventType,
        isWedding: isWedding
    });
    
    if (!isWedding) {
        // For non-wedding events, show completion screen instead of planning
        console.log('Non-wedding event - showing completion screen');
        if (typeof showCompletionScreen === 'function') {
            await showCompletionScreen();
        }
        return;
    }
    
    // For wedding events, continue with onboarding and planning
    // Check onboarding status (must be explicitly true)
    const hasCompletedOnboarding = clientData?.onboarding_completed === true;
    
    console.log('Onboarding Status:', {
        onboarding_completed: clientData?.onboarding_completed,
        hasCompletedOnboarding
    });
    
    if (!hasCompletedOnboarding) {
        // Proceed to onboarding
        if (typeof checkIfOnboardingNeeded === 'function') {
            checkIfOnboardingNeeded();
        }
        return;
    }
    
    // All steps completed - show the main planning app
    console.log('All requirements met - showing planning app');
    
    // Update header with client data first
    await updateHeader();
    
    // Initialize the main planning app
    await init();
}

// Export functions for global access
window.updateHeader = updateHeader;

// Check pre-onboarding requirements on page load
// This will determine what to show based on completion status
checkPreOnboardingRequirements();

// Note: init() will be called automatically when all requirements are met
// or after onboarding is completed
