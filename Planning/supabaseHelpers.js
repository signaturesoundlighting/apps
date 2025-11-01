// Supabase Database Helper Functions
// These functions provide a clean interface to interact with Supabase

// Get current client ID from URL or localStorage
function getCurrentClientId() {
    // Check URL parameter first (if using client-specific URLs)
    const urlParams = new URLSearchParams(window.location.search);
    const clientIdFromUrl = urlParams.get('client_id');
    if (clientIdFromUrl) {
        localStorage.setItem('currentClientId', clientIdFromUrl);
        return clientIdFromUrl;
    }
    
    // Fallback to localStorage
    return localStorage.getItem('currentClientId');
}

// Set current client ID
function setCurrentClientId(clientId) {
    localStorage.setItem('currentClientId', clientId);
}

// CLIENT OPERATIONS

async function getClientData(clientId) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return null;
    }
    
    const { data, error } = await window.supabaseClient
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
    
    if (error) {
        console.error('Error fetching client:', error);
        return null;
    }
    
    return data;
}

async function getAllClients() {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return [];
    }
    
    const { data, error } = await window.supabaseClient
        .from('clients')
        .select('*')
        .order('event_date', { ascending: false });
    
    if (error) {
        console.error('Error fetching all clients:', error);
        return [];
    }
    
    return data || [];
}

async function createClient(clientData) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return null;
    }
    
    const { data, error } = await window.supabaseClient
        .from('clients')
        .insert([clientData])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating client:', error);
        return null;
    }
    
    // Set as current client
    if (data.id) {
        setCurrentClientId(data.id);
    }
    
    return data;
}

async function updateClient(clientId, updates) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return false;
    }
    
    const { error } = await window.supabaseClient
        .from('clients')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', clientId);
    
    if (error) {
        console.error('Error updating client:', error);
        return false;
    }
    
    return true;
}

// EVENT OPERATIONS

async function getEvents(clientId) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return [];
    }
    
    const { data, error } = await window.supabaseClient
        .from('events')
        .select('*')
        .eq('client_id', clientId)
        .order('event_order', { ascending: true });
    
    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }
    
    return data || [];
}

// Convert Supabase event format to local event format
// Supabase: { id: UUID, client_id, event_order, type, name, time, details: JSONB }
// Local: { id: number, type, name, time, details: {}, supabase_id: UUID }
function convertSupabaseEventToLocal(supabaseEvent, localId) {
    return {
        id: localId, // Use provided local numeric ID
        type: supabaseEvent.type,
        name: supabaseEvent.name,
        time: supabaseEvent.time || '',
        details: supabaseEvent.details || {},
        supabase_id: supabaseEvent.id // Store Supabase UUID for future updates
    };
}

async function saveEvent(clientId, eventData, eventOrder = null) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return null;
    }
    
    // Convert local event format to Supabase format
    // eventData has: { id: number, type, name, time, details: {}, supabase_id?: UUID }
    const supabaseEvent = {
        client_id: clientId,
        type: eventData.type,
        name: eventData.name,
        time: eventData.time || null,
        details: eventData.details || {},
        updated_at: new Date().toISOString()
    };
    
    // If this event already exists in Supabase, fetch its current data to preserve event_order
    if (eventData.supabase_id) {
        supabaseEvent.id = eventData.supabase_id;
        
        // Fetch current event to preserve event_order if not provided
        if (eventOrder === null) {
            const { data: existingEvent, error: fetchError } = await window.supabaseClient
                .from('events')
                .select('event_order')
                .eq('id', eventData.supabase_id)
                .single();
            
            if (!fetchError && existingEvent) {
                supabaseEvent.event_order = existingEvent.event_order;
            } else {
                // If we can't find it, use the provided eventOrder or default to 0
                supabaseEvent.event_order = eventOrder !== null ? eventOrder : 0;
            }
        } else {
            supabaseEvent.event_order = eventOrder;
        }
    } else {
        // New event - must provide event_order
        if (eventOrder === null) {
            // Default to end of list (we'll set a proper order later)
            supabaseEvent.event_order = 999;
        } else {
            supabaseEvent.event_order = eventOrder;
        }
    }
    
    // Use upsert - if supabase_id exists, it will update; otherwise, it will insert
    const { data, error } = await window.supabaseClient
        .from('events')
        .upsert(supabaseEvent, { onConflict: 'id' })
        .select()
        .single();
    
    if (error) {
        console.error('Error saving event:', error);
        return null;
    }
    
    // Return the Supabase event data (includes the UUID id)
    return data;
}

async function updateEventOrder(clientId, events) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return false;
    }
    
    // Update all events with new order
    // events array has local events with numeric IDs and supabase_id field
    const updates = events
        .filter(event => event.supabase_id) // Only update events that exist in Supabase
        .map((event, index) => ({
            id: event.supabase_id, // Use Supabase UUID
            event_order: index,
            updated_at: new Date().toISOString()
        }));
    
    if (updates.length === 0) {
        console.warn('No events with Supabase IDs to update order');
        return false;
    }
    
    // Supabase doesn't support bulk updates easily, so we'll do them individually
    // In production, you might want to use a stored procedure for this
    const promises = updates.map(update => 
        window.supabaseClient
            .from('events')
            .update({ event_order: update.event_order, updated_at: update.updated_at })
            .eq('id', update.id)
    );
    
    const results = await Promise.all(promises);
    const hasError = results.some(result => result.error);
    
    if (hasError) {
        console.error('Error updating event order');
        return false;
    }
    
    return true;
}

async function deleteEvent(supabaseEventId) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return false;
    }
    
    // Delete by Supabase UUID
    const { error } = await window.supabaseClient
        .from('events')
        .delete()
        .eq('id', supabaseEventId);
    
    if (error) {
        console.error('Error deleting event:', error);
        return false;
    }
    
    return true;
}

// GENERAL INFO OPERATIONS

async function getGeneralInfo(clientId) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return null;
    }
    
    try {
        const { data, error } = await window.supabaseClient
            .from('general_info')
            .select('*')
            .eq('client_id', clientId)
            .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no record exists
        
        if (error) {
            // Log the error but don't fail completely
            console.error('Error fetching general info:', error);
            return null;
        }
        
        return data;
    } catch (err) {
        console.error('Exception fetching general info:', err);
        return null;
    }
}

async function saveGeneralInfo(clientId, generalInfoData) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return false;
    }
    
    try {
        // Check if a record already exists for this client
        const { data: existingRecord, error: checkError } = await window.supabaseClient
            .from('general_info')
            .select('id')
            .eq('client_id', clientId)
            .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking for existing general info:', checkError);
            // Continue anyway - try to insert
        }
        
        const updateData = {
            ...generalInfoData,
            updated_at: new Date().toISOString()
        };
        
        if (existingRecord) {
            // Update existing record
            const { error: updateError } = await window.supabaseClient
                .from('general_info')
                .update(updateData)
                .eq('client_id', clientId);
            
            if (updateError) {
                console.error('Error updating general info:', updateError);
                return false;
            }
        } else {
            // Insert new record
            const { error: insertError } = await window.supabaseClient
                .from('general_info')
                .insert({
                    client_id: clientId,
                    ...updateData
                });
            
            if (insertError) {
                console.error('Error inserting general info:', insertError);
                return false;
            }
        }
        
        return true;
    } catch (err) {
        console.error('Exception saving general info:', err);
        return false;
    }
}

// Export functions for global access
window.supabaseHelpers = {
    getCurrentClientId,
    setCurrentClientId,
    getClientData,
    getAllClients,
    createClient,
    updateClient,
    getEvents,
    convertSupabaseEventToLocal,
    saveEvent,
    updateEventOrder,
    deleteEvent,
    getGeneralInfo,
    saveGeneralInfo
};

