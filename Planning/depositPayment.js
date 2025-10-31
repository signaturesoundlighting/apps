// Deposit Payment page system

// Stripe Configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SOL0J42hg0JtIZtdOS6EDBt3kYaAfWv7DcD9d3l6UhqndI7VHnL2hKy3K61mQ8SzThpT8q1ljaVpK6aYLkJcQIz00cJwxm4wa';

// Backend API endpoint for creating PaymentIntents
// TODO: Replace with your actual Cloudflare Worker URL after deployment
// Example: 'https://stripe-payment-intent.your-account.workers.dev'
const PAYMENT_INTENT_API_URL = window.PAYMENT_INTENT_API_URL || null;

// Payment data - will be loaded from Supabase
let paymentData = {
    depositAmount: "$500.00", // Default placeholder
    totalAmount: "$5,000.00", // Default placeholder
    dueDate: "", // Will pull from backend
    clientId: null
};

// Load payment data from Supabase
async function loadPaymentData() {
    // Get client ID from URL (required)
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id');
    
    if (!clientId) {
        console.error('No client_id parameter found in URL');
        alert('Invalid link: Missing client ID. Please use the link provided by your event coordinator.');
        return;
    }
    
    paymentData.clientId = clientId;
    
    // Load from Supabase
    if (window.supabaseHelpers && window.supabaseHelpers.getClientData) {
        const clientData = await window.supabaseHelpers.getClientData(clientId);
        
        console.log('Client data loaded from Supabase:', clientData);
        
        if (!clientData) {
            console.error('Client not found in database');
            alert('Client not found. Please verify the link is correct.');
            return;
        }
        
        // Get deposit amount from database (or calculate as fallback)
        let depositAmount = null;
        if (clientData.deposit_amount) {
            depositAmount = parseFloat(clientData.deposit_amount);
        } else if (clientData.total_balance) {
            // Fallback: calculate 10% of total if deposit_amount not set
            const totalBalance = parseFloat(clientData.total_balance);
            depositAmount = totalBalance * 0.1;
            console.warn('deposit_amount not set in database, calculated 10% of total_balance');
        } else {
            // Default fallback
            depositAmount = 500;
        }
        
        // Get total amount
        const totalBalance = clientData.total_balance ? parseFloat(clientData.total_balance) : 5000;
        
        paymentData.depositAmount = `$${depositAmount.toFixed(2)}`;
        paymentData.totalAmount = `$${totalBalance.toFixed(2)}`;
        
        console.log('Payment amounts loaded:', {
            deposit_amount_from_db: clientData.deposit_amount,
            total_balance_from_db: clientData.total_balance,
            calculated_deposit: depositAmount,
            total: totalBalance,
            formattedDeposit: paymentData.depositAmount,
            formattedTotal: paymentData.totalAmount
        });
        
        // Parse date string directly to avoid timezone issues
        if (clientData.event_date) {
            const dateStr = clientData.event_date; // Format: YYYY-MM-DD
            const [year, month, day] = dateStr.split('-');
            const yy = year.substring(2); // Last 2 digits of year
            paymentData.dueDate = `${month}/${day}/${yy}`;
            console.log('Date parsed:', { dateStr, month, day, yy, formatted: paymentData.dueDate });
        } else {
            paymentData.dueDate = "";
            console.warn('No event_date found in client data');
        }
    } else {
        console.warn('Supabase helpers not available');
    }
}

let stripe = null;
let elements = null;
let cardElement = null;
let paymentIntentClientSecret = null;

async function showDepositPayment() {
    // Load payment data from Supabase before showing form
    await loadPaymentData();
    
    console.log('Payment Data loaded:', paymentData);
    
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
    
    // Subheader
    const subheader = document.createElement('p');
    subheader.className = 'deposit-subheader';
    subheader.textContent = "We'll need this to officially save the date";
    subheader.style.cssText = 'text-align: center; color: #666; margin-top: 10px; margin-bottom: 30px; font-size: 16px;';
    content.appendChild(subheader);
    
    // Payment summary (deposit amount only)
    const paymentSummary = document.createElement('div');
    paymentSummary.className = 'payment-summary';
    paymentSummary.innerHTML = `
        <div class="payment-row">
            <span class="payment-label">Deposit Amount:</span>
            <span class="payment-value">${paymentData.depositAmount}</span>
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
        // Convert deposit amount to cents (remove $ and convert to number)
        const amountInCents = parseFloat(paymentData.depositAmount.replace('$', '').replace(',', '')) * 100;
        
        // Create PaymentIntent (will return mock in test mode until backend is ready)
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
            // Payment succeeded - update Supabase
            if (paymentData.clientId && window.supabaseHelpers && window.supabaseHelpers.updateClient) {
                const updateSuccess = await window.supabaseHelpers.updateClient(paymentData.clientId, {
                    deposit_paid: true,
                    payment_intent_id: paymentIntent.id
                });
                
                if (!updateSuccess) {
                    console.warn('Payment succeeded but failed to update Supabase. Payment Intent ID:', paymentIntent.id);
                } else {
                    console.log('Payment and database update successful:', paymentIntent.id);
                }
            }
            
            // Store in localStorage as backup
            localStorage.setItem('depositPaid', 'true');
            localStorage.setItem('paymentIntentId', paymentIntent.id);
            
            // Hide deposit payment overlay
            const overlay = document.getElementById('depositPaymentOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
            
            // Show success message
            alert('Payment successful! Your deposit has been processed.');
            
            // Proceed to onboarding
            if (typeof checkIfOnboardingNeeded === 'function') {
                checkIfOnboardingNeeded();
            }
        } else {
            throw new Error(`Payment was not successful. Status: ${paymentIntent?.status || 'unknown'}. Please try again.`);
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

// Function to create PaymentIntent via backend API
async function createPaymentIntent(amountInCents, cardholderName) {
    if (!PAYMENT_INTENT_API_URL) {
        throw new Error('Payment API endpoint not configured. Please set PAYMENT_INTENT_API_URL.');
    }

    try {
        const response = await fetch(PAYMENT_INTENT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amountInCents,
                currency: 'usd',
                clientId: paymentData.clientId,
                metadata: {
                    cardholder_name: cardholderName,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to create payment intent`);
        }

        const data = await response.json();
        
        if (!data.clientSecret) {
            throw new Error('Invalid response from payment server: missing clientSecret');
        }

        return {
            clientSecret: data.clientSecret,
            paymentIntentId: data.paymentIntentId || null
        };
    } catch (error) {
        console.error('Error creating PaymentIntent:', error);
        throw error;
    }
}

async function checkDepositPaymentStatus() {
    // Check if deposit has been paid
    // First check localStorage (fallback)
    const localStoragePaid = localStorage.getItem('depositPaid') === 'true';
    
    // Then check Supabase (primary source)
    const clientId = new URLSearchParams(window.location.search).get('client_id') || localStorage.getItem('currentClientId');
    
    if (clientId && window.supabaseHelpers && window.supabaseHelpers.getClientData) {
        const clientData = await window.supabaseHelpers.getClientData(clientId);
        if (clientData && clientData.deposit_paid) {
            return true;
        }
    }
    
    return localStoragePaid;
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

