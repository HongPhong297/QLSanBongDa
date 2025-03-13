/**
 * Debug utilities for the application
 */

// Test API connection
export async function testApiConnection() {
    try {
        const API_BASE_URL = 'http://localhost:3000/api';
        
        console.log('Testing API connection to:', API_BASE_URL);
        const start = Date.now();
        
        // Thay đổi đường dẫn để trỏ đến một endpoint thực sự tồn tại
        const response = await fetch(`${API_BASE_URL}/stadiums`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors',
            cache: 'no-cache',
        });
        
        const elapsed = Date.now() - start;
        
        if (response.ok) {
            console.log(`✅ API connection successful (${elapsed}ms)`);
            return true;
        } else {
            console.error(`❌ API responded with status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('❌ API connection failed:', error);
        
        // Specific error guidance
        if (error.message === 'Failed to fetch') {
            console.warn('This usually means the server is not running or CORS is misconfigured');
            console.warn('Make sure your API server is running at http://localhost:3000');
            console.warn('Check for CORS headers in the response');
        }
        
        return false;
    }
}

// Check if bookings API is working
export async function testBookingsApi() {
    try {
        const API_BASE_URL = 'http://localhost:3000/api';
        
        // First check if API is reachable
        const baseTest = await testApiConnection();
        if (!baseTest) {
            return false;
        }
        
        // Test if we can query the bookings endpoint
        console.log('Testing bookings API...');
        const response = await fetch(`${API_BASE_URL}/bookings/user/1`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        // Even a 404 might be OK - it means the endpoint exists but no data
        if (response.status === 404 || response.ok) {
            console.log('✅ Bookings API endpoint reachable');
            return true;
        } else {
            console.error(`❌ Bookings API responded with status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Bookings API test failed:', error);
        return false;
    }
}

// Add a small UI panel that shows API status
export function addApiStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'api-status-indicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
        cursor: pointer;
    `;
    indicator.innerHTML = '⚠️ Checking API...';
    
    document.body.appendChild(indicator);
    
    // Test API and update indicator
    testApiConnection().then(connected => {
        if (connected) {
            indicator.innerHTML = '✅ API Connected';
            indicator.style.background = 'rgba(46, 204, 113, 0.8)';
            
            // Hide after 5 seconds
            setTimeout(() => {
                indicator.style.opacity = '0.3';
            }, 5000);
            
            // Show again on hover
            indicator.addEventListener('mouseenter', () => {
                indicator.style.opacity = '1';
            });
            
            indicator.addEventListener('mouseleave', () => {
                indicator.style.opacity = '0.3';
            });
        } else {
            indicator.innerHTML = '❌ API Disconnected';
            indicator.style.background = 'rgba(231, 76, 60, 0.8)';
            
            // Add click handler to test again
            indicator.addEventListener('click', () => {
                indicator.innerHTML = '⚠️ Retesting API...';
                indicator.style.background = 'rgba(0,0,0,0.7)';
                
                testApiConnection().then(reconnected => {
                    if (reconnected) {
                        indicator.innerHTML = '✅ API Connected';
                        indicator.style.background = 'rgba(46, 204, 113, 0.8)';
                    } else {
                        indicator.innerHTML = '❌ API Disconnected';
                        indicator.style.background = 'rgba(231, 76, 60, 0.8)';
                    }
                });
            });
        }
    });
    
    return indicator;
}

// Initialize debug tools automatically
document.addEventListener('DOMContentLoaded', () => {
    // Only run in non-production
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Add API status indicator after a small delay
        setTimeout(() => {
            addApiStatusIndicator();
        }, 1000);
        
        // Add to global scope for console debugging
        window.debugTools = {
            testApiConnection,
            testBookingsApi,
        };
        
        console.log('Debug tools initialized. Access via window.debugTools');
    }
});
