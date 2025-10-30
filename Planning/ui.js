// Render all events
function renderEvents() {
    const container = document.getElementById('eventList');
    container.innerHTML = '';
    
    events.forEach(event => {
        const card = createEventCard(event);
        container.appendChild(card);
    });
}

// Create an event card
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card' + (event.type === 'end-of-wedding' ? ' end-final' : '');
    card.setAttribute('data-id', event.id);
    card.setAttribute('data-type', event.type);
    
    const dragHtml = event.type === 'end-of-wedding' ? '' : '<div class="drag-handle">☰</div>';
    // Compute required completion summary
    const completion = (typeof computeEventCompletion === 'function') ? computeEventCompletion(event) : { done: 0, total: 0 };
    const reqHtml = `<div class="req-indicator"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm2-7.5c0 1.54-1 2.14-1.8 2.6-.72.41-1.2.69-1.2 1.4V14h-2v-.7c0-1.5 1-2.1 1.8-2.6.72-.41 1.2-.69 1.2-1.4 0-.83-.67-1.5-1.5-1.5S9 7.47 9 8.3H7c0-2 1.8-3.3 4-3.3s4 1.35 4 3.5z"/></svg>${completion.done}/${completion.total}</div>`;
    card.innerHTML = `
        <div class="event-content">
            <div class="event-name">${event.name}</div>
            ${reqHtml}
            <div class="event-time">${event.time}</div>
        </div>
        ${dragHtml}
    `;
    
    return card;
}

function updateEventOrder() {
    const cards = document.querySelectorAll('.event-card');
    const newOrder = [];
    
    cards.forEach(card => {
        const id = parseInt(card.getAttribute('data-id'));
        const event = events.find(e => e.id === id);
        if (event) {
            newOrder.push(event);
        }
    });
    
    events = newOrder;
    // Here you would sync with Airtable
}
