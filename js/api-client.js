const API_BASE_URL = 'http://localhost:3000/api';
/**
 * Create a new booking - improved version
 * @param {object} bookingData - The booking data to send to the server
 * @returns {Promise<object>} - Promise with the API response
 */
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