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
                delay: 4200,
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
});



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