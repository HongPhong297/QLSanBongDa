// Stadium search and listing functionality

import { showNotification, formatCurrency, generateStarRating } from './main.js';
import { getSafeImageUrl, preloadPlaceholderImage } from './imageLoader.js';

// DOM Elements
const searchBtn = document.getElementById('search-btn');
const locationSearch = document.getElementById('location-search');
const useCurrentLocationBtn = document.getElementById('use-current-location');
const filterBtn = document.getElementById('filter-btn');
const districtSelect = document.getElementById('district');
const sportTypeSelect = document.getElementById('sport-type');
const priceRangeSelect = document.getElementById('price-range');
const dateSelect = document.getElementById('date');
const sortBySelect = document.getElementById('sort-by');
const resultsCount = document.getElementById('results-count');
const stadiumResults = document.getElementById('stadium-results');

// API endpoint
const API_URL = 'http://localhost:3000/api/stadiums';

// Fallback stadium data in case the API is not available
let fallbackStadiums = [
    {
        "id": 1,
        "owner_id": 1,
        "name": "San Van Dong A",
        "description": "San co chat luong cao",
        "location": "456 Duong XYZ, Quan 3",
        "district": "Quan 3",
        "price": "500000.00",
        "capacity": 100,
        "sport_type": "football",
        "is_active": true,
        "featured": false
    },
    {
        "id": 2,
        "owner_id": 1,
        "name": "San Van Dong B",
        "description": "San nho phu hop cho nhom ban be",
        "location": "123 Duong ABC, Quan 1",
        "district": "Quan 1",
        "price": "350000.00",
        "capacity": 50,
        "sport_type": "basketball",
        "is_active": true,
        "featured": true
    },
    {
        "id": 3,
        "owner_id": 2,
        "name": "San Tennis Quan 7",
        "description": "San tennis chat luong cao",
        "location": "789 Duong DEF, Quan 7",
        "district": "Quan 7",
        "price": "200000.00",
        "capacity": 4,
        "sport_type": "tennis",
        "is_active": true,
        "featured": false
    },
    {
        "id": 4,
        "owner_id": 2,
        "name": "San Tennis Thu Duc",
        "description": "San tennis chat luong cao",
        "location": "789 Duong DEF, Thu Duc",
        "district": "Thu Duc",
        "price": "10",
        "capacity": 4,
        "sport_type": "tennis",
        "is_active": true,
        "featured": false
    }
];

// Current search state
let currentSearchState = {
    location: '',
    district: '',
    sportType: '',
    priceRange: '',
    date: '',
    sortBy: 'distance'
};

// Initialize stadium search
function initStadiumSearch() {
    // Preload placeholder image
    preloadPlaceholderImage();
    
    // Add event listeners
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    if (useCurrentLocationBtn) {
        useCurrentLocationBtn.addEventListener('click', getUserLocation);
    }
    
    if (filterBtn) {
        filterBtn.addEventListener('click', applyFilters);
    }
    
    if (sortBySelect) {
        sortBySelect.addEventListener('change', () => {
            currentSearchState.sortBy = sortBySelect.value;
            sortResults();
        });
    }
    
    // Set today's date as minimum for date picker
    if (dateSelect) {
        const today = new Date().toISOString().split('T')[0];
        dateSelect.min = today;
    }
    
    // Populate districts dynamically based on API data
    fetchDistrictsFromAPI();
    
    // Check if we should load all stadiums initially or perform search from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('location')) {
        locationSearch.value = urlParams.get('location');
        currentSearchState.location = urlParams.get('location');
        
        if (urlParams.has('sport')) {
            sportTypeSelect.value = urlParams.get('sport');
            currentSearchState.sportType = urlParams.get('sport');
        }
        
        performSearch();
    } else {
        // Load all stadiums
        loadAllStadiums();
    }
}

// Fetch districts from API data with improved error handling
async function fetchDistrictsFromAPI() {
    if (!districtSelect) return;
    
    console.log('Attempting to fetch districts from API:', API_URL);
    
    try {
        // Cố gắng kết nối tới API với timeout và gỡ lỗi
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            throw new Error('Request timeout after 5 seconds');
        }, 5000);
        
        // Loại bỏ headers tùy chỉnh và sử dụng cấu hình cơ bản
        const response = await fetch(API_URL, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        console.log('API response received:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch stadiums data: ${response.status} ${response.statusText}`);
        }
        
        const stadiums = await response.json();
        console.log('Stadiums data received:', stadiums.length, 'items');
        
        // Extract unique districts
        const districts = [...new Set(stadiums.map(stadium => stadium.district).filter(Boolean))];
        console.log('Extracted districts:', districts);
        
        if (districts.length === 0) {
            console.warn('No districts found in API data, using fallback');
            throw new Error('No districts found in data');
        }
        
        // Populate districts dropdown
        districtSelect.innerHTML = '<option value="">All Districts</option>';
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district.toLowerCase();
            option.textContent = district;
            districtSelect.appendChild(option);
        });
        
        console.log('Districts dropdown populated successfully');
        
    } catch (error) {
        console.error('Error fetching districts:', error);
        
        // Thêm chẩn đoán lỗi chi tiết
        if (error.name === 'AbortError') {
            console.warn('Request timed out - server might be slow or unreachable');
        } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            console.warn('Network error - possible CORS issue or server unreachable');
            
            // Kiểm tra xem có phải localhost không và hiển thị lời khuyên
            if (API_URL.includes('localhost')) {
                console.info('API URL is localhost - check if server is running on correct port');
                console.info('Try opening API URL directly in browser:', API_URL);
            }
        }
        
        // Use fallback data
        const districts = [...new Set(fallbackStadiums.map(stadium => stadium.district).filter(Boolean))];
        
        // Populate districts dropdown
        districtSelect.innerHTML = '<option value="">All Districts</option>';
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district.toLowerCase();
            option.textContent = district;
            districtSelect.appendChild(option);
        });
        
        console.log('Populated districts dropdown with fallback data');
        
        // Hiển thị thông báo rõ ràng cho người dùng
        showNotification('Đang sử dụng dữ liệu mẫu. Không thể kết nối tới API.', 'warning');
    }
}
// Get user's location
function getUserLocation() {
    if (navigator.geolocation) {
        useCurrentLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // In a real app, would reverse geocode to get address
                locationSearch.value = 'Current Location';
                currentSearchState.location = 'Current Location';
                currentSearchState.latitude = position.coords.latitude;
                currentSearchState.longitude = position.coords.longitude;
                
                useCurrentLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
                performSearch();
            },
            (error) => {
                showNotification('Unable to access your location. Please check your browser permissions.', 'error');
                useCurrentLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
            }
        );
    } else {
        showNotification('Geolocation is not supported by your browser.', 'error');
    }
}

// Perform stadium search
function performSearch() {
    if (!stadiumResults) return;
    
    // Update search state
    if (locationSearch) {
        currentSearchState.location = locationSearch.value;
    }
    
    // Show loading indicator
    stadiumResults.innerHTML = '<div class="loading">Searching for stadiums...</div>';
    
    // Fetch from API with a slight delay to show loading state
    setTimeout(() => {
        fetchStadiums();
    }, 500);
}

// Apply filter options
function applyFilters() {
    if (!districtSelect || !sportTypeSelect || !priceRangeSelect || !dateSelect) return;
    
    // Update search state
    currentSearchState.district = districtSelect.value;
    currentSearchState.sportType = sportTypeSelect.value;
    currentSearchState.priceRange = priceRangeSelect.value;
    currentSearchState.date = dateSelect.value;
    
    // Re-fetch stadiums with filters
    performSearch();
}

// Sort results based on selected sort option
function sortResults() {
    const stadiums = fetchStadiumsFromDOM();
    if (!stadiums.length) return;
    
    // Sort based on selected option
    switch (currentSearchState.sortBy) {
        case 'price-low':
            stadiums.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            break;
        case 'price-high':
            stadiums.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            break;
        case 'rating':
            // Since the API doesn't seem to provide ratings, fall back to sorting by name
            stadiums.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'distance':
        default:
            // Sort by name as a fallback
            stadiums.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    // Re-render sorted stadiums
    renderStadiums(stadiums);
}

// Get the stadiums currently displayed in DOM for sorting
function fetchStadiumsFromDOM() {
    const stadiumCards = document.querySelectorAll('.stadium-card');
    const stadiums = [];
    
    stadiumCards.forEach(card => {
        stadiums.push({
            id: card.dataset.id,
            name: card.querySelector('.stadium-name').textContent,
            location: card.querySelector('.stadium-location').textContent,
            price: parseFloat(card.dataset.price),
            rating: parseFloat(card.dataset.rating),
            image: card.querySelector('img').src,
            sport_type: card.dataset.sportType
        });
    });
    
    return stadiums;
}

// Fetch stadiums from API with extensive debugging
async function fetchStadiums() {
    try {
        // Show loading state first
        if (stadiumResults) {
            stadiumResults.innerHTML = '<div class="loading">Loading stadiums...</div>';
        }
        
        console.log('Fetching stadiums from API:', API_URL);
        
        let stadiums = [];
        
        try {
            // Thiết lập các tùy chọn fetch cơ bản - không có headers tùy chỉnh
            const fetchOptions = {
                method: 'GET',
                mode: 'cors', // Thử với mode cors rõ ràng
                cache: 'no-cache' // Tránh cache
            };
            
            console.log('Fetch options:', fetchOptions);
            
            // Thử fetch API với tùy chọn cơ bản
            const response = await fetch(API_URL, fetchOptions);
            
            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers);
            console.log("Response type:", response.type);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch stadiums: ${response.status} ${response.statusText}`);
            }
            
            try {
                // Thử lấy dữ liệu dưới dạng text trước để debug
                const textResponse = await response.clone().text();
                console.log("Raw response text (first 200 chars):", textResponse.substring(0, 200));
                
                // Sau đó thử phân tích JSON
                stadiums = await response.json();
                console.log('Parsed JSON data (first 2 items):', stadiums.slice(0, 2));
                
                if (stadiums && stadiums.length > 0) {
                    showNotification('Successfully loaded stadiums from API', 'success');
                } else {
                    console.warn('API returned empty stadiums array');
                    showNotification('API returned no stadiums', 'warning');
                    stadiums = [...fallbackStadiums];
                }
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error(`Failed to parse JSON: ${parseError.message}`);
            }
        } catch (apiError) {
            console.error('API error details:', {
                name: apiError.name,
                message: apiError.message,
                stack: apiError.stack
            });
            
            // Kiểm tra xem có phải lỗi CORS không
            if (apiError.message.includes('CORS') || 
                apiError.message.includes('cross-origin') || 
                apiError.message.includes('Cross-Origin')) {
                
                showNotification('CORS error detected. Server may not allow browser requests.', 'error');
                
                // Add CORS-specific troubleshooting
                const corsHelp = document.createElement('div');
                corsHelp.innerHTML = `
                    <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px;">
                        <h4>CORS Error Detected</h4>
                        <p>This is likely because the API server doesn't allow requests from your browser. Solutions:</p>
                        <ol>
                            <li>Ensure the API server has CORS headers enabled</li>
                            <li>Try using a CORS proxy for testing</li>
                            <li>Access the application from the same origin as the API</li>
                        </ol>
                        <div class="mt-2">
                            <button id="try-cors-proxy" class="btn btn-warning">Try using CORS Proxy</button>
                        </div>
                    </div>
                `;
                
                if (stadiumResults) {
                    stadiumResults.prepend(corsHelp);
                }
                
                // Add CORS proxy functionality
                setTimeout(() => {
                    const proxyBtn = document.getElementById('try-cors-proxy');
                    if (proxyBtn) {
                        proxyBtn.addEventListener('click', tryWithCorsProxy);
                    }
                }, 100);
            } else {
                showNotification(`API error: ${apiError.message}`, 'error');
            }
            
            // Sử dụng dữ liệu dự phòng
            stadiums = [...fallbackStadiums];
            console.log('Using fallback data:', stadiums);
        }
        
        if (!Array.isArray(stadiums)) {
            console.error('API response is not an array:', stadiums);
            stadiums = [...fallbackStadiums];
        }
        
        // Áp dụng bộ lọc
        const filteredStadiums = applySearchFilters(stadiums);
        console.log('Filtered stadiums:', filteredStadiums);
        
        // Hiển thị kết quả
        renderStadiums(filteredStadiums);
    } catch (error) {
        console.error('Overall error:', error);
        // Sử dụng dữ liệu dự phòng trong trường hợp xảy ra lỗi
        const filteredStadiums = applySearchFilters(fallbackStadiums);
        renderStadiums(filteredStadiums);
    }
}

// Function to try fetching with a CORS proxy
async function tryWithCorsProxy() {
    try {
        // Using a public CORS proxy (for testing only)
        const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
        const proxyUrl = CORS_PROXY + API_URL;
        
        console.log('Trying with CORS proxy:', proxyUrl);
        document.getElementById('try-cors-proxy').textContent = 'Trying...';
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Proxy request failed: ${response.status}`);
        }
        
        const stadiums = await response.json();
        
        if (stadiums && stadiums.length > 0) {
            showNotification('Successfully loaded stadiums via CORS proxy!', 'success');
            console.log('Received stadiums via proxy:', stadiums);
            
            // Render the stadiums
            const filteredStadiums = applySearchFilters(stadiums);
            renderStadiums(filteredStadiums);
            
            // Update button
            document.getElementById('try-cors-proxy').textContent = 'Success! Loaded via Proxy';
            document.getElementById('try-cors-proxy').classList.remove('btn-warning');
            document.getElementById('try-cors-proxy').classList.add('btn-success');
        } else {
            throw new Error('No stadiums data received from proxy');
        }
    } catch (error) {
        console.error('CORS proxy error:', error);
        showNotification(`CORS proxy error: ${error.message}`, 'error');
        document.getElementById('try-cors-proxy').textContent = 'Proxy Failed - Try Again';
    }
}
// Load all stadiums when page initially loads
function loadAllStadiums() {
    if (!stadiumResults) return;
    
    stadiumResults.innerHTML = '<div class="loading">Loading stadiums...</div>';
    
    // Small delay to show loading state
    setTimeout(() => {
        fetchStadiums();
    }, 300);
}

// Apply search filters to stadium data
function applySearchFilters(stadiums) {
    let filteredStadiums = [...stadiums];
    
    // Filter by sport type
    if (currentSearchState.sportType) {
        filteredStadiums = filteredStadiums.filter(
            stadium => stadium.sport_type && stadium.sport_type.toLowerCase() === currentSearchState.sportType.toLowerCase()
        );
    }
    
    // Filter by district
    if (currentSearchState.district) {
        filteredStadiums = filteredStadiums.filter(
            stadium => stadium.district && stadium.district.toLowerCase().includes(currentSearchState.district.toLowerCase())
        );
    }
    
    // Filter by location search term
    if (currentSearchState.location && currentSearchState.location !== 'Current Location') {
        const searchTerm = currentSearchState.location.toLowerCase();
        filteredStadiums = filteredStadiums.filter(
            stadium => (stadium.location && stadium.location.toLowerCase().includes(searchTerm)) || 
                       (stadium.name && stadium.name.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filter by price range
    if (currentSearchState.priceRange) {
        const [min, max] = currentSearchState.priceRange.split('-');
        
        if (min && max) {
            filteredStadiums = filteredStadiums.filter(
                stadium => parseFloat(stadium.price) >= parseInt(min) && parseFloat(stadium.price) <= parseInt(max)
            );
        } else if (min) {
            // Handle cases like "200+" where there's only a min value
            filteredStadiums = filteredStadiums.filter(
                stadium => parseFloat(stadium.price) >= parseInt(min)
            );
        }
    }
    
    return filteredStadiums;
}

// Render stadiums to the page
function renderStadiums(stadiums) {
    if (!stadiumResults) return;
    
    console.log('Rendering stadiums:', stadiums);
    
    if (!stadiums || stadiums.length === 0) {
        stadiumResults.innerHTML = `
            <div class="no-results">
                <h3>No stadiums found</h3>
                <p>Try adjusting your search criteria or explore all stadiums.</p>
                <button id="clear-filters-btn" class="btn btn-primary mt-2">Clear Filters</button>
            </div>
        `;
        
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearFilters);
        }
        
        if (resultsCount) {
            resultsCount.textContent = 'No stadiums found';
        }
        return;
    }
    
    // Update results count
    if (resultsCount) {
        resultsCount.textContent = `Showing ${stadiums.length} stadium${stadiums.length === 1 ? '' : 's'}`;
    }
    
    // Generate HTML for stadium cards
    let html = '';
    
    stadiums.forEach(stadium => {
        // Safely get properties with fallbacks
        const id = stadium.id || 0;
        const name = stadium.name || 'Unknown Stadium';
        const location = stadium.location || 'Location not specified';
        const price = stadium.price || '0';
        const description = stadium.description || '';
        const sportType = stadium.sport_type || '';
        
        // Set default image if none provided
        const imageUrl = getSafeImageUrl(stadium.image);
        
        // Set default rating if none provided (the API doesn't seem to have ratings)
        const rating = stadium.rating || 4.0;
        const reviews = stadium.reviews || 0;
        
        html += `
            <div class="stadium-card" data-id="${id}" data-price="${price}" data-rating="${rating}" data-sport-type="${sportType}">
                <div class="stadium-image">
                    <img src="${imageUrl}" alt="${name}" onerror="if(this.src !== 'images/stadium-placeholder.jpg') this.src='images/stadium-placeholder.jpg';">
                    <div class="stadium-badge">${formatSportType(sportType)}</div>
                </div>
                <div class="stadium-info">
                    <h3 class="stadium-name">${name}</h3>
                    <div class="stadium-meta">
                        <span class="stadium-location"><i class="fas fa-map-marker-alt"></i> ${location}</span>
                    </div>
                    <div class="stadium-description">
                        ${description ? `<p>${truncateText(description, 80)}</p>` : ''}
                    </div>
                    <div class="stadium-rating">
                        ${generateStarRating(rating)}
                        <span class="reviews-count">(${reviews})</span>
                    </div>
                    <div class="stadium-footer">
                        <div class="stadium-price">${formatCurrency(price)}<span>/hour</span></div>
                        <div class="stadium-actions">
                            <button class="btn btn-primary book-now-btn" data-id="${id}">
                                <i class="fas fa-calendar-check"></i> Book Now
                            </button>
                            <button class="btn btn-secondary view-details-btn" data-id="${id}">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    stadiumResults.innerHTML = html;
    
    // Add click events for buttons
    document.querySelectorAll('.book-now-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const stadiumId = this.getAttribute('data-id');
            handleBooking(stadiumId);
        });
    });
    
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const stadiumId = this.getAttribute('data-id');
            window.location.href = `stadium-details.html?id=${stadiumId}`;
        });
    });
    
    // Still maintain the card click for details
    const stadiumCards = document.querySelectorAll('.stadium-card');
    stadiumCards.forEach(card => {
        card.addEventListener('click', function() {
            const id = this.dataset.id;
            window.location.href = `stadium-details.html?id=${id}`;
        });
    });
}

// Handle stadium booking
function handleBooking(stadiumId) {
    const isUserLoggedIn = isLoggedIn();
    
    if (!isUserLoggedIn) {
        // Redirect to login with return URL
        const returnUrl = `stadium-details.html?id=${stadiumId}&action=book`;
        localStorage.setItem('bookingRedirect', returnUrl);
        showNotification('Please log in to book a stadium', 'info');
        
        setTimeout(() => {
            window.location.href = `login.html?redirect=${encodeURIComponent(returnUrl)}`;
        }, 1000);
        return;
    }
    
    // If user is logged in, redirect to booking page
    window.location.href = `booking.html?stadium=${stadiumId}`;
}

// Add isLoggedIn function if it doesn't exist already in this file
function isLoggedIn() {
    return localStorage.getItem('user') !== null;
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substr(0, maxLength) + '...' : text;
}

// Format sport type for display
function formatSportType(sportType) {
    if (!sportType) return 'Multiple Sports';
    
    return sportType.charAt(0).toUpperCase() + sportType.slice(1);
}

// Clear all filters
function clearFilters() {
    if (districtSelect) districtSelect.value = '';
    if (sportTypeSelect) sportTypeSelect.value = '';
    if (priceRangeSelect) priceRangeSelect.value = '';
    if (dateSelect) dateSelect.value = '';
    if (locationSearch) locationSearch.value = '';
    
    currentSearchState = {
        location: '',
        district: '',
        sportType: '',
        priceRange: '',
        date: '',
        sortBy: 'distance'
    };
    
    loadAllStadiums();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initStadiumSearch);

