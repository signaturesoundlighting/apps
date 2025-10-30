// Initialize the app
function init() {
    renderEvents();
    setupDragAndDrop();
    if (typeof updateOverallProgress === 'function') updateOverallProgress();
}

// Initialize on load
init();
