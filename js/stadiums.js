// Stadium search and listing functionality

import { showNotification, formatCurrency, generateStarRating } from './main.js';

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
    
    // Populate districts (would come from API in a real app)
    populateDistricts();
    
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

// Populate district select element
function populateDistricts() {
    if (!districtSelect) return;
    
    const districts = ['Downtown', 'Westside', 'Eastville', 'Northpark', 'South Bay'];
    
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district.toLowerCase();
        option.textContent = district;
        districtSelect.appendChild(option);
    });
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
    
    // In a real app, we would fetch data from an API
    // For the demo, simulate network delay and filter the stadiums
    setTimeout(() => {
        fetchStadiums();
    }, 1000);
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
            stadiums.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            stadiums.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            stadiums.sort((a, b) => b.rating - a.rating);
            break;
        case 'distance':
        default:
            // For demo, simply sort by name
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
            sportType: card.dataset.sportType
        });
    });
    
    return stadiums;
}

// Fetch stadiums from local storage
async function fetchStadiums() {
    // Get stadiums from localStorage (in a real app, would fetch from API)
    let stadiums = JSON.parse(localStorage.getItem('stadiums') || '[]');
    
    // Apply filters
    stadiums = applySearchFilters(stadiums);
    
    // Render results
    renderStadiums(stadiums);
}

// Load all stadiums when page initially loads without search
function loadAllStadiums() {
    if (!stadiumResults) return;
    
    stadiumResults.innerHTML = '<div class="loading">Loading stadiums...</div>';
    
    setTimeout(() => {
        fetchStadiums();
    }, 500);
}

// Apply search filters to stadium data
function applySearchFilters(stadiums) {
    let filteredStadiums = [...stadiums];
    
    // Filter by sport type
    if (currentSearchState.sportType) {
        filteredStadiums = filteredStadiums.filter(
            stadium => stadium.sportType === currentSearchState.sportType
        );
    }
    
    // Filter by district (from location)
    if (currentSearchState.district) {
        filteredStadiums = filteredStadiums.filter(
            stadium => stadium.location.toLowerCase().includes(currentSearchState.district.toLowerCase())
        );
    }
    
    // Filter by location search term
    if (currentSearchState.location && currentSearchState.location !== 'Current Location') {
        const searchTerm = currentSearchState.location.toLowerCase();
        filteredStadiums = filteredStadiums.filter(
            stadium => stadium.location.toLowerCase().includes(searchTerm) || 
                        stadium.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by price range
    if (currentSearchState.priceRange) {
        const [min, max] = currentSearchState.priceRange.split('-');
        
        if (min && max) {
            filteredStadiums = filteredStadiums.filter(
                stadium => stadium.price >= parseInt(min) && stadium.price <= parseInt(max)
            );
        } else if (min) {
            // Handle cases like "200+" where there's only a min value
            filteredStadiums = filteredStadiums.filter(
                stadium => stadium.price >= parseInt(min)
            );
        }
    }
    
    // In a real app, would check availability based on date
    // For demo purposes, we just keep all stadiums regardless of date
    
    return filteredStadiums;
}

// Render stadiums to the page
function renderStadiums(stadiums) {
    if (!stadiumResults) return;
    
    if (stadiums.length === 0) {
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
        
        resultsCount.textContent = 'No stadiums found';
        return;
    }
    
    // Update results count
    resultsCount.textContent = `Showing ${stadiums.length} stadium${stadiums.length === 1 ? '' : 's'}`;
    
    // Generate HTML for stadium cards
    let html = '';
    
    stadiums.forEach(stadium => {
        html += `
            <div class="stadium-card" data-id="${stadium.id}" data-price="${stadium.price}" data-rating="${stadium.rating}" data-sport-type="${stadium.sportType}">
                <div class="stadium-image">
                    <img src="${stadium.images?.[0] || 'images/stadium-placeholder.jpg'}" alt="${stadium.name}">
                </div>
                <div class="stadium-info">
                    <h3 class="stadium-name">${stadium.name}</h3>
                    <div class="stadium-meta">
                        <span class="stadium-location">${stadium.location}</span>
                        <span class="stadium-sport">${formatSportType(stadium.sportType)}</span>
                    </div>
                    <div class="stadium-footer">
                        <div class="stadium-price">${formatCurrency(stadium.price)}/hour</div>
                        <div class="stadium-rating">
                            ${generateStarRating(stadium.rating)}
                            <span>(${stadium.reviews || 0})</span>
                        </div>
                    </div>
                </div>
                <a href="stadium-details.html?id=${stadium.id}" class="stadium-card-overlay"></a>
            </div>
        `;
    });
    
    stadiumResults.innerHTML = html;
    
    // Add click event for stadium cards
    const stadiumCards = document.querySelectorAll('.stadium-card');
    stadiumCards.forEach(card => {
        card.addEventListener('click', function() {
            const id = this.dataset.id;
            window.location.href = `stadium-details.html?id=${id}`;
        });
    });
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