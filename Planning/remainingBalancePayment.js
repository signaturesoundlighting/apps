// Remaining Balance Payment page system

// Stripe Configuration (same as deposit payment)
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51RDrc9KrHOWv98vrmFa3XVBCavY2PPrJyegfZPmBy3RtN356MFT7vRzU7sdUiYysDHlzpsvvSxmNLhO4NWyPYVRt00XKlNCJfK';

// Payment data - will be loaded from Supabase
let remainingBalancePaymentData = {
    totalBalance: 0,
    depositAmount: 0,
    remainingBalance: 0,
    dueDate: "",
    clientId: null,
    eventDate: null
};

// Load payment data from Supabase
async function loadRemainingBalancePaymentData() {
    // Get client ID from URL (required)
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id');
    
    if (!clientId) {
        console.error('No client_id parameter found in URL');
        alert('Invalid link: Missing client ID. Please use the link provided by your event coordinator.');
        return false;
    }
    
    remainingBalancePaymentData.clientId = clientId;
    
    // Load from Supabase
    if (window.supabaseHelpers && window.supabaseHelpers.getClientData) {
        const clientData = await window.supabaseHelpers.getClientData(clientId);
        
        console.log('Client data loaded from Supabase:', clientData);
        
        if (!clientData) {
            console.error('Client not found in database');
            alert('Client not found. Please verify the link is correct.');
            return false;
        }
        
        // Get amounts
        const totalBalance = clientData.total_balance ? parseFloat(clientData.total_balance) : 0;
        const depositAmount = clientData.deposit_amount ? parseFloat(clientData.deposit_amount) : 0;
        const remainingBalance = totalBalance - depositAmount;
        
        remainingBalancePaymentData.totalBalance = totalBalance;
        remainingBalancePaymentData.depositAmount = depositAmount;
        remainingBalancePaymentData.remainingBalance = remainingBalance;
        
        // Calculate payment due date (2 weeks before event date)
        if (clientData.event_date) {
            const eventDate = new Date(clientData.event_date + 'T00:00:00');
            remainingBalancePaymentData.eventDate = eventDate;
            
            // Subtract 14 days (2 weeks)
            const dueDate = new Date(eventDate);
            dueDate.setDate(dueDate.getDate() - 14);
            
            // Format as MM/DD/YYYY
            const month = String(dueDate.getMonth() + 1).padStart(2, '0');
            const day = String(dueDate.getDate()).padStart(2, '0');
            const year = dueDate.getFullYear();
            remainingBalancePaymentData.dueDate = `${month}/${day}/${year}`;
            
            console.log('Payment due date calculated:', {
                eventDate: clientData.event_date,
                dueDate: remainingBalancePaymentData.dueDate
            });
        } else {
            remainingBalancePaymentData.dueDate = "TBD";
            console.warn('No event_date found in client data');
        }
        
        console.log('Remaining balance payment data loaded:', remainingBalancePaymentData);
        return true;
    } else {
        console.warn('Supabase helpers not available');
        return false;
    }
}

let stripeRemainingBalance = null;
let elementsRemainingBalance = null;
let cardElementRemainingBalance = null;
let paymentIntentClientSecretRemainingBalance = null;

async function showRemainingBalancePayment() {
    // Load payment data from Supabase before showing form
    const loaded = await loadRemainingBalancePaymentData();
    if (!loaded) {
        return;
    }
    
    // Check if remaining balance is 0 or negative
    if (remainingBalancePaymentData.remainingBalance <= 0) {
        alert('You have no remaining balance to pay. Thank you!');
        return;
    }
    
    console.log('Remaining Balance Payment Data loaded:', remainingBalancePaymentData);
    
    // Create payment modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'remainingBalancePaymentOverlay';
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
    title.textContent = 'Remaining Balance Payment';
    content.appendChild(title);
    
    // Description
    const description = document.createElement('div');
    description.style.cssText = 'text-align: center; color: #666; margin-top: 10px; margin-bottom: 30px; font-size: 16px; line-height: 1.6; padding: 0 20px;';
    description.innerHTML = `
        <p>Please review your payment summary below. The remaining balance is the total amount due minus any deposit already paid.</p>
    `;
    content.appendChild(description);
    
    // Payment summary
    const paymentSummary = document.createElement('div');
    paymentSummary.className = 'payment-summary';
    paymentSummary.style.cssText = 'margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; border: 1px solid #e0e0e0;';
    paymentSummary.innerHTML = `
        <div class="payment-row" style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
            <span class="payment-label" style="font-weight: 600; color: #333;">Total Balance:</span>
            <span class="payment-value" style="font-weight: 600; color: #333;">$${remainingBalancePaymentData.totalBalance.toFixed(2)}</span>
        </div>
        <div class="payment-row" style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
            <span class="payment-label" style="font-weight: 600; color: #333;">Deposit Paid:</span>
            <span class="payment-value" style="font-weight: 600; color: #28a745;">$${remainingBalancePaymentData.depositAmount.toFixed(2)}</span>
        </div>
        <div class="payment-row" style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid #1a9e8e;">
            <span class="payment-label" style="font-weight: 700; color: #1a9e8e; font-size: 18px;">Remaining Balance:</span>
            <span class="payment-value" style="font-weight: 700; color: #1a9e8e; font-size: 18px;">$${remainingBalancePaymentData.remainingBalance.toFixed(2)}</span>
        </div>
        <div class="payment-due-date" style="margin-top: 16px; text-align: center; color: #666; font-size: 14px;">
            <strong>Payment Due By:</strong> ${remainingBalancePaymentData.dueDate}
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
    
    // Card element container
    const cardContainer = document.createElement('div');
    cardContainer.id = 'card-element-remaining-balance';
    cardContainer.className = 'stripe-card-element';
    paymentForm.appendChild(cardContainer);
    
    // Cardholder name field
    const nameField = document.createElement('div');
    nameField.className = 'form-field';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Cardholder Name';
    nameLabel.setAttribute('for', 'cardholder-name-remaining-balance');
    nameField.appendChild(nameLabel);
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'cardholder-name-remaining-balance';
    nameInput.className = 'event-detail-input';
    nameInput.placeholder = 'John Doe';
    nameField.appendChild(nameInput);
    paymentForm.appendChild(nameField);
    
    content.appendChild(paymentForm);
    overlay.appendChild(content);
    
    // Initialize Stripe AFTER elements are in the DOM
    setTimeout(() => {
        if (typeof Stripe !== 'undefined') {
            try {
                stripeRemainingBalance = Stripe(STRIPE_PUBLISHABLE_KEY);
                elementsRemainingBalance = stripeRemainingBalance.elements();
                
                // Create card element
                cardElementRemainingBalance = elementsRemainingBalance.create('card', {
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
                
                // Mount card element
                const cardElementDom = document.getElementById('card-element-remaining-balance');
                if (cardElementDom) {
                    cardElementRemainingBalance.mount('#card-element-remaining-balance');
                    
                    // Handle real-time validation errors
                    cardElementRemainingBalance.on('change', function(event) {
                        const errorElement = document.getElementById('card-errors-remaining-balance');
                        if (event.error) {
                            if (!errorElement) {
                                const errorDiv = document.createElement('div');
                                errorDiv.id = 'card-errors-remaining-balance';
                                errorDiv.className = 'stripe-error';
                                paymentForm.appendChild(errorDiv);
                            }
                            document.getElementById('card-errors-remaining-balance').textContent = event.error.message;
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
            const errorMsg = document.createElement('div');
            errorMsg.className = 'stripe-error';
            errorMsg.textContent = 'Payment system is loading. Please refresh the page if this message persists.';
            paymentForm.appendChild(errorMsg);
        }
    }, 100);
    
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'pre-onboarding-button-container';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'pre-onboarding-button secondary';
    closeButton.textContent = 'Cancel';
    closeButton.onclick = () => {
        const overlay = document.getElementById('remainingBalancePaymentOverlay');
        if (overlay) {
            overlay.remove();
        }
    };
    buttonContainer.appendChild(closeButton);
    
    const payButton = document.createElement('button');
    payButton.className = 'pre-onboarding-button primary';
    payButton.textContent = `Pay $${remainingBalancePaymentData.remainingBalance.toFixed(2)}`;
    payButton.onclick = () => handleRemainingBalancePayment();
    buttonContainer.appendChild(payButton);
    
    content.appendChild(buttonContainer);
    
    overlay.appendChild(content);
}

async function handleRemainingBalancePayment() {
    const payButton = document.querySelector('.pre-onboarding-button.primary');
    const cardholderName = document.getElementById('cardholder-name-remaining-balance');
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
    if (!stripeRemainingBalance || !cardElementRemainingBalance) {
        alert('Payment system is not ready. Please refresh the page and try again.');
        return;
    }
    
    // Disable button and show loading state
    if (payButton) {
        payButton.disabled = true;
        payButton.textContent = 'Processing...';
    }
    
    try {
        // Convert remaining balance to cents
        const amountInCents = Math.round(remainingBalancePaymentData.remainingBalance * 100);
        
        // Create PaymentIntent
        const paymentIntentResponse = await createRemainingBalancePaymentIntent(amountInCents, cardholderNameValue);
        
        if (!paymentIntentResponse || !paymentIntentResponse.clientSecret) {
            throw new Error('Failed to create payment intent. Please try again.');
        }
        
        paymentIntentClientSecretRemainingBalance = paymentIntentResponse.clientSecret;
        
        // Confirm payment with Stripe
        const { error, paymentIntent } = await stripeRemainingBalance.confirmCardPayment(
            paymentIntentClientSecretRemainingBalance,
            {
                payment_method: {
                    card: cardElementRemainingBalance,
                    billing_details: {
                        name: cardholderNameValue,
                    },
                },
            }
        );
        
        if (error) {
            // Show error to user
            const errorElement = document.getElementById('card-errors-remaining-balance') || document.createElement('div');
            errorElement.id = 'card-errors-remaining-balance';
            errorElement.className = 'stripe-error';
            errorElement.textContent = error.message;
            if (!document.getElementById('card-errors-remaining-balance')) {
                const paymentForm = document.querySelector('.payment-form-container');
                if (paymentForm) {
                    paymentForm.appendChild(errorElement);
                }
            }
            
            // Re-enable button
            if (payButton) {
                payButton.disabled = false;
                payButton.textContent = `Pay $${remainingBalancePaymentData.remainingBalance.toFixed(2)}`;
            }
            return;
        }
        
        if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Payment succeeded - update Supabase
            if (remainingBalancePaymentData.clientId && window.supabaseHelpers && window.supabaseHelpers.updateClient) {
                // Update total_balance to reflect full payment (or mark as fully paid)
                // We could add a field like "remaining_balance_paid" or just update total_balance
                // For now, we'll update a note or add metadata
                const updateSuccess = await window.supabaseHelpers.updateClient(remainingBalancePaymentData.clientId, {
                    payment_intent_id: paymentIntent.id
                    // Note: We could add a field to track remaining balance payment
                });
                
                if (!updateSuccess) {
                    console.warn('Payment succeeded but failed to update Supabase. Payment Intent ID:', paymentIntent.id);
                } else {
                    console.log('Remaining balance payment and database update successful:', paymentIntent.id);
                }
            }
            
            // Hide payment overlay
            const overlay = document.getElementById('remainingBalancePaymentOverlay');
            if (overlay) {
                overlay.remove();
            }
            
            // Show success message
            alert('Payment successful! Your remaining balance has been processed. Thank you!');
            
            // Reload page to update any displayed information
            window.location.reload();
        } else {
            throw new Error(`Payment was not successful. Status: ${paymentIntent?.status || 'unknown'}. Please try again.`);
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        alert(error.message || 'An error occurred processing your payment. Please try again.');
        
        // Re-enable button
        if (payButton) {
            payButton.disabled = false;
            payButton.textContent = `Pay $${remainingBalancePaymentData.remainingBalance.toFixed(2)}`;
        }
    }
}

// Function to create PaymentIntent via backend API
async function createRemainingBalancePaymentIntent(amountInCents, cardholderName) {
    if (!window.PAYMENT_INTENT_API_URL) {
        throw new Error('Payment API endpoint not configured.');
    }

    try {
        const response = await fetch(window.PAYMENT_INTENT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amountInCents,
                currency: 'usd',
                clientId: remainingBalancePaymentData.clientId,
                metadata: {
                    cardholder_name: cardholderName,
                    payment_type: 'remaining_balance'
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

// Expose function globally
window.showRemainingBalancePayment = showRemainingBalancePayment;

