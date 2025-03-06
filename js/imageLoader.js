// Image loading helper functions

const PLACEHOLDER_IMAGE = 'assets/loupe.png';

// Check if an image exists before trying to use it
export async function imageExists(url) {
    if (!url) return false;
    
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (e) {
        console.log('Error checking image:', e);
        return false;
    }
}

// Safely get image URL with fallback to placeholder
export function getSafeImageUrl(imageUrl) {
    if (!imageUrl || imageUrl.trim() === '') {
        return PLACEHOLDER_IMAGE;
    }
    
    return imageUrl;
}

// Preload placeholder image to ensure it's in cache
export function preloadPlaceholderImage() {
    const img = new Image();
    img.src = PLACEHOLDER_IMAGE;
}

// Initialize image loaders on the page
export function initImageLoaders() {
    // Preload placeholder
    preloadPlaceholderImage();
    
    // Fix any images that failed to load
    document.querySelectorAll('img').forEach(img => {
        img.onerror = function() {
            if (this.src !== PLACEHOLDER_IMAGE) {
                this.src = PLACEHOLDER_IMAGE;
            }
        };
    });
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', initImageLoaders);
// Image loading helper functions

// Placeholder images by sport type
// const SPORT_PLACEHOLDERS = {
//     'football': 'assets/placeholders/football-stadium.jpg',
//     'basketball': 'assets/placeholders/basketball-court.jpg',
//     'tennis': 'assets/placeholders/tennis-court.jpg',
//     'volleyball': 'assets/placeholders/volleyball-court.jpg',
//     'badminton': 'assets/placeholders/badminton-court.jpg',
//     'default': 'assets/loupe.png' // Default fallback if sport type doesn't match
// };

// // Check if an image exists before trying to use it
// export async function imageExists(url) {
//     if (!url) return false;
    
//     try {
//         const response = await fetch(url, { method: 'HEAD' });
//         return response.ok;
//     } catch (e) {
//         console.log('Error checking image:', e);
//         return false;
//     }
// }

// // Safely get image URL with fallback to appropriate placeholder based on sport type
// export function getSafeImageUrl(imageUrl, sportType = '') {
//     if (!imageUrl || imageUrl.trim() === '') {
//         // Get appropriate placeholder based on sport type
//         return getPlaceholderForSport(sportType);
//     }
    
//     return imageUrl;
// }

// // Get the appropriate placeholder image based on sport type
// export function getPlaceholderForSport(sportType = '') {
//     if (!sportType) return SPORT_PLACEHOLDERS.default;
    
//     const normalizedSportType = sportType.toLowerCase();
//     return SPORT_PLACEHOLDERS[normalizedSportType] || SPORT_PLACEHOLDERS.default;
// }

// // Preload all placeholder images to ensure they're in cache
// export function preloadPlaceholderImages() {
//     // Preload all sport type placeholders
//     Object.values(SPORT_PLACEHOLDERS).forEach(imgSrc => {
//         const img = new Image();
//         img.src = imgSrc;
//     });
// }

// // Initialize image loaders on the page
// export function initImageLoaders() {
//     // Preload placeholder images
//     preloadPlaceholderImages();
    
//     // Fix any images that failed to load
//     document.querySelectorAll('img').forEach(img => {
//         img.onerror = function() {
//             // Get parent element that might contain sport-type data
//             const sportTypeElement = this.closest('[data-sport-type]');
//             const sportType = sportTypeElement ? sportTypeElement.dataset.sportType : '';
            
//             // Set appropriate placeholder based on sport type
//             const placeholder = getPlaceholderForSport(sportType);
            
//             if (this.src !== placeholder) {
//                 this.src = placeholder;
//             }
//         };
//     });
// }

// // Wait for DOM to be ready
// document.addEventListener('DOMContentLoaded', initImageLoaders);