const API_BASE_URL = 'http://localhost:3000/api';
// Add this to your existing api-client.js file

/**
 * Get all bookings for a specific user
 * @param {number|string} userId - The user ID to fetch bookings for
 * @returns {Promise<object>} - Promise with the API response
 */
export async function getUserBookings(userId) {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
                details: 'Unable to fetch bookings without a user ID'
            };
        }

        // Make sure userId is a number when passed to API
        const parsedUserId = parseInt(userId);
        if (isNaN(parsedUserId)) {
            console.error('Invalid user ID format:', userId);
            return {
                success: false,
                error: 'Invalid user ID format',
                details: 'User ID must be a valid number'
            };
        }

        console.log(`Fetching bookings for user ID: ${parsedUserId}`);
        
        // Get authentication token from localStorage
        const token = localStorage.getItem('token');
        
        // Add token to headers if available
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Including auth token in request');
        } else {
            console.warn('No authentication token found');
        }
        
        // Call the API endpoint for user bookings
        const response = await fetch(`http://localhost:3000/api/bookings/user/${parsedUserId}`, {
            method: 'GET',
            headers: headers
        });

        console.log(`API response status: ${response.status}`);
        
        // Get the raw text first for debugging
        const responseText = await response.text();
        console.log('Raw API response:', responseText.substring(0, 200)); // Log just the first part to avoid huge logs
        
        // Handle empty response
        if (!responseText) {
            return {
                success: false,
                error: 'Empty response from server',
                details: `Server returned empty response with status ${response.status}`
            };
        }
        
        // Try to parse the response as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse API response as JSON:', parseError);
            return {
                success: false,
                error: 'Invalid response format',
                details: 'Server returned non-JSON response: ' + responseText.substring(0, 100)
            };
        }
        
        if (!response.ok) {
            console.error('API error response:', data);
            return {
                success: false,
                error: data.error || `API error: ${response.status}`,
                details: data.details || 'No additional details provided'
            };
        }
        
        return {
            success: true,
            data
        };
    } catch (error) {
        console.error('Error in getUserBookings API call:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            isNetworkError: error.message.includes('fetch') || error.message.includes('network')
        };
    }
}

/**
 * Update a booking's status or other properties
 * @param {number|string} bookingId - The booking ID to update
 * @param {object} updateData - The data to update (status, payment_status, etc)
 * @returns {Promise<object>} - Promise with the API response
 */
export async function updateBooking(bookingId, updateData) {
    try {
        if (!bookingId) {
            return {
                success: false,
                error: 'Booking ID is required',
                details: 'Unable to update booking without an ID'
            };
        }

        console.log(`Updating booking ID: ${bookingId} with data:`, updateData);
        
        // Get authentication token from localStorage
        const token = localStorage.getItem('token');
        
        // Add token to headers if available
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Including auth token in request');
        } else {
            console.warn('No authentication token found');
        }
        
        // Call the API endpoint to update booking
        const response = await fetch(`http://localhost:3000/api/bookings/${bookingId}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(updateData)
        });
        
        // Get the raw text first for debugging
        const responseText = await response.text();
        console.log('Raw API response:', responseText.substring(0, 200));
        
        // Handle empty response
        if (!responseText) {
            return {
                success: false,
                error: 'Empty response from server',
                details: `Server returned empty response with status ${response.status}`
            };
        }
        
        // Try to parse the response as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse API response as JSON:', parseError);
            return {
                success: false,
                error: 'Invalid response format',
                details: 'Server returned non-JSON response: ' + responseText.substring(0, 100)
            };
        }
        
        if (!response.ok) {
            console.error('API error response:', data);
            return {
                success: false,
                error: data.error || `API error: ${response.status}`,
                details: data.details || 'No additional details provided'
            };
        }
        
        return {
            success: true,
            data: data.booking || data
        };
    } catch (error) {
        console.error('Error in updateBooking API call:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            isNetworkError: error.message.includes('fetch') || error.message.includes('network')
        };
    }
}
// Export other API functions that may be needed
// export { createBooking } from './api-client.js';
export async function createBooking(bookingData) {
    try {
        // Validate required fields first
        const requiredFields = [
            'stadium_id', 'booking_date', 'start_time', 'end_time', 
            'total_price', 'customer_name', 'customer_email', 'customer_phone'
        ];
        
        const missingFields = requiredFields.filter(field => !bookingData[field]);
        if (missingFields.length > 0) {
            console.error('Missing required booking fields:', missingFields);
            return {
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`,
                details: 'Please complete all required booking information.'
            };
        }

        // Convert numeric values safely with fallbacks to prevent NaN
        const processedPayload = {
            stadium_id: parseInt(bookingData.stadium_id) || null,
            user_id: bookingData.user_id ? (parseInt(bookingData.user_id) || null) : null,
            booking_date: bookingData.booking_date,
            start_time: ensureTimeFormat(bookingData.start_time),
            end_time: ensureTimeFormat(bookingData.end_time),
            total_price: parseFloat(bookingData.total_price) || 0,
            customer_name: bookingData.customer_name || '',
            customer_email: bookingData.customer_email || '',
            customer_phone: bookingData.customer_phone || '',
            notes: bookingData.notes || null,
            payment_method: bookingData.payment_method || 'online'
        };

        // Validate after conversion
        if (!processedPayload.stadium_id) {
            return {
                success: false,
                error: 'Invalid stadium ID',
                details: 'Stadium ID must be a valid number.'
            };
        }

        if (processedPayload.total_price <= 0) {
            return {
                success: false,
                error: 'Invalid price',
                details: 'Total price must be greater than zero.'
            };
        }

        console.log('Sending booking request to API:', processedPayload);
        
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(processedPayload)
        });
        
        // Get the raw text first
        const responseText = await response.text();
        console.log('Raw API response:', responseText);
        
        // Handle empty response
        if (!responseText) {
            return {
                success: false,
                error: 'Empty response from server',
                details: `Server returned empty response with status ${response.status}`
            };
        }
        
        // Try to parse the response as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse API response as JSON:', parseError);
            return {
                success: false,
                error: 'Invalid response format',
                details: 'Server returned non-JSON response: ' + responseText.substring(0, 100)
            };
        }
        
        if (!response.ok) {
            console.error('API error response:', data);
            return {
                success: false,
                error: data.error || `API error: ${response.status}`,
                details: data.details || 'No additional details provided'
            };
        }
        
        return {
            success: true,
            data
        };
    } catch (error) {
        console.error('Error in createBooking API call:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            isNetworkError: error.message.includes('fetch') || error.message.includes('network')
        };
    }
}

/**
 * Ensure time is in HH:MM format
 * @param {string} timeString - Time string to format
 * @returns {string} - Formatted time string
 */
function ensureTimeFormat(timeString) {
    if (!timeString) return '00:00';
    
    // If the time is just a number, assume it's hours
    if (/^\d+$/.test(timeString)) {
        return timeString.padStart(2, '0') + ':00';
    }
    
    // If it's already in HH:MM format, return as is
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        // Add leading zero if needed
        const [hours, minutes] = timeString.split(':');
        return hours.padStart(2, '0') + ':' + minutes;
    }
    
    // Try to parse as Date object and format
    try {
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        }
    } catch (e) {
        console.error('Error parsing time:', e);
    }
    
    // Fallback
    return '00:00';
}