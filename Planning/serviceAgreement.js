// Service Agreement page system

let currentClientId = null;
let eventData = {
    eventDate: "",
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    venueName: "",
    venueAddress: "",
    services: "",
    totalBalance: "",
    signature: ""
};

// Load client data from Supabase
async function loadClientData() {
    // Get client ID from URL (required)
    const urlParams = new URLSearchParams(window.location.search);
    currentClientId = urlParams.get('client_id');
    
    if (!currentClientId) {
        console.error('No client_id parameter found in URL');
        alert('Invalid link: Missing client ID. Please use the link provided by your event coordinator.');
        return;
    }
    
    // Store in localStorage for reference
    localStorage.setItem('currentClientId', currentClientId);
    
    // Load from Supabase
    if (window.supabaseHelpers && window.supabaseHelpers.getClientData) {
        const clientData = await window.supabaseHelpers.getClientData(currentClientId);
        
        if (!clientData) {
            console.error('Client not found in database');
            alert('Client not found. Please verify the link is correct.');
            return;
        }
        
        // Map database fields to eventData
        // Parse date string directly to avoid timezone issues
        if (clientData.event_date) {
            const dateStr = clientData.event_date; // Format: YYYY-MM-DD
            const [year, month, day] = dateStr.split('-');
            // Format as MM/DD/YY
            const yy = year.substring(2); // Last 2 digits of year
            eventData.eventDate = `${month}/${day}/${yy}`;
        } else {
            eventData.eventDate = "";
        }
        eventData.clientName = clientData.client_name || "";
        eventData.clientPhone = clientData.client_phone || "";
        eventData.clientAddress = clientData.client_address || "";
        eventData.venueName = clientData.venue_name || "";
        eventData.venueAddress = clientData.venue_address || "";
        eventData.services = clientData.services || "";
        eventData.totalBalance = clientData.total_balance ? `$${parseFloat(clientData.total_balance).toFixed(2)}` : "";
        eventData.signature = clientData.signature || "";
    } else {
        console.warn('Supabase helpers not available');
    }
}

async function showServiceAgreement() {
    // Load client data from Supabase before showing form
    await loadClientData();
    
    // Create service agreement overlay
    const overlay = document.createElement('div');
    overlay.id = 'serviceAgreementOverlay';
    overlay.className = 'pre-onboarding-overlay';
    document.body.appendChild(overlay);
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'pre-onboarding-content';
    
    // Logo (must be first element)
    const logo = document.createElement('img');
    logo.src = 'https://images.squarespace-cdn.com/content/v1/64909a307fc0025a2064d878/9b8fde02-b8f9-402b-be4c-366cb48134eb/Transparent+PNG+File.png';
    logo.alt = 'Signature Sound & Lighting';
    logo.className = 'service-agreement-logo';
    logo.onerror = function() {
        console.error('Logo failed to load');
    };
    content.appendChild(logo);
    
    // Event Details Form Section
    const eventDetailsSection = document.createElement('div');
    eventDetailsSection.className = 'event-details-form';
    
    const eventDetailsTitle = document.createElement('h3');
    eventDetailsTitle.textContent = 'Event Details';
    eventDetailsTitle.style.marginTop = '0';
    eventDetailsSection.appendChild(eventDetailsTitle);
    
    // Helper function to create form field
    const createFormField = (label, id, value, placeholder) => {
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'event-detail-field';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.setAttribute('for', id);
        fieldContainer.appendChild(labelEl);
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = id;
        input.className = 'event-detail-input';
        input.value = value || '';
        input.placeholder = placeholder || '';
        
        // Clear error styling when user starts typing
        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.style.borderColor = '';
                this.classList.remove('field-error');
            }
        });
        
        fieldContainer.appendChild(input);
        
        return fieldContainer;
    };
    
    // Helper function to create read-only display field
    const createReadOnlyField = (label, value) => {
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'event-detail-field';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        fieldContainer.appendChild(labelEl);
        
        const displayEl = document.createElement('p');
        displayEl.className = 'event-date-display';
        displayEl.textContent = value || '';
        fieldContainer.appendChild(displayEl);
        
        return fieldContainer;
    };
    
    // Event Date (read-only display)
    eventDetailsSection.appendChild(createReadOnlyField('Event Date:', eventData.eventDate));
    
    // Client Name (editable)
    eventDetailsSection.appendChild(createFormField('Client Name:', 'eventClientName', eventData.clientName, 'Enter client name'));
    
    // Client Phone (editable)
    eventDetailsSection.appendChild(createFormField('Client Phone:', 'eventClientPhone', eventData.clientPhone, 'Enter client phone'));
    
    // Client Address (editable)
    eventDetailsSection.appendChild(createFormField('Client Address:', 'eventClientAddress', eventData.clientAddress, 'Enter client address'));
    
    // Venue Name (editable)
    eventDetailsSection.appendChild(createFormField('Venue Name:', 'eventVenueName', eventData.venueName, 'Enter venue name'));
    
    // Venue Address (editable)
    eventDetailsSection.appendChild(createFormField('Venue Address:', 'eventVenueAddress', eventData.venueAddress, 'Enter venue address'));
    
    // Services (read-only - set by backend)
    eventDetailsSection.appendChild(createReadOnlyField('Services:', eventData.services));
    
    // Total Balance (read-only - set by backend)
    const totalBalanceDisplay = createReadOnlyField('Total Balance:', eventData.totalBalance);
    eventDetailsSection.appendChild(totalBalanceDisplay);
    
    // Store reference to services and total balance display for later use
    const servicesElement = eventDetailsSection.querySelectorAll('.event-date-display')[eventDetailsSection.querySelectorAll('.event-date-display').length - 2];
    const totalBalanceElement = eventDetailsSection.querySelectorAll('.event-date-display')[eventDetailsSection.querySelectorAll('.event-date-display').length - 1];
    
    content.appendChild(eventDetailsSection);
    
    // Agreement content container with scroll
    const agreementContainer = document.createElement('div');
    agreementContainer.className = 'agreement-container';
    
    // Agreement text
    const agreementText = document.createElement('div');
    agreementText.className = 'agreement-text';
    agreementText.innerHTML = `
        <h3>Terms & Conditions</h3>
        
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
    `;
    agreementContainer.appendChild(agreementText);
    content.appendChild(agreementContainer);
    
    // Signature section
    const signatureSection = document.createElement('div');
    signatureSection.className = 'signature-section';
    
    const signatureLabel = document.createElement('label');
    signatureLabel.textContent = 'Full Name (Digital Signature)';
    signatureLabel.className = 'signature-label';
    signatureSection.appendChild(signatureLabel);
    
    const signatureInput = document.createElement('input');
    signatureInput.type = 'text';
    signatureInput.id = 'signatureInput';
    signatureInput.className = 'signature-input';
    
    // Check if signature exists in database and auto-fill if it does
    if (eventData.signature && eventData.signature.trim() !== '') {
        signatureInput.value = eventData.signature;
        signatureInput.disabled = true;
        signatureInput.style.backgroundColor = '#f0f0f0';
        signatureInput.style.cursor = 'not-allowed';
    } else {
        signatureInput.placeholder = 'Type your full name to sign';
        
        // Clear error styling when user starts typing
        signatureInput.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.style.borderColor = '';
                this.classList.remove('field-error');
            }
        });
    }
    
    signatureSection.appendChild(signatureInput);
    
    content.appendChild(signatureSection);
    
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'pre-onboarding-button-container';
    
    const signButton = document.createElement('button');
    signButton.className = 'pre-onboarding-button primary';
    signButton.textContent = 'Sign Agreement';
    signButton.onclick = () => handleServiceAgreementSign();
    buttonContainer.appendChild(signButton);
    
    content.appendChild(buttonContainer);
    
    overlay.appendChild(content);
}

async function handleServiceAgreementSign() {
    // Get all required input fields
    const clientNameInput = document.getElementById('eventClientName');
    const clientPhoneInput = document.getElementById('eventClientPhone');
    const clientAddressInput = document.getElementById('eventClientAddress');
    const venueNameInput = document.getElementById('eventVenueName');
    const venueAddressInput = document.getElementById('eventVenueAddress');
    const signatureInput = document.getElementById('signatureInput');
    const eventDateInput = document.querySelector('.event-date-display');
    
    // Get values and trim whitespace
    const clientName = clientNameInput ? clientNameInput.value.trim() : '';
    const clientPhone = clientPhoneInput ? clientPhoneInput.value.trim() : '';
    const clientAddress = clientAddressInput ? clientAddressInput.value.trim() : '';
    const venueName = venueNameInput ? venueNameInput.value.trim() : '';
    const venueAddress = venueAddressInput ? venueAddressInput.value.trim() : '';
    const signature = signatureInput && !signatureInput.disabled ? signatureInput.value.trim() : '';
    const eventDate = eventDateInput ? eventDateInput.textContent.trim() : '';
    
    // Check if signature is already filled (disabled means it came from database)
    const signatureRequired = !signatureInput || !signatureInput.disabled;
    
    // Remove previous error styling
    const allInputs = [clientNameInput, clientPhoneInput, clientAddressInput, venueNameInput, venueAddressInput];
    if (signatureRequired) {
        allInputs.push(signatureInput);
    }
    
    allInputs.forEach(input => {
        if (input) {
            input.style.borderColor = '';
            input.classList.remove('field-error');
        }
    });
    
    // Validate all fields
    let hasErrors = false;
    
    if (!clientName) {
        if (clientNameInput) {
            clientNameInput.style.borderColor = '#dc3545';
            clientNameInput.classList.add('field-error');
        }
        hasErrors = true;
    }
    
    if (!clientPhone) {
        if (clientPhoneInput) {
            clientPhoneInput.style.borderColor = '#dc3545';
            clientPhoneInput.classList.add('field-error');
        }
        hasErrors = true;
    }
    
    if (!clientAddress) {
        if (clientAddressInput) {
            clientAddressInput.style.borderColor = '#dc3545';
            clientAddressInput.classList.add('field-error');
        }
        hasErrors = true;
    }
    
    if (!venueName) {
        if (venueNameInput) {
            venueNameInput.style.borderColor = '#dc3545';
            venueNameInput.classList.add('field-error');
        }
        hasErrors = true;
    }
    
    if (!venueAddress) {
        if (venueAddressInput) {
            venueAddressInput.style.borderColor = '#dc3545';
            venueAddressInput.classList.add('field-error');
        }
        hasErrors = true;
    }
    
    if (signatureRequired && !signature) {
        if (signatureInput) {
            signatureInput.style.borderColor = '#dc3545';
            signatureInput.classList.add('field-error');
        }
        hasErrors = true;
    }
    
    // If there are errors, don't proceed
    if (hasErrors) {
        // Scroll to first error field
        const firstError = allInputs.find(input => input && input.value.trim() === '');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
        return;
    }
    
    // Save to Supabase
    try {
        // Get services and total balance from read-only displays
        const servicesDisplay = document.querySelector('.event-date-display')?.parentElement?.parentElement?.querySelectorAll('.event-date-display')[6];
        const totalBalanceDisplay = document.querySelector('.event-date-display')?.parentElement?.parentElement?.querySelectorAll('.event-date-display')[7];
        const servicesValue = servicesDisplay ? servicesDisplay.textContent.trim() : '';
        const totalBalanceText = totalBalanceDisplay ? totalBalanceDisplay.textContent.trim() : '';
        
        // Parse total balance (remove $ and convert to number)
        const totalBalanceValue = totalBalanceText ? 
            parseFloat(totalBalanceText.replace('$', '').replace(',', '')) : null;
        
        // Parse event date to proper format
        let eventDateValue = null;
        if (eventDate) {
            // Try to parse the date (assuming MM/DD/YY format)
            const parts = eventDate.split('/');
            if (parts.length === 3) {
                const month = parseInt(parts[0]) - 1; // JavaScript months are 0-indexed
                const day = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                // Convert 2-digit year to 4-digit (assume 20xx for years < 50)
                const fullYear = year < 50 ? 2000 + year : 1900 + year;
                eventDateValue = new Date(fullYear, month, day).toISOString().split('T')[0];
            }
        }
        
        const clientData = {
            event_date: eventDateValue || new Date().toISOString().split('T')[0],
            client_name: clientName,
            client_phone: clientPhone,
            client_address: clientAddress,
            venue_name: venueName,
            venue_address: venueAddress,
            services: servicesValue,
            total_balance: totalBalanceValue,
            signature: signature || null,
            signature_date: signature ? new Date().toISOString() : null
        };
        
        let savedClientId = currentClientId;
        
        if (currentClientId && window.supabaseHelpers && window.supabaseHelpers.updateClient) {
            // Update existing client
            const success = await window.supabaseHelpers.updateClient(currentClientId, clientData);
            if (!success) {
                throw new Error('Failed to save client data');
            }
        } else {
            // Client ID should exist from URL - if not, this is an error
            throw new Error('Client ID not found. Please use the link provided by your event coordinator.');
        }
        
        // Store signature status for flow control
        localStorage.setItem('serviceAgreementSigned', 'true');
        if (signature) {
            localStorage.setItem('serviceAgreementSignature', signature);
        }
        
        // Hide service agreement overlay
        const overlay = document.getElementById('serviceAgreementOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Proceed to deposit payment
        if (typeof showDepositPayment === 'function') {
            showDepositPayment();
        }
        
    } catch (error) {
        console.error('Error saving client data:', error);
        alert('Failed to save data. Please try again. Error: ' + error.message);
    }
}

async function checkServiceAgreementStatus() {
    // Check if service agreement has been signed
    // First check localStorage (fallback)
    const localStorageSigned = localStorage.getItem('serviceAgreementSigned') === 'true';
    
    // Then check Supabase (primary source)
    const clientId = new URLSearchParams(window.location.search).get('client_id') || localStorage.getItem('currentClientId');
    
    if (clientId && window.supabaseHelpers && window.supabaseHelpers.getClientData) {
        const clientData = await window.supabaseHelpers.getClientData(clientId);
        if (clientData && clientData.signature) {
            return true;
        }
    }
    
    return localStorageSigned;
}

// Helper function to reset service agreement (useful for testing)
function resetServiceAgreement() {
    localStorage.removeItem('serviceAgreementSigned');
    localStorage.removeItem('serviceAgreementSignature');
    
    // Remove existing overlay if it exists
    const existingOverlay = document.getElementById('serviceAgreementOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    showServiceAgreement();
}

// Export functions for global access
window.showServiceAgreement = showServiceAgreement;
window.handleServiceAgreementSign = handleServiceAgreementSign;
window.checkServiceAgreementStatus = checkServiceAgreementStatus;
window.resetServiceAgreement = resetServiceAgreement;

