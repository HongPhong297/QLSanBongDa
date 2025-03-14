// Debugging tool for user bookings page
// Add this script to user-bookings.html to debug issues

document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug Tool for User Bookings Page Initialized');
    
    // Create debug panel
    createDebugPanel();
    
    // Test API connection
    testAPIConnection();
});

function createDebugPanel() {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 9999;
        font-family: monospace;
        font-size: 12px;
        width: 300px;
        max-height: 400px;
        overflow-y: auto;
    `;
    
    debugPanel.innerHTML = `
        <h3 style="margin-top: 0; color: #3498db;">Bookings Debug</h3>
        <div id="user-info">User: Loading...</div>
        <div id="api-status">API: Testing...</div>
        <div id="bookings-count">Bookings: Unknown</div>
        <div id="debug-actions">
            <button id="test-api" style="margin-right: 5px; padding: 3px 8px; font-size: 11px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">
                Test API
            </button>
            <button id="force-refresh" style="margin-right: 5px; padding: 3px 8px; font-size: 11px; background: #2ecc71; color: white; border: none; border-radius: 3px; cursor: pointer;">
                Refresh
            </button>
            <button id="close-debug" style="padding: 3px 8px; font-size: 11px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer;">
                Close
            </button>
        </div>
        <div id="debug-log" style="margin-top: 10px; border-top: 1px solid #555; padding-top: 10px; max-height: 200px; overflow-y: auto;">
            <div class="log-item">Debug started...</div>
        </div>
    `;
    
    document.body.appendChild(debugPanel);
    
    // Add event listeners to buttons
    document.getElementById('test-api').addEventListener('click', testAPIConnection);
    document.getElementById('force-refresh').addEventListener('click', forceRefreshBookings);
    document.getElementById('close-debug').addEventListener('click', () => {
        debugPanel.style.display = 'none';
    });
    
    // Add keyboard shortcut to toggle debug panel
    document.addEventListener('keydown', (e) => {
        // Ctrl+Alt+D to toggle debug panel
        if (e.ctrlKey && e.altKey && e.key === 'd') {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        }
    });
}

// Add log to debug panel
function addLog(message, type = 'info') {
    const debugLog = document.getElementById('debug-log');
    if (!debugLog) return;
    
    const logItem = document.createElement('div');
    logItem.className = `log-item log-${type}`;
    logItem.style.cssText = `
        margin-bottom: 5px;
        padding: 3px 0;
        border-bottom: 1px dotted #555;
        color: ${getLogColor(type)};
    `;
    
    const timestamp = new Date().toLocaleTimeString();
    logItem.innerHTML = `[${timestamp}] ${message}`;
    
    debugLog.appendChild(logItem);
    debugLog.scrollTop = debugLog.scrollHeight;
    
    // Also log to console
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Get color for log type
function getLogColor(type) {
    switch (type) {
        case 'error': return '#e74c3c';
        case 'success': return '#2ecc71';
        case 'warning': return '#f39c12';
        default: return '#ecf0f1';
    }
}

// Test API connection
async function testAPIConnection() {
    updatePanel('api-status', 'API: Testing...', '#f39c12');
    addLog('Testing API connection...');
    
    const API_BASE_URL = 'http://localhost:3000/api';
    
    try {
        const response = await fetch(`${API_BASE_URL}/stadiums`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            updatePanel('api-status', 'API: Connected ✓', '#2ecc71');
            addLog('API connection successful', 'success');
            
            // Now test bookings endpoint with actual user ID
            testBookingsEndpoint();
        } else {
            updatePanel('api-status', `API: Error ${response.status} ✗`, '#e74c3c');
            addLog(`API responded with status: ${response.status}`, 'error');
        }
    } catch (error) {
        updatePanel('api-status', 'API: Unreachable ✗', '#e74c3c');
        addLog(`API connection failed: ${error.message}`, 'error');
        
        // Show possible fixes
        if (error.message.includes('Failed to fetch')) {
            addLog('Possible causes: Server not running, CORS issue, network problem', 'warning');
        }
    }
}

// Test bookings endpoint
async function testBookingsEndpoint() {
    const user = getCurrentUser();
    if (!user || !user.id) {
        addLog('User not found or missing ID', 'error');
        return;
    }
    
    updatePanel('user-info', `User: ${user.fullname || user.email} (ID: ${user.id})`, '#3498db');
    addLog(`Testing bookings endpoint for user ID: ${user.id}`);
    
    const API_BASE_URL = 'http://localhost:3000/api';
    
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/user/${user.id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        // First, log the raw response for debugging
        const rawText = await response.clone().text();
        addLog(`Raw API response: ${rawText.substring(0, 50)}${rawText.length > 50 ? '...' : ''}`, 'info');
        
        if (response.ok) {
            try {
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    updatePanel('bookings-count', `Bookings: ${data.length} found`, '#2ecc71');
                    addLog(`Found ${data.length} bookings from API`, 'success');
                    
                    // Show sample booking if available
                    if (data.length > 0) {
                        addLog(`Sample booking: ID ${data[0].id}, Stadium: ${data[0].stadium_name || 'Unknown'}`, 'info');
                    }
                } else {
                    updatePanel('bookings-count', 'Bookings: Invalid data', '#e74c3c');
                    addLog('API response is not an array', 'error');
                }
            } catch (jsonError) {
                updatePanel('bookings-count', 'Bookings: JSON parse error', '#e74c3c');
                addLog(`Failed to parse JSON: ${jsonError.message}`, 'error');
            }
        } else {
            updatePanel('bookings-count', `Bookings: API Error ${response.status}`, '#e74c3c');
            addLog(`Bookings API responded with status: ${response.status}`, 'error');
        }
    } catch (error) {
        updatePanel('bookings-count', 'Bookings: Fetch error', '#e74c3c');
        addLog(`Bookings endpoint error: ${error.message}`, 'error');
    }
}

// Force refresh bookings
function forceRefreshBookings() {
    addLog('Forcing bookings refresh...');
    
    // Call fetchUserBookings from user-bookings.js
    if (typeof fetchUserBookings === 'function') {
        fetchUserBookings();
    } else {
        // If the function doesn't exist in global scope, we can try to reload the page
        addLog('fetchUserBookings function not found, reloading page...', 'warning');
        location.reload();
    }
}

// Update debug panel elements
function updatePanel(elementId, text, color = null) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
        if (color) {
            element.style.color = color;
        }
    }
}

// Get current user from localStorage - duplicate the main.js function
function getCurrentUser() {
    const user = localStorage.getItem('user');
    
    if (!user) return null;
    
    try {
        return JSON.parse(user);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}