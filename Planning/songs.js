// Song search + linking

function openSongSearch(inputId) {
  // currentSongInputId is defined in data.js
  currentSongInputId = inputId;
  document.getElementById('songSearchModal').classList.add('active');
  document.getElementById('songSearchInput').value = '';
  document.getElementById('songSearchResults').innerHTML = '';
  document.getElementById('songSearchInput').focus();
}

// Single shared audio element for previews
let previewAudio = null;
let currentPreviewBtn = null;

// Helper functions to get play/pause icon SVG
function getPlayIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5v14l11-7z"/>
  </svg>`;
}

function getPauseIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
  </svg>`;
}

// Stop any playing preview
function stopPreview() {
  if (previewAudio) {
    try {
      // More aggressive stopping
      previewAudio.pause();
      previewAudio.volume = 0;
      previewAudio.currentTime = 0;
      previewAudio.src = '';
      previewAudio.load(); // Reset the audio element
      // Remove event listeners to prevent callbacks
      previewAudio.onended = null;
      previewAudio.onerror = null;
      previewAudio.onplay = null;
      previewAudio.onpause = null;
    } catch(e) {
      console.error('Error stopping preview:', e);
    }
    previewAudio = null;
  }
  if (currentPreviewBtn) {
    try {
      currentPreviewBtn.innerHTML = getPlayIcon();
    } catch(e) {
      // Button might be removed from DOM
    }
    currentPreviewBtn = null;
  }
}

function closeSongSearch() {
  stopPreview();
  const modal = document.getElementById('songSearchModal');
  if (modal) {
    modal.classList.remove('active');
  }
  currentSongInputId = null;
}

// Also stop preview when modal is hidden (in case closed another way)
function stopPreviewOnModalClose() {
  const modal = document.getElementById('songSearchModal');
  if (modal) {
    // Use MutationObserver to detect when modal is closed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (!modal.classList.contains('active')) {
            stopPreview();
          }
        }
      });
    });
    observer.observe(modal, { attributes: true });
  }
}

// JSONP fallback for mobile CORS issues with iTunes API
function jsonpRequest(urlBase) {
  return new Promise((resolve, reject) => {
    // Use a simpler callback name that Safari mobile is more likely to accept
    const cbName = `itunesCallback${Date.now()}`;
    const url = urlBase + `&callback=${cbName}`;
    const script = document.createElement('script');
    let isResolved = false;
    let errorDetails = '';
    
    const timeout = setTimeout(() => {
      if (!isResolved) {
        errorDetails = 'Request timed out after 20 seconds';
        cleanup();
        reject(new Error('JSONP timeout'));
      }
    }, 20000); // Increased to 20 seconds for mobile connections

    function cleanup() {
      isResolved = true;
      clearTimeout(timeout);
      try { 
        delete window[cbName]; 
      } catch(_) { 
        window[cbName] = undefined; 
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    // Set up callback BEFORE setting script src
    // Use a more explicit function that Safari can handle
    window[cbName] = function(data) {
      if (!isResolved && data) {
        isResolved = true;
        cleanup();
        resolve(data);
      }
    };

    // Add more detailed error handling
    script.onerror = (event) => {
      if (!isResolved) {
        errorDetails = `Script failed to load. URL: ${url.substring(0, 100)}...`;
        cleanup();
        reject(new Error(`JSONP script error: ${errorDetails}`));
      }
    };

    // Add load event to detect if script loaded but callback wasn't called
    script.onload = () => {
      // Give it a moment to execute
      setTimeout(() => {
        if (!isResolved) {
          errorDetails = 'Script loaded but callback was not executed';
          cleanup();
          reject(new Error(`JSONP callback error: ${errorDetails}`));
        }
      }, 2000);
    };

    // Set script attributes
    script.async = true;
    script.charset = 'utf-8';
    script.crossOrigin = 'anonymous';
    
    // Try to set src and append
    try {
      script.src = url;
      // Use body instead of head for better Safari compatibility
      (document.body || document.head).appendChild(script);
    } catch (e) {
      errorDetails = `Failed to create script element: ${e.message}`;
      cleanup();
      reject(new Error(`JSONP setup error: ${errorDetails}`));
    }
  });
}

// Optional proxy fetch: if window.ITUNES_PROXY_URL is defined, route request through it
async function fetchViaProxy(paramsQueryString) {
  const base = (typeof window !== 'undefined' && window.ITUNES_PROXY_URL) ? window.ITUNES_PROXY_URL : null;
  if (!base) throw new Error('No proxy configured');
  const url = `${base}?${paramsQueryString}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const res = await fetch(url, { 
      mode: 'cors', 
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Proxy HTTP ${res.status}: ${errorText.substring(0, 100)}`);
    }
    
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    } else {
      // Try parsing as JSON anyway
      const text = await res.text();
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        return JSON.parse(text);
      }
      throw new Error(`Proxy returned non-JSON: ${contentType}`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Proxy request timed out');
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Could not reach proxy server');
    }
    throw error;
  }
}

// Main search with preview rendering. Exported as searchSongsWithPreview and aliased from searchSongs.
async function searchSongsWithPreview() {
  const searchInput = document.getElementById('songSearchInput');
  const query = (searchInput?.value || '').trim();
  if (!query) return;

  const resultsContainer = document.getElementById('songSearchResults');
  resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';

  try {
    // Attempt 1: use country + entity=song (most accurate)
    const mkParams = (opts) => new URLSearchParams({
      term: query,
      country: 'US',
      media: 'music',
      limit: '25',
      ...opts
    }).toString();

    const attempts = [
      `https://itunes.apple.com/search?${mkParams({ entity: 'song' })}`,
      // Fallback: drop entity filter (Apple sometimes 404s on narrow queries)
      `https://itunes.apple.com/search?${mkParams({})}`
    ];

    let data = null;
    let lastError = null;
    const errors = [];
    // More comprehensive mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(navigator.userAgent) ||
                    (window.innerWidth && window.innerWidth < 768);
    
    console.log('Device detection:', { 
      userAgent: navigator.userAgent, 
      isMobile, 
      width: window.innerWidth 
    });

    // On mobile, JSONP is most reliable (no CORS issues). Use ONLY JSONP on mobile.
    // On desktop, try proxy/direct fetch first, then JSONP as fallback.
    if (isMobile) {
      console.log('MOBILE MODE: Using JSONP only (proxy disabled on mobile)');
      // Mobile: Use JSONP only (most reliable, no CORS issues)
      // Try with entity=song first, then without entity filter if that fails
      const jsonpAttempts = [
        mkParams({ entity: 'song' }),
        mkParams({}) // Fallback without entity filter
      ];
      
      for (let i = 0; i < jsonpAttempts.length; i++) {
        const jsonpParams = jsonpAttempts[i];
        try {
          console.log(`Mobile: JSONP attempt ${i + 1}/${jsonpAttempts.length}...`);
          const urlBase = `https://itunes.apple.com/search?${jsonpParams}`;
          console.log('JSONP URL:', urlBase.substring(0, 100) + '...');
          data = await jsonpRequest(urlBase);
          console.log('Mobile: JSONP search successful!');
          break; // Success, exit loop
        } catch (e) {
          console.error(`Mobile: JSONP attempt ${i + 1} failed:`, e);
          errors.push(`JSONP attempt ${i + 1}: ${e.message}`);
          lastError = e;
          // Continue to next attempt
        }
      }
      
      // On mobile, NEVER try proxy - it's unreliable and causes the error
      // On mobile, if JSONP fails completely, try proxy as last resort
      // (even though it was failing before, it might work in some cases)
      if (!data && (typeof window !== 'undefined') && window.ITUNES_PROXY_URL) {
        try {
          console.log('Mobile: JSONP failed, trying proxy as last resort...');
          const proxyParams = mkParams({ entity: 'song' });
          data = await fetchViaProxy(proxyParams);
          console.log('Mobile: Proxy fallback successful!');
        } catch (e2) {
          console.error('Mobile: Proxy fallback also failed:', e2);
          errors.push(`Proxy fallback: ${e2.message}`);
          lastError = e2;
        }
      }
      
      if (!data) {
        console.error('Mobile: All search methods failed (JSONP and proxy).');
      }
    } else {
      console.log('DESKTOP MODE: Trying proxy/direct fetch first');
      // Desktop: Try proxy first, then direct fetch, then JSONP
      if ((typeof window !== 'undefined') && window.ITUNES_PROXY_URL) {
        try {
          console.log('Attempting proxy search...');
          const proxyParams = mkParams({ entity: 'song' });
          data = await fetchViaProxy(proxyParams);
          console.log('Proxy search successful');
        } catch (e) {
          console.error('Proxy search failed:', e);
          errors.push(`Proxy: ${e.message}`);
          lastError = e;
        }
      }
      
      // If proxy failed or not configured, try direct fetch
      if (!data) {
        for (const url of attempts) {
          try {
            const response = await fetch(url, {
              mode: 'cors',
              headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const contentType = response.headers.get('content-type') || '';
            const isJsonLike = contentType.includes('application/json') || 
                              contentType.includes('text/javascript') ||
                              contentType.includes('application/javascript');
            
            if (isJsonLike) {
              data = await response.json();
              break;
            } else {
              const text = await response.text();
              if (text.trim().startsWith('{')) {
                data = JSON.parse(text);
                break;
              } else {
                throw new Error(`Expected JSON, got ${contentType}. Body starts: ${text.slice(0, 80)}`);
              }
            }
          } catch (e) {
            errors.push(`Direct fetch: ${e.message}`);
            lastError = e;
          }
        }
      }
      
      // If all else fails, try JSONP as last resort
      if (!data) {
        try {
          console.log('Attempting JSONP fallback...');
          const jsonpParams = mkParams({ entity: 'song' });
          const urlBase = `https://itunes.apple.com/search?${jsonpParams}`;
          data = await jsonpRequest(urlBase);
          console.log('JSONP search successful');
        } catch (e) {
          console.error('JSONP search failed:', e);
          errors.push(`JSONP: ${e.message}`);
          lastError = e;
        }
      }
    }

    if (!data) {
      const errorMsg = errors.length > 0 ? errors.join('; ') : 'Unknown search error';
      console.error('All search methods failed:', errorMsg);
      throw new Error(errorMsg);
    }

    if (data.results && data.results.length > 0) {
      resultsContainer.innerHTML = '';
      data.results.forEach(song => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        // Build inner layout with a preview button
        const hasPreview = Boolean(song.previewUrl);
        resultItem.innerHTML = `
          <img src="${song.artworkUrl60}" alt="${song.trackName}" class="search-result-artwork"
               onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23ddd%22 width=%2260%22 height=%2260%22/%3E%3C/svg%3E'">
          <div class="search-result-info" style="display:flex;gap:12px;align-items:center;">
            <div style="flex:1;min-width:0;cursor:pointer;" class="search-result-click">
              <div class="search-result-track">${song.trackName}</div>
              <div class="search-result-artist">${song.artistName}</div>
              <div class="search-result-album">${song.collectionName}</div>
            </div>
            ${hasPreview ? `<button class="preview-btn" data-url="${song.previewUrl}" title="Play preview" style="width:40px;height:40px;border:none;border-radius:50%;background:#1a9e8e;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
              ${getPlayIcon()}
            </button>` : ''}
          </div>
        `;
        // Click on text area selects the song
        resultItem.querySelector('.search-result-click').onclick = () => selectSong(song);
        // Preview button
        const previewBtn = resultItem.querySelector('.preview-btn');
        if (hasPreview) {
          previewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            previewSong(previewBtn.getAttribute('data-url'), previewBtn);
          });
        }
        resultsContainer.appendChild(resultItem);
      });
    } else {
      resultsContainer.innerHTML = '<div class="search-no-results">No results found. Try a different search.</div>';
    }
  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error.message || 'Unknown error';
    console.log('Error message details:', { errorMessage, fullError: error });
    
    // Detect device type for error message
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(navigator.userAgent) ||
                    (window.innerWidth && window.innerWidth < 768);
    
    // Build detailed error message for debugging
    let debugInfo = [];
    debugInfo.push(`Device: ${isMobile ? 'Mobile' : 'Desktop'}`);
    debugInfo.push(`Method: ${errorMessage.includes('JSONP') ? 'JSONP' : errorMessage.includes('Proxy') ? 'Proxy' : 'Direct Fetch'}`);
    debugInfo.push(`Error: ${errorMessage}`);
    
    // Provide more helpful error message based on error type
    // Check for JSONP errors first (mobile), then proxy errors (desktop)
    let userMessage = 'Error searching. Please try again, or use "Link" to paste a song URL.';
    let errorDetails = '';
    
    if (errorMessage.includes('JSONP')) {
      // JSONP-specific errors (mobile)
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        userMessage = 'Search timed out (20 seconds).';
        errorDetails = 'The search request took too long. This might be due to a slow connection or the iTunes API being slow.';
      } else if (errorMessage.includes('script error') || errorMessage.includes('JSONP script error')) {
        userMessage = 'JSONP script error occurred.';
        errorDetails = 'The search script failed to load. This could be due to network issues, ad blockers, or content security policies.';
      } else {
        userMessage = 'JSONP search failed.';
        errorDetails = `JSONP error: ${errorMessage}`;
      }
    } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      userMessage = 'Search timed out.';
      errorDetails = 'The search request took too long.';
    } else if (errorMessage.includes('Network error') || errorMessage.includes('Could not reach')) {
      userMessage = 'Network error.';
      errorDetails = 'Could not reach the search service. Please check your internet connection.';
    } else if (errorMessage.includes('Proxy') && !errorMessage.includes('JSONP')) {
      // Only show proxy error if it's NOT a JSONP error (shouldn't happen on mobile)
      userMessage = 'Proxy service error.';
      errorDetails = `Proxy error: ${errorMessage}`;
    } else {
      userMessage = 'Search failed.';
      errorDetails = `Error: ${errorMessage}`;
    }
    
    // Display detailed error information
    const errorHtml = `
      <div class="search-no-results" style="padding: 20px;">
        <div style="font-weight: 600; margin-bottom: 12px; color: #d32f2f;">${userMessage}</div>
        <div style="font-size: 13px; color: #666; margin-bottom: 12px; line-height: 1.5;">
          ${errorDetails}
        </div>
        <div style="font-size: 12px; color: #999; margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 4px; font-family: monospace; word-break: break-all;">
          <strong>Debug Info:</strong><br>
          ${debugInfo.join('<br>')}
        </div>
        <div style="font-size: 13px; color: #666;">
          <strong>Options:</strong><br>
          • Try searching again<br>
          • Use the "Link" button to paste a song URL directly<br>
          • Check your internet connection
        </div>
      </div>
    `;
    
    resultsContainer.innerHTML = errorHtml;
  }
}

function selectSong(song) {
  stopPreview();
  if (!currentSongInputId) { closeSongSearch(); return; }
  const input = document.getElementById(currentSongInputId);
  if (!input) { closeSongSearch(); return; }
  const playlistEl = document.getElementById(`${currentSongInputId}_playlist`);
  // Check if playlist exists - if so, don't allow adding songs
  if (playlistEl && playlistEl.value.trim()) {
    alert('Please remove the playlist link before adding individual songs.');
    return;
  }
  const max = parseInt(input.getAttribute('data-max') || '1', 10);
  let items = [];
  try { items = JSON.parse(input.value || '[]'); if (!Array.isArray(items)) items = []; } catch { items = []; }
  if (items.length >= max) { alert(`You can add up to ${max} song(s) in this section.`); return; }
  // Store full song object with metadata
  const songObj = {
    type: 'search',
    trackName: song.trackName,
    artistName: song.artistName,
    artworkUrl: song.artworkUrl60 || song.artworkUrl100 || '',
    previewUrl: song.previewUrl || '',
    displayText: `${song.trackName} - ${song.artistName}`
  };
  items.push(songObj);
  input.value = JSON.stringify(items);
  updateSongUI(currentSongInputId, items, max);
  saveEventDetails(currentEventId);
  if (typeof updateStatusBadgeDisplay === 'function') {
    try { updateStatusBadgeDisplay(currentSongInputId, events.find(e => e.id === currentEventId)); } catch(_) {}
  }
  closeSongSearch();
}

// Play/pause 30s preview. Only one preview plays at a time.
function previewSong(url, btn) {
  if (!url) return;
  // If clicking the same button while playing, toggle pause
  if (previewAudio && !previewAudio.paused && currentPreviewBtn === btn) {
    previewAudio.pause();
    btn.innerHTML = getPlayIcon();
    return;
  }
  // Stop previous
  if (previewAudio) {
    try { previewAudio.pause(); } catch(_) {}
    if (currentPreviewBtn) currentPreviewBtn.innerHTML = getPlayIcon();
  }
  previewAudio = new Audio(url);
  currentPreviewBtn = btn;
  btn.innerHTML = getPauseIcon();
  previewAudio.play().catch(() => {
    btn.innerHTML = getPlayIcon();
  });
  previewAudio.onended = () => {
    if (currentPreviewBtn) currentPreviewBtn.innerHTML = getPlayIcon();
    previewAudio = null;
    currentPreviewBtn = null;
  };
}

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
        // Searched song - show artwork and preview button
        const artworkUrl = songObj.artworkUrl || '';
        const previewUrl = songObj.previewUrl || '';
        const displayText = songObj.displayText || `${songObj.trackName || ''} - ${songObj.artistName || ''}`;
        chipsHtml += `
          <div class="song-chip">
            ${artworkUrl ? `<img src="${artworkUrl}" alt="Album cover" class="song-artwork" onerror="this.style.display='none';">` : ''}
            <span class="song-text" style="flex: 1; ${!artworkUrl ? 'margin-left: 0;' : ''}">${displayText}</span>
            ${previewUrl ? `<button class="song-preview-btn" data-url="${previewUrl}" title="Play preview" style="width: 32px; height: 32px; border: none; border-radius: 50%; background: #1a9e8e; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 8px;">${getPlayIcon()}</button>` : ''}
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
    
    // Attach preview button handlers
    listEl.querySelectorAll('.song-preview-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-url');
        if (url) previewSong(url, btn);
      });
    });
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
  const input = document.getElementById('songSearchInput');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchSongsWithPreview();
    });
  }
  const modal = document.getElementById('songSearchModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'songSearchModal') closeSongSearch();
    });
    // Also stop preview when modal visibility changes
    stopPreviewOnModalClose();
  }
  // Ensure global alias exists for onclicks
  window.searchSongsWithPreview = searchSongsWithPreview;
  window.searchSongs = searchSongsWithPreview; // fallback for legacy markup
  window.closeSongSearch = closeSongSearch; // Make sure close function is global
  window.stopPreview = stopPreview; // Make stopPreview global too
})();
