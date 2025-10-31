// Service Agreement page system

// Placeholder event data - will be replaced with backend data later
const eventData = {
    name: "John & Sarah", // Placeholder - will pull from backend
    eventDate: "10/18/26", // Placeholder - will pull from backend
    eventType: "Wedding", // Placeholder - will pull from backend
    location: "TBD", // Placeholder - will pull from backend
    // Add more event details as needed from backend
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
    
    // Title
    const title = document.createElement('h1');
    title.className = 'pre-onboarding-title';
    title.textContent = 'Service Agreement';
    content.appendChild(title);
    
    // Agreement content container with scroll
    const agreementContainer = document.createElement('div');
    agreementContainer.className = 'agreement-container';
    
    // Agreement text (placeholder - will be replaced with actual contract text)
    const agreementText = document.createElement('div');
    agreementText.className = 'agreement-text';
    agreementText.innerHTML = `
        <h3>Event Details</h3>
        <p><strong>Event Name:</strong> ${eventData.name}</p>
        <p><strong>Event Date:</strong> ${eventData.eventDate}</p>
        <p><strong>Event Type:</strong> ${eventData.eventType}</p>
        <p><strong>Location:</strong> ${eventData.location}</p>
        
        <h3>Service Agreement</h3>
        <p>[Contract text will be added here. This will pull event details from the backend database including name, event date, and other relevant information.]</p>
        
        <p>By signing this agreement, you agree to the terms and conditions outlined above.</p>
        <p><em>Note: This is a placeholder. The actual contract text will be provided and will integrate with the backend database to populate event-specific details.</em></p>
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
    signatureInput.placeholder = 'Type your full name to sign';
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

