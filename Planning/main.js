// Helper function to extract first name from full name
function getFirstName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return '';
    }
    // Split by space and take the first part
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || '';
}

// Update header with client data from Supabase
async function updateHeader() {
    const clientId = getClientIdFromUrl();
    
    if (!clientId) {
        return;
    }
    
    // Load client data
    if (window.supabaseHelpers && window.supabaseHelpers.getClientData) {
        const clientData = await window.supabaseHelpers.getClientData(clientId);
        
        if (clientData) {
            // Update couple name (first names only)
            const coupleNameEl = document.querySelector('.couple-name');
            if (coupleNameEl) {
                const clientFirstName = getFirstName(clientData.client_name);
                const fianceFirstName = getFirstName(clientData.fiance_name);
                
                if (clientFirstName && fianceFirstName) {
                    coupleNameEl.textContent = `${clientFirstName} & ${fianceFirstName}`;
                } else if (clientFirstName) {
                    coupleNameEl.textContent = clientFirstName;
                } else if (fianceFirstName) {
                    coupleNameEl.textContent = fianceFirstName;
                }
                // If both empty, keep default "John & Sarah"
            }
            
            // Update wedding date
            const weddingDateEl = document.querySelector('.wedding-date');
            if (weddingDateEl && clientData.event_date) {
                const dateStr = clientData.event_date; // Format: YYYY-MM-DD
                const [year, month, day] = dateStr.split('-');
                const yy = year.substring(2); // Last 2 digits of year
                weddingDateEl.textContent = `${month}/${day}/${yy}`;
            }
        }
    }
}

// Initialize the app
async function init() {
    const clientId = getClientIdFromUrl();
    
    // Only initialize if we have a client ID and all requirements are met
    if (!clientId) {
        console.log('Waiting for client ID...');
        return;
    }
    
    // Update header with client data
    await updateHeader();
    
    // Load events and data from Supabase (will be implemented when integrating events)
    // For now, use existing data loading
    
    if (typeof renderEvents === 'function') {
        renderEvents();
    }
    if (typeof setupDragAndDrop === 'function') {
        setupDragAndDrop();
    }
    if (typeof updateOverallProgress === 'function') {
        updateOverallProgress();
    }
    if (typeof updateGeneralInfoCard === 'function') {
        updateGeneralInfoCard();
    }
}

// Get client ID from URL parameter
function getClientIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id');
    
    if (clientId) {
        localStorage.setItem('currentClientId', clientId);
        return clientId;
    }
    
    // Fallback to localStorage
    return localStorage.getItem('currentClientId');
}

// Check pre-onboarding requirements (service agreement & deposit) before onboarding
async function checkPreOnboardingRequirements() {
    const clientId = getClientIdFromUrl();
    
    // If no client ID in URL, show error or redirect
    if (!clientId) {
        console.error('No client_id parameter found in URL. Please provide a valid client ID.');
        // Optionally show an error message to the user
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; text-align: center; max-width: 500px;';
        errorMsg.innerHTML = `
            <h2 style="color: #dc3545; margin-bottom: 20px;">Invalid Link</h2>
            <p style="margin-bottom: 20px;">This link requires a valid client ID. Please contact your event coordinator for the correct link.</p>
            <p style="font-size: 14px; color: #666;">If you believe this is an error, please check the URL includes: ?client_id=...</p>
        `;
        document.body.appendChild(errorMsg);
        return;
    }
    
    // Load client data from Supabase to check completion status
    let clientData = null;
    if (window.supabaseHelpers && window.supabaseHelpers.getClientData) {
        clientData = await window.supabaseHelpers.getClientData(clientId);
        
        if (!clientData) {
            console.error('Client not found in database');
            const errorMsg = document.createElement('div');
            errorMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; text-align: center; max-width: 500px;';
            errorMsg.innerHTML = `
                <h2 style="color: #dc3545; margin-bottom: 20px;">Client Not Found</h2>
                <p style="margin-bottom: 20px;">The client ID in the URL does not exist in our system. Please contact your event coordinator.</p>
            `;
            document.body.appendChild(errorMsg);
            return;
        }
    }
    
    // Check service agreement status (must have a signature)
    const hasSignedAgreement = clientData?.signature && clientData.signature.trim() !== '';
    
    console.log('Service Agreement Status:', {
        hasSignature: !!clientData?.signature,
        signatureValue: clientData?.signature,
        hasSignedAgreement
    });
    
    if (!hasSignedAgreement) {
        console.log('Showing Service Agreement form');
        if (typeof showServiceAgreement === 'function') {
            await showServiceAgreement();
        }
        return;
    }
    
    // Check deposit payment status (must be explicitly true)
    const hasPaidDeposit = clientData?.deposit_paid === true;
    
    console.log('Deposit Payment Status:', {
        deposit_paid: clientData?.deposit_paid,
        hasPaidDeposit
    });
    
    if (!hasPaidDeposit) {
        console.log('Showing Deposit Payment form');
        if (typeof showDepositPayment === 'function') {
            await showDepositPayment();
        }
        return;
    }
    
    // Check onboarding status (must be explicitly true)
    const hasCompletedOnboarding = clientData?.onboarding_completed === true;
    
    console.log('Onboarding Status:', {
        onboarding_completed: clientData?.onboarding_completed,
        hasCompletedOnboarding
    });
    
    if (!hasCompletedOnboarding) {
        // Proceed to onboarding
        if (typeof checkIfOnboardingNeeded === 'function') {
            checkIfOnboardingNeeded();
        }
        return;
    }
    
    // All steps completed - show the main planning app
    console.log('All requirements met - showing planning app');
    
    // Update header with client data first
    await updateHeader();
    
    // Initialize the main planning app
    await init();
}

// Export functions for global access
window.updateHeader = updateHeader;

// Check pre-onboarding requirements on page load
// This will determine what to show based on completion status
checkPreOnboardingRequirements();

// Note: init() will be called automatically when all requirements are met
// or after onboarding is completed
