// Deposit Payment page system

// Stripe Configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SOL0J42hg0JtIZtdOS6EDBt3kYaAfWv7DcD9d3l6UhqndI7VHnL2hKy3K61mQ8SzThpT8q1ljaVpK6aYLkJcQIz00cJwxm4wa';

// Placeholder payment data - will be replaced with backend/Stripe integration
const paymentData = {
    depositAmount: "$500.00", // Placeholder - will pull from backend
    totalAmount: "$5,000.00", // Placeholder - will pull from backend
    dueDate: "10/18/26", // Placeholder - will pull from backend
    // Add more payment details as needed from backend/Stripe
};

let stripe = null;
let elements = null;
let cardElement = null;
let paymentIntentClientSecret = null;

function showDepositPayment() {
    // Create deposit payment overlay
    const overlay = document.createElement('div');
    overlay.id = 'depositPaymentOverlay';
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
    logo.onerror = function() {
        console.error('Logo failed to load');
    };
    content.appendChild(logo);
    
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
    
    // Payment form container with Stripe Elements
    const paymentForm = document.createElement('div');
    paymentForm.className = 'payment-form-container';
    
    const paymentFormTitle = document.createElement('h3');
    paymentFormTitle.textContent = 'Payment Information';
    paymentFormTitle.style.color = '#1a9e8e';
    paymentFormTitle.style.marginTop = '0';
    paymentForm.appendChild(paymentFormTitle);
    
    // Card element container (create it first so it exists in DOM)
    const cardContainer = document.createElement('div');
    cardContainer.id = 'card-element';
    cardContainer.className = 'stripe-card-element';
    paymentForm.appendChild(cardContainer);
    
    // Cardholder name field
    const nameField = document.createElement('div');
    nameField.className = 'form-field';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Cardholder Name';
    nameLabel.setAttribute('for', 'cardholder-name');
    nameField.appendChild(nameLabel);
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'cardholder-name';
    nameInput.className = 'event-detail-input';
    nameInput.placeholder = 'John Doe';
    nameField.appendChild(nameInput);
    paymentForm.appendChild(nameField);
    
    content.appendChild(paymentForm);
    overlay.appendChild(content);
    
    // Initialize Stripe AFTER elements are in the DOM
    // Use setTimeout to ensure DOM is fully ready
    setTimeout(() => {
        if (typeof Stripe !== 'undefined') {
            try {
                stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
                elements = stripe.elements();
                
                // Create card element
                cardElement = elements.create('card', {
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#32325d',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            '::placeholder': {
                                color: '#aab7c4',
                            },
                        },
                        invalid: {
                            color: '#dc3545',
                        },
                    },
                });
                
                // Mount card element - element should now exist in DOM
                const cardElementDom = document.getElementById('card-element');
                if (cardElementDom) {
                    cardElement.mount('#card-element');
                    
                    // Handle real-time validation errors
                    cardElement.on('change', function(event) {
                        const errorElement = document.getElementById('card-errors');
                        if (event.error) {
                            if (!errorElement) {
                                const errorDiv = document.createElement('div');
                                errorDiv.id = 'card-errors';
                                errorDiv.className = 'stripe-error';
                                paymentForm.appendChild(errorDiv);
                            }
                            document.getElementById('card-errors').textContent = event.error.message;
                        } else {
                            if (errorElement) {
                                errorElement.textContent = '';
                            }
                        }
                    });
                } else {
                    console.error('Card element container not found in DOM');
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'stripe-error';
                    errorMsg.textContent = 'Payment form error. Please refresh the page.';
                    paymentForm.appendChild(errorMsg);
                }
            } catch (error) {
                console.error('Stripe initialization error:', error);
                const errorMsg = document.createElement('div');
                errorMsg.className = 'stripe-error';
                errorMsg.textContent = 'Payment system initialization failed. Please refresh the page.';
                paymentForm.appendChild(errorMsg);
            }
        } else {
            // Fallback if Stripe.js hasn't loaded
            const errorMsg = document.createElement('div');
            errorMsg.className = 'stripe-error';
            errorMsg.textContent = 'Payment system is loading. Please refresh the page if this message persists.';
            paymentForm.appendChild(errorMsg);
        }
    }, 100);
    
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

async function handleDepositPayment() {
    const payButton = document.querySelector('.pre-onboarding-button.primary');
    const cardholderName = document.getElementById('cardholder-name');
    const cardholderNameValue = cardholderName ? cardholderName.value.trim() : '';
    
    // Validate cardholder name
    if (!cardholderNameValue) {
        if (cardholderName) {
            cardholderName.style.borderColor = '#dc3545';
            cardholderName.classList.add('field-error');
            cardholderName.focus();
        }
        alert('Please enter the cardholder name.');
        return;
    }
    
    // Remove error styling from name field
    if (cardholderName) {
        cardholderName.style.borderColor = '';
        cardholderName.classList.remove('field-error');
    }
    
    // Validate that Stripe is loaded
    if (!stripe || !cardElement) {
        alert('Payment system is not ready. Please refresh the page and try again.');
        return;
    }
    
    // Disable button and show loading state
    if (payButton) {
        payButton.disabled = true;
        payButton.textContent = 'Processing...';
    }
    
    try {
        // TODO: Replace with backend endpoint to create PaymentIntent
        // For now, we'll need to create a PaymentIntent on the backend first
        // The backend should return a client_secret which we use here
        
        // Placeholder: You'll need to call your backend to create a PaymentIntent
        // Example: const { clientSecret } = await fetch('/api/create-payment-intent', {...})
        
        // For now, using a test approach - in production you MUST create PaymentIntent on backend
        // Convert deposit amount to cents (remove $ and convert to number)
        const amountInCents = parseFloat(paymentData.depositAmount.replace('$', '').replace(',', '')) * 100;
        
        // Note: In production, the PaymentIntent MUST be created on your backend
        // This is a placeholder structure - replace with actual backend call
        const paymentIntentResponse = await createPaymentIntent(amountInCents, cardholderNameValue);
        
        if (!paymentIntentResponse || !paymentIntentResponse.clientSecret) {
            throw new Error('Failed to create payment intent. Please try again.');
        }
        
        paymentIntentClientSecret = paymentIntentResponse.clientSecret;
        
        // Confirm payment with Stripe
        const { error, paymentIntent } = await stripe.confirmCardPayment(
            paymentIntentClientSecret,
            {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: cardholderNameValue,
                    },
                },
            }
        );
        
        if (error) {
            // Show error to user
            const errorElement = document.getElementById('card-errors') || document.createElement('div');
            errorElement.id = 'card-errors';
            errorElement.className = 'stripe-error';
            errorElement.textContent = error.message;
            if (!document.getElementById('card-errors')) {
                const paymentForm = document.querySelector('.payment-form-container');
                if (paymentForm) {
                    paymentForm.appendChild(errorElement);
                }
            }
            
            // Re-enable button
            if (payButton) {
                payButton.disabled = false;
                payButton.textContent = 'Complete Payment';
            }
            return;
        }
        
        if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Payment succeeded
            localStorage.setItem('depositPaid', 'true');
            localStorage.setItem('paymentIntentId', paymentIntent.id);
            
            // Hide deposit payment overlay
            const overlay = document.getElementById('depositPaymentOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
            
            // Proceed to onboarding
            if (typeof checkIfOnboardingNeeded === 'function') {
                checkIfOnboardingNeeded();
            }
        } else {
            throw new Error('Payment was not successful. Please try again.');
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        alert(error.message || 'An error occurred processing your payment. Please try again.');
        
        // Re-enable button
        if (payButton) {
            payButton.disabled = false;
            payButton.textContent = 'Complete Payment';
        }
    }
}

// Function to create PaymentIntent - REPLACE WITH ACTUAL BACKEND CALL
async function createPaymentIntent(amountInCents, cardholderName) {
    // TODO: Replace this with actual backend API call
    // Example:
    // const response = await fetch('/api/create-payment-intent', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //         amount: amountInCents,
    //         currency: 'usd',
    //         metadata: {
    //             cardholder_name: cardholderName,
    //         },
    //     }),
    // });
    // return await response.json();
    
    // For now, return error to indicate backend integration needed
    throw new Error('Backend integration required: Please implement the createPaymentIntent function to call your backend API endpoint that creates a Stripe PaymentIntent.');
}

function checkDepositPaymentStatus() {
    // Check if deposit has been paid
    // Placeholder - will check with backend/Stripe later
    const isPaid = localStorage.getItem('depositPaid') === 'true';
    return isPaid;
}

// Helper function to reset deposit payment (useful for testing)
function resetDepositPayment() {
    localStorage.removeItem('depositPaid');
    
    // Remove existing overlay if it exists
    const existingOverlay = document.getElementById('depositPaymentOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    showDepositPayment();
}

// Helper function to reset both pre-onboarding steps (useful for testing)
function resetPreOnboarding() {
    localStorage.removeItem('serviceAgreementSigned');
    localStorage.removeItem('serviceAgreementSignature');
    localStorage.removeItem('depositPaid');
    
    // Remove existing overlays if they exist
    const agreementOverlay = document.getElementById('serviceAgreementOverlay');
    if (agreementOverlay) {
        agreementOverlay.remove();
    }
    
    const paymentOverlay = document.getElementById('depositPaymentOverlay');
    if (paymentOverlay) {
        paymentOverlay.remove();
    }
    
    // Show service agreement (first step)
    showServiceAgreement();
}

// Export functions for global access
window.showDepositPayment = showDepositPayment;
window.handleDepositPayment = handleDepositPayment;
window.checkDepositPaymentStatus = checkDepositPaymentStatus;
window.resetDepositPayment = resetDepositPayment;
window.resetPreOnboarding = resetPreOnboarding;

