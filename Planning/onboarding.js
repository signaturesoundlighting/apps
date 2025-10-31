// Onboarding tutorial system

let currentOnboardingStep = 0;
const onboardingSteps = [
    {
        title: "Congratulations! You're one step closer to an awesome wedding day",
        subtitle: "Ready to start planning? Here's how our planning app works...",
        buttonText: "Get Started",
        showConfetti: true
    },
    {
        title: "Click on events to fill in details or delete them",
        subtitle: "",
        buttonText: "Next",
        showConfetti: false
    },
    {
        title: "Re-order events by clicking and dragging",
        subtitle: "",
        buttonText: "Next",
        showConfetti: false
    },
    {
        title: "See your progress and how many days you have left to complete everything",
        subtitle: "",
        buttonText: "Get Started!",
        showConfetti: false
    }
];

function checkIfOnboardingNeeded() {
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
        showOnboarding();
    } else {
        // Hide onboarding overlay if it exists
        const overlay = document.getElementById('onboardingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
}

function showOnboarding() {
    // Create onboarding overlay
    const overlay = document.createElement('div');
    overlay.id = 'onboardingOverlay';
    overlay.className = 'onboarding-overlay';
    document.body.appendChild(overlay);
    
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
    
    // Add confetti if needed
    if (stepData.showConfetti) {
        createConfetti();
    }
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'onboarding-content';
    
    const title = document.createElement('h1');
    title.className = 'onboarding-title';
    title.textContent = stepData.title;
    
    content.appendChild(title);
    
    if (stepData.subtitle) {
        const subtitle = document.createElement('h2');
        subtitle.className = 'onboarding-subtitle';
        subtitle.textContent = stepData.subtitle;
        content.appendChild(subtitle);
    }
    
    const button = document.createElement('button');
    button.className = 'onboarding-button';
    button.textContent = stepData.buttonText;
    button.onclick = () => handleOnboardingNext();
    content.appendChild(button);
    
    overlay.appendChild(content);
}

function handleOnboardingNext() {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
        showOnboardingStep(currentOnboardingStep + 1);
    } else {
        // Finish onboarding
        localStorage.setItem('hasSeenOnboarding', 'true');
        const overlay = document.getElementById('onboardingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        // Remove confetti
        const confettiContainer = document.getElementById('confettiContainer');
        if (confettiContainer) {
            confettiContainer.remove();
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
    
    // Remove confetti after animation
    setTimeout(() => {
        if (confettiContainer.parentNode) {
            confettiContainer.remove();
        }
    }, 5000);
}

// Export functions for global access
window.checkIfOnboardingNeeded = checkIfOnboardingNeeded;
window.showOnboardingStep = showOnboardingStep;
window.handleOnboardingNext = handleOnboardingNext;

