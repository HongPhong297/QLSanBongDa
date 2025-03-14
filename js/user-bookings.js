// User bookings management functionality - Standalone version

import { 
    showNotification, 
    isLoggedIn, 
    getCurrentUser, 
    formatDate, 
    formatTime, 
    formatCurrency 
} from './main.js';
import { getSafeImageUrl } from './imageLoader.js';
// Instead of importing from api-client.js, we'll define the functions here

// DOM Elements
const bookingsLoading = document.getElementById('bookings-loading');
const noBookingsEl = document.getElementById('no-bookings');
const bookingsList = document.getElementById('bookings-list');
const filterTabs = document.querySelectorAll('.filter-tab');
const bookingSearch = document.getElementById('booking-search');
const bookingSort = document.getElementById('booking-sort');
const searchBtn = document.getElementById('search-btn');
const modal = document.getElementById('booking-details-modal');
const modalContent = document.getElementById('booking-details-content');
const closeModalBtn = document.querySelector('.close-modal');

// State variables
let bookings = [];
let filteredBookings = [];
let currentFilter = 'all';
let searchTerm = '';
let sortBy = 'date-desc';
const API_BASE_URL = 'http://localhost:3000/api';

// Stadium images map based on sport type
const sportTypeImages = {
    'football': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2',
    'basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc',
    'tennis': 'https://images.unsplash.com/photo-1622279457486-7d08f1d33d66',
    'default': 'https://images.unsplash.com/photo-1535131749006-b7d58e7ffac0'
};

// Initialize bookings page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Bookings page initialized');
    
    // Check if user is logged in
    if (!isLoggedIn()) {
        showNotification('Please login to view your bookings', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }
    
    // Initialize event listeners
    initEventListeners();
    
    // Fetch user bookings
    fetchUserBookings();
});

// Initialize event listeners
function initEventListeners() {
    // Setup filter tabs
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Update current filter and apply it
            currentFilter = tab.getAttribute('data-filter');
            applyFiltersAndRender();
        });
    });
    
    // Setup search
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            searchTerm = bookingSearch.value.trim();
            applyFiltersAndRender();
        });
    }
    
    if (bookingSearch) {
        bookingSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchTerm = bookingSearch.value.trim();
                applyFiltersAndRender();
            }
        });
    }
    
    // Setup sort
    if (bookingSort) {
        bookingSort.addEventListener('change', () => {
            sortBy = bookingSort.value;
            applyFiltersAndRender();
        });
    }
    
    // Setup modal close
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Fetch user bookings from API
async function fetchUserBookings() {
    try {
        // Get current user
        const user = getCurrentUser();
        if (!user) throw new Error('User not found');
        
        // Get user ID (ensuring it's a number)
        const userId = parseInt(user.id);
        console.log('Fetching bookings for user ID:', userId);
        
        // Show loading
        if (bookingsLoading) bookingsLoading.style.display = 'block';
        
        // Get authentication token from localStorage
        const token = localStorage.getItem('token');
        
        // Add token to headers if available
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Including auth token in request');
        } else {
            console.warn('No authentication token found');
        }
        
        // Fetch bookings directly from API
        const response = await fetch(`${API_BASE_URL}/bookings/user/${userId}`, {
            method: 'GET',
            headers: headers
        });
        
        console.log('API response status:', response.status);
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`Failed to fetch bookings: ${response.status}`);
        }
        
        // Parse response
        bookings = await response.json();
        console.log('Fetched bookings from API:', bookings);
        
        // If API returns an empty array or failed, check localStorage as backup
        if (!bookings || bookings.length === 0) {
            console.log('No bookings found in API, checking localStorage...');
            
            // Get all bookings from localStorage
            const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            console.log('All bookings in localStorage:', allBookings.length, 'bookings found');
            
            // Filter bookings for current user
            bookings = allBookings.filter(booking => {
                return String(booking.user_id) === String(userId);
            });
            
            console.log('Filtered bookings from localStorage:', bookings.length, 'bookings found');
        }
        
        // Hide loading
        if (bookingsLoading) bookingsLoading.style.display = 'none';
        
        // Check if we have any bookings after API or localStorage retrieval
        if (!bookings || bookings.length === 0) {
            console.log('No bookings found for current user');
            if (noBookingsEl) {
                noBookingsEl.style.display = 'block';
                noBookingsEl.innerHTML = `
                    <div class="no-bookings-message">
                        <i class="fas fa-calendar-times"></i>
                        <h3>No Bookings Found</h3>
                        <p>You haven't made any bookings yet. Explore stadiums and make your first booking!</p>
                        <a href="stadiums.html" class="btn btn-primary">Find Stadiums</a>
                    </div>
                `;
            }
        } else {
            console.log('Bookings found, rendering to UI');
            // Apply filters and render if we have bookings
            applyFiltersAndRender();
        }
        
    } catch (error) {
        console.error('Error fetching bookings:', error);
        
        // Try fetching from localStorage as fallback
        console.log('Trying localStorage fallback...');
        
        const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const userId = String(getCurrentUser()?.id);
        
        // Filter to only show current user's bookings
        bookings = allBookings.filter(booking => String(booking.user_id) === userId);
        
        console.log('Found', bookings.length, 'bookings in localStorage');
        
        // Hide loading
        if (bookingsLoading) bookingsLoading.style.display = 'none';
        
        if (bookings.length === 0) {
            if (noBookingsEl) {
                noBookingsEl.style.display = 'block';
                noBookingsEl.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error Loading Bookings</h3>
                        <p>${error.message}</p>
                        <button id="retry-loading" class="btn btn-primary">Retry</button>
                    </div>
                `;
                
                // Add retry button functionality
                const retryBtn = document.getElementById('retry-loading');
                if (retryBtn) {
                    retryBtn.addEventListener('click', fetchUserBookings);
                }
            }
        } else {
            // We found some bookings in localStorage, so render them
            applyFiltersAndRender();
            showNotification('Showing bookings from offline storage. Some data might not be up to date.', 'warning');
        }
    }
}

// Apply filters and sort
function applyFiltersAndRender() {
    if (!bookings || !Array.isArray(bookings)) {
        console.error('Invalid bookings data:', bookings);
        bookings = [];
    }
    
    // Apply filter
    switch (currentFilter) {
        case 'upcoming':
            filteredBookings = bookings.filter(booking => {
                const bookingDate = new Date(`${booking.booking_date || booking.date} ${booking.start_time || booking.time || '00:00'}`);
                return bookingDate > new Date() && booking.status !== 'cancelled';
            });
            break;
        case 'past':
            filteredBookings = bookings.filter(booking => {
                const bookingDate = new Date(`${booking.booking_date || booking.date} ${booking.start_time || booking.time || '00:00'}`);
                return bookingDate < new Date() && booking.status !== 'cancelled';
            });
            break;
        case 'cancelled':
            filteredBookings = bookings.filter(booking => booking.status === 'cancelled');
            break;
        case 'all':
        default:
            filteredBookings = [...bookings];
            break;
    }
    
    // Apply search
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredBookings = filteredBookings.filter(booking => {
            const stadiumName = (booking.stadium_name || '').toLowerCase();
            const bookingDate = (booking.booking_date || booking.date || '');
            return stadiumName.includes(term) || bookingDate.includes(term);
        });
    }
    
    // Apply sort
    switch (sortBy) {
        case 'date-asc':
            filteredBookings.sort((a, b) => {
                const dateA = new Date(a.booking_date || a.date || '2000-01-01');
                const dateB = new Date(b.booking_date || b.date || '2000-01-01');
                return dateA - dateB;
            });
            break;
        case 'price-desc':
            filteredBookings.sort((a, b) => {
                const priceA = parseFloat(a.total_price || a.price || 0);
                const priceB = parseFloat(b.total_price || b.price || 0);
                return priceB - priceA;
            });
            break;
        case 'price-asc':
            filteredBookings.sort((a, b) => {
                const priceA = parseFloat(a.total_price || a.price || 0);
                const priceB = parseFloat(b.total_price || b.price || 0);
                return priceA - priceB;
            });
            break;
        case 'date-desc':
        default:
            filteredBookings.sort((a, b) => {
                const dateA = new Date(a.booking_date || a.date || '2000-01-01');
                const dateB = new Date(b.booking_date || b.date || '2000-01-01');
                return dateB - dateA;
            });
            break;
    }
    
    // Render filtered bookings
    renderBookings();
}

// Render bookings in the UI
function renderBookings() {
    if (!bookingsList) return;
    
    // Check if we have any bookings
    if (filteredBookings.length === 0) {
        if (noBookingsEl) noBookingsEl.style.display = 'block';
        bookingsList.innerHTML = '';
        return;
    }
    
    // Hide no bookings message
    if (noBookingsEl) noBookingsEl.style.display = 'none';
    
    // Generate HTML
    let html = '';
    
    filteredBookings.forEach(booking => {
        // Format booking date - handle possible undefined values safely
        const bookingDate = formatDate(booking.booking_date || booking.date || new Date().toISOString().split('T')[0]);
        const startTime = formatTime(booking.start_time || booking.time || '00:00');
        
        // Calculate end time if needed
        let endTime = booking.end_time ? formatTime(booking.end_time) : '';
        if (!endTime && (booking.duration || booking.start_time)) {
            const duration = parseInt(booking.duration || 1);
            const [hours, minutes] = (booking.start_time || '00:00').split(':').map(Number);
            const endHours = hours + duration;
            endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        
        // Determine status class
        let statusClass = 'status-pending';
        if (booking.status === 'confirmed') statusClass = 'status-confirmed';
        if (booking.status === 'cancelled') statusClass = 'status-cancelled';
        if (booking.status === 'completed') statusClass = 'status-completed';
        
        // Determine image based on sport type
        const sportType = booking.sport_type || '';
        let imageSrc = sportTypeImages.default;
        
        if (sportType.includes('foot') || (booking.stadium_name || '').toLowerCase().includes('foot')) {
            imageSrc = sportTypeImages.football;
        } else if (sportType.includes('basket') || (booking.stadium_name || '').toLowerCase().includes('basket')) {
            imageSrc = sportTypeImages.basketball;
        } else if (sportType.includes('tennis') || (booking.stadium_name || '').toLowerCase().includes('tennis')) {
            imageSrc = sportTypeImages.tennis;
        }
        
        html += `
            <div class="booking-item" data-id="${booking.id}">
                <div class="booking-image">
                    <img src="${getSafeImageUrl(imageSrc)}" alt="Stadium">
                </div>
                <div class="booking-details">
                    <h3>${booking.stadium_name || 'Stadium'}</h3>
                    <div class="booking-meta">
                        <span><i class="fas fa-calendar"></i> ${bookingDate}</span>
                        <span><i class="fas fa-clock"></i> ${startTime}${endTime ? ' - ' + endTime : ''}</span>
                        <span><i class="fas fa-hourglass-half"></i> ${booking.duration || 1} hour${booking.duration > 1 ? 's' : ''}</span>
                        <span><i class="fas fa-money-bill-wave"></i> ${formatCurrency(booking.total_price || booking.price || 0)}</span>
                    </div>
                </div>
                <div class="booking-status">
                    <span class="status-badge ${statusClass}">${booking.status || 'pending'}</span>
                    <div class="booking-actions">
                        <button class="btn-view" data-id="${booking.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${booking.status !== 'cancelled' && booking.status !== 'completed' ? 
                            `<button class="btn-cancel" data-id="${booking.id}">
                                <i class="fas fa-times"></i> Cancel
                            </button>` : 
                            ''
                        }
                    </div>
                </div>
            </div>
        `;
    });
    
    bookingsList.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const bookingId = btn.getAttribute('data-id');
            showBookingDetails(bookingId);
        });
    });
    
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const bookingId = btn.getAttribute('data-id');
            cancelBooking(bookingId);
        });
    });
}

// Show booking details in modal
function showBookingDetails(bookingId) {
    // Find the booking
    const booking = bookings.find(b => String(b.id) === String(bookingId));
    
    if (!booking || !modal || !modalContent) return;
    
    // Format data
    const bookingDate = formatDate(booking.booking_date || booking.date || new Date().toISOString().split('T')[0]);
    const startTime = formatTime(booking.start_time || booking.time || '00:00');
    let endTime = booking.end_time ? formatTime(booking.end_time) : '';
    
    if (!endTime && (booking.duration || booking.start_time)) {
        const duration = parseInt(booking.duration || 1);
        const [hours, minutes] = (booking.start_time || '00:00').split(':').map(Number);
        const endHours = hours + duration;
        endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    // Determine status class
    let statusClass = 'status-pending';
    if (booking.status === 'confirmed') statusClass = 'status-confirmed';
    if (booking.status === 'cancelled') statusClass = 'status-cancelled';
    if (booking.status === 'completed') statusClass = 'status-completed';
    
    // Generate modal content
    modalContent.innerHTML = `
        <div class="status-container" style="margin-bottom: 20px;">
            <span class="status-badge ${statusClass}" style="font-size: 0.9rem">
                ${booking.status || 'pending'}
            </span>
        </div>
        <div class="booking-detail-row">
            <div class="booking-detail-label">Booking ID:</div>
            <div class="booking-detail-value">${booking.id}</div>
        </div>
        <div class="booking-detail-row">
            <div class="booking-detail-label">Stadium:</div>
            <div class="booking-detail-value">${booking.stadium_name || 'Stadium'}</div>
        </div>
        <div class="booking-detail-row">
            <div class="booking-detail-label">Date:</div>
            <div class="booking-detail-value">${bookingDate}</div>
        </div>
        <div class="booking-detail-row">
            <div class="booking-detail-label">Time:</div>
            <div class="booking-detail-value">${startTime}${endTime ? ' - ' + endTime : ''}</div>
        </div>
        <div class="booking-detail-row">
            <div class="booking-detail-label">Duration:</div>
            <div class="booking-detail-value">${booking.duration || 1} hour${booking.duration > 1 ? 's' : ''}</div>
        </div>
        <div class="booking-detail-row">
            <div class="booking-detail-label">Price:</div>
            <div class="booking-detail-value">${formatCurrency(booking.total_price || booking.price || 0)}</div>
        </div>
        <div class="booking-detail-row">
            <div class="booking-detail-label">Booked On:</div>
            <div class="booking-detail-value">${formatDate(booking.created_at || new Date())}</div>
        </div>
        ${booking.status !== 'cancelled' && booking.status !== 'completed' ? `
            <div class="booking-detail-actions">
                <button id="modal-cancel-btn" class="btn btn-danger" data-id="${booking.id}">
                    <i class="fas fa-times"></i> Cancel Booking
                </button>
            </div>
        ` : ''}
    `;
    
    // Show the modal
    modal.style.display = 'block';
    
    // Add event listener to cancel button in modal
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', () => {
            const bookingId = modalCancelBtn.getAttribute('data-id');
            cancelBooking(bookingId);
            modal.style.display = 'none';
        });
    }
}

// Cancel booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        // Get authentication token from localStorage
        const token = localStorage.getItem('token');
        
        // Add token to headers if available
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Including auth token in cancel request');
        } else {
            console.warn('No authentication token found for cancel request');
        }
        
        // Call the API endpoint to update booking
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ status: 'cancelled' })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to cancel booking: ${response.status}`);
        }
        
        showNotification('Booking cancelled successfully', 'success');
        
        // Update local state
        bookings = bookings.map(booking => {
            if (String(booking.id) === String(bookingId)) {
                return { ...booking, status: 'cancelled' };
            }
            return booking;
        });
        
        // Re-apply filters and render
        applyFiltersAndRender();
        
    } catch (error) {
        console.error('Error cancelling booking:', error);
        
        // Fallback to localStorage if API call fails
        try {
            // Update in localStorage as fallback
            const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const updatedBookings = allBookings.map(booking => {
                if (String(booking.id) === String(bookingId)) {
                    return { ...booking, status: 'cancelled' };
                }
                return booking;
            });
            
            localStorage.setItem('bookings', JSON.stringify(updatedBookings));
            
            // Update local state
            bookings = bookings.map(booking => {
                if (String(booking.id) === String(bookingId)) {
                    return { ...booking, status: 'cancelled' };
                }
                return booking;
            });
            
            showNotification('Booking cancelled successfully (offline mode)', 'success');
            
            // Re-apply filters and render
            applyFiltersAndRender();
        } catch (fallbackError) {
            showNotification('Failed to cancel booking: ' + error.message, 'error');
        }
    }
}