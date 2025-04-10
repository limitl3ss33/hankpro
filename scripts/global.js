// Function to initialize the hamburger menu functionality
function initializeHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    // Debug log to check if elements are found
    console.log('Hamburger element:', hamburger);
    console.log('Nav links element:', navLinks);

    if (hamburger && navLinks) {
        // Add click event listener for desktop and mobile
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Add touch event listener for mobile devices
        hamburger.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            navLinks.classList.toggle('active');
        });
    } else {
        console.warn('Hamburger menu elements not found. Retrying...');
        return false; // Indicate failure to find elements
    }
    return true; // Indicate success
}

// Function to poll for the hamburger menu elements until they are found
function waitForHamburgerMenu() {
    const maxAttempts = 20; // Maximum number of attempts to find the elements
    let attempts = 0;

    const interval = setInterval(() => {
        attempts++;
        if (initializeHamburgerMenu()) {
            clearInterval(interval); // Stop polling once elements are found and initialized
        } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.error('Hamburger menu elements not found after maximum attempts. Ensure #hamburger and #nav-links exist in the DOM.');
        }
    }, 100); // Check every 100ms
}

// Start polling for the hamburger menu elements
waitForHamburgerMenu();