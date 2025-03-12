// Script to handle booking success notification when redirected from booking page

document.addEventListener('DOMContentLoaded', function() {
    // Check if we have a booking success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('booking') && urlParams.get('booking') === 'success') {
        console.log('Booking success detected in URL');
        
        // Show success notification directly
        showBookingSuccessMessage();
        
        // Clean up URL parameter
        const newUrl = window.location.pathname;
        history.replaceState({}, document.title, newUrl);
    }
    
    // Check if we have a booking in localStorage that hasn't been confirmed to user
    const pendingBookingConfirmation = localStorage.getItem('pendingBookingConfirmation');
    if (pendingBookingConfirmation) {
        console.log('Pending booking confirmation found in localStorage');
        
        // Show success notification
        showBookingSuccessMessage();
        
        // Clear the pending confirmation
        localStorage.removeItem('pendingBookingConfirmation');
    }
});

// Function to show success notification and modal
function showBookingSuccessMessage() {
    // First try using the showNotification function from main.js
    try {
        // Direct import (safer than dynamic import)
        const mainModule = window.mainModule || {};
        if (typeof mainModule.showNotification === 'function') {
            mainModule.showNotification('Your booking has been confirmed! You can view your bookings in your profile.', 'success');
        } else {
            // Fallback to direct notification
            showFallbackNotification();
        }
    } catch (e) {
        console.error('Error showing notification:', e);
        showFallbackNotification();
    }
    
    // Additionally, create and show a confirmation dialog
    showSuccessDialog();
}

// Create a fallback notification function
function showFallbackNotification() {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = 'Your booking has been confirmed! You can view your bookings in your profile.';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: #2ecc71;
        color: white;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        transition: all 0.3s ease;
        opacity: 0;
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Hide and remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Show a success dialog
function showSuccessDialog() {
    // Create dialog element
    const dialog = document.createElement('div');
    dialog.className = 'booking-success-dialog';
    dialog.innerHTML = `
        <div class="booking-success-content">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2>Booking Successful!</h2>
            <p>Your stadium booking has been confirmed.</p>
            <p class="booking-details">You can view all your bookings in your profile dashboard.</p>
            <button class="btn btn-primary close-dialog">OK, Got it!</button>
        </div>
    `;
    
    // Style the dialog
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    const dialogContent = dialog.querySelector('.booking-success-content');
    dialogContent.style.cssText = `
        background-color: white;
        padding: 40px;
        border-radius: 8px;
        text-align: center;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        transform: translateY(20px);
        transition: transform 0.3s ease;
    `;
    
    // Style the success icon
    const successIcon = dialog.querySelector('.success-icon i');
    successIcon.style.cssText = `
        font-size: 4rem;
        color: #2ecc71;
        margin-bottom: 20px;
    `;
    
    // Add the dialog to the page
    document.body.appendChild(dialog);
    
    // Show the dialog with animation
    setTimeout(() => {
        dialog.style.opacity = '1';
        dialogContent.style.transform = 'translateY(0)';
    }, 10);
    
    // Add event listener to close button
    const closeButton = dialog.querySelector('.close-dialog');
    closeButton.addEventListener('click', () => {
        dialog.style.opacity = '0';
        dialogContent.style.transform = 'translateY(20px)';
        setTimeout(() => {
            document.body.removeChild(dialog);
        }, 300);
    });
    
    // Auto close after 8 seconds
    setTimeout(() => {
        if (document.body.contains(dialog)) {
            dialog.style.opacity = '0';
            dialogContent.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (document.body.contains(dialog)) {
                    document.body.removeChild(dialog);
                }
            }, 300);
        }
    }, 8000);
}
