// Initialize the app
function init() {
    renderEvents();
    setupDragAndDrop();
    if (typeof updateOverallProgress === 'function') updateOverallProgress();
    if (typeof updateGeneralInfoCard === 'function') updateGeneralInfoCard();
}

// Check pre-onboarding requirements (service agreement & deposit) before onboarding
function checkPreOnboardingRequirements() {
    // Check if service agreement has been signed
    if (typeof checkServiceAgreementStatus === 'function' && !checkServiceAgreementStatus()) {
        if (typeof showServiceAgreement === 'function') {
            showServiceAgreement();
        }
        return;
    }
    
    // Check if deposit has been paid
    if (typeof checkDepositPaymentStatus === 'function' && !checkDepositPaymentStatus()) {
        if (typeof showDepositPayment === 'function') {
            showDepositPayment();
        }
        return;
    }
    
    // If both requirements are met, proceed to onboarding
    if (typeof checkIfOnboardingNeeded === 'function') {
        checkIfOnboardingNeeded();
    }
}

// Check pre-onboarding requirements on page load
checkPreOnboardingRequirements();

// Initialize on load
init();
