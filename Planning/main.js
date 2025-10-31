// Initialize the app
function init() {
    renderEvents();
    setupDragAndDrop();
    if (typeof updateOverallProgress === 'function') updateOverallProgress();
    if (typeof updateGeneralInfoCard === 'function') updateGeneralInfoCard();
}

// Check if onboarding is needed on page load
if (typeof checkIfOnboardingNeeded === 'function') {
    checkIfOnboardingNeeded();
}

// Initialize on load
init();
