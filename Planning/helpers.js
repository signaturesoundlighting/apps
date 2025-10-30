// Time conversion helpers
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

// Show save indicator
function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    indicator.classList.add('show');
    setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
}

// Helper function to generate new song input UI with count and icon actions
function generateSongInput(id, label, value, maxItems = 1, conditional = null) {
    let items = [];
    if (value) {
        try { const parsed = JSON.parse(value); items = Array.isArray(parsed) ? parsed : [value]; }
        catch { items = [value]; }
    }
    const countText = `${items.length}/${maxItems}`;
    const itemsHtml = items.map((t, i) => `
        <div class="song-chip">
            <span>${t}</span>
            <button class="song-remove-btn" data-input-id="${id}" data-index="${i}">Remove</button>
        </div>
    `).join('');
    const helpHtml = maxItems > 1 ? `<div class="song-help">Add up to ${maxItems} songs or a playlist link</div>` : '';
    const conditionalAttr = conditional ? ` data-conditional="${conditional}"` : '';
    return `
        <div class="form-group">
            <label><span class="status-badge required" data-field-id="${id}" data-badge-type="songs"${conditionalAttr}></span>${label}</label>
            <div class="song-box" data-input-id="${id}">
                <input type="hidden" id="${id}" value='${JSON.stringify(items)}' data-max="${maxItems}">
                <input type="hidden" id="${id}_playlist" value="">
                <div class="song-box-header"><span class="song-count" id="${id}_count">${countText}</span><span class="song-note">♪</span></div>
                ${helpHtml}
                <div class="song-actions">
                    <button class="song-icon-btn song-search-btn" data-input-id="${id}" title="Search">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                        <div>Search</div>
                    </button>
                    <button class="song-icon-btn secondary song-link-btn" data-input-id="${id}" title="Song Link">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10.59 13.41a1 1 0 010-1.41l2.59-2.59a1 1 0 011.41 1.41l-2.59 2.59a1 1 0 01-1.41 0z"/>
                            <path d="M7 17a5 5 0 010-7.07l2.12-2.12a1 1 0 111.41 1.41L8.41 11.34a3 3 0 104.24 4.24l2.12-2.12a1 1 0 111.41 1.41L14.07 17A5 5 0 017 17z"/>
                            <path d="M17 7a5 5 0 010 7.07l-1.06 1.06a1 1 0 11-1.41-1.41L15.59 12A3 3 0 0011.34 7.76l-1.06 1.06a1 1 0 11-1.41-1.41L9.93 6A5 5 0 0117 7z"/>
                        </svg>
                        <div>Song Link</div>
                    </button>
                    ${maxItems > 1 ? `
                    <button class="song-icon-btn secondary song-playlist-btn" data-input-id="${id}" title="Playlist Link" onclick="openPlaylistLink('${id}')">
                        <svg viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h10v2H3v-2zm13 1v-4h2v4h3v2h-5v-2z\"/></svg>
                        <div>Playlist Link</div>
                    </button>` : ''}
                </div>
                <div class="song-items" id="${id}_items">${itemsHtml}</div>
            </div>
        </div>
    `;
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

// Get the accent color for an event type (matches the left border color)
function getEventAccentColor(eventType) {
    const colorMap = {
        'ceremony': '#667eea',
        'cocktail-hour': '#1a9e8e',
        'intros': '#f093fb',
        'first-dance': '#fa709a',
        'special-dance-1': '#feca57',
        'special-dance-2': '#ff9ff3',
        'blessing': '#48dbfb',
        'welcome': '#ff6b6b',
        'dinner': '#4ecdc4',
        'cake-cutting': '#c44569',
        'toasts': '#f8b500',
        'photo-dash': '#5f27cd',
        'open-dancing': '#00d2d3',
        'bouquet-toss': '#ff9ff3',
        'last-group-dance': '#54a0ff',
        'private-last-dance': '#ee5a6f',
        'grand-exit': '#00d8d6',
        'custom': '#95afc0',
        'end-of-wedding': '#1a9e8e',
        'shoe-game': '#1a9e8e' // Default to turquoise if not specified
    };
    return colorMap[eventType] || '#1a9e8e'; // Default to turquoise
}

// Progress helpers
function computeEventCompletion(event) {
    try {
        const html = generateModalContent(event);
        const regex = /status-badge\s+required[^>]*data-field-id=\"([^\"]+)\"([^>]*data-conditional=\"([^\"]+)\")?([^>]*data-badge-type=\"([^\"]+)\")?/g;
        let match;
        let total = 0;
        let done = 0;
        while ((match = regex.exec(html)) !== null) {
            const fieldId = match[1];
            const conditional = match[3];
            const badgeType = match[5] || '';
            if (conditional) {
                const [cField, cVal] = conditional.split(':');
                if (((event.details || {})[cField] || '') !== cVal) continue;
            }
            // Special-case: startTime required only for ceremony is handled by modal/script logic
            if (fieldId === 'startTime' && event.type !== 'ceremony') continue;
            total += 1;
            let value = (event.details || {})[fieldId];
            let hasValue = false;
            if (value != null) {
                if (typeof value === 'string') {
                    const v = value.trim();
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
            if (badgeType === 'songs') {
                const pl = (event.details || {})[`${fieldId}_playlist`];
                if (!hasValue && typeof pl === 'string' && pl.trim()) hasValue = true;
            }
            if (hasValue) done += 1;
        }
        return { done, total };
    } catch (e) {
        return { done: 0, total: 0 };
    }
}

function computeGeneralInfoCompletion() {
    if (typeof generalInfo === 'undefined') return { done: 0, total: 0 };
    const reqFields = ['venueName', 'venueAddress', 'plannerName', 'plannerEmail'];
    let total = reqFields.length;
    let done = 0;
    
    reqFields.forEach(field => {
        const val = generalInfo[field];
        if (val && typeof val === 'string' && val.trim().length > 0) {
            done += 1;
        }
    });
    
    // Add conditional fields if differentCeremonyVenue is true
    if (generalInfo.differentCeremonyVenue) {
        total += 2; // ceremonyVenueName and ceremonyVenueAddress
        if (generalInfo.ceremonyVenueName && typeof generalInfo.ceremonyVenueName === 'string' && generalInfo.ceremonyVenueName.trim().length > 0) {
            done += 1;
        }
        if (generalInfo.ceremonyVenueAddress && typeof generalInfo.ceremonyVenueAddress === 'string' && generalInfo.ceremonyVenueAddress.trim().length > 0) {
            done += 1;
        }
    }
    
    return { done, total };
}

function updateGeneralInfoCard() {
    const card = document.querySelector('.general-info-card');
    if (!card) return;
    
    const completion = (typeof computeGeneralInfoCompletion === 'function') ? computeGeneralInfoCompletion() : { done: 0, total: 0 };
    const isDone = completion.total > 0 && completion.done >= completion.total;
    // General info card uses turquoise (#1a9e8e) for its border
    const generalInfoColor = '#1a9e8e';
    const iconSVG = isDone
        ? '<svg viewBox="0 0 24 24" style="fill: #2b8a3e;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
        : `<svg viewBox="0 0 24 24" style="fill: ${generalInfoColor};"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm2-7.5c0 1.54-1 2.14-1.8 2.6-.72.41-1.2.69-1.2 1.4V14h-2v-.7c0-1.5 1-2.1 1.8-2.6.72-.41 1.2-.69 1.2-1.4 0-.83-.67-1.5-1.5-1.5S9 7.47 9 8.3H7c0-2 1.8-3.3 4-3.3s4 1.35 4 3.5z"/></svg>`;
    const reqHtml = `<div class="req-indicator${isDone ? ' completed' : ''}">${iconSVG}${completion.done}/${completion.total}</div>`;
    
    const nameDiv = card.querySelector('div[style*="font-size: 18px"]');
    if (nameDiv) {
        const existingIndicator = card.querySelector('.req-indicator');
        if (existingIndicator) {
            existingIndicator.outerHTML = reqHtml;
        } else {
            nameDiv.insertAdjacentHTML('afterend', reqHtml);
        }
    }
}

function updateOverallProgress() {
    if (typeof events === 'undefined' || !Array.isArray(events)) return;
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
    if (txt) {
        const isComplete = total > 0 && done >= total;
        const iconSVG = isComplete
            ? '<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: #2b8a3e; vertical-align: middle;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
            : '<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: #1a9e8e; vertical-align: middle;"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm2-7.5c0 1.54-1 2.14-1.8 2.6-.72.41-1.2.69-1.2 1.4V14h-2v-.7c0-1.5 1-2.1 1.8-2.6.72-.41 1.2-.69 1.2-1.4 0-.83-.67-1.5-1.5-1.5S9 7.47 9 8.3H7c0-2 1.8-3.3 4-3.3s4 1.35 4 3.5z"/></svg>';
        txt.innerHTML = `${done}/${total} ${iconSVG} — ${pct}%`;
    }
}
