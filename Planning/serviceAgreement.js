// Service Agreement page system

// Placeholder event data - will be replaced with backend data later
const eventData = {
    eventDate: "10/18/26", // Placeholder - will pull from backend
    clientName: "", // Placeholder - will pull from backend (editable by client)
    clientPhone: "", // Placeholder - will pull from backend (editable by client)
    clientAddress: "", // Placeholder - will pull from backend (editable by client)
    venueName: "", // Placeholder - will pull from backend (editable by client)
    venueAddress: "", // Placeholder - will pull from backend (editable by client)
    services: "", // Placeholder - will pull from backend (editable by client)
    totalBalance: "", // Placeholder - will pull from backend (editable by client)
    signature: "" // Placeholder - will pull from backend (auto-filled if exists, read-only)
};

function showServiceAgreement() {
    // Create service agreement overlay
    const overlay = document.createElement('div');
    overlay.id = 'serviceAgreementOverlay';
    overlay.className = 'pre-onboarding-overlay';
    document.body.appendChild(overlay);
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'pre-onboarding-content';
    
    // Logo
    const logo = document.createElement('img');
    logo.src = 'https://images.squarespace-cdn.com/content/v1/64909a307fc0025a2064d878/9b8fde02-b8f9-402b-be4c-366cb48134eb/Transparent+PNG+File.png';
    logo.alt = 'Signature Sound & Lighting';
    logo.className = 'service-agreement-logo';
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
    eventDetailsSection.appendChild(createReadOnlyField('Total Balance:', eventData.totalBalance));
    
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

function handleServiceAgreementSign() {
    const signatureInput = document.getElementById('signatureInput');
    const signature = signatureInput ? signatureInput.value.trim() : '';
    
    if (!signature) {
        alert('Please enter your full name to sign the agreement.');
        return;
    }
    
    // Store signature status (placeholder - will check with backend/Stripe later)
    localStorage.setItem('serviceAgreementSigned', 'true');
    localStorage.setItem('serviceAgreementSignature', signature);
    
    // Hide service agreement overlay
    const overlay = document.getElementById('serviceAgreementOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    // Proceed to deposit payment
    if (typeof showDepositPayment === 'function') {
        showDepositPayment();
    }
}

function checkServiceAgreementStatus() {
    // Check if service agreement has been signed
    // Placeholder - will check with backend/Stripe later
    const isSigned = localStorage.getItem('serviceAgreementSigned') === 'true';
    return isSigned;
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

