// User login functionality

import { validateEmail, showNotification } from './main.js';

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('login-error');
    
    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 5000);
    }
    
    // Handle form submission
    async function handleLogin(e) {
        e.preventDefault();
        
        // Get form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Basic validation
        if (!email || !password) {
            showError('Please enter both email and password');
            return;
        }
        
        if (!validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        // Show loading state
        const loginBtn = document.querySelector('#login-form button[type="submit"]');
        const originalBtnText = loginBtn.textContent;
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        
        try {
            // Send login request
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            // Parse response
            const data = await response.json();
            
            // Handle response
            if (response.ok) {
                // Login successful
                showNotification('Login successful!', 'success');
                
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
                
                // Redirect based on user type
                if (data.user.user_type === 'owner') {
                    window.location.href = 'owner-dashboard.html';
                } else if (data.user.is_admin) {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                // Login failed
                showError(data.error || 'Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            loginBtn.textContent = originalBtnText;
        }
    }
    
    // Initialize login functionality
    function init() {
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
    }
    
    // Initialize
    init();
});
