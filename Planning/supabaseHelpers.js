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

async function saveEvent(eventData) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return false;
    }
    
    const { error } = await window.supabaseClient
        .from('events')
        .upsert({
            ...eventData,
            updated_at: new Date().toISOString()
        });
    
    if (error) {
        console.error('Error saving event:', error);
        return false;
    }
    
    return true;
}

async function updateEventOrder(clientId, events) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return false;
    }
    
    // Update all events with new order
    const updates = events.map((event, index) => ({
        id: event.id,
        event_order: index,
        updated_at: new Date().toISOString()
    }));
    
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

async function deleteEvent(eventId) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return false;
    }
    
    const { error } = await window.supabaseClient
        .from('events')
        .delete()
        .eq('id', eventId);
    
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
    
    const { data, error } = await window.supabaseClient
        .from('general_info')
        .select('*')
        .eq('client_id', clientId)
        .single();
    
    if (error) {
        // If no record exists, that's okay
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching general info:', error);
        return null;
    }
    
    return data;
}

async function saveGeneralInfo(clientId, generalInfoData) {
    if (!window.supabaseClient) {
        console.error('Supabase not initialized');
        return false;
    }
    
    const { error } = await window.supabaseClient
        .from('general_info')
        .upsert({
            client_id: clientId,
            ...generalInfoData,
            updated_at: new Date().toISOString()
        });
    
    if (error) {
        console.error('Error saving general info:', error);
        return false;
    }
    
    return true;
}

// Export functions for global access
window.supabaseHelpers = {
    getCurrentClientId,
    setCurrentClientId,
    getClientData,
    createClient,
    updateClient,
    getEvents,
    saveEvent,
    updateEventOrder,
    deleteEvent,
    getGeneralInfo,
    saveGeneralInfo
};

