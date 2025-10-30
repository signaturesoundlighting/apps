// Mock data structure (will be replaced with Airtable)
let events = [
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
    { id: 13, type: 'open-dancing', name: 'Open Dancing', time: '', details: {} },
    { id: 14, type: 'last-group-dance', name: 'Last Group Dance', time: '', details: {} },
    { id: 15, type: 'private-last-dance', name: 'Private Last Dance', time: '', details: {} },
    { id: 16, type: 'grand-exit', name: 'Grand Exit', time: '', details: {} }
];

let currentEventId = null;
let draggedElement = null;
let nextId = 17;
let currentSongInputId = null;

// Mobile drag state
let longPressTimer = null;
let isDragging = false;
let draggedCard = null;
let touchStartY = 0;
let currentTouchY = 0;
let initialCardTop = 0;
let placeholder = null;

// General info data
let generalInfo = {
    venueName: '',
    venueAddress: '',
    differentCeremonyVenue: false,
    ceremonyVenueName: '',
    ceremonyVenueAddress: '',
    plannerName: '',
    plannerEmail: ''
};

// Standard event templates
const standardEventTemplates = [
    { type: 'ceremony', name: 'Ceremony' },
    { type: 'cocktail-hour', name: 'Cocktail Hour' },
    { type: 'intros', name: 'Wedding Party Introductions' },
    { type: 'first-dance', name: 'First Dance' },
    { type: 'special-dance-1', name: 'Special Dance #1' },
    { type: 'special-dance-2', name: 'Special Dance #2' },
    { type: 'blessing', name: 'Blessing' },
    { type: 'welcome', name: 'Welcome' },
    { type: 'dinner', name: 'Dinner' },
    { type: 'toasts', name: 'Toasts' },
    { type: 'cake-cutting', name: 'Cake Cutting' },
    { type: 'photo-dash', name: 'Photo Dash' },
    { type: 'open-dancing', name: 'Open Dancing' },
    { type: 'bouquet-toss', name: 'Bouquet Toss' },
    { type: 'last-group-dance', name: 'Last Group Dance' },
    { type: 'private-last-dance', name: 'Private Last Dance' },
    { type: 'grand-exit', name: 'Grand Exit' }
];

// Helper function to generate new song input UI with count and icon actions
function generateSongInput(id, label, value, maxItems = 1) {
    let items = [];
    if (value) {
        try {
            const parsed = JSON.parse(value);
            items = Array.isArray(parsed) ? parsed : [value];
        } catch {
            items = [value];
        }
    }
    const countText = `${items.length}/${maxItems}`;
    const itemsHtml = items.map((t, i) => `
        <div class="song-chip">
            <span>${t}</span>
            <button class="song-remove-btn" data-input-id="${id}" data-index="${i}">Remove</button>
        </div>
    `).join('');
    const helpHtml = maxItems > 1 ? `<div class="song-help">Add up to ${maxItems} songs or a playlist link</div>` : '';
    return `
        <div class="form-group">
            <label><span class="status-badge required" data-field-id="${id}" data-badge-type="songs"></span>${label}</label>
            <div class="song-box" data-input-id="${id}">
                <input type="hidden" id="${id}" value='${JSON.stringify(items)}' data-max="${maxItems}">
                <input type="hidden" id="${id}_playlist" value="${(value && value.playlist) ? value.playlist : ''}">
                <div class="song-box-header"><span class="song-count" id="${id}_count">${countText}</span><span class="song-note">♪</span></div>
                ${helpHtml}
                <div class="song-actions">
                    <button class="song-icon-btn song-search-btn" data-input-id="${id}" title="Search">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                        <div>Search</div>
                    </button>
                    <button class="song-icon-btn secondary song-link-btn" data-input-id="${id}" title="Insert Song Link">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10.59 13.41a1 1 0 010-1.41l2.59-2.59a1 1 0 011.41 1.41l-2.59 2.59a1 1 0 01-1.41 0z"/>
                            <path d="M7 17a5 5 0 010-7.07l2.12-2.12a1 1 0 111.41 1.41L8.41 11.34a3 3 0 104.24 4.24l2.12-2.12a1 1 0 111.41 1.41L14.07 17A5 5 0 017 17z"/>
                            <path d="M17 7a5 5 0 010 7.07l-1.06 1.06a1 1 0 11-1.41-1.41L15.59 12A3 3 0 0011.34 7.76l-1.06 1.06a1 1 0 11-1.41-1.41L9.93 6A5 5 0 0117 7z"/>
                        </svg>
                        <div>Insert Song Link</div>
                    </button>
                    ${maxItems > 1 ? `
                    <button class="song-icon-btn secondary song-playlist-btn" data-input-id="${id}" title="Insert Playlist Link" onclick="openPlaylistLink('${id}')">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h10v2H3v-2zm13 1v-4h2v4h3v2h-5v-2z"/></svg>
                        <div>Insert Playlist Link</div>
                    </button>` : ''}
                </div>
                <div class="song-items" id="${id}_items">${itemsHtml}</div>
            </div>
        </div>
    `;
}

// Initialize the app
function init() {
    renderEvents();
    setupDragAndDrop();
    updateOverallProgress();
}

// Render all events
function renderEvents() {
    const container = document.getElementById('eventList');
    container.innerHTML = '';
    
    events.forEach(event => {
        const card = createEventCard(event);
        container.appendChild(card);
    });
    updateOverallProgress();
}

// Create an event card
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('data-id', event.id);
    card.setAttribute('data-type', event.type);
    
    card.innerHTML = `
        <div class="event-content">
            <div class="event-name">${event.name}</div>
            <div class="event-time">${event.time}</div>
        </div>
        <div class="drag-handle">☰</div>
    `;
    
    return card;
}

// Setup drag and drop with improved mobile support
function setupDragAndDrop() {
    const container = document.getElementById('eventList');
    
    // Desktop drag events
    container.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('event-card')) {
            draggedElement = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }
    });
    
    container.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('event-card')) {
            e.target.classList.remove('dragging');
            draggedElement = null;
        }
    });
    
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        const dragging = document.querySelector('.dragging');
        
        if (dragging) {
            if (afterElement == null) {
                container.appendChild(dragging);
            } else {
                container.insertBefore(dragging, afterElement);
            }
        }
    });
    
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        updateEventOrder();
        showSaveIndicator();
    });

    // Mobile touch events
    const cards = container.querySelectorAll('.event-card');
    cards.forEach(card => {
        const dragHandle = card.querySelector('.drag-handle');
        
        // Click to open modal (for both mobile and desktop)
        card.addEventListener('click', (e) => {
            if (!isDragging && !e.target.classList.contains('drag-handle')) {
                const id = parseInt(card.getAttribute('data-id'));
                openModal(id);
            }
        });

        // Make drag handle draggable on desktop
        dragHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            card.draggable = true;
        });

        dragHandle.addEventListener('mouseup', () => {
            setTimeout(() => {
                card.draggable = false;
            }, 100);
        });

        // Mobile touch events on drag handle
        dragHandle.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            touchStartY = e.touches[0].clientY;
            initialCardTop = card.getBoundingClientRect().top;
            
            // Start long press timer (300ms)
            longPressTimer = setTimeout(() => {
                isDragging = true;
                draggedCard = card;
                card.classList.add('drag-ready');
                
                // Vibrate if supported
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, 300);
        }, { passive: false });

        dragHandle.addEventListener('touchmove', (e) => {
            // If moved before long press completes, cancel it
            if (!isDragging) {
                clearTimeout(longPressTimer);
                return;
            }

            e.preventDefault();
            currentTouchY = e.touches[0].clientY;
            
            // Calculate movement from initial touch point
            const deltaY = currentTouchY - touchStartY;
            
            // Apply transform to move the card
            card.style.transform = `translateY(${deltaY}px)`;
            card.classList.add('dragging');

            // Find where to insert based on current touch position
            const afterElement = getDragAfterElement(container, currentTouchY);
            if (afterElement == null) {
                container.appendChild(card);
            } else {
                container.insertBefore(card, afterElement);
            }
        }, { passive: false });

        dragHandle.addEventListener('touchend', (e) => {
            clearTimeout(longPressTimer);
            
            if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
                
                card.style.transform = '';
                card.classList.remove('drag-ready', 'dragging');
                
                updateEventOrder();
                showSaveIndicator();
                
                isDragging = false;
                draggedCard = null;
            }
        }, { passive: false });

        dragHandle.addEventListener('touchcancel', () => {
            clearTimeout(longPressTimer);
            if (draggedCard) {
                draggedCard.style.transform = '';
                draggedCard.classList.remove('drag-ready', 'dragging');
            }
            isDragging = false;
            draggedCard = null;
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.event-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateEventOrder() {
    const cards = document.querySelectorAll('.event-card');
    const newOrder = [];
    
    cards.forEach(card => {
        const id = parseInt(card.getAttribute('data-id'));
        const event = events.find(e => e.id === id);
        if (event) {
            newOrder.push(event);
        }
    });
    
    events = newOrder;
    // Here you would sync with Airtable
}

// Open general info modal
function openGeneralInfo() {
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.innerHTML = `<span>General Info</span>`;
    modalBody.innerHTML = `
        <div class="info-grid">
            <div class="form-group">
                <label>Venue Name</label>
                <input type="text" id="venueName" value="${generalInfo.venueName || ''}" placeholder="Venue name">
            </div>
            <div class="form-group">
                <label>Venue Address</label>
                <input type="text" id="venueAddress" value="${generalInfo.venueAddress || ''}" placeholder="Full address">
            </div>
        </div>
        <div class="form-group">
            <label class="checkbox-option">
                <input type="checkbox" id="differentCeremonyVenue" ${generalInfo.differentCeremonyVenue ? 'checked' : ''} onchange="toggleCeremonyVenue()">
                <span>My ceremony will be at a different venue</span>
            </label>
        </div>
        <div id="ceremonyVenueSection" class="info-grid" style="display: ${generalInfo.differentCeremonyVenue ? 'grid' : 'none'};">
            <div class="form-group">
                <label>Ceremony Venue Name</label>
                <input type="text" id="ceremonyVenueName" value="${generalInfo.ceremonyVenueName || ''}" placeholder="Ceremony venue name">
            </div>
            <div class="form-group">
                <label>Ceremony Venue Address</label>
                <input type="text" id="ceremonyVenueAddress" value="${generalInfo.ceremonyVenueAddress || ''}" placeholder="Full address">
            </div>
        </div>
        <div class="info-grid">
            <div class="form-group">
                <label>Planner Name</label>
                <input type="text" id="plannerName" value="${generalInfo.plannerName || ''}" placeholder="Planner's name">
            </div>
            <div class="form-group">
                <label>Planner Email</label>
                <input type="email" id="plannerEmail" value="${generalInfo.plannerEmail || ''}" placeholder="email@example.com">
            </div>
        </div>
    `;
    modal.classList.add('active');
    
    // Add event listeners for inputs
    modalBody.querySelectorAll('input').forEach(input => {
        if (input.type === 'checkbox') {
            input.addEventListener('change', () => saveGeneralInfo());
        } else {
            input.addEventListener('input', () => saveGeneralInfo());
        }
    });
    
    // Remove footer for general info
    const footer = modal.querySelector('.modal-footer');
    if (footer) footer.remove();
}

function saveGeneralInfo() {
    generalInfo.venueName = document.getElementById('venueName')?.value || '';
    generalInfo.venueAddress = document.getElementById('venueAddress')?.value || '';
    generalInfo.differentCeremonyVenue = document.getElementById('differentCeremonyVenue')?.checked || false;
    generalInfo.ceremonyVenueName = document.getElementById('ceremonyVenueName')?.value || '';
    generalInfo.ceremonyVenueAddress = document.getElementById('ceremonyVenueAddress')?.value || '';
    generalInfo.plannerName = document.getElementById('plannerName')?.value || '';
    generalInfo.plannerEmail = document.getElementById('plannerEmail')?.value || '';
    showSaveIndicator();
}

function toggleCeremonyVenue() {
    const checkbox = document.getElementById('differentCeremonyVenue');
    const section = document.getElementById('ceremonyVenueSection');
    if (section) {
        section.style.display = checkbox && checkbox.checked ? 'grid' : 'none';
    }
    saveGeneralInfo();
}

// Open modal with event details
function openModal(eventId) {
    currentEventId = eventId;
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.innerHTML = `
        <span id="eventNameDisplay">${event.name}</span>
        <button class="edit-name-btn" onclick="toggleEventNameEdit()" title="Edit event name">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
        </button>
    `;
    modalBody.innerHTML = generateModalContent(event);
    modal.classList.add('active');
    
    // Add event listeners for form inputs
    modalBody.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('change', () => saveEventDetails(eventId));
        input.addEventListener('input', () => {
            if (input.type === 'radio' || input.type === 'checkbox') return;
            saveEventDetails(eventId);
        });
    });
    
    // Add event listeners for song action buttons
    modalBody.querySelectorAll('.song-search-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const inputId = btn.getAttribute('data-input-id');
            openSongSearch(inputId);
        });
    });
    
    modalBody.querySelectorAll('.song-link-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const inputId = btn.getAttribute('data-input-id');
            openSongLink(inputId);
        });
    });
    
    // Add footer with navigation (includes Delete button)
    addModalFooter(eventId);

    // Add delete button event listener
    const deleteBtn = document.getElementById(`deleteBtn_${eventId}`);
    // Initialize status badges (non-interactive)
    document.querySelectorAll('.status-badge').forEach(badge => {
        const fieldId = badge.getAttribute('data-field-id');
        updateStatusBadgeDisplay(fieldId, events.find(e => e.id === currentEventId));
    });
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteEvent(eventId);
        });
    }
}

function toggleEventNameEdit() {
    const event = events.find(e => e.id === currentEventId);
    if (!event) return;
    
    const display = document.getElementById('eventNameDisplay');
    const currentName = display.textContent;
    
    display.innerHTML = `<input type="text" class="event-name-input" id="eventNameInput" value="${currentName}" />`;
    const input = document.getElementById('eventNameInput');
    input.focus();
    input.select();
    
    input.addEventListener('blur', () => saveEventName());
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEventName();
        }
    });
}

function saveEventName() {
    const input = document.getElementById('eventNameInput');
    if (!input) return;
    
    const newName = input.value.trim();
    if (newName) {
        const event = events.find(e => e.id === currentEventId);
        if (event) {
            event.name = newName;
            document.getElementById('eventNameDisplay').textContent = newName;
            renderEvents();
            setupDragAndDrop();
            showSaveIndicator();
        }
    } else {
        const event = events.find(e => e.id === currentEventId);
        document.getElementById('eventNameDisplay').textContent = event.name;
    }
}

function closeModal() {
    document.getElementById('eventModal').classList.remove('active');
    currentEventId = null;
}

function addModalFooter(eventId) {
    const currentIndex = events.findIndex(e => e.id === eventId);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < events.length - 1;
    
    const modalContent = document.querySelector('.modal-content');
    let footer = modalContent.querySelector('.modal-footer');
    
    if (!footer) {
        footer = document.createElement('div');
        footer.className = 'modal-footer';
        modalContent.appendChild(footer);
    }
    
    footer.innerHTML = `
        <button class="nav-btn" onclick="navigateEvent('prev')" ${!hasPrev ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            Previous
        </button>
        <button class="delete-event-btn" id="deleteBtn_${eventId}">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete Event
        </button>
        <button class="nav-btn" onclick="navigateEvent('next')" ${!hasNext ? 'disabled' : ''}>
            Next
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
        </button>
    `;
}

function navigateEvent(direction) {
    const currentIndex = events.findIndex(e => e.id === currentEventId);
    let newIndex;
    
    if (direction === 'prev') {
        newIndex = currentIndex - 1;
    } else {
        newIndex = currentIndex + 1;
    }
    
    if (newIndex >= 0 && newIndex < events.length) {
        closeModal();
        setTimeout(() => {
            openModal(events[newIndex].id);
        }, 100);
    }
}

// Generate modal content based on event type
function generateModalContent(event) {
    let html = '';
    if (event.type !== 'end-of-wedding') {
        html += `
            <div class="form-group">
                <label><span class="status-badge required" data-field-id="startTime"></span>Start Time</label>
                <input type="time" id="startTime" value="${event.time ? convertTo24Hour(event.time) : ''}">
            </div>
        `;
    }
    // Add event-specific fields based on type
    switch(event.type) {
        case 'ceremony':
            html += `
                <div class="form-group">
                    <label><span class="status-badge optional" data-field-id="location">Optional</span>Where will this be taking place?</label>
                    <input type="text" id="location" value="${event.details.location || ''}" placeholder="Location at venue i.e. under the pavilion">
                </div>
                <div class="form-group">
                    <label><span class="status-badge optional" data-field-id="arrivalMusicStyle">Optional</span>Style/genre of music as guests arrive</label>
                    <textarea id="arrivalMusicStyle" placeholder="i.e. Piano instrumentals">${event.details.arrivalMusicStyle || ''}</textarea>
                </div>
                ${generateSongInput('processionalSong', 'Processional Song (Wedding Party/Family Members)', event.details.processionalSong, 1)}
                ${generateSongInput('brideEntrance', "Grand Entrance Song", event.details.brideEntrance)}
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="hasSpecialActivity"></span>Are you doing any special activities during the ceremony such as a unity sand ritual, tying of the knot, etc.?</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="hasSpecialActivity" value="yes" ${event.details.hasSpecialActivity === 'yes' ? 'checked' : ''} onchange="toggleSpecialActivityDetails()">
                            <span>Yes</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="hasSpecialActivity" value="no" ${event.details.hasSpecialActivity === 'no' ? 'checked' : ''} onchange="toggleSpecialActivityDetails()">
                            <span>No</span>
                        </label>
                    </div>
                </div>
                <div id="specialActivityDetails" class="conditional-section" style="display: ${event.details.hasSpecialActivity === 'yes' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label><span class="status-badge optional" data-field-id="specialActivityType" data-conditional="hasSpecialActivity:yes"></span>What kind of event?</label>
                        <input type="text" id="specialActivityType" value="${event.details.specialActivityType || ''}" placeholder="e.g., Unity sand ritual, Handfasting">
                    </div>
                    <div class="form-group">
                        <label><span class="status-badge optional" data-field-id="specialActivitySong" data-conditional="hasSpecialActivity:yes"></span>Do you want a song for your special event?</label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="specialActivitySong" value="yes" ${event.details.specialActivitySong === 'yes' ? 'checked' : ''} onchange="toggleSpecialActivitySongEntry()">
                                <span>Yes</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="specialActivitySong" value="no" ${event.details.specialActivitySong === 'no' ? 'checked' : ''} onchange="toggleSpecialActivitySongEntry()">
                                <span>No</span>
                            </label>
                        </div>
                    </div>
                    <div id="specialActivitySongEntry" style="display: ${event.details.specialActivitySong === 'yes' ? 'block' : 'none'};">
                        <div class="form-group">
                            <label><span class="status-badge optional" data-field-id="specialActivitySongTitle" data-conditional="specialActivitySong:yes" data-badge-type="songs"></span>Song for Special Activity</label>
                            <div class="song-box" data-input-id="specialActivitySongTitle">
                                <input type="hidden" id="specialActivitySongTitle" value='${JSON.stringify([])}' data-max="1">
                                <div class="song-box-header"><span class="song-count" id="specialActivitySongTitle_count">0/1</span><span class="song-note">♪</span></div>
                                <div class="song-actions">
                                    <button class="song-icon-btn song-search-btn" data-input-id="specialActivitySongTitle" title="Search">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                                        <div>Search</div>
                                    </button>
                                    <button class="song-icon-btn secondary song-link-btn" data-input-id="specialActivitySongTitle" title="Insert Link">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12a5 5 0 015-5h3v2h-3a3 3 0 100 6h3v2h-3a5 5 0 01-5-5zm7-1h2v2h-2v-2zm4.1-4h-3v2h3a3 3 0 010 6h-3v2h3a5 5 0 000-10z"/></svg>
                                        <div>Insert Link</div>
                                    </button>
                                </div>
                                <div class="song-items" id="specialActivitySongTitle_items"></div>
                            </div>
                        </div>
                    </div>
                </div>
                ${generateSongInput('recessionalSong', 'Recessional Song', event.details.recessionalSong)}
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'cocktail-hour':
            html += `
                <div class="form-group">
                    <label>Where will this be taking place?</label>
                    <input type="text" id="location" value="${event.details.location || ''}" placeholder="Venue name or location">
                </div>
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="musicChoice"></span>Music style is…</label>
                    <div class="radio-group">
                        <label class="radio-option"><input type="radio" name="musicChoice" value="dj" ${event.details.musicChoice === 'dj' ? 'checked' : ''} onchange="toggleMusicChoice()"><span>DJ's choice</span></label>
                        <label class="radio-option"><input type="radio" name="musicChoice" value="genre" ${event.details.musicChoice === 'genre' ? 'checked' : ''} onchange="toggleMusicChoice()"><span>Specific style/genre</span></label>
                        <label class="radio-option"><input type="radio" name="musicChoice" value="playlist" ${event.details.musicChoice === 'playlist' ? 'checked' : ''} onchange="toggleMusicChoice()"><span>Specific songs/playlist</span></label>
                    </div>
                </div>
                <div id="musicStyleGroup" class="form-group" style="display: ${event.details.musicChoice === 'genre' ? 'block' : 'none'};">
                    <label><span class="status-badge required" data-field-id="musicStyle" data-conditional="musicChoice:genre"></span>Style/Genre</label>
                    <input type="text" id="musicStyle" value="${event.details.musicStyle || ''}" placeholder="e.g., Jazz, Acoustic, Classical">
                </div>
                <div id="cocktailSongsGroup" style="display: ${event.details.musicChoice === 'playlist' ? 'block' : 'none'};">
                    ${generateSongInput('cocktailSongs', 'Specific Songs/Playlist', event.details.cocktailSongs, 20)}
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'first-dance':
        case 'private-last-dance':
        case 'last-group-dance':
            html += `
                ${generateSongInput('songChoice', 'Song Selection', event.details.songChoice)}
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="danceDuration_${event.id}"></span>How long would you like to dance for?</label>
                    <div class="radio-group">
                        <label class="radio-option"><input type="radio" name="danceDuration_${event.id}" value="whole" ${event.details[`danceDuration_${event.id}`] === 'whole' ? 'checked' : ''} onchange="toggleDancePart(${event.id})"><span>Whole song</span></label>
                        <label class="radio-option"><input type="radio" name="danceDuration_${event.id}" value="part" ${event.details[`danceDuration_${event.id}`] === 'part' ? 'checked' : ''} onchange="toggleDancePart(${event.id})"><span>Part of song</span></label>
                    </div>
                </div>
                <div id="dancePartSection_${event.id}" class="time-row" style="display: ${event.details[`danceDuration_${event.id}`] === 'part' ? 'grid' : 'none'};">
                    <div class="form-group">
                        <label><span class="status-badge optional" data-field-id="startAt" data-conditional="danceDuration_${event.id}:part"></span>Start at</label>
                        <input type="text" id="startAt" value="${event.details.startAt || ''}" placeholder="00:30">
                    </div>
                    <div class="form-group">
                        <label><span class="status-badge optional" data-field-id="endAt" data-conditional="danceDuration_${event.id}:part"></span>End at</label>
                        <input type="text" id="endAt" value="${event.details.endAt || ''}" placeholder="01:30">
                    </div>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'special-dance-1':
        case 'special-dance-2':
            html += `
                <div class="form-group">
                    <label>What type of dance is this?</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="danceType_${event.id}" value="father-daughter" ${event.details.danceType === 'father-daughter' ? 'checked' : ''} onchange="handleSpecialDanceType(${event.id})">
                            <span>Father Daughter</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="danceType_${event.id}" value="mother-son" ${event.details.danceType === 'mother-son' ? 'checked' : ''} onchange="handleSpecialDanceType(${event.id})">
                            <span>Mother Son</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="danceType_${event.id}" value="other" ${event.details.danceType === 'other' ? 'checked' : ''} onchange="handleSpecialDanceType(${event.id})">
                            <span>Other</span>
                        </label>
                    </div>
                </div>
                <div id="otherDanceTypeContainer_${event.id}" class="conditional-section" style="display: ${event.details.danceType === 'other' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label>Please specify dance type</label>
                        <input type="text" id="otherDanceType_${event.id}" value="${event.details.otherDanceType || ''}" placeholder="e.g., Sibling dance, Grandparent dance" onchange="updateSpecialDanceName(${event.id})">
                    </div>
                </div>
                ${generateSongInput('songChoice', 'Song Selection', event.details.songChoice)}
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="danceDuration_${event.id}"></span>How long would you like to dance for?</label>
                    <div class="radio-group">
                        <label class="radio-option"><input type="radio" name="danceDuration_${event.id}" value="whole" ${event.details[`danceDuration_${event.id}`] === 'whole' ? 'checked' : ''} onchange="toggleDancePart(${event.id})"><span>Whole song</span></label>
                        <label class="radio-option"><input type="radio" name="danceDuration_${event.id}" value="part" ${event.details[`danceDuration_${event.id}`] === 'part' ? 'checked' : ''} onchange="toggleDancePart(${event.id})"><span>Part of song</span></label>
                    </div>
                </div>
                <div id="dancePartSection_${event.id}" class="time-row" style="display: ${event.details[`danceDuration_${event.id}`] === 'part' ? 'grid' : 'none'};">
                    <div class="form-group">
                        <label><span class="status-badge optional" data-field-id="startAt" data-conditional="danceDuration_${event.id}:part"></span>Start at</label>
                        <input type="text" id="startAt" value="${event.details.startAt || ''}" placeholder="00:30">
                    </div>
                    <div class="form-group">
                        <label><span class="status-badge optional" data-field-id="endAt" data-conditional="danceDuration_${event.id}:part"></span>End at</label>
                        <input type="text" id="endAt" value="${event.details.endAt || ''}" placeholder="01:30">
                    </div>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'intros':
            html += `
                <div class="form-group">
                    <label>Will we be introducing your wedding party?</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="introduceParty" value="yes" ${event.details.introduceParty === 'yes' ? 'checked' : ''} onchange="toggleWeddingPartySection()">
                            <span>Yes</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="introduceParty" value="no" ${event.details.introduceParty === 'no' ? 'checked' : ''} onchange="toggleWeddingPartySection()">
                            <span>No, just the newlyweds</span>
                        </label>
                    </div>
                </div>
                <div id="weddingPartySection" class="conditional-section" style="display: ${event.details.introduceParty === 'yes' ? 'block' : 'none'};">
                    ${generateSongInput('introSong', 'Wedding Party Introduction Song', event.details.introSong, 3)}
                    <div class="form-group">
                        <label>Wedding Party Names (in order)</label>
                        <textarea id="weddingParty" placeholder="List names in order of introduction">${event.details.weddingParty || ''}</textarea>
                    </div>
                </div>
                ${generateSongInput('newlywedsIntroSong', 'Newlyweds Introduction Song', event.details.newlywedsIntroSong)}
                <div class="form-group">
                    <label>How to introduce couple</label>
                    <input type="text" id="coupleIntro" value="${event.details.coupleIntro || ''}" placeholder="e.g., Mr. & Mrs. Smith">
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'blessing':
        case 'welcome':
            const eventType = event.type === 'blessing' ? 'blessing' : 'welcome';
            html += `
                <div class="form-group">
                    <label>Who will be giving the ${eventType}?</label>
                    <input type="text" id="givenBy" value="${event.details.givenBy || ''}" placeholder="Name and relationship">
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'toasts':
            html += `
                <div class="form-group">
                    <label>Who are giving toasts?</label>
                    <textarea id="toastGivers" placeholder="List names in order and their relationship to the bride/groom i.e. Father of the bride John, Maid of honor Sarah, etc">${event.details.toastGivers || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'cake-cutting':
            html += `
                ${generateSongInput('cakeSong', 'Cake Cutting Song', event.details.cakeSong)}
                <div class="form-group">
                    <label>Would you like us to make an announcement?</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="makeAnnouncement" value="yes" ${event.details.makeAnnouncement === 'yes' ? 'checked' : ''}>
                            <span>Yes</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="makeAnnouncement" value="no" ${event.details.makeAnnouncement === 'no' ? 'checked' : ''}>
                            <span>No</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'photo-dash':
            html += `
                ${generateSongInput('photoDashSong', 'Photo Dash Song', event.details.photoDashSong)}
                <div class="form-group">
                    <label>How would you like to do the photo dash?</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="photoDashStyle" value="center" ${event.details.photoDashStyle === 'center' ? 'checked' : ''} onchange="togglePhotoDashOther()">
                            <span>Couple sits in middle of dance floor and guests stand up to join</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="photoDashStyle" value="tables" ${event.details.photoDashStyle === 'tables' ? 'checked' : ''} onchange="togglePhotoDashOther()">
                            <span>Couple goes around to each table</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="photoDashStyle" value="other" ${event.details.photoDashStyle === 'other' ? 'checked' : ''} onchange="togglePhotoDashOther()">
                            <span>Other</span>
                        </label>
                    </div>
                </div>
                <div id="photoDashOther" class="conditional-section" style="display: ${event.details.photoDashStyle === 'other' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label>Please explain your photo dash style</label>
                        <textarea id="photoDashOtherText" placeholder="Describe how you'd like to do the photo dash">${event.details.photoDashOtherText || ''}</textarea>
                    </div>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'bouquet-toss':
            html += `
                ${generateSongInput('bouquetSong', 'Bouquet Toss Song', event.details.bouquetSong)}
                <div class="form-group">
                    <label>Include Garter Toss?</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="garter" value="yes" ${event.details.garter === 'yes' ? 'checked' : ''}>
                            <span>Yes</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="garter" value="no" ${event.details.garter === 'no' ? 'checked' : ''}>
                            <span>No</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'dinner':
            html += `
                <div class="form-group">
                    <label>Dinner style is...</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="dinnerStyle" value="plated" ${event.details.dinnerStyle === 'plated' ? 'checked' : ''} onchange="toggleBuffetRelease()">
                            <span>Plated</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="dinnerStyle" value="buffet" ${event.details.dinnerStyle === 'buffet' ? 'checked' : ''} onchange="toggleBuffetRelease()">
                            <span>Buffet</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="dinnerStyle" value="family" ${event.details.dinnerStyle === 'family' ? 'checked' : ''} onchange="toggleBuffetRelease()">
                            <span>Family Style</span>
                        </label>
                    </div>
                </div>
                <div id="buffetReleaseSection" class="conditional-section" style="display: ${event.details.dinnerStyle === 'buffet' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label>Who will be releasing tables for the buffet line?</label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="buffetRelease" value="catering" ${event.details.buffetRelease === 'catering' ? 'checked' : ''}>
                                <span>Catering</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="buffetRelease" value="planner" ${event.details.buffetRelease === 'planner' ? 'checked' : ''}>
                                <span>Planner</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="buffetRelease" value="dj" ${event.details.buffetRelease === 'dj' ? 'checked' : ''}>
                                <span>DJ on mic</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Dinner Music Style</label>
                    <input type="text" id="dinnerMusic" value="${event.details.dinnerMusic || ''}" placeholder="Genre or playlist">
                </div>
                <div class="form-group">
                    <label>Special Announcements</label>
                    <textarea id="announcements" placeholder="Any announcements during dinner?">${event.details.announcements || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'open-dancing':
            html += `
                ${generateSongInput('mustPlay', 'Must-Play Songs', event.details.mustPlay, 10)}
                ${generateSongInput('playIfPossible', "Maybe play these if they fit, but all don't need to be played", event.details.playIfPossible, 30)}
                <div class="form-group">
                    <label>Songs, artists, or genres to avoid</label>
                    <textarea id="doNotPlay" placeholder="Songs, artists, or genres to avoid">${event.details.doNotPlay || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Preferred Music Style</label>
                    <input type="text" id="danceStyle" value="${event.details.danceStyle || ''}" placeholder="Genres or era">
                </div>
                <div class="form-group">
                    <label>Line Dances</label>
                    ${generateLineDanceOptions('cha-cha-slide', 'Cha-Cha Slide', event.details.lineDances)}
                    ${generateLineDanceOptions('electric-slide', 'Electric Slide', event.details.lineDances)}
                    ${generateLineDanceOptions('cupid-shuffle', 'Cupid Shuffle', event.details.lineDances)}
                    ${generateLineDanceOptions('wobble', 'Wobble', event.details.lineDances)}
                    ${generateLineDanceOptions('watermelon-crawl', 'Watermelon Crawl', event.details.lineDances)}
                    ${generateLineDanceOptions('git-up', 'The Git Up', event.details.lineDances)}
                    ${generateLineDanceOptions('copperhead-road', 'Copperhead Road', event.details.lineDances)}
                    ${generateLineDanceOptions('cotton-eye-joe', 'Cotton Eye Joe', event.details.lineDances)}
                    ${generateLineDanceOptions('macarena', 'Macarena', event.details.lineDances)}
                    ${generateLineDanceOptions('ymca', 'YMCA', event.details.lineDances)}
                    <div style="margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                        <label class="radio-option" style="display: flex; align-items: center; margin-bottom: 8px;">
                            <input type="checkbox" name="lineDanceOther" ${event.details.lineDanceOtherEnabled ? 'checked' : ''} onchange="toggleLineDanceOther()">
                            <span style="font-weight: 600;">Other</span>
                        </label>
                        <div id="lineDanceOtherText" style="display: ${event.details.lineDanceOtherEnabled ? 'block' : 'none'}; margin-top: 8px;">
                            <textarea id="lineDanceOtherDetails" placeholder="List any other line dances and preferences">${event.details.lineDanceOtherDetails || ''}</textarea>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'grand-exit':
            html += `
                <div class="form-group">
                    <label>Exit Style</label>
                    <select id="exitStyle">
                        <option value="">Select...</option>
                        <option value="sparklers" ${event.details.exitStyle === 'sparklers' ? 'selected' : ''}>Sparklers</option>
                        <option value="bubbles" ${event.details.exitStyle === 'bubbles' ? 'selected' : ''}>Bubbles</option>
                        <option value="confetti" ${event.details.exitStyle === 'confetti' ? 'selected' : ''}>Confetti</option>
                        <option value="other" ${event.details.exitStyle === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Special Instructions</label>
                    <textarea id="instructions" placeholder="Any special notes about the exit">${event.details.instructions || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'custom':
            html += `
                ${generateSongInput('songChoice', 'Song Selection', event.details.songChoice)}
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Add any details about this event">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'shoe-game':
            const questions = Array.isArray(event.details.questions) ? event.details.questions : (event.details.questions ? [event.details.questions] : []);
            html += `
                <div class="form-group">
                    <label>Question #1</label>
                    <input type="text" id="shoeQuestion_0" value="${questions[0] || ''}" placeholder="Type your first question">
                </div>
                <div id="shoeQuestionsExtra">
                    ${questions.slice(1).map((q, idx) => `
                        <div class=\"form-group\"> 
                            <label>Question #${idx + 2}</label>
                            <input type=\"text\" id=\"shoeQuestion_${idx + 1}\" value=\"${q}\" placeholder=\"Type your question\"> 
                        </div>
                    `).join('')}
                </div>
                <div class="form-group">
                    <button class="song-action-btn" onclick="addShoeQuestion(${event.id}); return false;">+ Add a question</button>
                </div>
            `;
            break;

        default:
            html += `
                ${generateSongInput('songChoice', 'Song Selection', event.details.songChoice)}
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Add any details about this event">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
    }

    if (event.type === 'end-of-wedding') {
        html += `
            <div class="form-group">
                <label><span class="status-badge required" data-field-id="endTime"></span>Time that wedding ends</label>
                <input type="time" id="endTime" value="${event.details.endTime || ''}">
            </div>
        `;
    }

    // Add delete button for all events
    html += `
        <button class="delete-event-btn" id="deleteBtn_${event.id}">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete Event
        </button>
    `;

    return html;
}

function saveEventDetails(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Collect all form values
    const modalBody = document.getElementById('modalBody');
    const inputs = modalBody.querySelectorAll('input, textarea, select');
    
    // Handle line dances specially
    const lineDances = {};
    
    inputs.forEach(input => {
        if (input.type === 'radio') {
            if (input.checked) {
                // Check if it's a line dance radio
                if (input.name.startsWith('lineDance_')) {
                    const danceName = input.name.replace('lineDance_', '');
                    lineDances[danceName] = input.value;
                } else {
                    event.details[input.name] = input.value;
                }
            }
        } else if (input.type === 'checkbox') {
            if (input.name === 'lineDanceOther') {
                event.details.lineDanceOtherEnabled = input.checked;
            }
        } else if (input.type === 'hidden' || input.id) {
            // Save both hidden song inputs and regular inputs
            if (input.id) {
                event.details[input.id] = input.value;
            }
        }
    });

    // Store line dances object
    if (Object.keys(lineDances).length > 0) {
        event.details.lineDances = lineDances;
    }

    // Update time in the card view
    if (event.details.startTime) {
        event.time = convert24To12Hour(event.details.startTime);
        renderEvents();
        setupDragAndDrop();
    }

    showSaveIndicator();

    // Update status badges after saving
    const eventForBadges = events.find(e => e.id === eventId);
    if (eventForBadges) {
        document.querySelectorAll('.status-badge').forEach(b => {
            const fieldId = b.getAttribute('data-field-id');
            updateStatusBadgeDisplay(fieldId, eventForBadges);
        });
    }
    updateOverallProgress();
}

function convert24To12Hour(time24) {
    if (!time24) return '';
    let [hours, minutes] = time24.split(':');
    hours = parseInt(hours);
    const modifier = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${modifier}`;
}

function convertTo24Hour(time12h) {
    if (!time12h) return '';
    // Simple conversion for demo
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
        hours = '00';
    }
    
    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes || '00'}`;
}

// Conditional section toggle functions
function toggleWeddingPartySection() {
    const selected = document.querySelector('input[name="introduceParty"]:checked');
    const section = document.getElementById('weddingPartySection');
    if (section) {
        section.style.display = selected && selected.value === 'yes' ? 'block' : 'none';
    }
    saveEventDetails(currentEventId);
}

function toggleSpecialActivityDetails() {
    const selected = document.querySelector('input[name="hasSpecialActivity"]:checked');
    const section = document.getElementById('specialActivityDetails');
    if (section) {
        section.style.display = selected && selected.value === 'yes' ? 'block' : 'none';
    }
    saveEventDetails(currentEventId);
    if (typeof updateStatusBadgeDisplay === 'function') {
        updateStatusBadgeDisplay('specialActivityType', events.find(e => e.id === currentEventId));
        updateStatusBadgeDisplay('specialActivitySong', events.find(e => e.id === currentEventId));
    }
}

function toggleSpecialActivitySongEntry() {
    const selected = document.querySelector('input[name="specialActivitySong"]:checked');
    const section = document.getElementById('specialActivitySongEntry');
    if (section) {
        section.style.display = selected && selected.value === 'yes' ? 'block' : 'none';
    }
    saveEventDetails(currentEventId);
    if (typeof updateStatusBadgeDisplay === 'function') {
        updateStatusBadgeDisplay('specialActivitySongTitle', events.find(e => e.id === currentEventId));
    }
}

function toggleBuffetRelease() {
    const selected = document.querySelector('input[name="dinnerStyle"]:checked');
    const section = document.getElementById('buffetReleaseSection');
    if (section) {
        section.style.display = selected && selected.value === 'buffet' ? 'block' : 'none';
    }
    saveEventDetails(currentEventId);
}

function togglePhotoDashOther() {
    const selected = document.querySelector('input[name="photoDashStyle"]:checked');
    const section = document.getElementById('photoDashOther');
    if (section) {
        section.style.display = selected && selected.value === 'other' ? 'block' : 'none';
    }
    saveEventDetails(currentEventId);
}

function toggleDancePart(eventId) {
    const selected = document.querySelector(`input[name="danceDuration_${eventId}"]:checked`);
    const section = document.getElementById(`dancePartSection_${eventId}`);
    if (section) section.style.display = selected && selected.value === 'part' ? 'grid' : 'none';
    saveEventDetails(eventId);
    if (typeof updateStatusBadgeDisplay === 'function') {
        updateStatusBadgeDisplay(`danceDuration_${eventId}`, events.find(e => e.id === eventId));
        updateStatusBadgeDisplay('startAt', events.find(e => e.id === eventId));
        updateStatusBadgeDisplay('endAt', events.find(e => e.id === eventId));
    }
}

function addShoeQuestion(eventId) {
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    if (!Array.isArray(ev.details.questions)) {
        ev.details.questions = ev.details.questions ? [ev.details.questions] : [];
    }
    ev.details.questions.push('');
    // Reopen to render new input
    closeModal();
    setTimeout(() => openModal(eventId), 50);
}

function toggleLineDanceOther() {
    const checkbox = document.querySelector('input[name="lineDanceOther"]');
    const section = document.getElementById('lineDanceOtherText');
    if (section) {
        section.style.display = checkbox && checkbox.checked ? 'block' : 'none';
    }
    saveEventDetails(currentEventId);
}

function toggleMusicChoice() {
    const selected = document.querySelector('input[name="musicChoice"]:checked');
    const showGenre = selected && selected.value === 'genre';
    const showPlaylist = selected && selected.value === 'playlist';
    const styleGroup = document.getElementById('musicStyleGroup');
    const songsGroup = document.getElementById('cocktailSongsGroup');
    if (styleGroup) styleGroup.style.display = showGenre ? 'block' : 'none';
    if (songsGroup) songsGroup.style.display = showPlaylist ? 'block' : 'none';
    saveEventDetails(currentEventId);
    if (typeof updateStatusBadgeDisplay === 'function') {
        updateStatusBadgeDisplay('musicChoice', events.find(e => e.id === currentEventId));
        updateStatusBadgeDisplay('musicStyle', events.find(e => e.id === currentEventId));
        updateStatusBadgeDisplay('cocktailSongs', events.find(e => e.id === currentEventId));
    }
}

// Status badge utilities
function isFieldOptional(fieldId, event) {
    if (fieldId === 'otherDetails') return true;
    if (fieldId === 'startTime') {
        if (event && event.type === 'ceremony') return false;
        return true;
    }
    return false;
}

function getBadgeIcon(type) {
    if (type === 'completed') {
        return '<svg viewBox="0 0 24 24" fill="#2b8a3e"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    }
    if (type === 'required') {
        return '<svg viewBox="0 0 24 24" fill="#d9480f"><circle cx="12" cy="12" r="10"/><rect x="11" y="6" width="2" height="8" fill="#fff"/><rect x="11" y="16" width="2" height="2" fill="#fff"/></svg>';
    }
    return '';
}

function updateStatusBadgeDisplay(fieldId, event) {
    const badge = document.querySelector(`.status-badge[data-field-id="${fieldId}"]`);
    if (!badge) return;
    let requirement = isFieldOptional(fieldId, event) ? 'optional' : 'required';
    const conditional = badge.getAttribute('data-conditional');
    if (conditional) {
        const [condField, condValue] = conditional.split(':');
        const condEl = document.querySelector(`input[name="${condField}"]:checked`);
        if (!(condEl && condEl.value === condValue)) {
            requirement = 'optional';
        }
    }
    const inputEl = document.getElementById(fieldId);
    let hasValue = false;
    if (inputEl) {
        if (inputEl.hasAttribute('data-max')) {
            try {
                const arr = JSON.parse(inputEl.value || '[]');
                const max = parseInt(inputEl.getAttribute('data-max') || '1', 10);
                hasValue = Array.isArray(arr) && arr.length >= max;
            } catch { hasValue = false; }
        } else if (inputEl.type === 'checkbox' || inputEl.type === 'radio') {
            hasValue = !!inputEl.checked;
        } else {
            hasValue = !!(inputEl.value && inputEl.value.trim());
        }
    } else {
        // Fallback for radio groups referenced by name
        const radioChecked = document.querySelector(`input[name="${fieldId}"]:checked`);
        if (radioChecked) hasValue = true;
    }
    let cls = 'optional';
    let iconType = 'optional';
    if (requirement === 'required') {
        if (hasValue) {
            cls = 'completed';
            iconType = 'completed';
        } else {
            cls = 'required';
            iconType = 'required';
        }
    }
    badge.classList.remove('optional', 'required', 'completed');
    badge.classList.add(cls);
    badge.innerHTML = getBadgeIcon(iconType);
}

// Compute required completion counts by parsing generated markup for required badges
function computeEventCompletion(event) {
    try {
        const html = generateModalContent(event);
        const regex = /status-badge\s+required[^>]*data-field-id=\"([^\"]+)\"([^>]*data-conditional=\"([^\"]+)\")?/g;
        let match;
        let total = 0;
        let done = 0;
        while ((match = regex.exec(html)) !== null) {
            const fieldId = match[1];
            const conditional = match[3];
            // evaluate conditional
            if (conditional) {
                const [cField, cVal] = conditional.split(':');
                if ((event.details[cField] || '') !== cVal) {
                    continue; // not required under current condition
                }
            }
            total += 1;
            // Determine value presence
            let value = event.details[fieldId];
            let hasValue = false;
            if (value != null) {
                if (typeof value === 'string') {
                    const v = value.trim();
                    // song arrays saved as JSON strings
                    if (v.startsWith('[') && v.endsWith(']')) {
                        try { const arr = JSON.parse(v); hasValue = Array.isArray(arr) && arr.length > 0; } catch(_) { hasValue = v.length > 0; }
                    } else {
                        hasValue = v.length > 0;
                    }
                } else if (Array.isArray(value)) {
                    hasValue = value.length > 0;
                } else {
                    hasValue = !!value;
                }
            }
            if (fieldId === 'startTime' && event.type !== 'ceremony') {
                // optional outside ceremony
                total -= 1; // not count
            } else if (hasValue) {
                done += 1;
            }
        }
        return { done, total };
    } catch (e) {
        return { done: 0, total: 0 };
    }
}

function updateOverallProgress() {
    let total = 0;
    let done = 0;
    events.forEach(ev => {
        const c = computeEventCompletion(ev);
        total += c.total;
        done += c.done;
    });
    const remaining = Math.max(total - done, 0);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const bar = document.getElementById('overallProgressBar');
    const txt = document.getElementById('overallProgressText');
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = `${remaining} remaining — ${pct}%`;
}

function generateLineDanceOptions(value, label, lineDances) {
    const selected = lineDances?.[value] || '';
    return `
        <div style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #333;">${label}</div>
            <div class="radio-group" style="flex-direction: row; gap: 20px; flex-wrap: wrap;">
                <label class="radio-option">
                    <input type="radio" name="lineDance_${value}" value="must" ${selected === 'must' ? 'checked' : ''}>
                    <span>Must play</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="lineDance_${value}" value="maybe" ${selected === 'maybe' ? 'checked' : ''}>
                    <span>Play if feels right</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="lineDance_${value}" value="no" ${selected === 'no' ? 'checked' : ''}>
                    <span>Do not play</span>
                </label>
            </div>
        </div>
    `;
}

function handleSpecialDanceType(eventId) {
    const selected = document.querySelector(`input[name="danceType_${eventId}"]:checked`);
    const container = document.getElementById(`otherDanceTypeContainer_${eventId}`);
    if (container) {
        container.style.display = selected && selected.value === 'other' ? 'block' : 'none';
    }
    updateSpecialDanceName(eventId);
    saveEventDetails(eventId);
}

function updateSpecialDanceName(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const selected = document.querySelector(`input[name="danceType_${eventId}"]:checked`);
    if (!selected) return;

    let newName = event.name;
    if (selected.value === 'father-daughter') {
        newName = 'Father Daughter Dance';
    } else if (selected.value === 'mother-son') {
        newName = 'Mother Son Dance';
    } else if (selected.value === 'other') {
        const otherInput = document.getElementById(`otherDanceType_${eventId}`);
        if (otherInput && otherInput.value.trim()) {
            newName = otherInput.value.trim();
        } else {
            newName = 'Special Dance';
        }
    }

    if (newName !== event.name) {
        event.name = newName;
        document.getElementById('eventNameDisplay').textContent = newName;
        renderEvents();
        setupDragAndDrop();
        showSaveIndicator();
    }
}

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

function addStandardEvent(template) {
    const newEvent = {
        id: nextId++,
        type: template.type,
        name: template.name,
        time: '',
        details: {}
    };
    events.push(newEvent);
    renderEvents();
    setupDragAndDrop();
    closeAddEventModal();
    openModal(newEvent.id);
    showSaveIndicator();
}

function createCustomEvent() {
    const newEvent = {
        id: nextId++,
        type: 'custom',
        name: 'New Event',
        time: '',
        details: {}
    };
    events.push(newEvent);
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

// Song search functions
function openSongSearch(inputId) {
    currentSongInputId = inputId;
    document.getElementById('songSearchModal').classList.add('active');
    document.getElementById('songSearchInput').value = '';
    document.getElementById('songSearchResults').innerHTML = '';
    document.getElementById('songSearchInput').focus();
}

function closeSongSearch() {
    document.getElementById('songSearchModal').classList.remove('active');
    currentSongInputId = null;
}

async function searchSongs() {
    const searchInput = document.getElementById('songSearchInput');
    const query = searchInput.value.trim();
    
    if (!query) return;
    
    const resultsContainer = document.getElementById('songSearchResults');
    resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';
    
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=25`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            resultsContainer.innerHTML = '';
            data.results.forEach(song => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.onclick = () => selectSong(song);
                
                resultItem.innerHTML = `
                    <img src="${song.artworkUrl60}" alt="${song.trackName}" class="search-result-artwork">
                    <div class="search-result-info">
                        <div class="search-result-track">${song.trackName}</div>
                        <div class="search-result-artist">${song.artistName}</div>
                        <div class="search-result-album">${song.collectionName}</div>
                    </div>
                `;
                
                resultsContainer.appendChild(resultItem);
            });
        } else {
            resultsContainer.innerHTML = '<div class="search-no-results">No results found. Try a different search.</div>';
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<div class="search-no-results">Error searching. Please try again.</div>';
    }
}

function selectSong(song) {
    if (currentSongInputId) {
        const input = document.getElementById(currentSongInputId);
        const display = document.getElementById(`${currentSongInputId}_display`);
        if (input) {
            const songText = `${song.trackName} - ${song.artistName}`;
            input.value = songText;
            if (display) {
                display.textContent = songText;
            }
            // Trigger save
            saveEventDetails(currentEventId);
        }
    }
    closeSongSearch();
}

// Allow Enter key to search
document.getElementById('songSearchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchSongs();
    }
});

// Close song search modal when clicking outside
document.getElementById('songSearchModal').addEventListener('click', (e) => {
    if (e.target.id === 'songSearchModal') {
        closeSongSearch();
    }
});

// Function for Link
function openSongLink(inputId) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(`${inputId}_display`);
    
    const url = prompt('Paste your Spotify or Apple Music link here:');
    
    if (url && url.trim()) {
        // Extract song info from URL if possible, otherwise just store the URL
        const songText = url.trim();
        input.value = songText;
        if (display) {
            display.textContent = songText;
        }
        // Trigger save
        saveEventDetails(currentEventId);
    }
}

function deleteEvent(eventId) {
    openConfirm('Are you sure you want to delete this event?', () => {
        events = events.filter(e => e.id !== eventId);
        renderEvents();
        setupDragAndDrop();
        closeModal();
        showSaveIndicator();
    });
}

function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    indicator.classList.add('show');
    setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
}

// Close modal when clicking outside
document.getElementById('eventModal').addEventListener('click', (e) => {
    if (e.target.id === 'eventModal') {
        closeModal();
    }
});

// Initialize on load
init();
