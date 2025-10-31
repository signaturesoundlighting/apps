// Deposit Payment page system

// Placeholder payment data - will be replaced with backend/Stripe integration
const paymentData = {
    depositAmount: "$500.00", // Placeholder - will pull from backend
    totalAmount: "$5,000.00", // Placeholder - will pull from backend
    dueDate: "10/18/26", // Placeholder - will pull from backend
    // Add more payment details as needed from backend/Stripe
};

function showDepositPayment() {
    // Create deposit payment overlay
    const overlay = document.createElement('div');
    overlay.id = 'depositPaymentOverlay';
    overlay.className = 'pre-onboarding-overlay';
    document.body.appendChild(overlay);
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'pre-onboarding-content';
    
    // Title
    const title = document.createElement('h1');
    title.className = 'pre-onboarding-title';
    title.textContent = 'Deposit Payment';
    content.appendChild(title);
    
    // Payment summary
    const paymentSummary = document.createElement('div');
    paymentSummary.className = 'payment-summary';
    paymentSummary.innerHTML = `
        <div class="payment-row">
            <span class="payment-label">Deposit Amount:</span>
            <span class="payment-value">${paymentData.depositAmount}</span>
        </div>
        <div class="payment-row">
            <span class="payment-label">Total Amount:</span>
            <span class="payment-value">${paymentData.totalAmount}</span>
        </div>
        <div class="payment-row">
            <span class="payment-label">Due Date:</span>
            <span class="payment-value">${paymentData.dueDate}</span>
        </div>
    `;
    content.appendChild(paymentSummary);
    
    // Payment form container (placeholder for Stripe integration)
    const paymentForm = document.createElement('div');
    paymentForm.className = 'payment-form-container';
    paymentForm.innerHTML = `
        <div class="payment-placeholder">
            <h3>Payment Information</h3>
            <p><em>Stripe payment integration will be added here.</em></p>
            <p>This will include:</p>
            <ul>
                <li>Credit card payment form (via Stripe Elements)</li>
                <li>Secure payment processing</li>
                <li>Payment status tracking</li>
                <li>Integration with backend to verify payment completion</li>
            </ul>
        </div>
        
        <!-- Placeholder payment fields -->
        <div class="payment-fields-placeholder">
            <div class="form-field">
                <label>Card Number</label>
                <input type="text" placeholder="1234 5678 9012 3456" disabled />
            </div>
            <div class="form-row">
                <div class="form-field">
                    <label>Expiry Date</label>
                    <input type="text" placeholder="MM/YY" disabled />
                </div>
                <div class="form-field">
                    <label>CVV</label>
                    <input type="text" placeholder="123" disabled />
                </div>
            </div>
            <div class="form-field">
                <label>Cardholder Name</label>
                <input type="text" placeholder="John Doe" disabled />
            </div>
        </div>
    `;
    content.appendChild(paymentForm);
    
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'pre-onboarding-button-container';
    
    // For now, add a placeholder button to proceed
    // This will be replaced with actual Stripe payment processing
    const payButton = document.createElement('button');
    payButton.className = 'pre-onboarding-button primary';
    payButton.textContent = 'Complete Payment';
    payButton.onclick = () => handleDepositPayment();
    buttonContainer.appendChild(payButton);
    
    content.appendChild(buttonContainer);
    
    overlay.appendChild(content);
}

function handleDepositPayment() {
    // Placeholder payment handler - will integrate with Stripe later
    // This will verify payment with Stripe and backend
    
    // For now, just mark as paid (placeholder)
    localStorage.setItem('depositPaid', 'true');
    
    // Hide deposit payment overlay
    const overlay = document.getElementById('depositPaymentOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    // Proceed to onboarding
    if (typeof checkIfOnboardingNeeded === 'function') {
        checkIfOnboardingNeeded();
    }
}

function checkDepositPaymentStatus() {
    // Check if deposit has been paid
    // Placeholder - will check with backend/Stripe later
    const isPaid = localStorage.getItem('depositPaid') === 'true';
    return isPaid;
}

// Export functions for global access
window.showDepositPayment = showDepositPayment;
window.handleDepositPayment = handleDepositPayment;
window.checkDepositPaymentStatus = checkDepositPaymentStatus;

