/**
 * EVENTS PAGE JAVASCRIPT
 * Handles event listing, booking, and QR code generation
 */

// ===================================
// EVENT DATA & CONFIGURATION
// ===================================
// Event data is now loaded from event-data.js

// ===================================
// EVENT MANAGEMENT CLASS
// ===================================

class EventManager {
    constructor() {
        this.currentEvent = null;
        this.bookingData = {};
        this.init();
    }

    init() {
        this.populateEventCards();
        this.bindEventListeners();
        this.initializeEventCards();
        // Refresh when admin updates events (if coming from same origin)
        window.addEventListener('blankrooms:events-updated', () => {
            // Re-read global EVENTS_DATA rebuilt by event-data.js on load; force reload of data map
            // We rebuild it here from localStorage to be safe
            try {
                const raw = localStorage.getItem('blankrooms_admin_events');
                if (raw) {
                    const arr = JSON.parse(raw) || [];
                    const map = {};
                    arr.forEach(ev => { map[ev.id] = ev; });
                    window.EVENTS_DATA = map;
                }
            } catch {}
            this.populateEventCards();
        });
    }

    bindEventListeners() {
        // Event card clicks
        document.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('event-card__quick-book')) {
                    this.showEventDetail(card.dataset.eventId);
                }
            });
        });

        // Quick book buttons
        document.querySelectorAll('.event-card__quick-book').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = e.target.closest('.event-card').dataset.eventId;
                this.quickBook(eventId);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.modal__close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Modal backdrop clicks
        document.querySelectorAll('.modal__backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => this.closeModal());
        });

        // Book ticket buttons
        const bookTicketBtn = document.querySelector('.btn-book-ticket');
        if (bookTicketBtn) {
            bookTicketBtn.addEventListener('click', () => this.showBookingForm());
        }

        // Get tickets button in hero section
        const getTicketsBtn = document.querySelector('.event-detail__get-tickets');
        if (getTicketsBtn) {
            getTicketsBtn.addEventListener('click', () => this.showBookingForm());
        }

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

        // Load more events
        const loadMoreBtn = document.querySelector('.btn-load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreEvents());
        }

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    populateEventCards() {
        // Render events dynamically from data store
        const container = document.querySelector('.events-grid');
        if (!container) return;

        const fetchFromApi = async () => {
            try {
                console.log('Fetching events from API...');
                const res = await fetch('/api/events', { cache: 'no-store' });
                console.log('API Response status:', res.status);
                
                if (!res.ok) throw new Error(`API failed with status: ${res.status}`);
                
                const apiEvents = await res.json();
                console.log('Raw API events:', apiEvents);
                
                // Normalize MongoDB _id to id for consistency
                const normalizedEvents = apiEvents.map(e => ({
                    ...e,
                    id: e._id || e.id
                }));
                console.log('Normalized events:', normalizedEvents);
                
                return normalizedEvents;
            } catch (error) {
                console.error('API fetch failed:', error);
                // fallback to in-memory data
                const fallbackEvents = (typeof EventUtils !== 'undefined' && EventUtils.getAllEvents)
                    ? EventUtils.getAllEvents()
                    : Object.values(window.EVENTS_DATA || {});
                console.log('Using fallback events:', fallbackEvents);
                return fallbackEvents;
            }
        };

        // Always fetch fresh data to show newly added events
        const events = await fetchFromApi();
        window.__events_cache = events;
        
        console.log('Events to display:', events);
        console.log('Events count:', events.length);

        // Sort by date ascending
        const sorted = events.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
        console.log('Sorted events:', sorted);

        const renderedHTML = sorted.map(ev => {
            console.log('Rendering event:', ev.title, 'with image:', ev.image);
            return `
            <article class="event-card" data-event-id="${ev.id}">
                <div class="event-card__image">
                    <img src="${ImageUtils.getEventImage(ev, 'card')}" alt="${ev.title} Event" class="event-card__img">
                    <div class="event-card__overlay">
                        <button class="event-card__quick-book">Quick Book</button>
                    </div>
                </div>
                <div class="event-card__content">
                    <h3 class="event-card__title">${ev.title}</h3>
                    <p class="event-card__date">${ev.date}</p>
                    <p class="event-card__location">${ev.location}</p>
                    <div class="event-card__price">${this.getEventPrice(ev)}</div>
                </div>
            </article>
        `;
        }).join('');
        
        console.log('Final HTML length:', renderedHTML.length);
        container.innerHTML = renderedHTML;

        // Re-bind listeners to the new cards (use event delegation for reliability)
        container.addEventListener('click', (e) => {
            const card = e.target.closest('.event-card');
            if (!card) return;
            const quickBtn = e.target.closest('.event-card__quick-book');
            const eventId = card.dataset.eventId;
            if (quickBtn) {
                e.stopPropagation();
                this.currentEvent = (window.__events_cache || []).find(v => String(v.id) === String(eventId));
                if (!this.currentEvent) return;
                this.showBookingForm();
            } else {
                this.showEventDetail(eventId);
            }
        });
        this.initializeEventCards();
    }

    initializeEventCards() {
        // Add hover effects and animations
        document.querySelectorAll('.event-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-fade-in');
        });
    }

    showEventDetail(eventId) {
        // Navigate to full-page event detail
        window.location.href = EventUtils.createEventUrl(eventId);
    }

    quickBook(eventId) {
        this.currentEvent = EVENTS_DATA[eventId];
        this.showBookingForm();
    }

    showBookingForm() {
        if (!this.currentEvent) return;

        // Pre-populate booking summary
        document.querySelector('.summary-event').textContent = this.currentEvent.title;
        document.querySelector('.summary-date').textContent = this.currentEvent.date;
        
        this.updateBookingSummary();
        this.showModal('bookingModal');
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
            
            // Simulate sending email
            this.sendConfirmationEmail();
            
        } catch (error) {
            console.error('Booking failed:', error);
            alert('Booking failed. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async processBooking() {
        // Simulate API processing time
        return new Promise(resolve => {
            setTimeout(() => {
                // Store booking in localStorage for demo
                const bookings = JSON.parse(localStorage.getItem('blankRoomsBookings') || '[]');
                bookings.push(this.bookingData);
                localStorage.setItem('blankRoomsBookings', JSON.stringify(bookings));
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

    sendConfirmationEmail() {
        // In a real application, this would send an actual email
        console.log('Confirmation email sent to:', this.bookingData.email);
        console.log('Booking details:', this.bookingData);
        
        // For demo purposes, we'll just log it
        const emailContent = `
Dear ${this.bookingData.fullName},

Your booking has been confirmed!

Event: ${this.bookingData.eventTitle}
Date: ${this.bookingData.eventDate}
Tickets: ${this.bookingData.tickets}
Total: £${this.bookingData.totalPrice.toFixed(2)}
Booking ID: ${this.bookingData.bookingId}

Please present your QR code at the venue entrance.

Thank you for choosing Blank Rooms!
        `;
        
        console.log('Email content:', emailContent);
    }

    generateBookingId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 7);
        return `BR-${timestamp}-${randomStr}`.toUpperCase();
    }

    getEventPrice(event) {
        // Handle new events with ticketTypes or legacy events with price
        if (event.ticketTypes && Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0) {
            // Find the lowest price from ticket types
            const prices = event.ticketTypes.map(t => Number(t.price)).filter(p => !isNaN(p));
            if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                return `From ${EventUtils.formatPrice(minPrice)}`;
            }
        }
        
        // Fallback to legacy price field
        if (event.price !== undefined && event.price !== null) {
            return EventUtils.formatPrice(Number(event.price));
        }
        
        // Default fallback
        return 'Price TBA';
    }

    loadMoreEvents() {
        // Simulate loading more events
        const loadMoreBtn = document.querySelector('.btn-load-more');
        loadMoreBtn.textContent = 'Loading...';
        loadMoreBtn.disabled = true;

        setTimeout(() => {
            loadMoreBtn.textContent = 'No more events';
            loadMoreBtn.disabled = true;
            
            // In a real app, you would fetch more events from an API
            console.log('All events loaded');
        }, 1500);
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
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatPrice(price) {
    return `£${price.toFixed(2)}`;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// ===================================
// FORM VALIDATION
// ===================================

class FormValidator {
    static validateBookingForm(formData) {
        const errors = [];

        if (!formData.get('fullName') || formData.get('fullName').trim().length < 2) {
            errors.push('Please enter a valid full name');
        }

        if (!validateEmail(formData.get('email'))) {
            errors.push('Please enter a valid email address');
        }

        if (!validatePhone(formData.get('phone'))) {
            errors.push('Please enter a valid phone number');
        }

        if (!formData.get('tickets') || parseInt(formData.get('tickets')) < 1) {
            errors.push('Please select number of tickets');
        }

        return errors;
    }

    static showValidationErrors(errors) {
        // Remove existing error messages
        document.querySelectorAll('.form-error').forEach(error => error.remove());

        errors.forEach(error => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.textContent = error;
            errorDiv.style.cssText = `
                color: #e74c3c;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                font-weight: 500;
            `;

            const form = document.querySelector('.booking-form__form');
            form.insertBefore(errorDiv, form.querySelector('.booking-summary'));
        });
    }
}

// ===================================
// ANALYTICS & TRACKING
// ===================================

class Analytics {
    static trackEvent(eventName, properties = {}) {
        // In a real application, this would send data to analytics service
        console.log('Analytics Event:', eventName, properties);
    }

    static trackEventView(eventId) {
        this.trackEvent('event_viewed', { eventId });
    }

    static trackBookingStarted(eventId) {
        this.trackEvent('booking_started', { eventId });
    }

    static trackBookingCompleted(bookingData) {
        this.trackEvent('booking_completed', {
            eventId: bookingData.eventId,
            tickets: bookingData.tickets,
            totalPrice: bookingData.totalPrice
        });
    }
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize event manager
    const eventManager = new EventManager();
    
    // Add page animations
    const cards = document.querySelectorAll('.event-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Add scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.event-card').forEach(card => {
        observer.observe(card);
    });

    console.log('🎪 Events page initialized successfully');
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventManager, FormValidator, Analytics };
}