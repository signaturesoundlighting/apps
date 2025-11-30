// Song search + linking

function openSongSearch(inputId) {
  // currentSongInputId is defined in data.js
  currentSongInputId = inputId;
  document.getElementById('songSearchModal').classList.add('active');
  document.getElementById('songNameInput').value = '';
  document.getElementById('songArtistInput').value = '';
  document.getElementById('songNameInput').focus();
}

// Preview functionality removed - no longer using iTunes API

function closeSongSearch() {
  const modal = document.getElementById('songSearchModal');
  if (modal) {
    modal.classList.remove('active');
  }
  currentSongInputId = null;
}

// Preview functionality removed

// Add manual song entry (replaces iTunes search)
function addManualSong() {
  const songNameInput = document.getElementById('songNameInput');
  const songArtistInput = document.getElementById('songArtistInput');
  const songName = (songNameInput?.value || '').trim();
  const artistName = (songArtistInput?.value || '').trim();
  
  if (!songName) {
    alert('Please enter a song name.');
    songNameInput?.focus();
    return;
  }
  
  if (!currentSongInputId) {
    closeSongSearch();
    return;
  }
  
  const input = document.getElementById(currentSongInputId);
  if (!input) {
    closeSongSearch();
    return;
  }
  
  const playlistEl = document.getElementById(`${currentSongInputId}_playlist`);
  // Check if playlist exists - if so, don't allow adding songs
  if (playlistEl && playlistEl.value.trim()) {
    alert('Please remove the playlist link before adding individual songs.');
    return;
  }
  
  const max = parseInt(input.getAttribute('data-max') || '1', 10);
  let items = [];
  try { 
    items = JSON.parse(input.value || '[]'); 
    if (!Array.isArray(items)) items = []; 
  } catch { 
    items = []; 
  }
  
  if (items.length >= max) {
    alert(`You can add up to ${max} song(s) in this section.`);
    return;
  }
  
  // Store song object with same structure as before (for compatibility)
  // Keep type: 'search' so existing data structure is maintained
  const songObj = {
    type: 'search',
    trackName: songName,
    artistName: artistName || '',
    artworkUrl: '', // No artwork for manual entries
    previewUrl: '', // No preview for manual entries
    displayText: artistName ? `${songName} - ${artistName}` : songName
  };
  
  items.push(songObj);
  input.value = JSON.stringify(items);
  updateSongUI(currentSongInputId, items, max);
  saveEventDetails(currentEventId);
  if (typeof updateStatusBadgeDisplay === 'function') {
    try { 
      updateStatusBadgeDisplay(currentSongInputId, events.find(e => e.id === currentEventId)); 
    } catch(_) {}
  }
  closeSongSearch();
}

// Preview functionality removed - no longer using iTunes API

// “Link” button flow (paste Spotify / Apple link)
function openSongLink(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const playlistEl = document.getElementById(`${inputId}_playlist`);
  // Check if playlist exists - if so, don't allow adding songs
  if (playlistEl && playlistEl.value.trim()) {
    alert('Please remove the playlist link before adding individual songs.');
    return;
  }
  const max = parseInt(input.getAttribute('data-max') || '1', 10);
  let items = [];
  try { items = JSON.parse(input.value || '[]'); if (!Array.isArray(items)) items = []; } catch { items = []; }
  if (items.length >= max) { alert(`You can add up to ${max} song(s) in this section.`); return; }
  const raw = prompt('Paste your Spotify or Apple Music link here:');
  if (raw && raw.trim()) {
    let url = raw.trim();
    // Prepend protocol if missing
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    // Validate URL and require a common TLD
    let isValid = false;
    try {
      const u = new URL(url);
      // Basic TLD check; extend as needed
      isValid = /\.(com|net|org|io|co|us|uk|edu|gov|app|music|fm|tv)(:|\/|$)/i.test(u.hostname);
    } catch (_) {
      isValid = false;
    }
    if (!isValid) {
      alert('Please enter a valid URL (must include a recognized domain like .com, .net, etc).');
      return;
    }
    // Store as object with type: 'link'
    const linkObj = {
      type: 'link',
      url: url,
      displayText: url
    };
    items.push(linkObj);
    input.value = JSON.stringify(items);
    updateSongUI(inputId, items, max);
    saveEventDetails(currentEventId);
  }
}

// Playlist link flow (max >= 2)
function openPlaylistLink(inputId) {
  const input = document.getElementById(inputId);
  const playlistEl = document.getElementById(`${inputId}_playlist`);
  if (!input || !playlistEl) return;
  
  // Check if songs already exist - if so, warn user
  let items = [];
  try { items = JSON.parse(input.value || '[]'); if (!Array.isArray(items)) items = []; } catch { items = []; }
  if (items.length > 0) {
    const confirmClear = confirm('Adding a playlist link will remove all existing songs. Continue?');
    if (!confirmClear) return;
  }
  
  const raw = prompt('Paste your Spotify or Apple Music playlist link here:');
  if (raw && raw.trim()) {
    let url = raw.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    let isValid = false;
    try {
      const u = new URL(url);
      isValid = /\.(com|net|org|io|co|us|uk|edu|gov|app|music|fm|tv)(:|\/|$)/i.test(u.hostname);
    } catch(_) { isValid = false; }
    if (!isValid) { alert('Please enter a valid playlist URL.'); return; }
    // Save playlist and clear songs list
    playlistEl.value = url;
    input.value = '[]';
    const max = parseInt(input.getAttribute('data-max') || '1', 10);
    updateSongUI(inputId, [], max);
    saveEventDetails(currentEventId);
    if (typeof updateStatusBadgeDisplay === 'function') {
      try { updateStatusBadgeDisplay(inputId, events.find(e => e.id === currentEventId)); } catch(_) {}
    }
  }
}

// Update the visual list and counter for a song input
function updateSongUI(inputId, items, max) {
  const countEl = document.getElementById(`${inputId}_count`);
  const playlistEl = document.getElementById(`${inputId}_playlist`);
  const helpEl = document.getElementById(`${inputId}_help`);
  const playlistLinkEl = document.getElementById(`${inputId}_playlistLink`);
  const searchBtn = document.querySelector(`.song-search-btn[data-input-id="${inputId}"]`);
  const linkBtn = document.querySelector(`.song-link-btn[data-input-id="${inputId}"]`);
  const playlistBtn = document.querySelector(`.song-playlist-btn[data-input-id="${inputId}"]`);
  const actionsContainer = searchBtn?.closest('.song-actions');
  
  // Check if playlist exists
  const hasPlaylist = playlistEl && playlistEl.value.trim();
  
  // Check if section is full (items.length >= max)
  const isFull = items.length >= max;
  
  // Hide/show buttons based on playlist and fullness
  if (hasPlaylist || isFull) {
    // Hide all buttons when playlist exists or section is full
    if (actionsContainer) {
      actionsContainer.style.display = 'none';
    }
  } else {
    // Show buttons when not full and no playlist
    if (actionsContainer) {
      actionsContainer.style.display = 'flex';
    }
    // Enable search and link buttons
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.style.opacity = '1';
      searchBtn.style.cursor = 'pointer';
    }
    if (linkBtn) {
      linkBtn.disabled = false;
      linkBtn.style.opacity = '1';
      linkBtn.style.cursor = 'pointer';
    }
  }
  
  if (hasPlaylist) {
    if (countEl) countEl.textContent = 'Playlist link';
    // Hide helper text
    if (helpEl) helpEl.style.display = 'none';
    // Show playlist link in items list as a chip
    if (playlistLinkEl) {
      playlistLinkEl.style.display = 'none';
      playlistLinkEl.innerHTML = '';
    }
  } else {
    if (countEl) countEl.textContent = `${items.length}/${max || parseInt(document.getElementById(inputId)?.getAttribute('data-max')||'1',10)}`;
    // Show helper text
    if (helpEl) helpEl.style.display = 'block';
    if (playlistLinkEl) {
      playlistLinkEl.style.display = 'none';
      playlistLinkEl.innerHTML = '';
    }
  }
  
  const listEl = document.getElementById(`${inputId}_items`);
  if (listEl) {
    let chipsHtml = '';
    
    // If playlist exists, render it as a chip
    if (hasPlaylist) {
      const playlistUrl = playlistEl.value.trim();
      chipsHtml += `
        <div class="song-chip">
          <a href="${playlistUrl}" target="_blank" rel="noopener noreferrer" style="color: #1a9e8e; text-decoration: underline; flex: 1;">${playlistUrl}</a>
          <button class="song-remove-playlist-btn" data-input-id="${inputId}" style="background: #ff6b6b; color: #fff; border: none; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-weight: 600; margin-left: 8px;">Remove</button>
        </div>
      `;
    }
    
    // Render song items
    items.forEach((item, i) => {
      // Handle backward compatibility - if item is a string, convert to object
      let songObj;
      if (typeof item === 'string') {
        // Check if it looks like a URL
        if (/^https?:\/\//i.test(item)) {
          songObj = { type: 'link', url: item, displayText: item };
        } else {
          songObj = { type: 'search', displayText: item };
        }
      } else {
        songObj = item;
      }
      
      if (songObj.type === 'search') {
        // Song entry - show artwork if available (for backward compatibility), but no preview button
        const artworkUrl = songObj.artworkUrl || '';
        const displayText = songObj.displayText || `${songObj.trackName || ''} - ${songObj.artistName || ''}`;
        chipsHtml += `
          <div class="song-chip">
            ${artworkUrl ? `<img src="${artworkUrl}" alt="Album cover" class="song-artwork" onerror="this.style.display='none';">` : ''}
            <span class="song-text" style="flex: 1; ${!artworkUrl ? 'margin-left: 0;' : ''}">${displayText}</span>
            <button class="song-remove-btn" data-input-id="${inputId}" data-index="${i}">Remove</button>
          </div>
        `;
      } else if (songObj.type === 'link') {
        // Song link - show as hyperlink
        const url = songObj.url || songObj.displayText || '';
        chipsHtml += `
          <div class="song-chip">
            <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1a9e8e; text-decoration: underline; flex: 1;">${url}</a>
            <button class="song-remove-btn" data-input-id="${inputId}" data-index="${i}">Remove</button>
          </div>
        `;
      } else {
        // Fallback for old format
        const displayText = songObj.displayText || String(item);
        chipsHtml += `
          <div class="song-chip">
            <span style="flex: 1;">${displayText}</span>
            <button class="song-remove-btn" data-input-id="${inputId}" data-index="${i}">Remove</button>
          </div>
        `;
      }
    });
    
    listEl.innerHTML = chipsHtml;
  }
}

// Delegate removal clicks globally (for songs and playlist)
document.addEventListener('click', (e) => {
  // Handle playlist removal
  const playlistBtn = e.target.closest('.song-remove-playlist-btn');
  if (playlistBtn) {
    const inputId = playlistBtn.getAttribute('data-input-id');
    const playlistEl = document.getElementById(`${inputId}_playlist`);
    if (playlistEl) {
      playlistEl.value = '';
      const input = document.getElementById(inputId);
      const max = parseInt(input?.getAttribute('data-max') || '1', 10);
      let items = [];
      try { items = JSON.parse(input?.value || '[]'); if (!Array.isArray(items)) items = []; } catch { items = []; }
      updateSongUI(inputId, items, max);
      saveEventDetails(currentEventId);
      if (typeof updateStatusBadgeDisplay === 'function') {
        try { updateStatusBadgeDisplay(inputId, events.find(e => e.id === currentEventId)); } catch(_) {}
      }
    }
    return;
  }
  
  // Handle song removal
  const btn = e.target.closest('.song-remove-btn');
  if (!btn) return;
  const inputId = btn.getAttribute('data-input-id');
  const index = parseInt(btn.getAttribute('data-index')||'0',10);
  const input = document.getElementById(inputId);
  if (!input) return;
  let items = [];
  try { items = JSON.parse(input.value || '[]'); if (!Array.isArray(items)) items = []; } catch { items = []; }
  items.splice(index, 1);
  input.value = JSON.stringify(items);
  const max = parseInt(input.getAttribute('data-max') || '1', 10);
  updateSongUI(inputId, items, max);
  saveEventDetails(currentEventId);
  if (typeof updateStatusBadgeDisplay === 'function') {
    try { updateStatusBadgeDisplay(inputId, events.find(e => e.id === currentEventId)); } catch(_) {}
  }
});

// Attach handlers once
(function attachSongSearchHandlers() {
  const songNameInput = document.getElementById('songNameInput');
  const songArtistInput = document.getElementById('songArtistInput');
  
  // Allow Enter key to submit form
  if (songNameInput) {
    songNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addManualSong();
      }
    });
  }
  if (songArtistInput) {
    songArtistInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addManualSong();
      }
    });
  }
  
  const modal = document.getElementById('songSearchModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'songSearchModal') closeSongSearch();
    });
  }
  
  // Ensure global functions exist
  window.addManualSong = addManualSong;
  window.closeSongSearch = closeSongSearch;
})();
