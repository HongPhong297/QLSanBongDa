// Main JavaScript file for functionality shared across all pages

// DOM elements
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.getElementById('main-nav');

// Function to toggle mobile navigation
function toggleMobileNav() {
    mainNav.classList.toggle('active');
}

// Initialize UI elements
function initUI() {
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileNav);
    }
    
    // Call updateNavigation to display correct menu based on user type
    updateNavigation();
    
    // Add event listeners for tabs if present on page
    initTabs();
    
    // Initialize dark mode toggle if present
    initDarkMode();
}

// Initialize tab functionality across the site
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn, .auth-tab');
    
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const target = this.dataset.tab;
                const parent = this.closest('.stadium-content, .auth-form');
                
                // Remove active class from all tabs
                if (this.classList.contains('auth-tab')) {
                    document.querySelectorAll('.auth-tab').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    
                    // Show/hide owner specific fields for registration
                    const ownerFields = document.getElementById('owner-fields');
                    if (ownerFields) {
                        ownerFields.style.display = target === 'owner' ? 'block' : 'none';
                    }
                } else {
                    parent.querySelectorAll('.tab-btn').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    
                    // Hide all content
                    parent.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    // Show selected content
                    const contentToShow = document.getElementById(`${target}-tab`);
                    if (contentToShow) {
                        contentToShow.classList.add('active');
                    }
                }
                
                // Add active class to clicked tab
                this.classList.add('active');
            });
        });
    }
}

// Dark mode functionality
function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (darkModeToggle) {
        // Check if user previously enabled dark mode
        const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
        
        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', null);
            }
        });
    }
}

// Display notification to user
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide and remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Authentication related functions
export function isLoggedIn() {
    return localStorage.getItem('user') !== null;
}

export function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

export function isStadiumOwner() {
    const user = getCurrentUser();
    return user && user.type === 'owner';
}

export function isAdmin() {
    const user = getCurrentUser();
    return user && user.isAdmin === true;
}

export function logout() {
    localStorage.removeItem('user');
    showNotification('You have been logged out successfully', 'success');
    window.location.href = 'index.html';
}

// Update navigation based on user login status
export function updateNavigation() {
    const loginBtn = document.querySelector('a[href="login.html"]');
    const registerBtn = document.querySelector('a[href="register.html"]');
    
    if (!loginBtn || !registerBtn) return; // Skip if elements don't exist
    
    if (isLoggedIn()) {
        const user = getCurrentUser();
        const nav = document.getElementById('main-nav').querySelector('ul');
        
        // Remove login/register buttons
        loginBtn.parentNode.removeChild(loginBtn);
        registerBtn.parentNode.removeChild(registerBtn);
        
        // Create user dropdown
        const li = document.createElement('li');
        li.className = 'user-dropdown';
        
        // Create dropdown HTML with appropriate links based on user type
        if (isAdmin()) {
            li.innerHTML = `
                <a href="#" class="dropdown-toggle">${user.fullname} <i class="fas fa-chevron-down"></i></a>
                <div class="dropdown-menu">
                    <a href="admin-dashboard.html"><i class="fas fa-tachometer-alt"></i> Admin Dashboard</a>
                    <a href="admin-users.html"><i class="fas fa-users"></i> Manage Users</a>
                    <a href="admin-stadiums.html"><i class="fas fa-futbol"></i> Manage Stadiums</a>
                    <a href="admin-bookings.html"><i class="fas fa-calendar-check"></i> Manage Bookings</a>
                    <a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            `;
        } else if (isStadiumOwner()) {
            li.innerHTML = `
                <a href="#" class="dropdown-toggle">${user.fullname} <i class="fas fa-chevron-down"></i></a>
                <div class="dropdown-menu">
                    <a href="owner-dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    <a href="owner-stadiums.html"><i class="fas fa-futbol"></i> My Stadiums</a>
                    <a href="owner-bookings.html"><i class="fas fa-calendar-check"></i> Bookings</a>
                    <a href="owner-profile.html"><i class="fas fa-user"></i> Profile</a>
                    <a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            `;
        } else {
            li.innerHTML = `
                <a href="#" class="dropdown-toggle">${user.fullname} <i class="fas fa-chevron-down"></i></a>
                <div class="dropdown-menu">
                    <a href="user-dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    <a href="user-bookings.html"><i class="fas fa-calendar-check"></i> My Bookings</a>
                    <a href="user-profile.html"><i class="fas fa-user"></i> Profile</a>
                    <a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            `;
        }
        
        nav.appendChild(li);
        
        // Add dropdown toggle functionality
        const dropdownToggle = li.querySelector('.dropdown-toggle');
        const dropdownMenu = li.querySelector('.dropdown-menu');
        
        dropdownToggle.addEventListener('click', (e) => {
            e.preventDefault();
            dropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!li.contains(e.target) && dropdownMenu.classList.contains('show')) {
                dropdownMenu.classList.remove('show');
            }
        });
        
        // Add logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    }
}

// API service functions - Updated to use real API
export async function fetchAPI(endpoint, options = {}) {
    const API_BASE_URL = 'http://localhost:3000/api';
    
    try {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors' // Explicitly set CORS mode
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        // If there's a body, stringify it
        if (mergedOptions.body && typeof mergedOptions.body === 'object') {
            mergedOptions.body = JSON.stringify(mergedOptions.body);
        }
        
        // Log the request for debugging
        console.log(`Fetching ${API_BASE_URL}${endpoint}`, mergedOptions);
        
        // Add a timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        mergedOptions.signal = controller.signal;
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
        clearTimeout(timeoutId);
        
        // Log response status for debugging
        console.log(`Response status:`, response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        // For debugging, get the response text first and log it
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        // Try to parse the JSON response
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid JSON response from server');
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('API fetch error:', error);
        
        // Check if it's a network error - likely CORS or server down
        if (error.message === 'Failed to fetch' || error.name === 'AbortError') {
            showNotification('Network error. Check if the API server is running and CORS is configured.', 'error');
        } else {
            showNotification(`API error: ${error.message}`, 'error');
        }
        
        // Fallback to localStorage for demo purposes
        console.log('Falling back to localStorage data');
        
        if (endpoint === '/stadiums' && options.method === 'GET') {
            const stadiums = JSON.parse(localStorage.getItem('stadiums') || '[]');
            return { success: true, data: stadiums };
        }
        
        if (endpoint.startsWith('/stadiums/') && options.method === 'GET') {
            const stadiumId = endpoint.split('/')[2];
            const stadiums = JSON.parse(localStorage.getItem('stadiums') || '[]');
            const stadium = stadiums.find(s => s.id === stadiumId);
            
            if (stadium) {
                return { success: true, data: stadium };
            }
        }
        
        return { 
            success: false, 
            error: error.message,
            data: null 
        };
    }
}

// Helper function to test API connection
export async function testAPIConnection() {
    try {
        showNotification('Testing API connection...', 'info');
        const result = await fetchAPI('/stadiums');
        
        if (result.success && result.data) {
            showNotification('API connection successful!', 'success');
            console.log('Stadiums data:', result.data);
            return true;
        } else {
            showNotification('API connection failed.', 'error');
            return false;
        }
    } catch (error) {
        showNotification(`API test failed: ${error.message}`, 'error');
        return false;
    }
}

// Add a test connection button if we're on the debug page
document.addEventListener('DOMContentLoaded', () => {
    const debugButton = document.getElementById('test-api-connection');
    if (debugButton) {
        debugButton.addEventListener('click', testAPIConnection);
    }
    
    // Rest of the initialization code...
    initUI();
});

// Helper function to generate unique IDs
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Form validation utilities
export function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

export function validatePassword(password) {
    // At least 8 characters with at least one letter and one number
    if (password.length < 8) return false;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
}

export function validatePhone(phone) {
    // Basic validation - allow digits, spaces, and common phone symbols
    const re = /^[\d\s\+\-\(\)]{8,20}$/;
    return re.test(String(phone));
}

// Format date and time for display
export function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

export function formatTime(timeString) {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatCurrency(amount) {
    // Handle strings or numbers
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(numAmount);
}

// Generate star rating HTML
export function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Add placeholder image for images that fail to load
document.addEventListener('DOMContentLoaded', function() {
    const imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
        img.onerror = function() {
            this.src = 'images/stadium-placeholder.jpg';
        };
    });
});

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
        });
    }
});

// Initialize everything when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initUI);