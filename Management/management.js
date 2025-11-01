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

// Load all events from database
async function loadAllEvents() {
    const tbody = document.getElementById('eventsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading events...</td></tr>';
    
    try {
        const clients = await window.supabaseHelpers.getAllClients();
        
        if (!clients || clients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-events">No events found. Create your first event to get started!</td></tr>';
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
        
        tbody.innerHTML = '';
        eventsWithProgress.forEach(client => {
            const row = createEventRow(client);
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading events:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="error">Error loading events. Please refresh the page.</td></tr>';
    }
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
    
    // Event name (client name & fiance name)
    const eventName = formatEventName(client.client_name, client.fiance_name);
    
    // Format event date
    const eventDate = client.event_date ? formatDate(client.event_date) : 'N/A';
    
    // Pipeline stages
    const signatureStage = getSignatureStage(client);
    const depositStage = getDepositStage(client);
    const onboardingStage = getOnboardingStage(client);
    const planningStage = getPlanningStage(client.planningProgress || 0);
    
    // Actions (link to planning page)
    const planningLink = `../Planning/index.html?client_id=${client.id}`;
    
    row.innerHTML = `
        <td class="event-name">${escapeHtml(eventName)}</td>
        <td>${eventDate}</td>
        <td>${signatureStage}</td>
        <td>${depositStage}</td>
        <td>${onboardingStage}</td>
        <td>${planningStage}</td>
        <td class="actions">
            <a href="${planningLink}" target="_blank" class="btn-link">View Planning</a>
        </td>
    `;
    
    return row;
}

// Format event name from client_name and fiance_name
function formatEventName(clientName, fianceName) {
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

// Format date from YYYY-MM-DD to readable format
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Get signature stage indicator
function getSignatureStage(client) {
    if (client.signature && client.signature.trim() !== '') {
        return '<span class="stage-complete">✓ 100%</span>';
    } else {
        return '<span class="stage-incomplete">✗ 0%</span>';
    }
}

// Get deposit stage indicator
function getDepositStage(client) {
    if (client.deposit_paid === true) {
        return '<span class="stage-complete">✓ 100%</span>';
    } else {
        return '<span class="stage-incomplete">✗ 0%</span>';
    }
}

// Get onboarding stage indicator
function getOnboardingStage(client) {
    if (client.onboarding_completed === true) {
        return '<span class="stage-complete">✓ 100%</span>';
    } else {
        return '<span class="stage-incomplete">✗ 0%</span>';
    }
}

// Get planning stage indicator with percentage
function getPlanningStage(percentage) {
    if (percentage === 100) {
        return `<span class="stage-complete">✓ ${percentage}%</span>`;
    } else if (percentage > 0) {
        return `<span class="stage-partial">○ ${percentage}%</span>`;
    } else {
        return '<span class="stage-incomplete">✗ 0%</span>';
    }
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

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('createEventModal');
    if (e.target === modal) {
        closeCreateEventModal();
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
    const clientName = document.getElementById('eventClientName').value.trim();
    const fianceName = document.getElementById('eventFianceName').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    const services = document.getElementById('eventServices').value.trim();
    const depositAmount = parseFloat(document.getElementById('eventDepositAmount').value);
    const totalBalance = parseFloat(document.getElementById('eventTotalBalance').value);
    
    // Validate
    if (!clientName || !eventDate || !services || isNaN(depositAmount) || isNaN(totalBalance)) {
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
        console.log('Form values:', { clientName, fianceName, eventDate, services, depositAmount, totalBalance });
        
        // Create client data object
        const clientData = {
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
            onboarding_completed: false
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
        alert('Event created successfully!');
        
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

