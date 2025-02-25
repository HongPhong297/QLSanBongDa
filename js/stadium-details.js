// Stadium details and booking functionality

import { 
    showNotification, 
    getCurrentUser, 
    isLoggedIn, 
    fetchAPI, 
    formatDate, 
    formatTime, 
    formatCurrency, 
    generateStarRating, 
    generateId 
} from './main.js';

// DOM Elements
const stadiumName = document.getElementById('stadium-name');
const stadiumNameBreadcrumb = document.getElementById('stadium-name-breadcrumb');
const mainImage = document.getElementById('main-image');
const imageThumbnails = document.getElementById('image-thumbnails');
const ratingStars = document.getElementById('rating-stars');
const reviewCount = document.getElementById('review-count');
const stadiumLocation = document.getElementById('stadium-location');
const stadiumPrice = document.getElementById('stadium-price');
const stadiumDescription = document.getElementById('stadium-description');
const facilitiesList = document.getElementById('facilities-list');
const rulesList = document.getElementById('rules-list');
const bookingDate = document.getElementById('booking-date');
const timeSlotsContainer = document.getElementById('time-slots-container');
const noSlotsMessage = document.getElementById('no-slots-message');
const bookingFormContainer = document.getElementById('booking-form-container');
const bookingForm = document.getElementById('booking-form');
const bookingDetails = document.getElementById('booking-details');
const writeReviewBtn = document.getElementById('write-review-btn');
const reviewFormContainer = document.getElementById('review-form-container');
const reviewForm = document.getElementById('review-form');
const cancelReviewBtn = document.getElementById('cancel-review-btn');
const ratingSelect = document.querySelectorAll('.rating-select i');
const ratingValue = document.getElementById('rating-value');
const averageRating = document.getElementById('average-rating');
const averageRatingStars = document.getElementById('average-rating-stars');
const reviewsList = document.getElementById('reviews-list');

// Current stadium data
let currentStadium = null;
let selectedTimeSlot = null;

// Initialize stadium details page
async function initStadiumDetails() {
    // Get stadium ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const stadiumId = urlParams.get('id');
    
    if (!stadiumId) {
        showNotification('Stadium not found.', 'error');
        window.location.href = 'stadiums.html';
        return;
    }
    
    // Fetch stadium data
    try {
        const stadium = await fetchStadiumById(stadiumId);
        if (!stadium) {
            showNotification('Stadium not found.', 'error');
            window.location.href = 'stadiums.html';
            return;
        }
        
        currentStadium = stadium;
        renderStadiumDetails(stadium);
        
        // Set up event listeners for booking process
        setupBookingEventListeners();
        
        // Set up review functionality
        setupReviewEventListeners();
    } catch (error) {
        console.error('Error loading stadium details:', error);
        showNotification('Failed to load stadium details. Please try again later.', 'error');
    }
}

// Fetch stadium by ID
async function fetchStadiumById(id) {
    // In a real app, this would make an API call
    const stadiums = JSON.parse(localStorage.getItem('stadiums') || '[]');
    return stadiums.find(stadium => stadium.id === id);
}

// Render stadium details to the page
function renderStadiumDetails(stadium) {
    // Set page title
    document.title = `${stadium.name} - StadiumFinder`;
    
    // Set stadium name
    if (stadiumName) stadiumName.textContent = stadium.name;
    if (stadiumNameBreadcrumb) stadiumNameBreadcrumb.textContent = stadium.name;
    
    // Set stadium images
    renderStadiumImages(stadium);
    
    // Set rating and reviews
    if (ratingStars) ratingStars.innerHTML = generateStarRating(stadium.rating);
    if (reviewCount) reviewCount.textContent = `(${stadium.reviews || 0} reviews)`;
    
    // Set location and price
    if (stadiumLocation) stadiumLocation.textContent = stadium.location;
    if (stadiumPrice) stadiumPrice.textContent = formatCurrency(stadium.price);
    
    // Set description
    if (stadiumDescription) stadiumDescription.textContent = stadium.description;
    
    // Set facilities
    renderFacilities(stadium);
    
    // Set rules
    renderRules(stadium);
    
    // Set up booking date
    if (bookingDate) {
        const today = new Date().toISOString().split('T')[0];
        bookingDate.min = today;
        bookingDate.value = today;
    }
    
    // Set average rating in reviews tab
    if (averageRating) averageRating.textContent = stadium.rating.toFixed(1);
    if (averageRatingStars) averageRatingStars.innerHTML = generateStarRating(stadium.rating);
    
    // Load reviews
    loadStadiumReviews(stadium);
}

// Render stadium images
function renderStadiumImages(stadium) {
    if (!mainImage || !imageThumbnails) return;
    
    // Default image if no images available
    const defaultImage = 'images/stadium-placeholder.jpg';
    
    // Set main image
    const imageUrl = stadium.images && stadium.images.length > 0 
        ? stadium.images[0] 
        : defaultImage;
    
    mainImage.innerHTML = `<img src="${imageUrl}" alt="${stadium.name}">`;
    
    // Set thumbnails
    if (stadium.images && stadium.images.length > 0) {
        let thumbnailsHtml = '';
        
        stadium.images.forEach((image, index) => {
            thumbnailsHtml += `
                <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <img src="${image}" alt="${stadium.name} image ${index + 1}">
                </div>
            `;
        });
        
        imageThumbnails.innerHTML = thumbnailsHtml;
        
        // Add click handlers for thumbnails
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                const index = this.dataset.index;
                
                // Update active state
                document.querySelectorAll('.thumbnail').forEach(t => {
                    t.classList.remove('active');
                });
                this.classList.add('active');
                
                // Update main image
                mainImage.innerHTML = `<img src="${stadium.images[index]}" alt="${stadium.name}">`;
            });
        });
    } else {
        imageThumbnails.innerHTML = '';
    }
}

// Render facilities
function renderFacilities(stadium) {
    if (!facilitiesList) return;
    
    if (stadium.facilities && stadium.facilities.length > 0) {
        let html = '';
        
        stadium.facilities.forEach(facility => {
            html += `
                <li><i class="fas fa-check-circle"></i> ${facility}</li>
            `;
        });
        
        facilitiesList.innerHTML = html;
    } else {
        facilitiesList.innerHTML = `<li>No facilities information available.</li>`;
    }
}

// Render rules
function renderRules(stadium) {
    if (!rulesList) return;
    
    if (stadium.rules && stadium.rules.length > 0) {
        let html = '';
        
        stadium.rules.forEach(rule => {
            html += `
                <li><i class="fas fa-info-circle"></i> ${rule}</li>
            `;
        });
        
        rulesList.innerHTML = html;
    } else {
        rulesList.innerHTML = `<li>No rules information available.</li>`;
    }
}

// Setup event listeners for booking process
function setupBookingEventListeners() {
    // Date selection for booking
    if (bookingDate) {
        bookingDate.addEventListener('change', function() {
            loadAvailableTimeSlots(this.value);
        });
        
        // Load initial slots for today
        loadAvailableTimeSlots(bookingDate.value);
    }
    
    // Handle booking form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBookingSubmit();
        });
    }
}

// Load available time slots for selected date
function loadAvailableTimeSlots(selectedDate) {
    if (!timeSlotsContainer || !noSlotsMessage) return;
    
    // In a real app, this would fetch available slots from an API
    // For demo, generate random availability
    
    // Show loading indicator
    timeSlotsContainer.innerHTML = '<div class="loading">Loading available slots...</div>';
    noSlotsMessage.style.display = 'none';
    
    // Reset booking form
    if (bookingFormContainer) {
        bookingFormContainer.style.display = 'none';
    }
    
    // Simulate API delay
    setTimeout(() => {
        // Generate time slots from 8 AM to 10 PM with 1-hour intervals
        const slots = [];
        for (let hour = 8; hour <= 22; hour++) {
            const startHour = hour.toString().padStart(2, '0') + ':00';
            const endHour = (hour + 1).toString().padStart(2, '0') + ':00';
            
            // Randomly determine if slot is available (70% chance)
            const isAvailable = Math.random() < 0.7;
            
            slots.push({
                startTime: startHour,
                endTime: endHour,
                available: isAvailable
            });
        }
        
        renderTimeSlots(slots);
    }, 1000);
}

// Render time slots to the page
function renderTimeSlots(slots) {
    if (!timeSlotsContainer || !noSlotsMessage) return;
    
    if (slots.length === 0) {
        timeSlotsContainer.innerHTML = '';
        noSlotsMessage.style.display = 'block';
        noSlotsMessage.textContent = 'No available time slots for the selected date.';
        return;
    }
    
    let html = '';
    
    slots.forEach(slot => {
        html += `
            <div class="time-slot ${slot.available ? 'available' : 'unavailable'}" 
                data-start="${slot.startTime}" 
                data-end="${slot.endTime}"
                ${slot.available ? '' : 'disabled'}>
                ${slot.startTime} - ${slot.endTime}
                <span class="slot-status">${slot.available ? 'Available' : 'Booked'}</span>
            </div>
        `;
    });
    
    timeSlotsContainer.innerHTML = html;
    noSlotsMessage.style.display = 'none';
    
    // Add click handlers for available time slots
    const availableSlots = document.querySelectorAll('.time-slot.available');
    availableSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            // Deselect any previously selected slot
            document.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
            });
            
            // Select this slot
            this.classList.add('selected');
            
            // Store selected time slot data
            selectedTimeSlot = {
                date: bookingDate.value,
                startTime: this.dataset.start,
                endTime: this.dataset.end
            };
            
            // Show booking form
            showBookingForm();
        });
    });
}

// Show booking form with selected slot details
function showBookingForm() {
    if (!bookingFormContainer || !bookingDetails || !selectedTimeSlot) return;
    
    // Set booking details
    const formattedDate = formatDate(selectedTimeSlot.date);
    const formattedStartTime = formatTime(selectedTimeSlot.startTime);
    const formattedEndTime = formatTime(selectedTimeSlot.endTime);
    
    bookingDetails.innerHTML = `
        <p><strong>Stadium:</strong> <span>${currentStadium.name}</span></p>
        <p><strong>Date:</strong> <span>${formattedDate}</span></p>
        <p><strong>Time:</strong> <span>${formattedStartTime} - ${formattedEndTime}</span></p>
        <p><strong>Price:</strong> <span>${formatCurrency(currentStadium.price)}</span></p>
    `;
    
    // Pre-fill user info if logged in
    if (isLoggedIn()) {
        const user = getCurrentUser();
        
        const nameInput = document.getElementById('booking-name');
        const emailInput = document.getElementById('booking-email');
        const phoneInput = document.getElementById('booking-phone');
        
        if (nameInput && user.fullname) nameInput.value = user.fullname;
        if (emailInput && user.email) emailInput.value = user.email;
        if (phoneInput && user.phone) phoneInput.value = user.phone;
    }
    
    // Show form
    bookingFormContainer.style.display = 'block';
    
    // Scroll to form
    bookingFormContainer.scrollIntoView({ behavior: 'smooth' });
}

// Handle booking form submission
async function handleBookingSubmit() {
    if (!selectedTimeSlot || !currentStadium) return;
    
    const name = document.getElementById('booking-name').value.trim();
    const email = document.getElementById('booking-email').value.trim();
    const phone = document.getElementById('booking-phone').value.trim();
    const notes = document.getElementById('booking-notes').value.trim();
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
    // Validate form
    if (!name || !email || !phone) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    // Prepare booking data
    const bookingData = {
        id: generateId(),
        stadiumId: currentStadium.id,
        stadiumName: currentStadium.name,
        date: selectedTimeSlot.date,
        startTime: selectedTimeSlot.startTime,
        endTime: selectedTimeSlot.endTime,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        notes: notes,
        price: currentStadium.price,
        paymentMethod: paymentMethod,
        paymentAmount: paymentMethod === 'deposit' 
            ? currentStadium.price * 0.3 
            : currentStadium.price,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    // If user is logged in, associate booking with user
    if (isLoggedIn()) {
        const user = getCurrentUser();
        bookingData.userId = user.id;
    }
    
    // In a real app, this would send booking to an API
    try {
        // Show loading state
        const submitButton = bookingForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Save booking to local storage for demo
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        bookings.push(bookingData);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        // Show success message
        showNotification('Booking successful! Redirecting to payment...', 'success');
        
        // Reset form and redirect after delay
        setTimeout(() => {
            window.location.href = `booking-confirmation.html?id=${bookingData.id}`;
        }, 2000);
        
    } catch (error) {
        console.error('Booking error:', error);
        showNotification('Failed to process your booking. Please try again.', 'error');
        
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

// Setup review functionality
function setupReviewEventListeners() {
    // Show/hide review form
    if (writeReviewBtn) {
        writeReviewBtn.addEventListener('click', function() {
            if (!isLoggedIn()) {
                showNotification('You need to log in to write a review.', 'warning');
                return;
            }
            
            if (reviewFormContainer) {
                reviewFormContainer.style.display = 'block';
                writeReviewBtn.style.display = 'none';
            }
        });
    }
    
    // Cancel review
    if (cancelReviewBtn) {
        cancelReviewBtn.addEventListener('click', function() {
            if (reviewFormContainer) {
                reviewFormContainer.style.display = 'none';
                writeReviewBtn.style.display = 'block';
            }
        });
    }
    
    // Star rating selection
    if (ratingSelect && ratingSelect.length > 0) {
        ratingSelect.forEach(star => {
            star.addEventListener('mouseover', function() {
                const rating = parseInt(this.dataset.rating);
                
                // Update stars on hover
                ratingSelect.forEach((s, index) => {
                    if (index < rating) {
                        s.className = 'fas fa-star';
                    } else {
                        s.className = 'far fa-star';
                    }
                });
            });
            
            star.addEventListener('click', function() {
                const rating = parseInt(this.dataset.rating);
                
                // Set rating value
                ratingValue.value = rating;
                
                // Update stars
                ratingSelect.forEach((s, index) => {
                    if (index < rating) {
                        s.className = 'fas fa-star';
                    } else {
                        s.className = 'far fa-star';
                    }
                });
            });
        });
        
        // Reset stars when mouse leaves container
        document.querySelector('.rating-select').addEventListener('mouseleave', function() {
            const rating = parseInt(ratingValue.value) || 0;
            
            ratingSelect.forEach((s, index) => {
                if (index < rating) {
                    s.className = 'fas fa-star';
                } else {
                    s.className = 'far fa-star';
                }
            });
        });
    }
    
    // Handle review submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!isLoggedIn()) {
                showNotification('You need to log in to write a review.', 'warning');
                return;
            }
            
            const rating = parseInt(ratingValue.value);
            const title = document.getElementById('review-title').value.trim();
            const text = document.getElementById('review-text').value.trim();
            
            if (!rating) {
                showNotification('Please select a rating.', 'error');
                return;
            }
            
            if (!title || !text) {
                showNotification('Please fill in all fields.', 'error');
                return;
            }
            
            try {
                const user = getCurrentUser();
                const review = {
                    id: generateId(),
                    stadiumId: currentStadium.id,
                    userId: user.id,
                    userName: user.fullname,
                    rating,
                    title,
                    text,
                    createdAt: new Date().toISOString()
                };
                
                // In a real app, this would be an API call
                const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
                reviews.push(review);
                localStorage.setItem('reviews', JSON.stringify(reviews));
                
                // Update stadium rating
                const stadiums = JSON.parse(localStorage.getItem('stadiums') || '[]');
                const stadiumIndex = stadiums.findIndex(s => s.id === currentStadium.id);
                
                if (stadiumIndex !== -1) {
                    const stadiumReviews = reviews.filter(r => r.stadiumId === currentStadium.id);
                    const averageRating = stadiumReviews.reduce((acc, r) => acc + r.rating, 0) / stadiumReviews.length;
                    
                    stadiums[stadiumIndex].rating = parseFloat(averageRating.toFixed(1));
                    stadiums[stadiumIndex].reviews = stadiumReviews.length;
                    
                    localStorage.setItem('stadiums', JSON.stringify(stadiums));
                    currentStadium = stadiums[stadiumIndex];
                }
                
                // Show success message
                showNotification('Review submitted successfully!', 'success');
                
                // Reset form and hide it
                reviewForm.reset();
                reviewFormContainer.style.display = 'none';
                writeReviewBtn.style.display = 'block';
                
                // Reload reviews
                loadStadiumReviews(currentStadium);
                
                // Update rating display
                if (ratingStars) ratingStars.innerHTML = generateStarRating(currentStadium.rating);
                if (reviewCount) reviewCount.textContent = `(${currentStadium.reviews} reviews)`;
                if (averageRating) averageRating.textContent = currentStadium.rating.toFixed(1);
                if (averageRatingStars) averageRatingStars.innerHTML = generateStarRating(currentStadium.rating);
                
            } catch (error) {
                console.error('Error submitting review:', error);
                showNotification('Failed to submit review. Please try again.', 'error');
            }
        });
    }
}

// Load stadium reviews
function loadStadiumReviews(stadium) {
    if (!reviewsList) return;
    
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]')
        .filter(review => review.stadiumId === stadium.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="no-reviews">
                <p>No reviews yet. Be the first to review this stadium!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    reviews.forEach(review => {
        const date = new Date(review.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        html += `
            <div class="review">
                <div class="review-header">
                    <div class="reviewer-name">${review.userName}</div>
                    <div class="review-date">${date}</div>
                </div>
                <div class="review-rating">
                    ${generateStarRating(review.rating)}
                </div>
                <div class="review-title">${review.title}</div>
                <div class="review-text">${review.text}</div>
            </div>
        `;
    });
    
    reviewsList.innerHTML = html;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', initStadiumDetails);