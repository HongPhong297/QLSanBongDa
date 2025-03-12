// User bookings management functionality

import { 
    showNotification, 
    isLoggedIn, 
    getCurrentUser, 
    formatDate, 
    formatTime, 
    formatCurrency 
} from './main.js';
import { getSafeImageUrl } from './imageLoader.js';

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

// Stadium images map for demo purposes
const sportTypeImages = {
    'football': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2',
    'basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc',
    'tennis': 'https://images.unsplash.com/photo-1622279457486-7d08f1d33d66',
    'default': 'https://images.unsplash.com/photo-1535131749006-b7d58e7ffac0'
};

// Initialize bookings page
document.addEventListener('DOMContentLoaded', function() {
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
        
        // Show loading
        if (bookingsLoading) bookingsLoading.style.display = 'block';
        
        // Try to fetch from API
        try {
            const response = await fetch(`http://localhost:3000/api/bookings/user/${user.id}`);
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            bookings = data;
            console.log('Fetched bookings from API:', bookings);
        } catch (apiError) {
            console.log('API fetch failed, using localStorage fallback:', apiError);
            
            // Fall back to localStorage
            const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            bookings = allBookings.filter(booking => 
                booking.user_id === user.id.toString() || 
                booking.user_id === parseInt(user.id) ||
                booking.user_email === user.email
            );
        }
        
        // Hide loading
        if (bookingsLoading) bookingsLoading.style.display = 'none';
        
        // Apply initial filter and render
        applyFiltersAndRender();
        
    } catch (error) {
        console.error('Error fetching bookings:', error);
        showNotification('Error loading bookings', 'error');
        
        // Hide loading
        if (bookingsLoading) bookingsLoading.style.display = 'none';
        
        // Show no bookings message on error
        if (noBookingsEl) noBookingsEl.style.display = 'block';
    }
}

// Apply filters and sort
function applyFiltersAndRender() {
    // Apply filter
    switch (currentFilter) {
        case 'upcoming':
            filteredBookings = bookings.filter(booking => {
                const bookingDate = new Date(`${booking.booking_date || booking.date} ${booking.start_time || booking.time}`);
                return bookingDate > new Date() && booking.status !== 'cancelled';
            });
            break;
        case 'past':
            filteredBookings = bookings.filter(booking => {
                const bookingDate = new Date(`${booking.booking_date || booking.date} ${booking.start_time || booking.time}`);
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
                const dateA = new Date(a.booking_date || a.date);
                const dateB = new Date(b.booking_date || b.date);
                return dateA - dateB;
            });
            break;
        case 'price-desc':
            filteredBookings.sort((a, b) => b.total_price - a.total_price);
            break;
        case 'price-asc':
            filteredBookings.sort((a, b) => a.total_price - b.total_price);
            break;
        case 'date-desc':
        default:
            filteredBookings.sort((a, b) => {
                const dateA = new Date(a.booking_date || a.date);
                const dateB = new Date(b.booking_date || b.date);
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
        // Format booking date
        const bookingDate = formatDate(booking.booking_date || booking.date);
        const bookingTime = formatTime(booking.start_time || booking.time);
        
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
                        <span><i class="fas fa-clock"></i> ${bookingTime}</span>
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
    const booking = bookings.find(b => b.id.toString() === bookingId.toString());
    
    if (!booking || !modal || !modalContent) return;
    
    // Format data
    const bookingDate = formatDate(booking.booking_date || booking.date);
    const startTime = formatTime(booking.start_time || booking.time);
    const endTime = booking.end_time ? formatTime(booking.end_time) : 
                   calculateEndTime(booking.start_time || booking.time, booking.duration);
    
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
            <div class="booking-detail-value">${startTime} - ${endTime}</div>
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

// Calculate end time based on start time and duration
function calculateEndTime(startTime, duration) {
    if (!startTime) return 'N/A';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + (parseInt(duration) || 1);
    
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Cancel booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        // Try to cancel via API
        try {
            const response = await fetch(`http://localhost:3000/api/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'cancelled' })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to cancel booking: ${response.status}`);
            }
            
            showNotification('Booking cancelled successfully', 'success');
        } catch (apiError) {
            console.warn('API cancel failed, using localStorage fallback:', apiError);
            
            // Fallback to localStorage
            const storedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const updatedBookings = storedBookings.map(booking => {
                if (booking.id.toString() === bookingId.toString()) {
                    return { ...booking, status: 'cancelled' };
                }
                return booking;
            });
            
            localStorage.setItem('bookings', JSON.stringify(updatedBookings));
            showNotification('Booking cancelled successfully (offline mode)', 'success');
        }
        
        // Update local state
        bookings = bookings.map(booking => {
            if (booking.id.toString() === bookingId.toString()) {
                return { ...booking, status: 'cancelled' };
            }
            return booking;
        });
        
        // Re-apply filters and render
        applyFiltersAndRender();
        
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification('Failed to cancel booking', 'error');
    }
}
