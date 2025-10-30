// Initialize the app
function init() {
    renderEvents();
    setupDragAndDrop();
    if (typeof updateOverallProgress === 'function') updateOverallProgress();
    if (typeof updateGeneralInfoCard === 'function') updateGeneralInfoCard();
}

// Initialize on load
init();
