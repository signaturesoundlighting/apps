// Event creation and management functions

function addCustomEvent() {
    document.getElementById('addEventModal').classList.add('active');
    document.getElementById('addEventOptions').style.display = 'flex';
    document.getElementById('standardEventsList').classList.remove('active');
}

function showStandardEvents() {
    document.getElementById('addEventOptions').style.display = 'none';
    document.getElementById('standardEventsList').classList.add('active');
    
    const container = document.getElementById('standardEventsContainer');
    container.innerHTML = '';
    
    standardEventTemplates.forEach(template => {
        const item = document.createElement('div');
        item.className = 'standard-event-item';
        item.textContent = template.name;
        item.onclick = () => addStandardEvent(template);
        container.appendChild(item);
    });
}

function backToAddOptions() {
    document.getElementById('addEventOptions').style.display = 'flex';
    document.getElementById('standardEventsList').classList.remove('active');
}

async function addStandardEvent(template) {
    const newEvent = {
        id: nextId++,
        type: template.type,
        name: template.name,
        time: '',
        details: {}
    };
    const endIdx = events.findIndex(e => e.type === 'end-of-wedding');
    if (endIdx >= 0) {
        events.splice(endIdx, 0, newEvent);
    } else {
        events.push(newEvent);
    }
    
    // Save to Supabase
    const clientId = window.supabaseHelpers?.getCurrentClientId();
    if (clientId && window.supabaseHelpers && window.supabaseHelpers.saveEvent) {
        try {
            const eventIndex = events.findIndex(e => e.id === newEvent.id);
            const savedEvent = await window.supabaseHelpers.saveEvent(clientId, newEvent, eventIndex);
            if (savedEvent) {
                newEvent.supabase_id = savedEvent.id;
                console.log('New event saved to Supabase:', savedEvent);
            }
        } catch (error) {
            console.error('Error saving new event to Supabase:', error);
        }
    }
    
    renderEvents();
    setupDragAndDrop();
    closeAddEventModal();
    openModal(newEvent.id);
    showSaveIndicator();
}

async function createCustomEvent() {
    const newEvent = {
        id: nextId++,
        type: 'custom',
        name: 'New Event',
        time: '',
        details: {}
    };
    const endIdx = events.findIndex(e => e.type === 'end-of-wedding');
    if (endIdx >= 0) {
        events.splice(endIdx, 0, newEvent);
    } else {
        events.push(newEvent);
    }
    
    // Save to Supabase
    const clientId = window.supabaseHelpers?.getCurrentClientId();
    if (clientId && window.supabaseHelpers && window.supabaseHelpers.saveEvent) {
        try {
            const eventIndex = events.findIndex(e => e.id === newEvent.id);
            const savedEvent = await window.supabaseHelpers.saveEvent(clientId, newEvent, eventIndex);
            if (savedEvent) {
                newEvent.supabase_id = savedEvent.id;
                console.log('New custom event saved to Supabase:', savedEvent);
            }
        } catch (error) {
            console.error('Error saving new custom event to Supabase:', error);
        }
    }
    
    renderEvents();
    setupDragAndDrop();
    closeAddEventModal();
    openModal(newEvent.id);
    showSaveIndicator();
}

function closeAddEventModal() {
    document.getElementById('addEventModal').classList.remove('active');
}

// Close add event modal when clicking outside
document.getElementById('addEventModal').addEventListener('click', (e) => {
    if (e.target.id === 'addEventModal') {
        closeAddEventModal();
    }
});

// Ensure functions are available globally for inline onclick handlers
window.addCustomEvent = addCustomEvent;
window.showStandardEvents = showStandardEvents;
window.backToAddOptions = backToAddOptions;
window.addStandardEvent = addStandardEvent;
window.createCustomEvent = createCustomEvent;
window.closeAddEventModal = closeAddEventModal;
