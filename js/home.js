// Home page specific JavaScript

import { updateNavigation, isLoggedIn, getCurrentUser } from './main.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log("Home page initialized");
    
    // Ensure navigation is updated for the home page
    if (isLoggedIn()) {
        console.log("User is logged in on home page");
        
        // Force navigation update for home page
        setTimeout(() => {
            updateNavigation();
            console.log("Navigation update triggered for home page");
        }, 100);
    } else {
        console.log("No logged in user detected on home page");
    }
    
    // Add testimonial slider functionality
    initTestimonialSlider();
});

// Initialize testimonial slider
function initTestimonialSlider() {
    const prevBtn = document.getElementById('testimonial-prev');
    const nextBtn = document.getElementById('testimonial-next');
    const slider = document.getElementById('testimonials-slider');
    
    if (prevBtn && nextBtn && slider) {
        let slidePosition = 0;
        const testimonials = slider.querySelectorAll('.testimonial');
        const testimonialWidth = testimonials[0].offsetWidth + 25; // add gap
        
        nextBtn.addEventListener('click', () => {
            if (slidePosition > -(testimonials.length - 2) * testimonialWidth) {
                slidePosition -= testimonialWidth;
                slider.style.transform = `translateX(${slidePosition}px)`;
                slider.style.transition = 'transform 0.4s ease-in-out';
            }
        });
        
        prevBtn.addEventListener('click', () => {
            if (slidePosition < 0) {
                slidePosition += testimonialWidth;
                slider.style.transform = `translateX(${slidePosition}px)`;
                slider.style.transition = 'transform 0.4s ease-in-out';
            }
        });
    }
}
