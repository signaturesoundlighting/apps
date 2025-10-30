// Open general info modal
function openGeneralInfo() {
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.innerHTML = `<span>General Info</span>`;
    modalBody.innerHTML = `
        <div class="form-group">
            <label><span class=\"status-badge required\" data-field-id=\"venueName\"></span>Venue Name</label>
            <input type="text" id="venueName" value="${generalInfo.venueName || ''}" placeholder="Venue name">
        </div>
        <div class="form-group">
            <label><span class=\"status-badge required\" data-field-id=\"venueAddress\"></span>Venue Address</label>
            <input type="text" id="venueAddress" value="${generalInfo.venueAddress || ''}" placeholder="Full address">
        </div>
        <div class="form-group">
            <label class="checkbox-option">
                <input type="checkbox" id="differentCeremonyVenue" ${generalInfo.differentCeremonyVenue ? 'checked' : ''} onchange="toggleCeremonyVenue()">
                <span>My ceremony will be at a different venue</span>
            </label>
        </div>
        <div id="ceremonyVenueSection" style="display: ${generalInfo.differentCeremonyVenue ? 'block' : 'none'};">
            <div class="form-group">
                <label><span class=\"status-badge required\" data-field-id=\"ceremonyVenueName\"></span>Ceremony Venue Name</label>
                <input type="text" id="ceremonyVenueName" value="${generalInfo.ceremonyVenueName || ''}" placeholder="Ceremony venue name">
            </div>
            <div class="form-group">
                <label><span class=\"status-badge required\" data-field-id=\"ceremonyVenueAddress\"></span>Ceremony Venue Address</label>
                <input type="text" id="ceremonyVenueAddress" value="${generalInfo.ceremonyVenueAddress || ''}" placeholder="Full address">
            </div>
        </div>
        <div class="info-grid">
            <div class="form-group">
                <label><span class=\"status-badge required\" data-field-id=\"plannerName\"></span>Planner Name</label>
                <input type="text" id="plannerName" value="${generalInfo.plannerName || ''}" placeholder="Planner's name">
            </div>
            <div class="form-group">
                <label><span class=\"status-badge required\" data-field-id=\"plannerEmail\"></span>Planner Email</label>
                <input type="email" id="plannerEmail" value="${generalInfo.plannerEmail || ''}" placeholder="email@example.com">
            </div>
        </div>
    `;
    modal.classList.add('active');
    
    modalBody.querySelectorAll('input').forEach(input => {
        if (input.type === 'checkbox') {
            input.addEventListener('change', () => saveGeneralInfo());
        } else {
            input.addEventListener('input', () => saveGeneralInfo());
        }
    });
    // Initialize badges for general info
    modalBody.querySelectorAll('.status-badge').forEach(b => {
        const fieldId = b.getAttribute('data-field-id');
        updateStatusBadgeDisplay(fieldId);
    });
    
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
    // Refresh badges after changes
    const modalBody = document.getElementById('modalBody');
    modalBody.querySelectorAll('.status-badge').forEach(b => {
        const fieldId = b.getAttribute('data-field-id');
        updateStatusBadgeDisplay(fieldId);
    });
}

function toggleCeremonyVenue() {
    const checkbox = document.getElementById('differentCeremonyVenue');
    const section = document.getElementById('ceremonyVenueSection');
    if (section) {
        section.style.display = checkbox && checkbox.checked ? 'grid' : 'none';
    }
    saveGeneralInfo();
}

function closeModal() {
    document.getElementById('eventModal').classList.remove('active');
    currentEventId = null;
}

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
    
    modalBody.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('change', () => saveEventDetails(eventId));
        input.addEventListener('input', () => {
            if (input.type === 'radio' || input.type === 'checkbox') return;
            saveEventDetails(eventId);
        });
    });
    
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
    
    // Build footer (includes Delete button)
    addModalFooter(eventId);

    // Wire delete after footer is in DOM
    const deleteBtn = document.getElementById(`deleteBtn_${eventId}`);
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteEvent(eventId);
        });
    }

    // Initialize status badges (non-interactive)
    document.querySelectorAll('.status-badge').forEach(badge => {
        const fieldId = badge.getAttribute('data-field-id');
        updateStatusBadgeDisplay(fieldId, events.find(e => e.id === currentEventId));
    });
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
    
    const current = events.find(e => e.id === eventId);
    const deleteHtml = current && current.type === 'end-of-wedding' ? '' : `
        <button class="delete-event-btn" id="deleteBtn_${eventId}">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete Event
        </button>`;
    footer.innerHTML = `
        <button class="nav-btn" onclick="navigateEvent('prev')" ${!hasPrev ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            Previous
        </button>
        ${deleteHtml}
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

function deleteEvent(eventId) {
    const ev = events.find(e => e.id === eventId);
    if (ev && ev.type === 'end-of-wedding') {
        alert('The End of Wedding card cannot be deleted.');
        return;
    }
    openConfirm('Are you sure you want to delete this event?', () => {
        events = events.filter(e => e.id !== eventId);
        renderEvents();
        setupDragAndDrop();
        closeModal();
        showSaveIndicator();
    });
}

// Close modal when clicking outside
document.getElementById('eventModal').addEventListener('click', (e) => {
    if (e.target.id === 'eventModal') {
        closeModal();
    }
});

// Conditional section toggle functions (exposed globally for inline handlers)
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
}

function toggleSpecialActivitySongEntry() {
    const selected = document.querySelector('input[name="specialActivitySong"]:checked');
    const section = document.getElementById('specialActivitySongEntry');
    if (section) {
        section.style.display = selected && selected.value === 'yes' ? 'block' : 'none';
    }
    saveEventDetails(currentEventId);
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

// Special dance type handlers (global)
function addShoeQuestion(eventId) {
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    if (!Array.isArray(ev.details.questions)) {
        ev.details.questions = ev.details.questions ? [ev.details.questions] : [];
    }
    ev.details.questions.push('');
    closeModal();
    setTimeout(() => openModal(eventId), 50);
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
        const displayEl = document.getElementById('eventNameDisplay');
        if (displayEl) displayEl.textContent = newName;
        renderEvents();
        setupDragAndDrop();
        showSaveIndicator();
    }
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

// Extra safety: delegate delete button clicks in case a specific listener wasn't bound
document.addEventListener('click', (e) => {
    const deleteBtnEl = e.target.closest('.delete-event-btn');
    if (deleteBtnEl && document.getElementById('eventModal').classList.contains('active')) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof currentEventId === 'number') {
            deleteEvent(currentEventId);
        }
    }
});

// Extra safety: ensure confirm Yes button always triggers the pending action
(() => {
    const yesBtn = document.getElementById('confirmYesBtn');
    if (yesBtn) {
        yesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof __onConfirmYes === 'function') {
                const fn = __onConfirmYes;
                __onConfirmYes = null;
                closeConfirm();
                fn();
            }
        });
    }
})();

// Simple confirm modal helpers
let __onConfirmYes = null;
function openConfirm(message, onYes) {
    const modal = document.getElementById('confirmModal');
    const msg = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYesBtn');
    msg.textContent = message || 'Are you sure?';
    __onConfirmYes = onYes;
    modal.style.display = 'flex';
    modal.classList.add('active');
    // Reset existing handler then set
    yesBtn.onclick = () => {
        closeConfirm();
        if (typeof __onConfirmYes === 'function') __onConfirmYes();
        __onConfirmYes = null;
    };
}
function closeConfirm() {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
    __onConfirmYes = null;
}

function saveEventDetails(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const modalBody = document.getElementById('modalBody');
    const inputs = modalBody.querySelectorAll('input, textarea, select');
    
    const lineDances = {};
    
    inputs.forEach(input => {
        if (input.type === 'radio') {
            if (input.checked) {
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
            if (input.id) {
                event.details[input.id] = input.value;
            }
        }
    });

    if (Object.keys(lineDances).length > 0) {
        event.details.lineDances = lineDances;
    }

    if (event.details.startTime) {
        event.time = convert24To12Hour(event.details.startTime);
        renderEvents();
        setupDragAndDrop();
    }

    showSaveIndicator();
    if (typeof updateOverallProgress === 'function') updateOverallProgress();

    // Update status badges
    const eventForBadges = events.find(e => e.id === eventId);
    if (eventForBadges) {
        document.querySelectorAll('.status-badge').forEach(b => {
            const fieldId = b.getAttribute('data-field-id');
            updateStatusBadgeDisplay(fieldId, eventForBadges);
        });
    }
}
