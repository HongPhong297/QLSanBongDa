// Stadium booking functionality

// Import necessary functions
import { 
    showNotification, 
    isLoggedIn, 
    getCurrentUser,
    generateId 
} from './main.js';
import { getSafeImageUrl } from './imageLoader.js';

// DOM Elements
const bookingForm = document.getElementById('booking-form');
const stadiumImage = document.getElementById('stadium-image');
const stadiumNameElement = document.getElementById('stadium-name');
const stadiumLocationElement = document.getElementById('stadium-location');
const stadiumSportElement = document.getElementById('stadium-sport');
const stadiumPriceElement = document.getElementById('stadium-price');
const timeSlots = document.getElementById('time-slots');
const durationSelect = document.getElementById('duration');
const summaryDate = document.getElementById('summary-date');
const summaryTime = document.getElementById('summary-time');
const summaryDuration = document.getElementById('summary-duration');
const summaryRate = document.getElementById('summary-rate');
const summaryTotal = document.getElementById('summary-total');
const customerNameInput = document.getElementById('customer-name');
const customerEmailInput = document.getElementById('customer-email');
const customerPhoneInput = document.getElementById('customer-phone');

// State variables
let stadium = null;
let selectedDate = null;
let selectedTimeSlot = null;
let selectedDuration = 2;
let hourlyRate = 0;

// Initialize booking page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Booking page loaded');
    initBookingPage();
});

async function initBookingPage() {
    console.log('Initializing booking page');
    
    // Check if user is logged in
    if (!isLoggedIn()) {
        showNotification('Please login to book a stadium', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }

    // Get stadium ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const stadiumId = urlParams.get('stadium');
    console.log('Stadium ID from URL:', stadiumId);
    
    if (!stadiumId) {
        showNotification('No stadium selected', 'error');
        setTimeout(() => {
            window.location.href = 'stadiums.html';
        }, 1500);
        return;
    }
    
    try {
        // Fetch stadium details
        console.log('Fetching stadium details...');
        await fetchStadiumDetails(stadiumId);
        
        // Pre-fill user information
        fillUserInformation();
        
        // Initialize date picker after stadium data is loaded
        console.log('Initializing date picker...');
        initDatePicker();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('Booking page initialization complete');
    } catch (error) {
        console.error('Error initializing booking page:', error);
        showNotification('Error loading stadium details', 'error');
    }
}

// Fetch stadium details
async function fetchStadiumDetails(stadiumId) {
    console.log('Fetching details for stadium ID:', stadiumId);
    
    // Simulate API call with stadium data
    const simulatedStadiums = [
        {
            id: "1",
            name: "San Van Dong A",
            description: "San co chat luong cao",
            location: "456 Duong XYZ, Quan 3",
            district: "Quan 3",
            price: "500000",
            capacity: 100,
            sport_type: "football",
            image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1000&auto=format&fit=crop"
        },
        {
            id: "2",
            name: "San Van Dong B",
            description: "San nho phu hop cho nhom ban be",
            location: "123 Duong ABC, Quan 1",
            district: "Quan 1",
            price: "350000",
            capacity: 50,
            sport_type: "basketball",
            image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000&auto=format&fit=crop"
        },
        {
            id: "3",
            name: "San Tennis Quan 7",
            description: "San tennis chat luong cao",
            location: "789 Duong DEF, Quan 7",
            district: "Quan 7",
            price: "200000",
            capacity: 4,
            sport_type: "tennis",
            image: "https://images.unsplash.com/photo-1622279457486-7d08f1d33d66?q=80&w=1000&auto=format&fit=crop"
        }
    ];
    
    // Find the stadium with matching ID
    stadium = simulatedStadiums.find(s => s.id === stadiumId);
    console.log('Found stadium:', stadium);
    
    if (!stadium) {
        console.error('Stadium not found for ID:', stadiumId);
        throw new Error('Stadium not found');
    }
    
    // Update UI with stadium details
    hourlyRate = parseFloat(stadium.price);
    
    // Set stadium image with fallback
    if (stadiumImage) {
        stadiumImage.src = getSafeImageUrl(stadium.image);
        stadiumImage.alt = stadium.name;
        
        // Add error handler in case the image fails to load
        stadiumImage.onerror = function() {
            this.src = 'assets/loupe.png';
        };
    }
    
    // Update other stadium details in the UI
    if (stadiumNameElement) stadiumNameElement.textContent = stadium.name;
    if (stadiumLocationElement) stadiumLocationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${stadium.location}`;
    if (stadiumSportElement) stadiumSportElement.innerHTML = `<i class="fas fa-futbol"></i> ${formatSportType(stadium.sport_type)}`;
    if (stadiumPriceElement) stadiumPriceElement.textContent = `${formatCurrency(stadium.price)} per hour`;
    if (summaryRate) summaryRate.textContent = formatCurrency(stadium.price);
    
    updateTotalPrice();
    console.log('Stadium details updated in UI');
}

// Format sport type for display
function formatSportType(sportType) {
    if (!sportType) return 'Multiple Sports';
    return sportType.charAt(0).toUpperCase() + sportType.slice(1);
}

// Initialize date picker
function initDatePicker() {
    console.log('Setting up date picker');
    
    // Check if flatpickr is available
    if (typeof flatpickr === 'undefined') {
        console.error('Flatpickr not found! Make sure the script is loaded.');
        showNotification('Error initializing date picker', 'error');
        return;
    }
    
    const dateElement = document.getElementById('booking-date');
    if (!dateElement) {
        console.error('Booking date element not found!');
        return;
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    try {
        const fp = flatpickr(dateElement, {
            minDate: today,
            dateFormat: 'Y-m-d',
            disable: [
                function(date) {
                    return date < today;
                }
            ],
            onChange: function(selectedDates, dateStr) {
                selectedDate = dateStr;
                if (summaryDate) summaryDate.textContent = formatDateForDisplay(dateStr);
                generateTimeSlots(dateStr);
                updateTotalPrice();
            }
        });
        
        // Default to tomorrow
        fp.setDate(tomorrow);
        console.log('Date picker initialized with default date:', tomorrow);
    } catch (err) {
        console.error('Error initializing flatpickr:', err);
    }
}

// Format date for display
function formatDateForDisplay(dateStr) {
    try {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch (err) {
        console.error('Error formatting date:', err);
        return dateStr;
    }
}

// Generate time slots for selected date
function generateTimeSlots(dateStr) {
    console.log('Generating time slots for date:', dateStr);
    if (!timeSlots) {
        console.error('Time slots container not found');
        return;
    }
    
    timeSlots.innerHTML = ''; // Clear existing slots
    
    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = new Date(dateStr).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Generate time slots from 6 AM to 10 PM
    const startHour = 6;
    const endHour = 22;
    
    for (let hour = startHour; hour < endHour; hour++) {
        const timeSlotElement = document.createElement('div');
        timeSlotElement.className = 'time-slot';
        
        const formattedHour = hour.toString().padStart(2, '0') + ':00';
        timeSlotElement.textContent = formattedHour;
        
        // Randomly mark some slots as booked for demonstration
        const isBooked = Math.random() < 0.3;
        if (isBooked) {
            timeSlotElement.classList.add('booked');
        } else {
            timeSlotElement.addEventListener('click', () => selectTimeSlot(timeSlotElement, formattedHour));
        }
        
        timeSlots.appendChild(timeSlotElement);
    }
    
    console.log('Time slots generated');
    
    // Select the first available time slot by default
    setTimeout(() => {
        const firstAvailableSlot = timeSlots.querySelector('.time-slot:not(.booked)');
        if (firstAvailableSlot) {
            firstAvailableSlot.click();
            console.log('First available slot selected');
        } else {
            console.log('No available time slots found');
        }
    }, 100);
}

// Select time slot
function selectTimeSlot(element, time) {
    console.log('Time slot selected:', time);
    
    // Remove 'selected' class from all time slots
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Add 'selected' class to the clicked time slot
    element.classList.add('selected');
    
    // Update state and UI
    selectedTimeSlot = time;
    if (summaryTime) summaryTime.textContent = time;
    updateTotalPrice();
}

// Pre-fill user information
function fillUserInformation() {
    const user = getCurrentUser();
    if (!user) return;
    
    if (customerNameInput && user.fullname) {
        customerNameInput.value = user.fullname;
    }
    
    if (customerEmailInput && user.email) {
        customerEmailInput.value = user.email;
    }
    
    if (customerPhoneInput && user.phone) {
        customerPhoneInput.value = user.phone;
    }
}

// Set up event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    if (durationSelect) {
        durationSelect.addEventListener('change', function() {
            selectedDuration = parseInt(this.value);
            if (summaryDuration) {
                summaryDuration.textContent = `${selectedDuration} hour${selectedDuration > 1 ? 's' : ''}`;
            }
            updateTotalPrice();
            console.log('Duration changed to:', selectedDuration);
        });
    }
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
        console.log('Booking form submit handler attached');
    } else {
        console.error('Booking form not found!');
    }
}

// Update total price
function updateTotalPrice() {
    if (!stadium) return;
    
    const total = hourlyRate * selectedDuration;
    if (summaryTotal) summaryTotal.textContent = formatCurrency(total);
    console.log('Total price updated:', total);
}

// Helper function to calculate end time based on start time and duration
function calculateEndTime(startTime, durationHours) {
    const [hours, minutes] = startTime.split(':').map(Number);
    let endHours = hours + durationHours;
    
    // Format the end time
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Handle booking form submission
async function handleBookingSubmit(e) {
    e.preventDefault();
    console.log('Processing booking submission');
    
    if (!selectedDate || !selectedTimeSlot) {
        showNotification('Please select date and time', 'error');
        return;
    }
    
    // Get user information from the current user data
    const user = getCurrentUser();
    
    if (!user || !user.id) {
        console.error('User ID not found in getCurrentUser():', user);
        showNotification('User information missing. Please log in again.', 'error');
        return;
    }
    
    console.log('Current user ID:', user.id);
    
    const customerName = user.fullname || '';
    const customerEmail = user.email || '';
    const customerPhone = user.phone || '';
    
    // Disable the submit button
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        // Calculate end time based on start time and duration
        const endTime = calculateEndTime(selectedTimeSlot, selectedDuration);
        
        // Create booking data object to send to API
        const bookingData = {
            stadium_id: parseInt(stadium.id),
            user_id: parseInt(user.id), // Ensure user ID is properly parsed as integer
            booking_date: selectedDate,
            start_time: selectedTimeSlot,
            end_time: endTime,
            total_price: hourlyRate * selectedDuration,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone
        };
        
        console.log('Sending booking data to API with user ID:', bookingData.user_id);
        
        let apiSuccess = false;
        
        try {
            // Try to make API call to create booking
            const response = await fetch('http://localhost:3000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                console.error('API response error:', errorData);
                throw new Error('Failed to create booking via API. Using fallback method.');
            }
            
            const bookingResult = await response.json();
            console.log('Booking created successfully via API:', bookingResult);
            apiSuccess = true;
        } catch (apiError) {
            console.warn('API booking failed, using local storage fallback:', apiError);
            // Continue with local storage approach
        }
        
        // For demonstration purposes, always store in localStorage
        const bookingForLocalStorage = {
            id: generateId(),
            stadium_id: stadium.id,
            stadium_name: stadium.name,
            user_id: user.id.toString(), // Ensure consistent user ID in localStorage
            user_name: customerName,
            date: selectedDate,
            time: selectedTimeSlot,
            duration: selectedDuration,
            price: hourlyRate * selectedDuration,
            status: 'confirmed',
            created_at: new Date().toISOString()
        };
        
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        bookings.push(bookingForLocalStorage);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        // IMPORTANT: Set a flag in localStorage to indicate pending confirmation
        // This ensures the success message will show even if the redirect fails
        localStorage.setItem('pendingBookingConfirmation', 'true');
        
        // Show a notification on this page first before redirecting
        showNotification('Booking successful! Redirecting...', 'success');
        
        // Redirect to index page with success parameter
        setTimeout(() => {
            window.location.href = 'index.html?booking=success';
        }, 2000);
        
    } catch (error) {
        console.error('Error processing booking:', error);
        showNotification(`Booking error: ${error.message}`, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Complete Booking';
    }
}

// Helper function to format currency
function formatCurrency(amount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '₫0';
    
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numAmount);
}
