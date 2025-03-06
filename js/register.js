// User registration functionality

import { validateEmail, validatePassword, validatePhone, showNotification } from './main.js';

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('registration-error');
    const successMessage = document.getElementById('registration-success');
    const userTab = document.querySelector('.auth-tab[data-tab="user"]');
    const ownerTab = document.querySelector('.auth-tab[data-tab="owner"]');
    const ownerFields = document.getElementById('owner-fields');
    
    // Active user type (default: 'user')
    // Change this line in register.js
let activeUserType = 'customer'; // Change from 'user' to 'customer'

// And update this part where you set up the tabs
function setupTabs() {
    [userTab, ownerTab].forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Set active user type - Map 'user' to 'customer' if needed
            activeUserType = this.dataset.tab === 'user' ? 'customer' : this.dataset.tab;
            
            // Toggle owner fields visibility
            ownerFields.style.display = activeUserType === 'owner' ? 'block' : 'none';
            
            // Update required fields based on user type
            updateRequiredFields();
        });
    });
}
    
    // Update required fields based on user type
    function updateRequiredFields() {
        const ownerOnlyFields = ['company-name', 'business-address', 'business-license'];
        
        ownerOnlyFields.forEach(field => {
            const element = document.getElementById(field);
            if (activeUserType === 'owner') {
                element.setAttribute('required', 'required');
            } else {
                element.removeAttribute('required');
            }
        });
    }
    
    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        successMessage.classList.remove('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 5000);
    }
    
    // Show success message
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.add('show');
        errorMessage.classList.remove('show');
    }
    
    // Validate form
    function validateForm(formData) {
        // Validate email
        if (!validateEmail(formData.email)) {
            showError('Please enter a valid email address');
            return false;
        }
        
        // Validate password
        if (!validatePassword(formData.password)) {
            showError('Password must be at least 8 characters and include numbers and letters');
            return false;
        }
        
        // Check if passwords match
        if (formData.password !== formData.confirmPassword) {
            showError('Passwords do not match');
            return false;
        }
        
        // Validate phone
        if (!validatePhone(formData.phone)) {
            showError('Please enter a valid phone number');
            return false;
        }
        
        // For owner accounts, validate business info
        if (activeUserType === 'owner') {
            if (!formData.company_name || !formData.business_address || !formData.business_license) {
                showError('Please complete all business information fields');
                return false;
            }
        }
        
        return true;
    }
    
    // Handle form submission
    async function handleRegistration(e) {
        e.preventDefault();
        
        // Get form values
        const formData = {
            fullname: document.getElementById('fullname').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('password-confirm').value,
            user_type: activeUserType,
            // Owner fields (might be empty for regular users)
            company_name: document.getElementById('company-name').value.trim(),
            business_address: document.getElementById('business-address').value.trim(),
            business_license: document.getElementById('business-license').value.trim()
        };
        
        // Validate form data
        if (!validateForm(formData)) {
            return; // Stop if validation fails
        }
        
        // Show loading state
        const submitBtn = document.getElementById('register-btn');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        
        try {
            // Prepare API request data
            const apiData = {
                fullname: formData.fullname,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                user_type: formData.user_type
            };
            
            // Add owner-specific fields if user is registering as an owner
            if (activeUserType === 'owner') {
                apiData.company_name = formData.company_name;
                apiData.business_address = formData.business_address;
                apiData.business_license = formData.business_license;
            }
            
            // Send registration request
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(apiData)
            });
            
            // Parse response
            const data = await response.json();
            
            // Handle response
            if (response.ok) {
                // Registration successful
                showSuccess('Registration successful! You can now login.');
                showNotification('Account created successfully!', 'success');
                
                // Reset form
                registerForm.reset();
                
                // Redirect to login page after a delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                // Registration failed
                showError(data.error || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }
    
    // Initialize registration functionality
    function init() {
        // Set up tab switching
        setupTabs();
        
        // Update initial required fields
        updateRequiredFields();
        
        // Set up form submission
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    // Initialize
    init();
});
