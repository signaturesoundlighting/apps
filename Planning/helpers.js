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
function generateSongInput(id, label, value, maxItems = 1) {
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
    return `
        <div class="form-group">
            <label><span class="status-badge required" data-field-id="${id}" data-badge-type="songs"></span>${label}</label>
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
                        <svg viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h10v2H3v-2zm13 1v-4h2v4h3v2h-5v-2z\"/></svg>
                        <div>Insert Playlist Link</div>
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

// Progress helpers
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
            if (hasValue) done += 1;
        }
        return { done, total };
    } catch (e) {
        return { done: 0, total: 0 };
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
    if (txt) txt.textContent = `${remaining} remaining — ${pct}%`;
}
