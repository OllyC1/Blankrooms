/**
 * SHARED EVENT DATA
 * Centralized event data used across all pages
 */

// ===================================
// CENTRALIZED EVENT DATA
// ===================================

// Build default seed
const DEFAULT_EVENTS_MAP = {
    1: {
        id: 1,
        title: 'Shang-Chi',
        date: '3 March 2025',
        location: 'Newcastle, UK',
        price: 25.00,
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
        description: 'Experience an incredible martial arts and action-packed entertainment event featuring live performances, interactive experiences, and multi-genre entertainment.',
        features: ['Live Action Performances', 'Interactive Experiences', 'Multi-Genre Entertainment', 'Food & Beverages']
    },
    2: {
        id: 2,
        title: 'Yellow Buses',
        date: '8 April 2025',
        location: 'Newcastle, UK',
        price: 30.00,
        image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13',
        description: 'A unique urban adventure featuring live music, street performances, and an unforgettable journey through the city with our signature yellow bus experience.',
        features: ['Live Music', 'Street Performances', 'Urban Adventure', 'Signature Transportation']
    },
    3: {
        id: 3,
        title: 'An Events\' Event',
        date: '11 April 2025',
        location: 'Newcastle, UK',
        price: 35.00,
        image: 'https://images.unsplash.com/photo-1574391884720-bbc2f77f9086',
        description: 'The ultimate meta-entertainment experience where events become the entertainment. Interactive performances, live music, and immersive experiences.',
        features: ['Meta Entertainment', 'Interactive Shows', 'Live Music', 'Immersive Experiences']
    },
    4: {
        id: 4,
        title: 'Bend Pot',
        date: '4 March 2024',
        location: 'Newcastle, UK',
        price: 28.00,
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        description: 'Octopuses humming. David, the Octopus. Show me your tentacles. All of them. The sub did not explode, and the fireworks may have been a tactical mistake. The mood is electric. He\'s going to turn us into monsters. Let\'s see how everyone loves you when you\'re the monster.',
        features: ['Maritime Theme', 'Nautical Experiences', 'Live Performances', 'Oceanic Adventures']
    },
    5: {
        id: 5,
        title: 'City Lights',
        date: '15 May 2025',
        location: 'Newcastle, UK',
        price: 32.00,
        image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0',
        description: 'Illuminate your night with urban entertainment, rooftop performances, and city-wide experiences that showcase the best of Newcastle nightlife.',
        features: ['Urban Entertainment', 'Rooftop Performances', 'City Experiences', 'Nightlife Showcase']
    },
    6: {
        id: 6,
        title: 'Stadium Nights',
        date: '22 June 2025',
        location: 'Newcastle, UK',
        price: 40.00,
        image: 'https://images.unsplash.com/photo-1517263904808-5dc91e3e7044',
        description: 'Experience the energy of stadium-scale entertainment with live music, sports entertainment, and massive crowd participation events.',
        features: ['Stadium Scale', 'Live Music', 'Sports Entertainment', 'Crowd Participation']
    }
};

// Try to load admin-managed events from localStorage and build the EVENTS_DATA map
function buildEventsMap() {
    try {
        const raw = localStorage.getItem('blankrooms_admin_events');
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr) && arr.length) {
                const map = {};
                arr.forEach(ev => { map[ev.id] = ev; });
                return map;
            }
        }
    } catch (e) { /* ignore and fall back */ }
    return { ...DEFAULT_EVENTS_MAP };
}

const EVENTS_DATA = buildEventsMap();

// ===================================
// IMAGE UTILITY FUNCTIONS
// ===================================

class ImageUtils {
    /**
     * Get optimized image URL for different use cases
     * @param {string} baseUrl - Base Unsplash URL without parameters
     * @param {string} size - Size preset: 'card', 'hero', 'thumbnail'
     * @param {Object} options - Custom width/height options
     */
    static getImageUrl(baseUrl, size = 'card', options = {}) {
        const presets = {
            thumbnail: { w: 300, h: 200 },
            card: { w: 800, h: 600 },
            hero: { w: 1200, h: 800 },
            fullsize: { w: 1600, h: 1200 }
        };

        const { w, h } = options.w && options.h ? options : presets[size];

        // Only append transformation params for Unsplash URLs
        const isUnsplash = /images\.unsplash\.com/i.test(baseUrl);
        if (!isUnsplash) {
            return baseUrl; // return as-is for other hosts (e.g., googleusercontent)
        }

        // Avoid double question marks
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}w=${w}&h=${h}&fit=crop&auto=format&q=80`;
    }

    /**
     * Get event image for specific use case
     * @param {Object} event - Event object
     * @param {string} size - Size preset
     */
    static getEventImage(event, size = 'card') {
        return this.getImageUrl(event.image, size);
    }
}

// ===================================
// EVENT UTILITY FUNCTIONS
// ===================================

class EventUtils {
    /**
     * Get event by ID
     * @param {number|string} eventId 
     */
    static getEventById(eventId) {
        return EVENTS_DATA[eventId] || null;
    }

    /**
     * Get all events
     */
    static getAllEvents() {
        return Object.values(EVENTS_DATA);
    }

    /**
     * Format event date
     * @param {string} dateString 
     */
    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Format event price
     * @param {number} price 
     */
    static formatPrice(price) {
        return `£${price.toFixed(2)}`;
    }

    /**
     * Create event URL
     * @param {number|string} eventId 
     */
    static createEventUrl(eventId) {
        return `event-detail.html?id=${eventId}`;
    }

    /**
     * Create booking URL
     * @param {number|string} eventId 
     */
    static createBookingUrl(eventId) {
        return `booking.html?eventId=${eventId}`;
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.EVENTS_DATA = EVENTS_DATA;
    window.ImageUtils = ImageUtils;
    window.EventUtils = EventUtils;
}

// Node.js export for potential future use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EVENTS_DATA, ImageUtils, EventUtils };
}