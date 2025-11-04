// Completion screen for non-wedding events

async function showCompletionScreen() {
    // Get client ID from URL to check event date
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id');
    
    // Determine if event date has passed
    let eventDatePassed = false;
    if (clientId && window.supabaseHelpers && window.supabaseHelpers.getClientData) {
        const clientData = await window.supabaseHelpers.getClientData(clientId);
        if (clientData && clientData.event_date) {
            const eventDate = new Date(clientData.event_date + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            eventDatePassed = eventDate < today;
        }
    }
    
    // Create completion screen overlay
    const overlay = document.createElement('div');
    overlay.id = 'completionScreenOverlay';
    overlay.className = 'pre-onboarding-overlay';
    document.body.appendChild(overlay);
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'pre-onboarding-content';
    content.style.cssText = 'max-width: 600px; text-align: center;';
    
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
    title.textContent = "You're all set!";
    title.style.cssText = 'margin-top: 30px; margin-bottom: 20px; color: #1a9e8e;';
    content.appendChild(title);
    
    // Message - different text based on whether event date has passed
    const message = document.createElement('p');
    message.className = 'completion-message';
    if (eventDatePassed) {
        message.textContent = "It was a pleasure being a part of your event! Let us know if there's anything we can help you with in the future";
    } else {
        message.textContent = "We're super excited to be a part of your event. Let us know if there are any songs, events, or special requests we should prepare";
    }
    message.style.cssText = 'font-size: 18px; color: #666; line-height: 1.6; margin-bottom: 40px; padding: 0 20px;';
    content.appendChild(message);
    
    // Contact information (optional - can add if needed)
    const contactInfo = document.createElement('div');
    contactInfo.style.cssText = 'margin-top: 30px; padding-top: 30px; border-top: 1px solid #e9ecef;';
    contactInfo.innerHTML = `
        <p style="color: #999; font-size: 14px; margin-bottom: 10px;">Need to make changes or have questions?</p>
        <p style="color: #1a9e8e; font-size: 16px; font-weight: 600;">Contact your event coordinator</p>
    `;
    content.appendChild(contactInfo);
    
    overlay.appendChild(content);
    
    // Hide the main app content and header
    const header = document.querySelector('.header');
    if (header) {
        header.style.display = 'none';
    }
    
    const mainApp = document.querySelector('.app-container, .event-list, main, .general-info-section');
    if (mainApp) {
        mainApp.style.display = 'none';
    }
}

// Export for global access
window.showCompletionScreen = showCompletionScreen;

