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
    // async function handleLogin(e) {
    //     e.preventDefault();
        
    //     // Get form values
    //     const email = document.getElementById('email').value.trim();
    //     const password = document.getElementById('password').value;
    //     const remember = document.getElementById('remember').checked;
        
    //     // Basic validation
    //     if (!email || !password) {
    //         showError('Please enter both email and password');
    //         return;
    //     }
        
    //     if (!validateEmail(email)) {
    //         showError('Please enter a valid email address');
    //         return;
    //     }
        
    //     // Show loading state
    //     const loginBtn = document.querySelector('#login-form button[type="submit"]');
    //     const originalBtnText = loginBtn.textContent;
    //     loginBtn.disabled = true;
    //     loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        
    //     try {
    //         // Simulate login API call
    //         await simulateLogin(email, password);
            
    //         // Important: DO NOT clear bookings here - that will delete the user's bookings
    //         // We'll rely on proper filtering on the booking pages instead
            
    //         // Create user object with consistent user ID
    //         const user = {
    //             id: 13, // Fixed value for testing - using ID 13 consistently
    //             email: email,
    //             fullname: email.split('@')[0], // Extract name from email as example
    //             type: email.includes('owner') ? 'owner' : 'user',
    //             isAdmin: email.includes('admin')
    //         };
            
    //         // Store in localStorage
    //         localStorage.setItem('user', JSON.stringify(user));
            
    //         // Show success message
    //         showNotification('Login successful! Redirecting...', 'success');
            
    //         // Check if we have a redirect for booking
    //         const bookingRedirect = localStorage.getItem('bookingRedirect');
    //         let redirectUrl = 'index.html';
            
    //         // Get URL parameters to check if we have a redirect
    //         const urlParams = new URLSearchParams(window.location.search);
    //         const paramRedirect = urlParams.get('redirect');
            
    //         if (bookingRedirect) {
    //             redirectUrl = bookingRedirect;
    //             localStorage.removeItem('bookingRedirect');
    //         } else if (paramRedirect) {
    //             redirectUrl = decodeURIComponent(paramRedirect);
    //         }
            
    //         // Redirect after a short delay
    //         setTimeout(() => {
    //             window.location.href = redirectUrl;
    //         }, 1000);
            
    //     } catch (error) {
    //         showError(error.message);
    //         loginBtn.disabled = false;
    //         loginBtn.textContent = originalBtnText;
    //     }
    // }
    async function handleLogin(e) {
        e.preventDefault();
        
        // Get form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        
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
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        
        try {
            // Call the real login API
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            console.log('Login API response:', data);
            
            // Store actual user data and token in localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            
            // Show success message
            showNotification('Login successful! Redirecting...', 'success');
            
            // Check if we have a redirect for booking
            const bookingRedirect = localStorage.getItem('bookingRedirect');
            let redirectUrl = 'index.html';
            
            // Get URL parameters to check if we have a redirect
            const urlParams = new URLSearchParams(window.location.search);
            const paramRedirect = urlParams.get('redirect');
            
            if (bookingRedirect) {
                redirectUrl = bookingRedirect;
                localStorage.removeItem('bookingRedirect');
            } else if (paramRedirect) {
                redirectUrl = decodeURIComponent(paramRedirect);
            }
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
            
        } catch (error) {
            showError(error.message);
            loginBtn.disabled = false;
            loginBtn.textContent = originalBtnText;
        }
    }
    
    // Xóa hàm simulateLogin() vì không cần nữa
    // Simulate login API call
    function simulateLogin(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Example validation - in a real app this would be server-side
                if (password.length < 6) {
                    reject(new Error('Invalid credentials'));
                } else {
                    resolve();
                }
            }, 1000);
        });
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
