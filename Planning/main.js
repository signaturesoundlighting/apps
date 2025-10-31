// Initialize the app
function init() {
    renderEvents();
    setupDragAndDrop();
    if (typeof updateOverallProgress === 'function') updateOverallProgress();
    if (typeof updateGeneralInfoCard === 'function') updateGeneralInfoCard();
}

// Check pre-onboarding requirements (service agreement & deposit) before onboarding
async function checkPreOnboardingRequirements() {
    // Check if service agreement has been signed
    if (typeof checkServiceAgreementStatus === 'function') {
        const agreementStatus = await checkServiceAgreementStatus();
        if (!agreementStatus) {
            if (typeof showServiceAgreement === 'function') {
                await showServiceAgreement();
            }
            return;
        }
    }
    
    // Check if deposit has been paid
    if (typeof checkDepositPaymentStatus === 'function') {
        const depositStatus = await checkDepositPaymentStatus();
        if (!depositStatus) {
            if (typeof showDepositPayment === 'function') {
                await showDepositPayment();
            }
            return;
        }
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
