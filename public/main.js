window.onbeforeunload = function() {
    window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', function() {
    window.scrollTo(0, 0);
});



function loadImages() {

    const logo = document.querySelector('.logo img');
    logo.src = imageData.logo;

    const location_icon = document.querySelector('.location-icon img');
    location_icon.src = imageData.location_icon;

    const down_arrow = document.querySelector('.full-portfolio-arrow-icon img');
    down_arrow.src = imageData.down_arrow;

}

function loadSwiper() {
    // Check if Swiper is available
    if (typeof Swiper !== 'undefined') {
        var swiper = new Swiper(".mySwiper", {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: true,
              },
            navigation: {
              nextEl: ".right-button",
              prevEl: ".left-button",
            },
          });
    } else {
        // If Swiper isn't ready yet, wait a bit and try again
        setTimeout(loadSwiper, 100);
    }
}

// Wait for DOM to be ready, then initialize Swiper
document.addEventListener('DOMContentLoaded', function() {
    loadSwiper();
    initializeHeaderButtonVisibility();
    initializeFavicon();
});

function initializeFavicon() {
    // Check if user prefers light mode
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    // Get the favicon link element
    let favicon = document.querySelector('link[rel="icon"]');
    
    if (!favicon) {
        // Create favicon link if it doesn't exist
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
    }
    
    // Set the appropriate favicon based on color scheme
    if (prefersLight) {
        // For light mode, we'll invert the white logo
        favicon.href = 'graphics/pls_logo.svg';
    } else {
        // For dark mode, use the original white logo
        favicon.href = 'graphics/pls_logo_white.png';
    }
    
    // Listen for changes in color scheme preference
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (e.matches) {
            favicon.href = 'graphics/pls_logo.svg';
        } else {
            favicon.href = 'graphics/pls_logo_white.png';
        }
    });
}

function initializeHeaderButtonVisibility() {
    const headerButton = document.getElementById('header-book-with-button');
    const frameButton = document.querySelector('.book-with-button-frame');
    
    // Check if both elements exist
    if (!headerButton || !frameButton) {
        console.warn('Header button or frame button not found');
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Frame button is visible, hide header button
                headerButton.style.opacity = '0';
                headerButton.style.pointerEvents = 'none';
                headerButton.style.transition = 'opacity 0.1s ease-in-out';
            } else {
                // Frame button is not visible, show header button
                headerButton.style.opacity = '1';
                headerButton.style.pointerEvents = 'auto';
                headerButton.style.transition = 'opacity 0.6s ease-in';
            }
        });
    }, {
        threshold: 0.2, // Trigger when 10% of the frame is visible
        rootMargin: '0px 0px -10% 0px' // Add some margin to trigger earlier
    });
    
    observer.observe(frameButton);
}



/*document.getElementById("homeButton").addEventListener("click", (e) => {
    e.preventDefault(); // stops default anchor scroll
    window.location.href = "#"; // instant jump
  });



/*
document.getElementById("scrollLink").addEventListener("click", (e) => {
    e.preventDefault(); // prevent URL # update
    document.getElementById("shoot-component").scrollIntoView({ behavior: "smooth" });
  });
*/