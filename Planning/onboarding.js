// Onboarding tutorial system

let currentOnboardingStep = 0;
const onboardingSteps = [
    {
        title: "Congratulations!",
        subtitle: "You're one step closer to an awesome wedding!  Let's start with a quick walkthrough of your planning app",
        buttonText: "Get Started",
        showConfetti: true
    },
    {
        title: "Click on events",
        subtitle: "To see the details, answer questions, or delete any events",
        image: "../images/103025-instructions/1-instructions.jpg",
        buttonText: "Next",
        showConfetti: false
    },
    {
        title: "Click and drag",
        subtitle: "To re-order events",
        image: "../images/103025-instructions/2-instructions.jpg",
        buttonText: "Next",
        showConfetti: false
    },
    {
        title: "Click plus",
        subtitle: "To add custom events",
        image: "../images/103025-instructions/3-instructions.jpg",
        buttonText: "Next",
        showConfetti: false
    },
    {
        title: "Track your progress",
        subtitle: "To make your wedding day amazing!",
        image: "../images/103025-instructions/4-instructions.jpg",
        buttonText: "Let's Go!",
        showConfetti: false
    }
];

async function checkIfOnboardingNeeded() {
    // Check if user has seen onboarding before
    // First check Supabase, then localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id') || localStorage.getItem('currentClientId');
    
    let hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';
    
    // Check Supabase if client ID exists
    if (clientId && window.supabaseHelpers && window.supabaseHelpers.getClientData) {
        const clientData = await window.supabaseHelpers.getClientData(clientId);
        if (clientData && clientData.onboarding_completed) {
            hasSeenOnboarding = true;
        }
    }
    
    if (!hasSeenOnboarding) {
        showOnboarding();
    } else {
        // Hide onboarding overlay if it exists
        const overlay = document.getElementById('onboardingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        // Initialize main app if onboarding already completed
        if (typeof init === 'function') {
            init();
        }
    }
}

function showOnboarding() {
    // Create onboarding overlay
    const overlay = document.createElement('div');
    overlay.id = 'onboardingOverlay';
    overlay.className = 'onboarding-overlay';
    document.body.appendChild(overlay);
    
    // Start confetti immediately
    createConfetti();
    
    // Show first step
    showOnboardingStep(0);
}

function showOnboardingStep(step) {
    currentOnboardingStep = step;
    const stepData = onboardingSteps[step];
    const overlay = document.getElementById('onboardingOverlay');
    
    if (!overlay) return;
    
    // Clear existing content
    overlay.innerHTML = '';
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'onboarding-content';
    
    if (stepData.title) {
        const title = document.createElement('h1');
        title.className = 'onboarding-title';
        title.textContent = stepData.title;
        content.appendChild(title);
    }
    
    if (stepData.subtitle) {
        const subtitle = document.createElement('h2');
        subtitle.className = 'onboarding-subtitle';
        subtitle.textContent = stepData.subtitle;
        content.appendChild(subtitle);
    }
    
    if (stepData.image) {
        const image = document.createElement('img');
        image.className = 'onboarding-image';
        image.src = stepData.image;
        image.alt = 'Instructions';
        content.appendChild(image);
    }
    
    const button = document.createElement('button');
    button.className = 'onboarding-button';
    button.textContent = stepData.buttonText;
    button.onclick = () => handleOnboardingNext();
    content.appendChild(button);
    
    overlay.appendChild(content);
}

async function handleOnboardingNext() {
    // Stop confetti when "Get Started" button is clicked (step 0)
    if (currentOnboardingStep === 0) {
        const confettiContainer = document.getElementById('confettiContainer');
        if (confettiContainer) {
            confettiContainer.remove();
        }
    }
    
    if (currentOnboardingStep < onboardingSteps.length - 1) {
        showOnboardingStep(currentOnboardingStep + 1);
    } else {
        // Finish onboarding - mark as complete in Supabase
        localStorage.setItem('hasSeenOnboarding', 'true');
        
        // Get client ID and update in Supabase
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('client_id') || localStorage.getItem('currentClientId');
        
        if (clientId && window.supabaseHelpers && window.supabaseHelpers.updateClient) {
            try {
                await window.supabaseHelpers.updateClient(clientId, {
                    onboarding_completed: true
                });
            } catch (error) {
                console.error('Error updating onboarding status:', error);
            }
        }
        
        const overlay = document.getElementById('onboardingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        // Remove confetti
        const confettiContainer = document.getElementById('confettiContainer');
        if (confettiContainer) {
            confettiContainer.remove();
        }
        
        // Now that onboarding is complete, initialize the main app
        if (typeof init === 'function') {
            init();
        }
    }
}

function createConfetti() {
    // Remove existing confetti
    const existing = document.getElementById('confettiContainer');
    if (existing) {
        existing.remove();
    }
    
    const confettiContainer = document.createElement('div');
    confettiContainer.id = 'confettiContainer';
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    // Create confetti particles
    const colors = ['#1a9e8e', '#ff6b6b', '#4ecdc4', '#ffe66d', '#95afc0'];
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 5;
        const left = Math.random() * 100;
        const animationDelay = Math.random() * 0.5;
        const animationDuration = Math.random() * 2 + 2;
        
        particle.style.backgroundColor = color;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = left + '%';
        particle.style.animationDelay = animationDelay + 's';
        particle.style.animationDuration = animationDuration + 's';
        
        confettiContainer.appendChild(particle);
    }
    
    // Confetti will continue until stopped manually (no auto-remove timeout)
}

// Helper function to reset onboarding (useful for testing)
function resetOnboarding() {
    localStorage.removeItem('hasSeenOnboarding');
    showOnboarding();
}

// Export functions for global access
window.checkIfOnboardingNeeded = checkIfOnboardingNeeded;
window.showOnboardingStep = showOnboardingStep;
window.handleOnboardingNext = handleOnboardingNext;
window.resetOnboarding = resetOnboarding;

