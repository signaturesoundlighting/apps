// Setup drag and drop with improved mobile support
function setupDragAndDrop() {
    const container = document.getElementById('eventList');
    
    // Desktop drag events
    container.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('event-card')) {
            draggedElement = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }
    });
    
    container.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('event-card')) {
            e.target.classList.remove('dragging');
            draggedElement = null;
        }
    });
    
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        const dragging = document.querySelector('.dragging');
        
        if (dragging) {
            if (afterElement == null) {
                container.appendChild(dragging);
            } else {
                container.insertBefore(dragging, afterElement);
            }
        }
    });
    
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        updateEventOrder();
        showSaveIndicator();
    });

    // Mobile touch events
    const cards = container.querySelectorAll('.event-card');
    cards.forEach(card => {
        const dragHandle = card.querySelector('.drag-handle');
        
        // Skip if no drag handle (non-draggable card like End of Wedding)
        if (!dragHandle) {
            // Still allow click to open modal
            card.addEventListener('click', (e) => {
                if (!isDragging) {
                    const id = parseInt(card.getAttribute('data-id'));
                    openModal(id);
                }
            });
            return;
        }

        // Click to open modal (for desktop and quick taps on mobile)
        let tapStartTime = 0;
        let tapStartY = 0;
        let tapStartX = 0;
        let hasMoved = false;
        
        card.addEventListener('click', (e) => {
            // Only open modal if:
            // 1. Not currently dragging
            // 2. User tapped quickly (didn't drag)
            // 3. Didn't click on the drag handle specifically
            if (!isDragging && !hasMoved && !e.target.classList.contains('drag-handle')) {
                const id = parseInt(card.getAttribute('data-id'));
                openModal(id);
            }
        });

        // Make drag handle draggable on desktop
        dragHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            card.draggable = true;
        });

        dragHandle.addEventListener('mouseup', () => {
            setTimeout(() => {
                card.draggable = false;
            }, 100);
        });

        // Mobile touch events on entire card (not just drag handle)
        card.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            // Don't preventDefault here - allow scrolling until drag actually starts
            
            const rect = card.getBoundingClientRect();
            touchStartY = e.touches[0].clientY;
            tapStartY = touchStartY;
            tapStartX = e.touches[0].clientX;
            tapStartTime = Date.now();
            hasMoved = false;
            initialCardTop = rect.top;
            // Calculate offset inside the card so the finger stays anchored
            const offsetWithinCard = touchStartY - rect.top;
            card.__offsetWithinCard = offsetWithinCard;
            
            // Start long press timer (more responsive on mobile)
            longPressTimer = setTimeout(() => {
                // Only prevent default and start dragging after long press completes
                isDragging = true;
                draggedCard = card;
                card.classList.add('drag-ready');
                // Create placeholder to preserve layout
                placeholder = document.createElement('div');
                placeholder.style.height = rect.height + 'px';
                placeholder.style.marginBottom = getComputedStyle(card).marginBottom;
                placeholder.className = 'event-card-placeholder';
                card.parentNode.insertBefore(placeholder, card.nextSibling);
                // Elevate card and make it follow the finger
                card.style.position = 'fixed';
                card.style.width = rect.width + 'px';
                card.style.left = rect.left + 'px';
                card.style.top = (touchStartY - card.__offsetWithinCard) + 'px';
                card.style.zIndex = '1000';
                
                // Vibrate if supported
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, 120);
        }, { passive: true });

        let moveQueued = false;
        card.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].clientY;
            const currentX = e.touches[0].clientX;
            
            // Check if user has moved significantly (more than a tap)
            const moveY = Math.abs(currentY - tapStartY);
            const moveX = Math.abs(currentX - tapStartX);
            if (moveY > 10 || moveX > 10) {
                hasMoved = true;
            }
            
            // If moved before long press completes, cancel drag timer and allow scrolling
            if (!isDragging) {
                clearTimeout(longPressTimer);
                // Allow normal scrolling if user moved significantly before drag started
                return; // Don't preventDefault - allow scrolling
            }

            // Only prevent default scrolling once dragging has actually started
            e.preventDefault();
            currentTouchY = currentY;
            if (moveQueued) return; // throttle with rAF for smoother updates
            moveQueued = true;
            requestAnimationFrame(() => {
                // Move the card to follow the finger
                card.style.top = (currentTouchY - (card.__offsetWithinCard || 0)) + 'px';
                card.classList.add('dragging');

                // Find where to insert based on current touch position
                const afterElement = getDragAfterElement(container, currentTouchY);
                if (afterElement == null) {
                    if (placeholder.parentNode !== container || placeholder.nextSibling != null) {
                        container.appendChild(placeholder);
                    }
                } else {
                    if (placeholder.nextSibling !== afterElement) {
                        container.insertBefore(placeholder, afterElement);
                    }
                }

                // Auto-scroll when near viewport edges (slower)
                const edge = 80; // px
                if (currentTouchY > window.innerHeight - edge) {
                    window.scrollBy(0, 3);
                } else if (currentTouchY < edge) {
                    window.scrollBy(0, -3);
                }
                moveQueued = false;
            });
        }, { passive: false });

        card.addEventListener('touchend', (e) => {
            clearTimeout(longPressTimer);
            
            if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
                
                // Drop: place card at placeholder position
                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.insertBefore(card, placeholder);
                }
                // Clear drag styles
                card.style.position = '';
                card.style.width = '';
                card.style.left = '';
                card.style.top = '';
                card.style.zIndex = '';
                card.classList.remove('drag-ready', 'dragging');
                // Remove placeholder
                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.removeChild(placeholder);
                }
                placeholder = null;
                card.__offsetWithinCard = null;

                updateEventOrder();
                showSaveIndicator();
                
                isDragging = false;
                draggedCard = null;
            }
            
            // Reset tap tracking
            hasMoved = false;
            tapStartTime = 0;
        }, { passive: false });

        card.addEventListener('touchcancel', () => {
            clearTimeout(longPressTimer);
            if (draggedCard) {
                // Revert styles
                draggedCard.style.position = '';
                draggedCard.style.width = '';
                draggedCard.style.left = '';
                draggedCard.style.top = '';
                draggedCard.style.zIndex = '';
                draggedCard.classList.remove('drag-ready', 'dragging');
            }
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.removeChild(placeholder);
            }
            placeholder = null;
            isDragging = false;
            draggedCard = null;
            hasMoved = false;
            tapStartTime = 0;
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.event-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
