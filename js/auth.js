// Authentication module for registration and login functionality

import { 
    showNotification, 
    validateEmail, 
    validatePassword, 
    validatePhone, 
    generateId 
} from './main.js';

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authTabs = document.querySelectorAll('.auth-tab');
const errorMessage = document.getElementById('error-message');

// User types
const userTypes = {
    customer: 'customer',
    owner: 'owner'
};

// Get current selected user type
function getUserType() {
    const activeTab = document.querySelector('.auth-tab.active');
    return activeTab ? activeTab.dataset.tab : userTypes.customer;
}

// Display validation error
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
    }
}

// Clear validation error
function clearError() {
    if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.classList.remove('show');
    }
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    clearError();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const userType = getUserType();
    
    // Validate inputs
    if (!email) {
        showError('Email is required');
        return;
    }
    
    if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    if (!password) {
        showError('Password is required');
        return;
    }
    
    // Get users from local storage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Find user by email and type
    const user = users.find(u => u.email === email && u.type === userType);
    
    if (!user) {
        showError(`No ${userType} account found with this email address`);
        return;
    }
    
    // Simple password check (in real app, would use proper authentication)
    if (user.password !== password) {
        showError('Incorrect password');
        return;
    }
    
    // Login successful - store user info
    const { password: _, ...userWithoutPassword } = user; // Remove password from user object
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    
    // Show success notification
    showNotification('Login successful! Redirecting...', 'success');
    
    // Redirect based on user type
    setTimeout(() => {
        if (user.isAdmin) {
            window.location.href = 'admin-dashboard.html';
        } else if (user.type === userTypes.owner) {
            window.location.href = 'owner-dashboard.html';
        } else {
            window.location.href = 'user-dashboard.html';
        }
    }, 1000);
}

// Handle registration form submission
function handleRegistration(e) {
    e.preventDefault();
    clearError();
    
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const termsChecked = document.querySelector('input[name="terms"]').checked;
    const userType = getUserType();
    
    // Validate inputs
    if (!fullname) {
        showError('Full name is required');
        return;
    }
    
    if (!email) {
        showError('Email is required');
        return;
    }
    
    if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    if (!phone) {
        showError('Phone number is required');
        return;
    }
    
    if (!validatePhone(phone)) {
        showError('Please enter a valid phone number');
        return;
    }
    
    if (!password) {
        showError('Password is required');
        return;
    }
    
    if (password.length < 8) {
        showError('Password must be at least 8 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (!termsChecked) {
        showError('You must agree to the Terms and Conditions');
        return;
    }
    
    // Additional stadium owner fields validation
    let ownerData = {};
    if (userType === userTypes.owner) {
        const companyName = document.getElementById('company-name').value.trim();
        const businessAddress = document.getElementById('business-address').value.trim();
        const businessLicense = document.getElementById('business-license').value.trim();
        
        if (!companyName) {
            showError('Company name is required');
            return;
        }
        
        if (!businessAddress) {
            showError('Business address is required');
            return;
        }
        
        if (!businessLicense) {
            showError('Business license number is required');
            return;
        }
        
        ownerData = {
            companyName,
            businessAddress,
            businessLicense,
            verified: false // New stadium owners need to be verified by admin
        };
    }
    
    // Check if email is already registered
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const emailExists = users.some(user => user.email === email);
    
    if (emailExists) {
        showError('This email is already registered');
        return;
    }
    
    // Create new user
    const newUser = {
        id: generateId(),
        fullname,
        email,
        phone,
        password, // In a real app, password would be hashed
        type: userType,
        createdAt: new Date().toISOString(),
        isAdmin: false,
        ...ownerData
    };
    
    // Add to users array and save
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Show success notification
    showNotification('Registration successful! You can now log in.', 'success');
    
    // Redirect to login page
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

// Initialize authentication functionality
function initAuth() {
    // Add login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Add registration form handler
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    // Initialize demo data if not present
    initDemoData();
}

// Initialize demo data for testing
function initDemoData() {
    // Only add demo data if users array is empty
    if (!localStorage.getItem('users')) {
        const demoUsers = [
            {
                id: 'admin1',
                fullname: 'Admin User',
                email: 'admin@stadiumfinder.com',
                phone: '1234567890',
                password: 'Admin123',
                type: 'customer',
                isAdmin: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'customer1',
                fullname: 'John Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'Password123',
                type: 'customer',
                isAdmin: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 'owner1',
                fullname: 'Stadium Manager',
                email: 'owner@example.com',
                phone: '9876543210',
                password: 'Password123',
                type: 'owner',
                isAdmin: false,
                companyName: 'Sports Venues Inc.',
                businessAddress: '123 Stadium St, Sportsville',
                businessLicense: 'BL12345678',
                verified: true,
                createdAt: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('users', JSON.stringify(demoUsers));
    }
    
    // Initialize demo stadiums if not present
    if (!localStorage.getItem('stadiums')) {
        const demoStadiums = [
            {
                id: 'stadium1',
                name: 'City Sports Arena',
                description: 'A modern sports complex with multiple courts and excellent facilities.',
                location: '123 Main St, Downtown',
                price: 120,
                capacity: 100,
                sportType: 'basketball',
                ownerId: 'owner1',
                images: [
                    'images/stadiums/stadium1-1.jpg',
                    'images/stadiums/stadium1-2.jpg',
                    'images/stadiums/stadium1-3.jpg'
                ],
                facilities: [
                    'Changing rooms',
                    'Showers',
                    'Parking',
                    'Cafe',
                    'Lighting',
                    'Equipment rental'
                ],
                rules: [
                    'No food on courts',
                    'Proper sports shoes required',
                    'Bookings must be cancelled 24h in advance'
                ],
                rating: 4.5,
                reviews: 24,
                createdAt: new Date().toISOString()
            },
            {
                id: 'stadium2',
                name: 'Riverside Football Ground',
                description: 'A beautiful football field located right next to the river with stunning views.',
                location: '45 River Lane, Westside',
                price: 150,
                capacity: 22,
                sportType: 'football',
                ownerId: 'owner1',
                images: [
                    'images/stadiums/stadium2-1.jpg',
                    'images/stadiums/stadium2-2.jpg'
                ],
                facilities: [
                    'Changing rooms',
                    'Showers',
                    'Floodlights',
                    'Parking',
                    'Coach area'
                ],
                rules: [
                    'No metal studs',
                    'No food on field',
                    'Teams responsible for cleanup'
                ],
                rating: 4.2,
                reviews: 18,
                createdAt: new Date().toISOString()
            },
            {
                id: 'stadium3',
                name: 'Ace Tennis Club',
                description: 'Professional tennis courts with both indoor and outdoor options.',
                location: '78 Park Avenue, Eastville',
                price: 80,
                capacity: 4,
                sportType: 'tennis',
                ownerId: 'owner1',
                images: [
                    'images/stadiums/stadium3-1.jpg',
                    'images/stadiums/stadium3-2.jpg',
                    'images/stadiums/stadium3-3.jpg'
                ],
                facilities: [
                    'Pro shop',
                    'Coaching available',
                    'Locker rooms',
                    'Equipment rental',
                    'Clubhouse'
                ],
                rules: [
                    'Tennis shoes only',
                    'Appropriate tennis attire required',
                    'Court time limited to 2 hours'
                ],
                rating: 4.8,
                reviews: 36,
                createdAt: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('stadiums', JSON.stringify(demoStadiums));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);
