/**
 * EVENT DETAIL PAGE JAVASCRIPT
 * Handles individual event page functionality
 */

// ===================================
// EVENT DATA
// ===================================
// Event data is now loaded from event-data.js

// ===================================
// EVENT DETAIL PAGE CLASS
// ===================================

class EventDetailPage {
    constructor() {
        this.currentEvent = null;
        this.bookingData = {};
        this.init();
    }

    init() {
        this.loadEventFromURL();
        this.bindEventListeners();
        this.initScrollEffects();
    }

    loadEventFromURL() {
        // Get event ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        
        console.log('URL Event ID:', eventId);
        console.log('Available events:', EVENTS_DATA);
        
        if (eventId && EventUtils.getEventById(eventId)) {
            this.currentEvent = EventUtils.getEventById(eventId);
            console.log('Loaded event from URL:', this.currentEvent);
            this.populateEventData();
        } else {
            // Default to first event if no ID provided
            console.log('No valid event ID, defaulting to event 1');
            this.currentEvent = EventUtils.getEventById(1);
            console.log('Default event:', this.currentEvent);
            this.populateEventData();
        }
    }

    populateEventData() {
        if (!this.currentEvent) return;

        const event = this.currentEvent;

        console.log('Populating event data for:', event.title);
        console.log('Event data:', event);

        // Update page title
        document.title = `${event.title} - Blank Rooms`;

        // Populate hero section
        const heroImage = document.getElementById('eventImage');
        
        console.log('ImageUtils available:', typeof ImageUtils);
        console.log('Event image base URL:', event.image);
        
        let heroImageUrl;
        if (typeof ImageUtils !== 'undefined' && ImageUtils.getEventImage) {
            heroImageUrl = ImageUtils.getEventImage(event, 'hero');
        } else {
            // Fallback if ImageUtils not available
            heroImageUrl = `${event.image}?w=1200&h=800&fit=crop&auto=format&q=80`;
        }
        
        console.log('Setting hero image URL:', heroImageUrl);
        
        if (heroImage) {
            heroImage.src = heroImageUrl;
            heroImage.alt = event.title;
            
            // Add error handling
            heroImage.onerror = function() {
                console.error('Failed to load hero image:', heroImageUrl);
                // Try fallback image
                this.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop&auto=format&q=80';
            };
            
            heroImage.onload = function() {
                console.log('Hero image loaded successfully:', heroImageUrl);
            };
        }
        
        const titleElement = document.getElementById('eventTitle');
        const dateElement = document.getElementById('eventDate');
        const locationElement = document.getElementById('eventLocation');
        
        if (titleElement) titleElement.textContent = event.title;
        if (dateElement) dateElement.textContent = event.date;
        if (locationElement) locationElement.textContent = event.location;

        // Info section only contains description now

        // Populate description
        const descriptionElement = document.getElementById('eventDescription');
        if (descriptionElement) {
            descriptionElement.textContent = event.description;
        }

        // Features are no longer displayed in this simplified design

        // Add loading animation
        this.animateContent();
    }

    bindEventListeners() {
        // Get tickets button
        const getTicketsBtn = document.getElementById('getTicketsBtn');
        
        if (getTicketsBtn) {
            getTicketsBtn.addEventListener('click', () => this.showBookingForm());
        }

        // Modal close buttons
        document.querySelectorAll('.modal__close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Modal backdrop clicks
        document.querySelectorAll('.modal__backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => this.closeModal());
        });

        // Booking form submission
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => this.handleBookingSubmission(e));
        }

        // Ticket quantity change
        const ticketSelect = document.getElementById('tickets');
        if (ticketSelect) {
            ticketSelect.addEventListener('change', () => this.updateBookingSummary());
        }

        // Success modal close
        const successCloseBtn = document.querySelector('.btn-close-success');
        if (successCloseBtn) {
            successCloseBtn.addEventListener('click', () => this.closeModal());
        }

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Scroll effects
        window.addEventListener('scroll', this.throttle(() => this.handleScroll(), 16));
    }

    showBookingForm() {
        if (!this.currentEvent) return;
        
        // Navigate to dedicated booking page
        window.location.href = EventUtils.createBookingUrl(this.currentEvent.id);
    }

    updateBookingSummary() {
        if (!this.currentEvent) return;

        const ticketCount = parseInt(document.getElementById('tickets').value);
        const totalPrice = this.currentEvent.price * ticketCount;

        document.querySelector('.summary-tickets').textContent = `${ticketCount} × £${this.currentEvent.price.toFixed(2)}`;
        document.querySelector('.summary-price').textContent = `£${totalPrice.toFixed(2)}`;
    }

    async handleBookingSubmission(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        this.bookingData = {
            eventId: this.currentEvent.id,
            eventTitle: this.currentEvent.title,
            eventDate: this.currentEvent.date,
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            tickets: parseInt(formData.get('tickets')),
            totalPrice: this.currentEvent.price * parseInt(formData.get('tickets')),
            bookingId: this.generateBookingId(),
            bookingDate: new Date().toISOString()
        };

        // Show loading state
        const submitBtn = e.target.querySelector('.btn-confirm-booking');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await this.processBooking();
            
            // Generate QR code
            await this.generateQRCode();
            
            // Show success modal
            this.showModal('successModal');
            
        } catch (error) {
            console.error('Booking failed:', error);
            alert('Booking failed. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async processBooking() {
        return new Promise(resolve => {
            setTimeout(() => {
                // Store booking in localStorage for demo
                const bookings = JSON.parse(localStorage.getItem('blankRoomsBookings') || '[]');
                bookings.push(this.bookingData);
                localStorage.setItem('blankRoomsBookings', JSON.stringify(bookings));
                console.log('Booking processed:', this.bookingData);
                resolve();
            }, 2000);
        });
    }

    async generateQRCode() {
        const canvas = document.getElementById('qrCodeCanvas');
        const qrData = {
            bookingId: this.bookingData.bookingId,
            eventId: this.bookingData.eventId,
            eventTitle: this.bookingData.eventTitle,
            eventDate: this.bookingData.eventDate,
            customerName: this.bookingData.fullName,
            tickets: this.bookingData.tickets,
            totalPrice: this.bookingData.totalPrice
        };

        try {
            await QRCode.toCanvas(canvas, JSON.stringify(qrData), {
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                margin: 1,
                errorCorrectionLevel: 'M'
            });
        } catch (error) {
            console.error('QR Code generation failed:', error);
        }
    }

    generateBookingId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 7);
        return `BR-${timestamp}-${randomStr}`.toUpperCase();
    }

    showModal(modalId) {
        this.closeModal(); // Close any open modals first
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('modal--active');
            document.body.classList.add('no-scroll');
        }
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('modal--active');
        });
        document.body.classList.remove('no-scroll');
    }

    initScrollEffects() {
        // Parallax effect for hero image
        const heroImg = document.getElementById('eventImage');
        if (heroImg) {
            heroImg.style.willChange = 'transform';
        }

        // Fade in animations for content sections
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe content sections
        const sections = document.querySelectorAll('.event-info__description, .event-info__features, .event-booking');
        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'all 0.8s ease';
            observer.observe(section);
        });
    }

    handleScroll() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.3;
        
        // Parallax effect for hero image
        const heroImg = document.getElementById('eventImage');
        if (heroImg) {
            heroImg.style.transform = `translateY(${rate}px)`;
        }

        // Header background opacity
        const header = document.querySelector('.header--transparent');
        if (header) {
            const opacity = Math.min(scrolled / 200, 0.95);
            header.style.background = `rgba(0, 0, 0, ${0.7 + (opacity * 0.3)})`;
        }
    }

    animateContent() {
        // Animate hero content
        const heroContent = document.querySelector('.event-hero__content');
        if (heroContent) {
            heroContent.style.opacity = '0';
            heroContent.style.transform = 'translateY(50px)';
            
            setTimeout(() => {
                heroContent.style.transition = 'all 1s ease';
                heroContent.style.opacity = '1';
                heroContent.style.transform = 'translateY(0)';
            }, 300);
        }
    }

    // Utility methods
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// ===================================
// URL UTILITIES
// ===================================

class URLUtils {
    static getEventIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    static updateURL(eventId) {
        const newURL = `${window.location.pathname}?id=${eventId}`;
        window.history.pushState({ eventId }, '', newURL);
    }

    static createEventURL(eventId) {
        return `event-detail.html?id=${eventId}`;
    }
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize event detail page
    const eventDetailPage = new EventDetailPage();
    
    console.log('🎪 Event detail page initialized successfully');
    
    // Track page view
    if (eventDetailPage.currentEvent) {
        console.log('Event viewed:', eventDetailPage.currentEvent.title);
    }
});

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.eventId) {
        location.reload(); // Reload to show correct event
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventDetailPage, URLUtils };
}