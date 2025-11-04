// Management Dashboard JavaScript

// Pipeline stages
const PIPELINE_STAGES = {
    SIGNATURE: 'Signature',
    DEPOSIT: 'Deposit',
    ONBOARDING: 'Onboarding',
    PLANNING: 'Planning'
};

// Store errors persistently for debugging
function logPersistentError(error) {
    const errorData = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        supabaseError: error.supabaseError ? {
            code: error.supabaseError.code,
            message: error.supabaseError.message,
            details: error.supabaseError.details,
            hint: error.supabaseError.hint
        } : null
    };
    
    // Store in localStorage
    try {
        const existingErrors = JSON.parse(localStorage.getItem('management_errors') || '[]');
        existingErrors.push(errorData);
        // Keep only last 5 errors
        if (existingErrors.length > 5) {
            existingErrors.shift();
        }
        localStorage.setItem('management_errors', JSON.stringify(existingErrors));
    } catch (e) {
        console.error('Could not store error in localStorage:', e);
    }
    
    // Also log to console with clear markers
    console.error('🔴 PERSISTENT ERROR LOGGED:', errorData);
}

// Display any previous errors on page load
function checkPreviousErrors() {
    try {
        const errors = JSON.parse(localStorage.getItem('management_errors') || '[]');
        if (errors.length > 0) {
            console.group('⚠️ Previous Errors (from localStorage)');
            errors.forEach((error, index) => {
                console.error(`Error ${index + 1} (${error.timestamp}):`, error);
            });
            console.groupEnd();
        }
    } catch (e) {
        console.error('Could not read previous errors:', e);
    }
}

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    // Check for previous errors
    checkPreviousErrors();
    
    // Set up global error handler
    window.addEventListener('error', (event) => {
        console.error('Global error caught:', event.error);
        if (event.error) {
            logPersistentError(event.error);
        }
    });
    
    // Set up unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        if (event.reason) {
            logPersistentError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
        }
    });
    
    // Set up form handler to prevent default submission
    const form = document.getElementById('createEventForm');
    const submitBtn = document.getElementById('createEventSubmitBtn');
    
    if (form) {
        // Add click handler to submit button as backup
        if (submitBtn) {
            submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {} };
                createEvent(fakeEvent);
                return false;
            });
        }
        
        // Also add form submit handler
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            createEvent(e);
            return false;
        }, true); // Use capture phase
    }
    
    // Wait for Supabase to initialize
    const checkSupabase = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(checkSupabase);
            loadAllEvents();
        }
    }, 100);
    
    // Stop checking after 10 seconds
    setTimeout(() => {
        clearInterval(checkSupabase);
        if (!window.supabaseClient) {
            console.error('Supabase not initialized');
            const tbody = document.getElementById('eventsTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" class="error">Error: Could not connect to database. Please refresh the page.</td></tr>';
            }
        }
    }, 10000);
});

// Store all clients for filtering
let allClientsData = [];

// Load all events from database
async function loadAllEvents() {
    const tbody = document.getElementById('eventsTableBody');
    tbody.innerHTML = '<tr><td colspan="9" class="loading">Loading events...</td></tr>';
    
    try {
        const clients = await window.supabaseHelpers.getAllClients();
        
        if (!clients || clients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="no-events">No events found. Create your first event to get started!</td></tr>';
            allClientsData = [];
            return;
        }
        
        // Fetch planning completion for each client
        const eventsWithProgress = await Promise.all(
            clients.map(async (client) => {
                const planningProgress = await calculatePlanningProgress(client.id);
                return {
                    ...client,
                    planningProgress
                };
            })
        );
        
        // Store all clients data for filtering
        allClientsData = eventsWithProgress;
        
        // Apply current filter
        filterEventsByStage();
    } catch (error) {
        console.error('Error loading events:', error);
        tbody.innerHTML = '<tr><td colspan="9" class="error">Error loading events. Please refresh the page.</td></tr>';
        allClientsData = [];
    }
}

// Determine event stage based on client data
function getEventStage(client) {
    // Check if archived
    if (client.archived === true) {
        return 'archive';
    }
    
    // Check if completed (event date is in the past)
    if (client.event_date) {
        const eventDate = new Date(client.event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (eventDate < today) {
            return 'completed';
        }
    }
    
    // Check signature status
    const hasSignature = client.signature && client.signature.trim() !== '';
    const hasDeposit = client.deposit_paid === true;
    
    if (hasSignature && hasDeposit) {
        return 'booked';
    } else if (hasSignature && !hasDeposit) {
        return 'awaiting-deposit';
    } else {
        return 'awaiting-signature';
    }
}

// Filter events by stage
function filterEventsByStage() {
    const tbody = document.getElementById('eventsTableBody');
    const filterValue = document.getElementById('stageFilter').value;
    
    if (!allClientsData || allClientsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-events">No events found.</td></tr>';
        return;
    }
    
    let filteredClients;
    
    if (filterValue === 'all') {
        // Show all non-archived events
        filteredClients = allClientsData.filter(client => !client.archived);
    } else if (filterValue === 'archive') {
        // Show only archived events
        filteredClients = allClientsData.filter(client => client.archived === true);
    } else {
        // Filter by stage
        filteredClients = allClientsData.filter(client => {
            // Exclude archived events unless we're viewing archive
            if (client.archived === true) {
                return false;
            }
            const stage = getEventStage(client);
            return stage === filterValue;
        });
    }
    
    if (filteredClients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-events">No events found for this filter.</td></tr>';
        return;
    }
        
        tbody.innerHTML = '';
    filteredClients.forEach(client => {
            const row = createEventRow(client);
            tbody.appendChild(row);
        });
}

// Calculate planning progress percentage based on events and general info completion
async function calculatePlanningProgress(clientId) {
    try {
        const events = await window.supabaseHelpers.getEvents(clientId);
        const generalInfo = await window.supabaseHelpers.getGeneralInfo(clientId);
        
        let totalItems = 0;
        let completedItems = 0;
        
        // Check general info completion (required fields: venue_name, venue_address, planner_name, planner_email)
        const generalInfoFields = ['venue_name', 'venue_address', 'planner_name', 'planner_email'];
        generalInfoFields.forEach(field => {
            totalItems++;
            if (generalInfo && generalInfo[field] && typeof generalInfo[field] === 'string' && generalInfo[field].trim().length > 0) {
                completedItems++;
            }
        });
        
        // Check for conditional ceremony venue fields
        if (generalInfo && generalInfo.different_ceremony_venue === true) {
            totalItems += 2;
            if (generalInfo.ceremony_venue_name && generalInfo.ceremony_venue_name.trim().length > 0) {
                completedItems++;
            }
            if (generalInfo.ceremony_venue_address && generalInfo.ceremony_venue_address.trim().length > 0) {
                completedItems++;
            }
        }
        
        // Check events completion - simplified check for events with time set
        // (More accurate calculation would require full event details parsing)
        if (!events || events.length === 0) {
            // No events means no planning progress yet
            if (totalItems === 0) return 0;
            return Math.round((completedItems / totalItems) * 100);
        }
        
        events.forEach(event => {
            totalItems++;
            // Check if event has time set (basic completion indicator)
            if (event.time && event.time.trim() !== '') {
                completedItems++;
            }
        });
        
        if (totalItems === 0) return 0;
        return Math.round((completedItems / totalItems) * 100);
    } catch (error) {
        console.error('Error calculating planning progress:', error);
        return 0;
    }
}

// Create a table row for an event
function createEventRow(client) {
    const row = document.createElement('tr');
    
    // Event name (format based on event type)
    const eventName = formatEventName(client.client_name, client.fiance_name, client.event_name, client.event_type);
    
    // Format event date
    const eventDate = client.event_date ? formatDate(client.event_date) : 'N/A';
    
    // Format event type
    const eventType = client.event_type || 'N/A';
    
    // Calculate balances and format currency
    const totalBalance = parseFloat(client.total_balance) || 0;
    const depositAmount = parseFloat(client.deposit_amount) || 0;
    // Only subtract deposit if it's been paid
    const remainingBalance = client.deposit_paid === true ? totalBalance - depositAmount : totalBalance;
    const formattedTotalBalance = formatCurrency(totalBalance);
    const formattedDepositAmount = formatCurrency(depositAmount);
    const formattedRemainingBalance = formatCurrency(remainingBalance);
    
    // Determine deposit status for styling
    const depositPaid = client.deposit_paid === true;
    const depositClass = depositPaid ? 'deposit-paid' : 'deposit-unpaid';
    
    // Pipeline stages
    const eventStage = getEventStage(client);
    const stageDisplay = formatStageDisplay(eventStage);
    const planningStage = getPlanningStage(client.planningProgress || 0);
    
    // Actions (link to planning page)
    const planningLink = `https://apps.signature-sl.com/Planning/?client_id=${client.id}`;
    
    // Escape event name for JavaScript string (handle quotes and special chars)
    const escapedEventName = eventName.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    const escapedClientId = escapeHtml(client.id);
    
    row.innerHTML = `
        <td class="event-name">
            <div class="event-name-container">
                <button class="btn-edit-name" onclick="openEditEventModal('${escapedClientId}')" title="Edit event">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
                <span class="event-name-text">${escapeHtml(eventName)}</span>
            </div>
        </td>
        <td>${eventDate}</td>
        <td>${escapeHtml(eventType)}</td>
        <td class="stage">${escapeHtml(stageDisplay)}</td>
        <td>${planningStage}</td>
        <td class="full-balance">${escapeHtml(formattedTotalBalance)}</td>
        <td class="deposit-amount ${depositClass}">${escapeHtml(formattedDepositAmount)}</td>
        <td class="remaining-balance">${escapeHtml(formattedRemainingBalance)}</td>
        <td class="actions">
            <a href="${planningLink}" target="_blank" class="btn-link" title="View Planning">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
            </a>
            <button class="btn-export" onclick="exportTimeline('${escapedClientId}', '${escapedEventName}')" title="Export timeline PDF">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor">
                    <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                </svg>
            </button>
            <button class="btn-delete" onclick="deleteClient('${escapedClientId}', '${escapedEventName}')" title="Delete event">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
            </button>
        </td>
    `;
    
    return row;
}

// Format event name based on event type
function formatEventName(clientName, fianceName, eventName = null, eventType = null) {
    // For Wedding events, always show "Client & Fiance" format
    if (eventType && eventType.toLowerCase() === 'wedding') {
        if (clientName && fianceName) {
            return `${clientName} & ${fianceName}`;
        } else if (clientName) {
            return clientName;
        } else if (fianceName) {
            return fianceName;
        } else {
            return 'Unnamed Event';
        }
    }
    
    // For non-wedding events, use custom event_name if provided
    if (eventName && eventName.trim()) {
        return eventName.trim();
    }
    
    // Fallback: generate from client names if no event_name
    if (clientName && fianceName) {
        return `${clientName} & ${fianceName}`;
    } else if (clientName) {
        return clientName;
    } else if (fianceName) {
        return fianceName;
    } else {
        return 'Unnamed Event';
    }
}

// Format date from YYYY-MM-DD to readable format (single line)
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Format currency amount
function formatCurrency(amount) {
    if (isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Get signature stage indicator (clickable)
function getSignatureStage(client) {
    const isComplete = client.signature && client.signature.trim() !== '';
    const statusClass = isComplete ? 'stage-complete' : 'stage-incomplete';
    const icon = isComplete ? '✓' : '✗';
    const escapedId = escapeHtml(client.id);
    return `<button class="stage-toggle ${statusClass}" onclick="toggleSignature('${escapedId}')" title="Click to ${isComplete ? 'mark as not signed' : 'mark as signed'}">${icon}</button>`;
}

// Get deposit stage indicator (clickable)
function getDepositStage(client) {
    const isComplete = client.deposit_paid === true;
    const statusClass = isComplete ? 'stage-complete' : 'stage-incomplete';
    const icon = isComplete ? '✓' : '✗';
    const escapedId = escapeHtml(client.id);
    return `<button class="stage-toggle ${statusClass}" onclick="toggleDeposit('${escapedId}')" title="Click to ${isComplete ? 'mark as not paid' : 'mark as paid'}">${icon}</button>`;
}

// Get onboarding stage indicator
function getOnboardingStage(client) {
    if (client.onboarding_completed === true) {
        return '<span class="stage-complete">✓</span>';
    } else {
        return '<span class="stage-incomplete">✗</span>';
    }
}

// Get planning stage indicator with percentage (just percentage, no icons)
function getPlanningStage(percentage) {
    return `${percentage}%`;
}

// Format stage display text
function formatStageDisplay(stage) {
    if (!stage) return 'N/A';
    const stageMap = {
        'booked': 'Booked',
        'awaiting-deposit': 'Deposit',
        'awaiting-signature': 'Signature',
        'completed': 'Completed',
        'archive': 'Archive'
    };
    return stageMap[stage] || stage.charAt(0).toUpperCase() + stage.slice(1).replace(/-/g, ' ');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Open create event modal
function openCreateEventModal() {
    const modal = document.getElementById('createEventModal');
    modal.classList.add('active');
    // Reset form and clear errors
    document.getElementById('createEventForm').reset();
    hideErrorMessage();
}

// Close create event modal
function closeCreateEventModal() {
    const modal = document.getElementById('createEventModal');
    modal.classList.remove('active');
}

// Open edit event modal
async function openEditEventModal(clientId) {
    const modal = document.getElementById('editEventModal');
    hideEditErrorMessage();
    
    try {
        // Fetch client data
        const { data: client, error } = await window.supabaseClient
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();
        
        if (error) throw error;
        if (!client) {
            showEditErrorMessage('Event not found.');
            return;
        }
        
        // Populate form with client data
        document.getElementById('editClientId').value = client.id;
        document.getElementById('editEventType').value = client.event_type || '';
        document.getElementById('editEventName').value = client.event_name || '';
        document.getElementById('editClientName').value = client.client_name || '';
        document.getElementById('editFianceName').value = client.fiance_name || '';
        document.getElementById('editClientPhone').value = client.client_phone || '';
        document.getElementById('editClientAddress').value = client.client_address || '';
        document.getElementById('editEventDate').value = client.event_date || '';
        document.getElementById('editVenueName').value = client.venue_name || '';
        document.getElementById('editVenueAddress').value = client.venue_address || '';
        document.getElementById('editServices').value = client.services || '';
        document.getElementById('editDepositAmount').value = client.deposit_amount || '';
        document.getElementById('editTotalBalance').value = client.total_balance || '';
        
        // Populate signature and deposit checkboxes
        const hasSignature = client.signature && client.signature.trim() !== '';
        document.getElementById('editSignature').checked = hasSignature;
        document.getElementById('editDepositPaid').checked = client.deposit_paid === true;
        
        // Update deposit status color and remaining balance
        updateDepositStatusColor();
        updateRemainingBalance();
        
        // Open modal
        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading event data:', error);
        showEditErrorMessage('Failed to load event data. Please try again.');
    }
}

// Close edit event modal
function closeEditEventModal() {
    const modal = document.getElementById('editEventModal');
    modal.classList.remove('active');
    document.getElementById('editEventForm').reset();
    hideEditErrorMessage();
}

// Show error message in edit modal
function showEditErrorMessage(message) {
    const errorDiv = document.getElementById('editErrorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Hide error message in edit modal
function hideEditErrorMessage() {
    const errorDiv = document.getElementById('editErrorMessage');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
}

// Update event
async function updateEvent(event) {
    // Prevent form submission and page refresh
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('🔵 updateEvent called', { event });
    
    // Clear any previous errors
    hideEditErrorMessage();
    
    const form = document.getElementById('editEventForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Get form values
    const clientId = document.getElementById('editClientId').value;
    const eventType = document.getElementById('editEventType').value.trim();
    const eventName = document.getElementById('editEventName').value.trim();
    const clientName = document.getElementById('editClientName').value.trim();
    const fianceName = document.getElementById('editFianceName').value.trim();
    const clientPhone = document.getElementById('editClientPhone').value.trim();
    const clientAddress = document.getElementById('editClientAddress').value.trim();
    const eventDate = document.getElementById('editEventDate').value;
    const venueName = document.getElementById('editVenueName').value.trim();
    const venueAddress = document.getElementById('editVenueAddress').value.trim();
    const services = document.getElementById('editServices').value.trim();
    const depositAmount = parseFloat(document.getElementById('editDepositAmount').value);
    const totalBalance = parseFloat(document.getElementById('editTotalBalance').value);
    
    // Validate
    if (!clientId || !eventType || !clientName || !eventDate || !services || isNaN(depositAmount) || isNaN(totalBalance)) {
        showEditErrorMessage('Please fill in all required fields with valid values.');
        return;
    }
    
    if (depositAmount < 0 || totalBalance < 0) {
        showEditErrorMessage('Amounts cannot be negative.');
        return;
    }
    
    if (depositAmount > totalBalance) {
        showEditErrorMessage('Deposit amount cannot be greater than total balance.');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
    try {
        console.log('Starting event update...');
        console.log('Form values:', { clientId, eventType, clientName, fianceName, clientPhone, clientAddress, eventDate, venueName, venueAddress, services, depositAmount, totalBalance });
        
        // Get signature and deposit status
        const signatureChecked = document.getElementById('editSignature').checked;
        const depositPaidChecked = document.getElementById('editDepositPaid').checked;
        
        // Update client data object
        const clientData = {
            event_type: eventType,
            event_name: eventName || null, // Custom event name (optional)
            client_name: clientName,
            fiance_name: fianceName || null,
            client_phone: clientPhone || null,
            client_address: clientAddress || null,
            event_date: eventDate,
            venue_name: venueName || null,
            venue_address: venueAddress || null,
            services: services,
            deposit_amount: depositAmount,
            total_balance: totalBalance,
            signature: signatureChecked ? 'completed' : '',
            deposit_paid: depositPaidChecked
        };
        
        console.log('Client data to be updated:', clientData);
        
        // Check if Supabase is initialized
        if (!window.supabaseClient) {
            throw new Error('Database connection not available. Please refresh the page and try again.');
        }
        
        // Update client in database
        const { error } = await window.supabaseClient
            .from('clients')
            .update(clientData)
            .eq('id', clientId);
        
        if (error) {
            console.error('Error updating client:', error);
            throw error;
        }
        
        console.log('✅ Event updated successfully');
        
        // Close modal and reload events
        closeEditEventModal();
        await loadAllEvents();
        
        // Show success message (optional - could add a toast notification)
        alert('Event updated successfully!');
        
    } catch (error) {
        console.error('Error updating event:', error);
        showEditErrorMessage(error.message || 'Failed to update event. Please try again.');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Update remaining balance display in edit modal
function updateRemainingBalance() {
    const totalBalance = parseFloat(document.getElementById('editTotalBalance').value) || 0;
    const depositAmount = parseFloat(document.getElementById('editDepositAmount').value) || 0;
    const depositPaid = document.getElementById('editDepositPaid').checked;
    
    // Only subtract deposit if it's been paid
    const remainingBalance = depositPaid ? totalBalance - depositAmount : totalBalance;
    const formatted = formatCurrency(remainingBalance);
    
    const display = document.getElementById('remainingBalanceDisplay');
    if (display) {
        display.textContent = formatted;
    }
}

// Update deposit status color based on checkbox state
function updateDepositStatusColor() {
    const checkbox = document.getElementById('editDepositPaid');
    const label = document.getElementById('depositCheckboxLabel');
    
    if (checkbox && label) {
        if (checkbox.checked) {
            label.style.color = '#28a745'; // Green
            label.style.fontWeight = '600';
        } else {
            label.style.color = '#dc3545'; // Red
            label.style.fontWeight = '500';
        }
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const createModal = document.getElementById('createEventModal');
    const editModal = document.getElementById('editEventModal');
    if (e.target === createModal) {
        closeCreateEventModal();
    }
    if (e.target === editModal) {
        closeEditEventModal();
    }
});

// Show error message in modal
function showErrorMessage(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        // Scroll to error message
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Hide error message
function hideErrorMessage() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
}

// Create new event
async function createEvent(event) {
    // Prevent form submission and page refresh
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('🔵 createEvent called', { event });
    
    // Clear any previous errors
    hideErrorMessage();
    
    const form = document.getElementById('createEventForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Get form values
    const eventType = document.getElementById('eventType').value.trim();
    const eventName = document.getElementById('eventName').value.trim();
    const clientName = document.getElementById('eventClientName').value.trim();
    const fianceName = document.getElementById('eventFianceName').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    const services = document.getElementById('eventServices').value.trim();
    const depositAmount = parseFloat(document.getElementById('eventDepositAmount').value);
    const totalBalance = parseFloat(document.getElementById('eventTotalBalance').value);
    
    // Validate
    if (!eventType || !clientName || !eventDate || !services || isNaN(depositAmount) || isNaN(totalBalance)) {
        showErrorMessage('Please fill in all required fields with valid values.');
        return;
    }
    
    if (depositAmount < 0 || totalBalance < 0) {
        showErrorMessage('Amounts cannot be negative.');
        return;
    }
    
    if (depositAmount > totalBalance) {
        showErrorMessage('Deposit amount cannot be greater than total balance.');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    
    try {
        console.log('Starting event creation...');
        console.log('Form values:', { eventType, clientName, fianceName, eventDate, services, depositAmount, totalBalance });
        
        // Create client data object
        const clientData = {
            event_type: eventType,
            event_name: eventName || null, // Custom event name (optional)
            client_name: clientName,
            fiance_name: fianceName || null,
            event_date: eventDate,
            services: services,
            deposit_amount: depositAmount,
            total_balance: totalBalance,
            signature: null,
            signature_date: null,
            deposit_paid: false,
            payment_intent_id: null,
            onboarding_completed: false,
            archived: false
        };
        
        console.log('Client data to be inserted:', clientData);
        
        // Check if Supabase is initialized
        if (!window.supabaseClient) {
            throw new Error('Database connection not available. Please refresh the page and try again.');
        }
        
        // Create client in database
        const newClient = await window.supabaseHelpers.createClient(clientData);
        
        console.log('createClient returned:', newClient);
        
        if (!newClient) {
            throw new Error('Failed to create event. No data returned from database.');
        }
        
        console.log('Event created successfully!', newClient);
        
        // Success
        closeCreateEventModal();
        
        // Reload events list
        loadAllEvents();
    } catch (error) {
        // Log error persistently so it survives page refresh
        logPersistentError(error);
        
        console.error('🔴 === ERROR CREATING EVENT ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        if (error.supabaseError) {
            console.error('Supabase error details:', error.supabaseError);
            console.error('Supabase error code:', error.supabaseError.code);
            console.error('Supabase error message:', error.supabaseError.message);
            console.error('Supabase error details:', error.supabaseError.details);
            console.error('Supabase error hint:', error.supabaseError.hint);
        }
        console.error('🔴 === END ERROR DETAILS ===');
        console.error('🔴 ERROR HAS BEEN LOGGED TO LOCALSTORAGE - Check console for details even after refresh');
        
        // Show error message in modal
        let errorMsg = error.message || 'An unknown error occurred. Please try again.';
        
        // Add more details if available
        if (error.supabaseError) {
            if (error.supabaseError.code === '23505') {
                errorMsg = 'This event may already exist. Please check the event list.';
            } else if (error.supabaseError.code === '23502') {
                errorMsg = 'Missing required field in database. Please contact support.';
            } else if (error.supabaseError.hint) {
                errorMsg += ' (' + error.supabaseError.hint + ')';
            }
            // Add full error message
            errorMsg = errorMsg + ' [Code: ' + error.supabaseError.code + ']';
        }
        
        showErrorMessage(errorMsg);
        
        // Also alert so user sees it even if modal closes
        alert('ERROR: ' + errorMsg + '\n\nFull error details are in the browser console.');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
    
    // Always return false to prevent form submission
    return false;
}

// Archive a client/event (exposed globally for onclick handler)
async function deleteClient(clientId, eventName) {
    const confirmMessage = `Are you sure you want to archive "${eventName}"?\n\nThis will move the event to the archive. You can view archived events using the filter dropdown.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        console.log('Archiving client:', clientId);
        
        if (!window.supabaseClient) {
            throw new Error('Database connection not available.');
        }
        
        // Archive the client instead of deleting
        const { error } = await window.supabaseClient
            .from('clients')
            .update({ archived: true })
            .eq('id', clientId);
        
        if (error) {
            console.error('Error archiving client:', error);
            throw new Error(`Failed to archive event: ${error.message}`);
        }
        
        console.log('Client archived successfully');
        
        // Reload events list
        await loadAllEvents();
    } catch (error) {
        console.error('Error deleting client:', error);
        alert('Error deleting event: ' + (error.message || 'Please try again.'));
    }
}

// Toggle signature status
async function toggleSignature(clientId) {
    try {
        // Get current client data
        const client = await window.supabaseHelpers.getClientData(clientId);
        if (!client) {
            throw new Error('Could not fetch client data');
        }
        
        // Determine new signature status
        const hasSignature = client.signature && client.signature.trim() !== '';
        let updateData;
        
        if (hasSignature) {
            // Clear signature
            updateData = {
                signature: null,
                signature_date: null
            };
        } else {
            // Mark as signed (set signature to "Signed" and current date)
            updateData = {
                signature: 'Signed',
                signature_date: new Date().toISOString()
            };
        }
        
        // Update in database
        const success = await window.supabaseHelpers.updateClient(clientId, updateData);
        
        if (!success) {
            throw new Error('Failed to update signature status');
        }
        
        // Reload events list to show updated status
        loadAllEvents();
    } catch (error) {
        console.error('Error toggling signature:', error);
        alert('Error updating signature status: ' + (error.message || 'Please try again.'));
    }
}

// Toggle deposit paid status
async function toggleDeposit(clientId) {
    try {
        // Get current client data
        const client = await window.supabaseHelpers.getClientData(clientId);
        if (!client) {
            throw new Error('Could not fetch client data');
        }
        
        // Toggle deposit_paid status
        const updateData = {
            deposit_paid: !client.deposit_paid
        };
        
        // Update in database
        const success = await window.supabaseHelpers.updateClient(clientId, updateData);
        
        if (!success) {
            throw new Error('Failed to update deposit status');
        }
        
        // Reload events list to show updated status
        loadAllEvents();
    } catch (error) {
        console.error('Error toggling deposit:', error);
        alert('Error updating deposit status: ' + (error.message || 'Please try again.'));
    }
}

// Export timeline PDF
async function exportTimeline(clientId, eventName) {
    try {
        // Check if jsPDF is loaded
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('PDF library not loaded. Please refresh the page and try again.');
        }
        
        // Fetch all necessary data
        const [clientData, events, generalInfo] = await Promise.all([
            window.supabaseHelpers.getClientData(clientId),
            window.supabaseHelpers.getEvents(clientId),
            window.supabaseHelpers.getGeneralInfo(clientId)
        ]);
        
        if (!clientData) {
            throw new Error('Could not fetch client data');
        }
        
        // Generate PDF (now async)
        await generateTimelinePDF(clientData, events || [], generalInfo);
    } catch (error) {
        console.error('Error exporting timeline:', error);
        alert('Error generating PDF: ' + (error.message || 'Please try again.'));
    }
}

// Generate the formatted PDF timeline
async function generateTimelinePDF(clientData, events, generalInfo) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin; // Start position
    const contentWidth = pageWidth - (margin * 2);
    
    // Color scheme (Signature Sound & Lighting teal)
    const primaryColor = [26, 158, 142]; // #1a9e8e
    const darkColor = [20, 128, 115];
    const lightGray = [245, 245, 245];
    const darkGray = [51, 51, 51];
    
    // Company logo URL
    const logoUrl = 'https://images.squarespace-cdn.com/content/v1/64909a307fc0025a2064d878/9b8fde02-b8f9-402b-be4c-366cb48134eb/Transparent+PNG+File.png';
    
    // Track logo height for spacing
    let logoHeight = 0;
    const logoSpacing = 10; // Space after logo
    
    // Add logo at the very top - use canvas to handle CORS properly
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.warn('Logo load timeout - continuing without logo');
                logoHeight = 0;
                resolve();
            }, 5000);
            
            img.onload = () => {
                clearTimeout(timeout);
                try {
                    // Draw image to canvas to get base64 data
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    const base64data = canvas.toDataURL('image/png');
                    const logoWidth = 60;
                    logoHeight = (img.height / img.width) * logoWidth;
                    const logoX = (pageWidth - logoWidth) / 2;
                    
                    // Add logo at top margin
                    doc.addImage(base64data, 'PNG', logoX, margin, logoWidth, logoHeight);
                    console.log('Logo added successfully at y:', margin, 'height:', logoHeight);
                    resolve();
                } catch (e) {
                    console.warn('Could not add logo to PDF:', e);
                    logoHeight = 0;
                    resolve();
                }
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                console.warn('Could not load logo image');
                logoHeight = 0;
                resolve();
            };
            
            img.src = logoUrl;
        });
    } catch (e) {
        console.warn('Error loading logo:', e);
        logoHeight = 0;
    }
    
    // Set yPosition to start BELOW the logo (or at margin if no logo)
    yPosition = margin + logoHeight + logoSpacing;
    
    // Helper function to add a new page if needed
    function checkPageBreak(requiredSpace = 20) {
        if (yPosition + requiredSpace > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
            return true;
        }
        return false;
    }
    
    // Helper to add text with wrapping
    function addText(text, x, y, options = {}) {
        const maxWidth = options.maxWidth || contentWidth;
        const fontSize = options.fontSize || 12;
        const align = options.align || 'left';
        doc.setFontSize(fontSize);
        doc.setTextColor(...(options.color || darkColor));
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y, { align });
        return lines.length * (fontSize * 0.35); // Approximate line height
    }
    
    // Header section - starts BELOW the logo (yPosition already adjusted)
    doc.setFillColor(...primaryColor);
    const headerHeight = 25;
    doc.rect(margin, yPosition, contentWidth, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    
    // Helper to extract first name from full name
    function getFirstName(fullName) {
        if (!fullName || typeof fullName !== 'string') return '';
        const parts = fullName.trim().split(/\s+/);
        return parts[0] || '';
    }
    
    const clientFirstName = getFirstName(clientData.client_name || '');
    const fianceFirstName = getFirstName(clientData.fiance_name || '');
    const displayName = fianceFirstName ? `${clientFirstName} & ${fianceFirstName}` : clientFirstName;
    
    doc.text('EVENT TIMELINE', margin + 5, yPosition + 15);
    doc.setFontSize(18);
    doc.text(displayName, margin + 5, yPosition + 23);
    
    // Move yPosition below header block
    yPosition += 35;
    
    // Event Date
    if (clientData.event_date) {
        const eventDate = formatDateForPDF(clientData.event_date);
        doc.setFontSize(14);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.text(`Event Date: ${eventDate}`, margin, yPosition);
        yPosition += 10;
    }
    
    // Services (below Event Date)
    if (clientData.services) {
        doc.setFontSize(10);
        doc.setTextColor(...darkGray);
        doc.setFont('helvetica', 'normal'); // Not bold
        yPosition += addText(`Services: ${clientData.services}`, margin, yPosition, { fontSize: 10 });
        yPosition += 5;
    }
    
    // Venue Information Section
    if (generalInfo) {
        checkPageBreak(30);
        doc.setFillColor(...lightGray);
        doc.rect(margin, yPosition, contentWidth, 8, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);
        doc.text('VENUE INFORMATION', margin + 2, yPosition + 6);
        yPosition += 12;
        
        let venueInfo = [];
        if (generalInfo.venue_name) venueInfo.push(`Venue: ${generalInfo.venue_name}`);
        if (generalInfo.venue_address) venueInfo.push(`Address: ${generalInfo.venue_address}`);
        if (generalInfo.different_ceremony_venue && generalInfo.ceremony_venue_name) {
            venueInfo.push(`Ceremony Venue: ${generalInfo.ceremony_venue_name}`);
            if (generalInfo.ceremony_venue_address) {
                venueInfo.push(`Ceremony Address: ${generalInfo.ceremony_venue_address}`);
            }
        }
        
        if (venueInfo.length > 0) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...darkGray);
            venueInfo.forEach(info => {
                checkPageBreak(6);
                yPosition += addText(info, margin + 2, yPosition, { fontSize: 10 });
                yPosition += 2;
            });
            yPosition += 3;
        }
    }
    
    // Planner Contact Section
    if (generalInfo && (generalInfo.planner_name || generalInfo.planner_email)) {
        checkPageBreak(20);
        doc.setFillColor(...lightGray);
        doc.rect(margin, yPosition, contentWidth, 8, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);
        doc.text('PLANNER CONTACT', margin + 2, yPosition + 6);
        yPosition += 12;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        if (generalInfo.planner_name) {
            yPosition += addText(`Name: ${generalInfo.planner_name}`, margin + 2, yPosition, { fontSize: 10 });
            yPosition += 2;
        }
        if (generalInfo.planner_email) {
            yPosition += addText(`Email: ${generalInfo.planner_email}`, margin + 2, yPosition, { fontSize: 10 });
            yPosition += 2;
        }
        yPosition += 3;
    }
    
    // Timeline Section
    checkPageBreak(20);
    yPosition += 5;
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('EVENT TIMELINE', margin + 2, yPosition + 6);
    yPosition += 15;
    
    // Events are already sorted by event_order from Supabase, maintain that order
    // Just ensure events without event_order are at the end
    const sortedEvents = [...events].sort((a, b) => {
        const aOrder = a.event_order !== null && a.event_order !== undefined ? a.event_order : 9999;
        const bOrder = b.event_order !== null && b.event_order !== undefined ? b.event_order : 9999;
        return aOrder - bOrder;
    });
    
    // Add each event to timeline
    sortedEvents.forEach((event, index) => {
        checkPageBreak(30);
        
        // Event header with time
        const eventTime = event.time ? formatTimeForPDF(event.time) : 'Time TBD';
        doc.setFillColor(...lightGray);
        doc.rect(margin, yPosition, contentWidth, 6, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);
        doc.text(`${eventTime} - ${event.name}`, margin + 2, yPosition + 4.5);
        yPosition += 8;
        
        // Add extra space between header and details
        yPosition += 5;
        
        // Event details - ensure it's an object and parse if needed
        let details = event.details || {};
        
        // If details is a string, try to parse it
        if (typeof details === 'string') {
            try {
                details = JSON.parse(details);
            } catch (e) {
                console.warn('Could not parse event details as JSON:', e);
                details = {};
            }
        }
        
        // Ensure details is an object
        if (typeof details !== 'object' || details === null) {
            details = {};
        }
        
        // Debug: Log event details to console for troubleshooting
        console.log(`Event: ${event.name} (${event.type})`, 'Details:', details);
        console.log('Keys in details:', Object.keys(details || {}));
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        
        // Add event-specific details (pass event object for ID references)
        const detailLines = formatEventDetails(event.type, details, event);
        
        detailLines.forEach(detail => {
            if (detail && detail.trim() && detail.trim() !== '(No additional details)') {
                checkPageBreak(5);
                yPosition += addText(detail, margin + 4, yPosition, { fontSize: 10, maxWidth: contentWidth - 8 });
                yPosition += 1;
            }
        });
        
        yPosition += 5; // Space between events
    });
    
    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Signature Sound & Lighting - Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }
    
    // Generate filename (use displayName already defined above)
    const filename = `Timeline_${displayName.replace(/[^a-zA-Z0-9]/g, '_')}_${clientData.event_date || 'Event'}.pdf`;
    
    // Save PDF
    doc.save(filename);
}

// Format date for PDF
function formatDateForPDF(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time for PDF
function formatTimeForPDF(timeString) {
    if (!timeString) return '';
    
    // Check if already in 12-hour format with AM/PM
    if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString.trim();
    }
    
    // Convert 24-hour to 12-hour format
    const [hours, minutes] = timeString.split(':');
    if (!hours || !minutes) return timeString;
    
    const hour = parseInt(hours, 10);
    if (isNaN(hour)) return timeString;
    
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

// Format event details based on event type
function formatEventDetails(eventType, details, event = null) {
    const lines = [];
    
    // Helper to add formatted song info (handles arrays and objects)
    function addSongLine(label, songData) {
        if (!songData) return;
        
        try {
            // Parse if string
            let parsed = typeof songData === 'string' ? JSON.parse(songData) : songData;
            
            // Handle array of songs (common format)
            if (Array.isArray(parsed)) {
                if (parsed.length > 0) {
                    parsed.forEach((song, idx) => {
                        if (song && song.trackName) {
                            const artist = song.artistName ? ` by ${song.artistName}` : '';
                            if (parsed.length > 1) {
                                lines.push(`${label} ${idx + 1}: ${song.trackName}${artist}`);
                            } else {
                                lines.push(`${label}: ${song.trackName}${artist}`);
                            }
                        } else if (song && song.type === 'link' && song.url) {
                            lines.push(`${label}: ${song.url}`);
                        }
                    });
                }
                return;
            }
            
            // Handle single song object
            if (parsed && typeof parsed === 'object') {
                if (parsed.trackName) {
                    const artist = parsed.artistName ? ` by ${parsed.artistName}` : '';
                    lines.push(`${label}: ${parsed.trackName}${artist}`);
                } else if (parsed.type === 'link' && parsed.url) {
                    lines.push(`${label}: ${parsed.url}`);
                }
                return;
            }
            
            // Fallback: treat as plain text
            if (typeof parsed === 'string' && parsed.trim()) {
                lines.push(`${label}: ${parsed}`);
            }
        } catch (e) {
            // If not JSON, treat as plain text
            if (typeof songData === 'string' && songData.trim()) {
                lines.push(`${label}: ${songData}`);
            }
        }
    }
    
    switch (eventType) {
        case 'ceremony':
            if (details.location) lines.push(`Location: ${details.location}`);
            if (details.arrivalMusicStyle) lines.push(`Arrival Music: ${details.arrivalMusicStyle}`);
            addSongLine('Processional', details.processionalSong);
            addSongLine('Grand Entrance', details.brideEntrance);
            if (details.hasSpecialActivity === 'yes' && details.specialActivityDetails) {
                lines.push(`Special Activity: ${details.specialActivityDetails}`);
            }
            // Special activity fields in order:
            // 1. Special Activity Type (if yes)
            if (details.hasSpecialActivity === 'yes' && details.specialActivityType) {
                lines.push(`Special Activity Type: ${details.specialActivityType}`);
            }
            // 2. Special Activity Song (yes/no)
            if (details.hasSpecialActivity === 'yes' && details.specialActivitySong) {
                lines.push(`Special Activity Song: ${details.specialActivitySong === 'yes' ? 'Yes' : 'No'}`);
            }
            // 3. Special Activity Song Title (actual song if yes)
            if (details.specialActivitySong === 'yes' && details.specialActivitySongTitle) {
                addSongLine('Special Activity Song', details.specialActivitySongTitle);
            }
            addSongLine('Recessional', details.recessionalSong);
            break;
            
        case 'intros':
            if (details.introOrder) {
                const order = typeof details.introOrder === 'string' ? JSON.parse(details.introOrder) : details.introOrder;
                if (Array.isArray(order) && order.length > 0) {
                    lines.push('Introduction Order:');
                    order.forEach((intro, idx) => {
                        const name = intro.name || `Person ${idx + 1}`;
                        const song = intro.song ? (typeof intro.song === 'string' ? JSON.parse(intro.song) : intro.song) : null;
                        if (song && song.trackName) {
                            lines.push(`  ${name}: ${song.trackName}${song.artistName ? ` by ${song.artistName}` : ''}`);
                        } else {
                            lines.push(`  ${name}`);
                        }
                    });
                }
            }
            break;
            
        case 'first-dance':
            addSongLine('Song', details.songChoice);
            const firstDanceDuration = event ? details[`danceDuration_${event.id}`] : null;
            const firstDanceDurationGeneric = details.danceDuration || firstDanceDuration;
            if (firstDanceDurationGeneric) {
                if (firstDanceDurationGeneric === 'part') {
                    if (details.startAt && details.endAt) {
                        lines.push(`Duration: ${details.startAt} - ${details.endAt}`);
                    }
                } else {
                    lines.push('Duration: Whole song');
                }
            }
            break;
            
        case 'special-dance-1':
        case 'special-dance-2':
            addSongLine('Song', details.songChoice);
            if (details.danceType) {
                const danceTypes = {
                    'father-daughter': 'Father-Daughter Dance',
                    'mother-son': 'Mother-Son Dance',
                    'other': details.otherDanceType || 'Other'
                };
                lines.push(`Dance Type: ${danceTypes[details.danceType] || details.danceType}`);
            }
            const specialDanceDuration = event ? details[`danceDuration_${event.id}`] : null;
            const specialDanceDurationGeneric = details.danceDuration || specialDanceDuration;
            if (specialDanceDurationGeneric === 'part') {
                if (details.startAt && details.endAt) {
                    lines.push(`Duration: ${details.startAt} - ${details.endAt}`);
                }
            }
            break;
            
        case 'private-last-dance':
        case 'last-group-dance':
            addSongLine('Song', details.songChoice);
            break;
            
        case 'blessing':
            if (details.speakerName) lines.push(`Speaker: ${details.speakerName}`);
            if (details.blessingSong) addSongLine('Song', details.blessingSong);
            break;
            
        case 'welcome':
            if (details.speakerName) lines.push(`Speaker: ${details.speakerName}`);
            if (details.welcomeSong) {
                addSongLine('Welcome Song', details.welcomeSong);
            }
            break;
            
        case 'toasts':
            if (details.speakerName) lines.push(`Speaker: ${details.speakerName}`);
            if (details.toastOrder) {
                try {
                    const toastOrder = typeof details.toastOrder === 'string' ? JSON.parse(details.toastOrder) : details.toastOrder;
                    if (Array.isArray(toastOrder) && toastOrder.length > 0) {
                        lines.push('Toast Order:');
                        toastOrder.forEach((toast, idx) => {
                            const name = toast.name || toast.speakerName || `Speaker ${idx + 1}`;
                            lines.push(`  ${idx + 1}. ${name}`);
                        });
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
            break;
            
        case 'shoe-game':
            if (Array.isArray(details.questions) && details.questions.length > 0) {
                lines.push('Questions:');
                details.questions.forEach((q, idx) => {
                    if (q && q.trim()) {
                        lines.push(`  ${idx + 1}. ${q}`);
                    }
                });
            }
            break;
            
        case 'open-dancing':
            if (details.startAt && details.endAt) {
                lines.push(`Duration: ${details.startAt} - ${details.endAt}`);
            }
            if (details.danceDuration) {
                lines.push(`Dance Duration: ${details.danceDuration}`);
            }
            if (details.lineDances && typeof details.lineDances === 'object') {
                const lineDanceEntries = Object.entries(details.lineDances);
                if (lineDanceEntries.length > 0) {
                    lines.push('Line Dances:');
                    lineDanceEntries.forEach(([dance, timing]) => {
                        lines.push(`  ${dance}: ${timing}`);
                    });
                }
            }
            break;
            
        case 'cocktail-hour':
            if (details.location) lines.push(`Location: ${details.location}`);
            if (details.musicChoice) {
                if (details.musicChoice === 'genre' && details.musicStyle) {
                    lines.push(`Music Style: ${details.musicStyle}`);
                } else if (details.musicChoice === 'playlist') {
                    addSongLine('Songs/Playlist', details.cocktailSongs);
                    if (details.cocktailSongs_playlist) {
                        lines.push(`Playlist Link: ${details.cocktailSongs_playlist}`);
                    }
                } else if (details.musicChoice === 'dj') {
                    lines.push('Music: DJ\'s choice');
                }
            } else if (details.musicStyle) {
                // Fallback for old data format
                lines.push(`Music Style: ${details.musicStyle}`);
            }
            break;
            
        case 'dinner':
            if (details.serviceStyle) lines.push(`Service Style: ${details.serviceStyle}`);
            if (details.musicStyle) lines.push(`Music Style: ${details.musicStyle}`);
            break;
            
        case 'cake-cutting':
            if (details.songChoice) {
                addSongLine('Song', details.songChoice);
            }
            if (details.location) lines.push(`Location: ${details.location}`);
            break;
            
        case 'photo-dash':
            if (details.songChoice) {
                addSongLine('Song', details.songChoice);
            }
            break;
            
        case 'grand-exit':
            if (details.songChoice) {
                addSongLine('Song', details.songChoice);
            }
            if (details.exitType) lines.push(`Exit Type: ${details.exitType}`);
            break;
            
        case 'end-of-wedding':
            if (details.endTime) {
                lines.push(`End Time: ${formatTimeForPDF(details.endTime)}`);
            }
            break;
            
        default:
            // For any unhandled event types, try to show common fields
            if (details.songChoice) {
                addSongLine('Song', details.songChoice);
            }
            if (details.location) lines.push(`Location: ${details.location}`);
            if (details.musicStyle) lines.push(`Music Style: ${details.musicStyle}`);
            break;
    }
    
    // Add any other details (always check this last)
    if (details.otherDetails && details.otherDetails.trim()) {
        lines.push(`Notes: ${details.otherDetails}`);
    }
    
    // Fallback: Show any other detail fields that weren't handled above
    // This catches any fields we might have missed
    const handledFields = new Set([
        'location', 'arrivalMusicStyle', 'processionalSong', 'brideEntrance', 'recessionalSong',
        'hasSpecialActivity', 'specialActivityDetails', 'specialActivityType', 'specialActivitySongTitle',
        'introOrder', 'songChoice', 'danceType', 'otherDanceType', 'danceDuration', 'startAt', 'endAt',
        'speakerName', 'welcomeSong', 'blessingSong', 'toastOrder', 'questions', 'lineDances',
        'musicStyle', 'musicChoice', 'cocktailSongs', 'cocktailSongs_playlist', 'serviceStyle',
        'otherDetails', 'startTime', 'start_time', 'time' // Exclude time fields from display
    ]);
    
    // Also add event-specific duration fields
    if (event && event.id) {
        handledFields.add(`danceDuration_${event.id}`);
    }
    
    // Add any unhandled fields (but skip empty strings, empty arrays, and song JSON arrays)
    Object.keys(details).forEach(key => {
        if (!handledFields.has(key) && details[key] !== null && details[key] !== undefined && details[key] !== '') {
            const value = details[key];
            // Skip if it's an empty array or JSON array string of songs
            if (Array.isArray(value) && value.length === 0) return;
            if (typeof value === 'string' && value.trim().startsWith('[') && value.includes('trackName')) return;
            
            // Format the value nicely
            if (typeof value === 'string' && value.trim()) {
                lines.push(`${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: ${value}`);
            } else if (typeof value === 'boolean') {
                lines.push(`${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: ${value ? 'Yes' : 'No'}`);
            } else if (Array.isArray(value) && value.length > 0) {
                lines.push(`${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: ${value.join(', ')}`);
            }
        }
    });
    
    return lines.length > 0 ? lines : ['(No additional details)'];
}

// Expose functions globally for onclick handlers
window.deleteClient = deleteClient;
window.toggleSignature = toggleSignature;
window.toggleDeposit = toggleDeposit;
window.exportTimeline = exportTimeline;
window.filterEventsByStage = filterEventsByStage;

