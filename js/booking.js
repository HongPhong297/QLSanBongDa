// Stadium booking functionality

// Import necessary functions
import { 
    showNotification, 
    isLoggedIn, 
    getCurrentUser,
    generateId 
} from './main.js';
import { getSafeImageUrl } from './imageLoader.js';
import { createBooking } from './api-client.js';

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
    
    try {
        // First, try to fetch stadium data from the API
        console.log('Attempting to fetch stadium from API...');
        const response = await fetch(`http://localhost:3000/api/stadiums/${stadiumId}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Successfully fetched stadium data from API:', data);
            stadium = data;
        } else {
            throw new Error(`API request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching stadium from API:', error);
        console.log('Falling back to simulated data...');
        
        // Fallback to simulated data if API call fails
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
        console.log('Using fallback data for stadium:', stadium);
    }
    
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
    const API_BASE_URL = 'http://localhost:3000/api';
    if (!selectedDate || !selectedTimeSlot) {
        showNotification('Please select date and time', 'error');
        return;
    }
    
    // Get user information from the current user data
    const user = getCurrentUser();
    console.log('User data for booking:', user);
    
    if (!user) {
        showNotification('User information missing. Please log in again.', 'error');
        return;
    }
    
    // Kiểm tra ID người dùng kỹ lưỡng hơn
    let userId = null;
    if (user.id !== undefined) {
        userId = parseInt(user.id);
        if (isNaN(userId)) {
            console.error('Invalid user ID:', user.id);
            showNotification('Invalid user ID. Please log in again.', 'error');
            return;
        }
    } else {
        console.error('User ID is missing:', user);
        showNotification('User ID is missing. Please log in again.', 'error');
        return;
    }
    
    console.log('Validated user ID for booking:', userId);
    
    const customerName = user.fullname || '';
    const customerEmail = user.email || '';
    const customerPhone = user.phone || '';
    
    // Disable the submit button
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        // Ensure API base URL is defined correctly
        if (!API_BASE_URL) {
            console.error('API_BASE_URL is not defined');
            throw new Error('API configuration error');
        }
        
        // Calculate end time based on start time and duration
        const endTime = calculateEndTime(selectedTimeSlot, selectedDuration);
        const totalPrice = hourlyRate * selectedDuration;
        
        // Use parseInt with a radix
        const stadiumId = parseInt(stadium.id, 10);
        if (isNaN(stadiumId)) {
            throw new Error('Invalid stadium ID');
        }
        
        // Create booking data object with proper number types where needed
        const bookingData = {
            stadium_id: stadiumId,
            user_id: userId,
            booking_date: selectedDate,
            start_time: selectedTimeSlot,
            end_time: endTime,
            total_price: totalPrice,
            customer_name: customerName || 'Guest',  // Ensure not empty
            customer_email: customerEmail || 'guest@example.com',  // Ensure not empty
            customer_phone: customerPhone || '0000000000',
            notes: `Booking for ${stadium.name} - Duration: ${selectedDuration} hours`,
            payment_method: 'online'
        };
        
        console.log('Booking data to send:', bookingData);
        
        // Use the API client to create the booking
        const result = await createBooking(bookingData);
        
        if (!result.success) {
            console.error('Booking API error:', result);
            throw new Error(result.error || 'Failed to create booking');
        }
        
        console.log('Booking created successfully:', result.data);
        
        // Store booking in localStorage for redundancy
        const bookingForLocalStorage = {
            id: result.data.booking?.id || generateId(),
            stadium_id: stadiumId,
            stadium_name: stadium.name,
            user_id: userId,
            booking_date: selectedDate,
            start_time: selectedTimeSlot,
            end_time: endTime,
            duration: selectedDuration,
            total_price: totalPrice,
            price: hourlyRate,
            customer_name: customerName || 'Guest',
            customer_email: customerEmail || 'guest@example.com',
            customer_phone: customerPhone || '0000000000',
            status: result.data.booking?.status || 'confirmed',
            created_at: new Date().toISOString(),
            sport_type: stadium.sport_type || ''
        };
        
        const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        existingBookings.push(bookingForLocalStorage);
        localStorage.setItem('bookings', JSON.stringify(existingBookings));
        
        // Set flag for confirmation
        localStorage.setItem('pendingBookingConfirmation', 'true');
        
        // Show success notification
        showNotification('Booking successful! Redirecting...', 'success');
        
        // Redirect to bookings page
        setTimeout(() => {
            window.location.href = 'user-bookings.html?booking=success';
        }, 2000);
    } catch (error) {
        console.error('Error processing booking:', error);
        showNotification(`Booking error: ${error.message}`, 'error');
        
        // Re-enable the submit button
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