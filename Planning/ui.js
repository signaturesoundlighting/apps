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
    card.innerHTML = `
        <div class="event-content">
            <div class="event-name">${event.name}</div>
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
