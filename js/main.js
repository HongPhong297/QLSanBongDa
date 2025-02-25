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
    // Check if notification container exists, if not, create it
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '1000';
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.padding = '15px 20px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    notification.style.cursor = 'pointer';
    
    // Set color based on type
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#2ecc71';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            notification.style.color = 'white';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f39c12';
            notification.style.color = 'white';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
            notification.style.color = 'white';
    }
    
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode === notificationContainer) {
                notificationContainer.removeChild(notification);
            }
        }, 300);
    }, 5000);
    
    // Remove on click
    notification.addEventListener('click', () => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if(notification.parentNode === notificationContainer) {
                notificationContainer.removeChild(notification);
            }
        }, 300);
    });
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

// API service functions
export async function fetchAPI(endpoint, options = {}) {
    // For now, simulate API calls with localStorage
    // In a real app, this would make actual API requests
    
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        // Get data from localStorage based on endpoint
        if (endpoint === '/stadiums' && mergedOptions.method === 'GET') {
            const stadiums = JSON.parse(localStorage.getItem('stadiums') || '[]');
            return { success: true, data: stadiums };
        }
        
        if (endpoint.startsWith('/stadiums/') && mergedOptions.method === 'GET') {
            const stadiumId = endpoint.split('/')[2];
            const stadiums = JSON.parse(localStorage.getItem('stadiums') || '[]');
            const stadium = stadiums.find(s => s.id === stadiumId);
            
            if (stadium) {
                return { success: true, data: stadium };
            } else {
                return { success: false, error: 'Stadium not found' };
            }
        }
        
        if (endpoint === '/bookings' && mergedOptions.method === 'POST') {
            const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const newBooking = { id: generateId(), ...JSON.parse(mergedOptions.body) };
            bookings.push(newBooking);
            localStorage.setItem('bookings', JSON.stringify(bookings));
            return { success: true, data: newBooking };
        }
        
        return { success: false, error: 'Endpoint not implemented' };
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

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
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(String(password));
}

export function validatePhone(phone) {
    const re = /^\+?[0-9]{10,15}$/;
    return re.test(String(phone).replace(/\s+/g, ''));
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
    return '$' + parseFloat(amount).toFixed(2);
}

// Generate star rating HTML
export function generateStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && halfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return stars;
}

// Initialize everything when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initUI);