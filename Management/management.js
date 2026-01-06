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
    const depositAmount = parseFloat(client.deposit_amount) || 0;
    // If deposit is $0, treat it as paid
    const hasDeposit = client.deposit_paid === true || depositAmount === 0;
    
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
    // If deposit is $0, treat it as paid (green)
    const depositPaid = client.deposit_paid === true || depositAmount === 0;
    const depositClass = depositPaid ? 'deposit-paid' : 'deposit-unpaid';
    
    // Determine remaining balance status for styling
    // If remaining balance is $0 or has been paid, show green
    const remainingBalancePaid = client.remaining_balance_paid === true || remainingBalance === 0;
    const remainingBalanceClass = remainingBalancePaid ? 'remaining-balance-paid' : 'remaining-balance-unpaid';
    
    // Pipeline stages
    const eventStage = getEventStage(client);
    const stageDisplay = formatStageDisplay(eventStage);
    const planningStage = getPlanningStage(client.planningProgress || 0);
    
    // Actions (link to planning page)
    const planningLink = `https://apps.signature-sl.com/Planning/?client_id=${client.id}`;
    
    // Check if contract is signed (has signature)
    const hasSignature = client.signature && client.signature.trim() !== '';
    
    // Escape event name for JavaScript string (handle quotes and special chars)
    const escapedEventName = eventName.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    const escapedClientId = escapeHtml(client.id);
    
    // Build actions HTML
    let actionsHTML = `
        <a href="${planningLink}" target="_blank" class="btn-link" title="View Planning">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
        </a>
        <button class="btn-export" onclick="exportTimeline('${escapedClientId}', '${escapedEventName}')" title="Export timeline PDF">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor">
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
            </svg>
        </button>`;
    
    // Add contract button if signature exists
    if (hasSignature) {
        actionsHTML += `
            <button class="btn-contract" onclick="viewContract('${escapedClientId}')" title="View Contract">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
            </button>`;
    }
    
    actionsHTML += `
        <button class="btn-delete" onclick="deleteClient('${escapedClientId}', '${escapedEventName}')" title="Delete event">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
        </button>`;
    
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
        <td class="remaining-balance ${remainingBalanceClass}">${escapeHtml(formattedRemainingBalance)}</td>
        <td class="actions">
            ${actionsHTML}
        </td>
    `;
    
    return row;
}

// Helper function to extract first name from full name
function getFirstName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return '';
    }
    // Split by space and take the first part
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || '';
}

// Format event name based on event type
function formatEventName(clientName, fianceName, eventName = null, eventType = null) {
    // For Wedding events, always show "First Name & First Name" format (first names only)
    if (eventType && eventType.toLowerCase() === 'wedding') {
        const clientFirstName = getFirstName(clientName);
        const fianceFirstName = getFirstName(fianceName);
        
        if (clientFirstName && fianceFirstName) {
            return `${clientFirstName} & ${fianceFirstName}`;
        } else if (clientFirstName) {
            return clientFirstName;
        } else if (fianceFirstName) {
            return fianceFirstName;
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
        // Ensure deposit amount is properly formatted (handle 0, null, undefined)
        const depositAmountValue = client.deposit_amount != null ? client.deposit_amount : '';
        document.getElementById('editDepositAmount').value = depositAmountValue;
        // Ensure total balance is properly formatted (handle 0, null, undefined)
        const totalBalanceValue = client.total_balance != null ? client.total_balance : '';
        document.getElementById('editTotalBalance').value = totalBalanceValue;
        
        // Populate signature and deposit checkboxes
        const hasSignature = client.signature && client.signature.trim() !== '';
        document.getElementById('editSignature').checked = hasSignature;
        
        // If deposit is $0, automatically mark as paid
        const depositAmount = parseFloat(client.deposit_amount) || 0;
        const depositPaid = client.deposit_paid === true || depositAmount === 0;
        document.getElementById('editDepositPaid').checked = depositPaid;
        
        // Populate remaining balance paid checkbox
        // If remaining balance is $0, automatically mark as paid
        const totalBalance = parseFloat(client.total_balance) || 0;
        const calculatedRemainingBalance = depositPaid ? totalBalance - depositAmount : totalBalance;
        const remainingBalancePaid = client.remaining_balance_paid === true || calculatedRemainingBalance === 0;
        document.getElementById('editRemainingBalancePaid').checked = remainingBalancePaid;
        
        // Update deposit status color and remaining balance
        updateDepositStatusColor();
        updateRemainingBalance();
        updateRemainingBalanceStatusColor();
        
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
    // Get and validate deposit amount - ensure we handle empty strings properly
    const depositAmountInput = document.getElementById('editDepositAmount').value.trim();
    const depositAmount = depositAmountInput !== '' ? parseFloat(depositAmountInput) : 0;
    // Get and validate total balance - ensure we handle empty strings properly
    const totalBalanceInput = document.getElementById('editTotalBalance').value.trim();
    const totalBalance = totalBalanceInput !== '' ? parseFloat(totalBalanceInput) : 0;
    
    // Validate
    if (!clientId || !eventType || !clientName || !eventDate || !services) {
        showEditErrorMessage('Please fill in all required fields.');
        return;
    }
    
    // Validate numeric fields
    if (isNaN(depositAmount) || depositAmount < 0) {
        showEditErrorMessage('Please enter a valid deposit amount (0 or greater).');
        return;
    }
    
    if (isNaN(totalBalance) || totalBalance < 0) {
        showEditErrorMessage('Please enter a valid total balance (0 or greater).');
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
        
        // Get signature, deposit, and remaining balance status
        const signatureChecked = document.getElementById('editSignature').checked;
        const depositPaidChecked = document.getElementById('editDepositPaid').checked;
        const remainingBalancePaidChecked = document.getElementById('editRemainingBalancePaid').checked;
        
        // If deposit is $0, automatically mark as paid (override checkbox)
        const finalDepositPaid = depositAmount === 0 ? true : depositPaidChecked;
        
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
            deposit_paid: finalDepositPaid,
            remaining_balance_paid: remainingBalancePaidChecked
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
    
    // If deposit is $0, treat it as paid automatically
    const isDepositPaid = depositPaid || depositAmount === 0;
    
    // Only subtract deposit if it's been paid
    const remainingBalance = isDepositPaid ? totalBalance - depositAmount : totalBalance;
    const formatted = formatCurrency(remainingBalance);
    
    const display = document.getElementById('remainingBalanceDisplay');
    if (display) {
        display.textContent = formatted;
    }
    
    // Auto-check deposit paid if deposit amount becomes $0
    if (depositAmount === 0 && !depositPaid) {
        document.getElementById('editDepositPaid').checked = true;
        updateDepositStatusColor();
    }
    
    // Auto-check remaining balance paid if remaining balance becomes $0
    const calculatedRemainingBalance = isDepositPaid ? totalBalance - depositAmount : totalBalance;
    if (calculatedRemainingBalance === 0) {
        const remainingBalanceCheckbox = document.getElementById('editRemainingBalancePaid');
        if (remainingBalanceCheckbox && !remainingBalanceCheckbox.checked) {
            remainingBalanceCheckbox.checked = true;
            updateRemainingBalanceStatusColor();
        }
    }
}

// Update deposit status color based on checkbox state
function updateDepositStatusColor() {
    const checkbox = document.getElementById('editDepositPaid');
    const label = document.getElementById('depositCheckboxLabel');
    const depositAmount = parseFloat(document.getElementById('editDepositAmount')?.value) || 0;
    
    if (checkbox && label) {
        // If deposit is $0 or checkbox is checked, show green
        const isPaid = checkbox.checked || depositAmount === 0;
        if (isPaid) {
            label.style.color = '#28a745'; // Green
            label.style.fontWeight = '600';
        } else {
            label.style.color = '#dc3545'; // Red
            label.style.fontWeight = '500';
        }
    }
}

// Update remaining balance status color based on checkbox state
function updateRemainingBalanceStatusColor() {
    const checkbox = document.getElementById('editRemainingBalancePaid');
    const label = document.getElementById('remainingBalanceCheckboxLabel');
    const remainingBalanceDisplay = document.getElementById('remainingBalanceDisplay');
    
    if (checkbox && label) {
        // Get remaining balance value from display
        const remainingBalanceText = remainingBalanceDisplay?.textContent || '$0.00';
        const remainingBalance = parseFloat(remainingBalanceText.replace(/[^0-9.-]/g, '')) || 0;
        
        // If remaining balance is $0 or checkbox is checked, show green
        const isPaid = checkbox.checked || remainingBalance === 0;
        if (isPaid) {
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
        // If deposit is $0, automatically mark as paid
        const depositPaid = depositAmount === 0;
        
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
            deposit_paid: depositPaid,
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

// View contract modal
async function viewContract(clientId) {
    try {
        // Fetch client data
        const clientData = await window.supabaseHelpers.getClientData(clientId);
        
        if (!clientData) {
            alert('Could not load contract data.');
            return;
        }
        
        // Check if contract is signed
        if (!clientData.signature || clientData.signature.trim() === '') {
            alert('This contract has not been signed yet.');
            return;
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'contractModal';
        modal.className = 'modal active';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content contract-modal-content';
        
        // Modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.innerHTML = `
            <h2>Service Agreement Contract</h2>
            <button class="close-btn" onclick="closeContractModal()">&times;</button>
        `;
        modalContent.appendChild(modalHeader);
        
        // Contract body
        const contractBody = document.createElement('div');
        contractBody.className = 'contract-body';
        contractBody.id = 'contractBody';
        
        // Format event date
        const eventDateFormatted = clientData.event_date ? formatDate(clientData.event_date) : 'N/A';
        
        // Format signature date
        let signatureDateFormatted = 'N/A';
        if (clientData.signature_date) {
            const sigDate = new Date(clientData.signature_date);
            signatureDateFormatted = sigDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Build contract HTML
        contractBody.innerHTML = `
            <div class="contract-logo">
                <img src="https://images.squarespace-cdn.com/content/v1/64909a307fc0025a2064d878/9b8fde02-b8f9-402b-be4c-366cb48134eb/Transparent+PNG+File.png" alt="Signature Sound & Lighting" onerror="this.style.display='none'">
            </div>
            
            <div class="contract-section">
                <h3>Event Details</h3>
                <div class="contract-details-grid">
                    <div class="contract-detail-item">
                        <label>Event Date:</label>
                        <span>${escapeHtml(eventDateFormatted)}</span>
                    </div>
                    <div class="contract-detail-item">
                        <label>Client Name:</label>
                        <span>${escapeHtml(clientData.client_name || 'N/A')}</span>
                    </div>
                    ${clientData.fiance_name ? `
                    <div class="contract-detail-item">
                        <label>Fiance Name:</label>
                        <span>${escapeHtml(clientData.fiance_name)}</span>
                    </div>
                    ` : ''}
                    <div class="contract-detail-item">
                        <label>Client Phone:</label>
                        <span>${escapeHtml(clientData.client_phone || 'N/A')}</span>
                    </div>
                    <div class="contract-detail-item">
                        <label>Client Address:</label>
                        <span>${escapeHtml(clientData.client_address || 'N/A')}</span>
                    </div>
                    <div class="contract-detail-item">
                        <label>Venue Name:</label>
                        <span>${escapeHtml(clientData.venue_name || 'N/A')}</span>
                    </div>
                    <div class="contract-detail-item">
                        <label>Venue Address:</label>
                        <span>${escapeHtml(clientData.venue_address || 'N/A')}</span>
                    </div>
                    <div class="contract-detail-item">
                        <label>Services:</label>
                        <span>${escapeHtml(clientData.services || 'N/A')}</span>
                    </div>
                    <div class="contract-detail-item">
                        <label>Total Balance:</label>
                        <span>${formatCurrency(parseFloat(clientData.total_balance) || 0)}</span>
                    </div>
                </div>
            </div>
            
            <div class="contract-section">
                <h3>Terms & Conditions</h3>
                <div class="contract-terms">
                    <p><strong>Venue Requirements:</strong> The Client shall ensure that the venue can supply: 1) an area within 50 feet of a 110-volt 3 prong outlet; 2) facility is open within one hour prior to scheduled start time and will remain open at least 30 minutes after the event ends; 3) facility meets all government safety regulations and has appropriate music licenses/permits.</p>
                    
                    <p><strong>1. Payment:</strong> Payment in full shall take place on or before the event date, unless otherwise agreed upon by both parties in writing. Any additional performance time requested by Client not specified within this Agreement will be at the discretion of the DJ. All fees paid for additional performance time shall be paid to the DJ at that time in cash or check and any gratuity given to DJ at the event are at the sole discretion of the Client.</p>
                    
                    <p><strong>2. Contract Modifications:</strong> This contract reflects any prior verbal Agreement, and includes all terms and conditions agreed prior to its execution. Client acknowledges that it has had the opportunity to review this contract in full prior to its execution. Neither Client nor DJ may make any alterations to this contract, without prior written approval by the other party.</p>
                    
                    <p><strong>3. Cancellation by Client:</strong> In the event of the Client wishes to cancel this contract for any reason, any advance payment made will be forfeited unless otherwise agreed by DJ. If Client decided to cancel the event more than 14 days from the day of the event then Client does not owe DJ the balance due pursuant to the contract. If Client decides to cancel the event less than 14 days from the date of event, the Client is responsible to pay the total fee set forth above.</p>
                    
                    <p><strong>4. Cancellation by DJ:</strong> In the unlikely event of the DJ having to cancel the contract due to injury or illness, accident or other legitimate condition outside the DJ's control, the DJ will make every reasonable effort to find a qualified replacement at the agreed upon fee. If the DJ is unable to find a replacement, Client will receive a full refund including the first installment.</p>
                    
                    <p><strong>5. Force Majeure:</strong> In the event that the event is cancelled due to act of God or other action constituting force majeure, DJ shall retain the deposit paid.</p>
                    
                    <p><strong>6. Liability:</strong> The DJ shall be in no way liable for breach of any contract executed between Client and the venue. DJ shall not be held liable for any loss, damages, injuries, or illness sustained during his performance. Client explicitly agrees to indemnify DJ for any loss or injury occurring to any guest or attendee of the event.</p>
                    
                    <p><strong>7. Security & Equipment:</strong> Client will provide adequate security and supervision of its guests, customers and staff at the venue and will be liable for any loss or damage to the DJ's equipment, vehicles or personal belongings caused by guests, customers and/or staff. Any mistreatment or abuse of the DJ will result in the immediate discontinuation of services and the full balance shall be due and payable to DJ.</p>
                    
                    <p><strong>8. Safety:</strong> The DJ reserves the right to discontinue performance if there exists a risk of injury or if the working environment constitutes a health and safety risk. If applicable, Client agrees to furnish a facility that completely covers the DJ's equipment from direct sunlight, rain and wind.</p>
                    
                    <p><strong>9. Governing Law:</strong> This Agreement shall be governed by the laws of the State of North Carolina. Client is responsible for repayment of any fees plus interest incurred by DJ in an attempt to collect payment. Client agrees that images, reviews and communications acquired during the course of this Agreement are usable for marketing.</p>
                    
                    <p><strong>By signing this agreement, you agree to the terms and conditions outlined above.</strong></p>
                </div>
            </div>
            
            <div class="contract-section">
                <h3>Signature</h3>
                <div class="contract-signature">
                    <div class="signature-field">
                        <label>Signed By:</label>
                        <span class="signature-value">${escapeHtml(clientData.signature)}</span>
                    </div>
                    <div class="signature-field">
                        <label>Date Signed:</label>
                        <span class="signature-value">${escapeHtml(signatureDateFormatted)}</span>
                    </div>
                </div>
            </div>
        `;
        
        modalContent.appendChild(contractBody);
        
        // Modal footer with buttons
        const escapedClientId = escapeHtml(clientId);
        const modalFooter = document.createElement('div');
        modalFooter.className = 'contract-footer';
        modalFooter.innerHTML = `
            <button class="btn-secondary" onclick="closeContractModal()">Close</button>
            <button class="btn-primary" onclick="downloadContractPDF('${escapedClientId}')">Download PDF</button>
            <button class="btn-primary" onclick="printContract()">Print</button>
        `;
        modalContent.appendChild(modalFooter);
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeContractModal();
            }
        });
        
    } catch (error) {
        console.error('Error loading contract:', error);
        alert('Failed to load contract. Please try again.');
    }
}

// Close contract modal
function closeContractModal() {
    const modal = document.getElementById('contractModal');
    if (modal) {
        modal.remove();
    }
}

// Print contract
function printContract() {
    const contractBody = document.getElementById('contractBody');
    if (!contractBody) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Service Agreement Contract</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 40px;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .contract-logo img {
                    max-width: 200px;
                    margin-bottom: 30px;
                }
                .contract-section {
                    margin-bottom: 30px;
                }
                .contract-section h3 {
                    color: #1a9e8e;
                    border-bottom: 2px solid #1a9e8e;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .contract-details-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .contract-detail-item {
                    display: flex;
                    flex-direction: column;
                }
                .contract-detail-item label {
                    font-weight: 600;
                    color: #666;
                    margin-bottom: 5px;
                }
                .contract-detail-item span {
                    color: #333;
                }
                .contract-terms {
                    line-height: 1.6;
                }
                .contract-terms p {
                    margin-bottom: 15px;
                }
                .contract-signature {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-top: 20px;
                }
                .signature-field {
                    display: flex;
                    flex-direction: column;
                }
                .signature-field label {
                    font-weight: 600;
                    color: #666;
                    margin-bottom: 5px;
                }
                .signature-value {
                    font-size: 18px;
                    color: #1a9e8e;
                    font-weight: 600;
                    padding: 10px;
                    border-bottom: 2px solid #1a9e8e;
                }
                @media print {
                    body { padding: 20px; }
                }
            </style>
        </head>
        <body>
            ${contractBody.innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// Download contract as PDF
async function downloadContractPDF(clientId) {
    try {
        // Check if jsPDF is loaded
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('PDF library not loaded. Please refresh the page and try again.');
        }
        
        // Fetch client data
        const clientData = await window.supabaseHelpers.getClientData(clientId);
        
        if (!clientData) {
            throw new Error('Could not load contract data.');
        }
        
        // Generate PDF
        await generateContractPDF(clientData);
    } catch (error) {
        console.error('Error generating contract PDF:', error);
        alert('Error generating PDF: ' + (error.message || 'Please try again.'));
    }
}

// Generate contract PDF
async function generateContractPDF(clientData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;
    const contentWidth = pageWidth - (margin * 2);
    
    // Color scheme
    const primaryColor = [26, 158, 142]; // #1a9e8e
    const darkColor = [20, 128, 115];
    const darkGray = [51, 51, 51];
    
    // Add logo
    const logoUrl = 'https://images.squarespace-cdn.com/content/v1/64909a307fc0025a2064d878/9b8fde02-b8f9-402b-be4c-366cb48134eb/Transparent+PNG+File.png';
    let logoHeight = 0;
    
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                logoHeight = 0;
                resolve();
            }, 5000);
            
            img.onload = () => {
                clearTimeout(timeout);
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    const base64data = canvas.toDataURL('image/png');
                    const logoWidth = 50;
                    logoHeight = (img.height / img.width) * logoWidth;
                    const logoX = (pageWidth - logoWidth) / 2;
                    
                    doc.addImage(base64data, 'PNG', logoX, margin, logoWidth, logoHeight);
                    resolve();
                } catch (e) {
                    logoHeight = 0;
                    resolve();
                }
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                logoHeight = 0;
                resolve();
            };
            
            img.src = logoUrl;
        });
    } catch (e) {
        logoHeight = 0;
    }
    
    yPosition = margin + logoHeight + 10;
    
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
        return lines.length * (fontSize * 0.35);
    }
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('SERVICE AGREEMENT CONTRACT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    // Event Details Section
    checkPageBreak(30);
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('EVENT DETAILS', margin + 2, yPosition + 6);
    yPosition += 12;
    
    // Event details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    
    const details = [
        ['Event Date:', clientData.event_date ? formatDateForPDF(clientData.event_date) : 'N/A'],
        ['Client Name:', clientData.client_name || 'N/A'],
        ['Fiance Name:', clientData.fiance_name || 'N/A'],
        ['Client Phone:', clientData.client_phone || 'N/A'],
        ['Client Address:', clientData.client_address || 'N/A'],
        ['Venue Name:', clientData.venue_name || 'N/A'],
        ['Venue Address:', clientData.venue_address || 'N/A'],
        ['Services:', clientData.services || 'N/A'],
        ['Total Balance:', formatCurrency(parseFloat(clientData.total_balance) || 0)]
    ];
    
    details.forEach(([label, value]) => {
        if (!value || value === 'N/A') return;
        checkPageBreak(6);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition += addText(value, margin + 50, yPosition, { fontSize: 10, maxWidth: contentWidth - 50 });
        yPosition += 2;
    });
    
    yPosition += 5;
    
    // Terms & Conditions Section
    checkPageBreak(30);
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TERMS & CONDITIONS', margin + 2, yPosition + 6);
    yPosition += 12;
    
    // Terms text
    const terms = [
        'Venue Requirements: The Client shall ensure that the venue can supply: 1) an area within 50 feet of a 110-volt 3 prong outlet; 2) facility is open within one hour prior to scheduled start time and will remain open at least 30 minutes after the event ends; 3) facility meets all government safety regulations and has appropriate music licenses/permits.',
        '1. Payment: Payment in full shall take place on or before the event date, unless otherwise agreed upon by both parties in writing. Any additional performance time requested by Client not specified within this Agreement will be at the discretion of the DJ. All fees paid for additional performance time shall be paid to the DJ at that time in cash or check and any gratuity given to DJ at the event are at the sole discretion of the Client.',
        '2. Contract Modifications: This contract reflects any prior verbal Agreement, and includes all terms and conditions agreed prior to its execution. Client acknowledges that it has had the opportunity to review this contract in full prior to its execution. Neither Client nor DJ may make any alterations to this contract, without prior written approval by the other party.',
        '3. Cancellation by Client: In the event of the Client wishes to cancel this contract for any reason, any advance payment made will be forfeited unless otherwise agreed by DJ. If Client decided to cancel the event more than 14 days from the day of the event then Client does not owe DJ the balance due pursuant to the contract. If Client decides to cancel the event less than 14 days from the date of event, the Client is responsible to pay the total fee set forth above.',
        '4. Cancellation by DJ: In the unlikely event of the DJ having to cancel the contract due to injury or illness, accident or other legitimate condition outside the DJ\'s control, the DJ will make every reasonable effort to find a qualified replacement at the agreed upon fee. If the DJ is unable to find a replacement, Client will receive a full refund including the first installment.',
        '5. Force Majeure: In the event that the event is cancelled due to act of God or other action constituting force majeure, DJ shall retain the deposit paid.',
        '6. Liability: The DJ shall be in no way liable for breach of any contract executed between Client and the venue. DJ shall not be held liable for any loss, damages, injuries, or illness sustained during his performance. Client explicitly agrees to indemnify DJ for any loss or injury occurring to any guest or attendee of the event.',
        '7. Security & Equipment: Client will provide adequate security and supervision of its guests, customers and staff at the venue and will be liable for any loss or damage to the DJ\'s equipment, vehicles or personal belongings caused by guests, customers and/or staff. Any mistreatment or abuse of the DJ will result in the immediate discontinuation of services and the full balance shall be due and payable to DJ.',
        '8. Safety: The DJ reserves the right to discontinue performance if there exists a risk of injury or if the working environment constitutes a health and safety risk. If applicable, Client agrees to furnish a facility that completely covers the DJ\'s equipment from direct sunlight, rain and wind.',
        '9. Governing Law: This Agreement shall be governed by the laws of the State of North Carolina. Client is responsible for repayment of any fees plus interest incurred by DJ in an attempt to collect payment. Client agrees that images, reviews and communications acquired during the course of this Agreement are usable for marketing.',
        'By signing this agreement, you agree to the terms and conditions outlined above.'
    ];
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    
    terms.forEach(term => {
        checkPageBreak(15);
        yPosition += addText(term, margin, yPosition, { fontSize: 9 });
        yPosition += 3;
    });
    
    yPosition += 5;
    
    // Signature Section
    checkPageBreak(25);
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SIGNATURE', margin + 2, yPosition + 6);
    yPosition += 15;
    
    // Signature details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Signed By:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    yPosition += addText(clientData.signature || 'N/A', margin, yPosition, { fontSize: 12 });
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Date Signed:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    if (clientData.signature_date) {
        const sigDate = new Date(clientData.signature_date);
        const sigDateFormatted = sigDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        yPosition += addText(sigDateFormatted, margin, yPosition, { fontSize: 12 });
    } else {
        yPosition += addText('N/A', margin, yPosition, { fontSize: 12 });
    }
    
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
    
    // Generate filename
    const clientName = clientData.client_name || 'Client';
    const filename = `Contract_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${clientData.event_date || 'Event'}.pdf`;
    
    // Save PDF
    doc.save(filename);
}

// Expose functions globally for onclick handlers
window.deleteClient = deleteClient;
window.toggleSignature = toggleSignature;
window.toggleDeposit = toggleDeposit;
window.exportTimeline = exportTimeline;
window.filterEventsByStage = filterEventsByStage;
window.viewContract = viewContract;
window.closeContractModal = closeContractModal;
window.printContract = printContract;
window.downloadContractPDF = downloadContractPDF;

