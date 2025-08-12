class BookingManager {
    constructor() {
        this.currentEvent = null;
        this.currentStep = 'tickets';
        this.ticketQuantities = {
            early: 0,
            vip: 0
        };
        this.ticketPrices = {
            early: 40,
            vip: 80
        };
        this.totalAmount = 0;
        this.dynamicTicketTypes = [];
        
        this.init();
    }
    
    setupTicketTypes() {
        if (!this.currentEvent || !this.currentEvent.ticketTypes) {
            console.log('No ticket types found, using defaults');
            // Fallback to default ticket types for legacy events
            this.ticketQuantities = { early: 0, vip: 0 };
            this.ticketPrices = { early: 40, vip: 80 };
            this.dynamicTicketTypes = [
                { id: 'early', name: 'Early Access', price: 40 },
                { id: 'vip', name: 'VIP Access', price: 80 }
            ];
            return;
        }
        
        console.log('Setting up dynamic ticket types:', this.currentEvent.ticketTypes);
        
        // Clear existing ticket data
        this.ticketQuantities = {};
        this.ticketPrices = {};
        this.dynamicTicketTypes = [];
        
        // Setup dynamic ticket types from event data
        this.currentEvent.ticketTypes.forEach((ticket, index) => {
            const ticketId = `ticket_${index}`;
            this.ticketQuantities[ticketId] = 0;
            this.ticketPrices[ticketId] = Number(ticket.price);
            this.dynamicTicketTypes.push({
                id: ticketId,
                name: ticket.name,
                price: Number(ticket.price)
            });
        });
        
        console.log('Dynamic ticket types setup:', this.dynamicTicketTypes);
        console.log('Ticket prices:', this.ticketPrices);
        
        // Render the dynamic ticket types
        this.renderTicketTypes();
    }
    
    renderTicketTypes() {
        const ticketTypesContainer = document.querySelector('.ticket-types');
        if (!ticketTypesContainer) {
            console.error('Ticket types container not found');
            return;
        }
        
        console.log('Rendering ticket types...', this.dynamicTicketTypes);
        
        // Clear existing ticket types
        ticketTypesContainer.innerHTML = '';
        
        // Render each ticket type
        this.dynamicTicketTypes.forEach(ticket => {
            const ticketElement = document.createElement('div');
            ticketElement.className = 'ticket-type';
            ticketElement.setAttribute('data-ticket-type', ticket.id);
            
            ticketElement.innerHTML = `
                <div class="ticket-type__info">
                    <h3 class="ticket-type__name">${ticket.name}</h3>
                    <p class="ticket-type__price">£${ticket.price.toFixed(2)}</p>
                </div>
                <div class="ticket-type__controls">
                    <button class="ticket-btn ticket-btn--minus" data-action="decrease" data-ticket="${ticket.id}">-</button>
                    <span class="ticket-quantity" id="${ticket.id}Quantity">0</span>
                    <button class="ticket-btn ticket-btn--plus" data-action="increase" data-ticket="${ticket.id}">+</button>
                </div>
            `;
            
            ticketTypesContainer.appendChild(ticketElement);
        });
        
        // Re-bind event listeners for the new ticket controls
        this.bindTicketControls();
    }
    
    bindTicketControls() {
        // Remove existing listeners and re-bind to new elements
        document.querySelectorAll('.ticket-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.target.getAttribute('data-action');
                const ticketType = e.target.getAttribute('data-ticket');
                
                if (action === 'increase') {
                    this.increaseTicket(ticketType);
                } else if (action === 'decrease') {
                    this.decreaseTicket(ticketType);
                }
            });
        });
    }

    async init() {
        await this.loadEventFromURL();
        this.setupEventListeners();
        this.updateTotalAmount();
    }

    async loadEventFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('eventId');
        
        console.log('Loading event for booking, ID:', eventId);
        
        try {
            // Load events from API
            const res = await fetch('/api/events', { cache: 'no-store' });
            let events = [];
            
            if (res.ok) {
                const apiEvents = await res.json();
                events = apiEvents.map(e => ({
                    ...e,
                    id: e._id || e.id
                }));
                console.log('Loaded events for booking:', events);
            } else {
                // Fallback to static data
                events = EventUtils ? EventUtils.getAllEvents() : Object.values(window.EVENTS_DATA || {});
            }
            
            if (eventId) {
                this.currentEvent = events.find(e => String(e.id) === String(eventId));
            }
            
            if (!this.currentEvent && events.length > 0) {
                this.currentEvent = events[0];
            }
            
            console.log('Current event for booking:', this.currentEvent);
            
            if (this.currentEvent) {
                this.setupTicketTypes();
                this.populateEventData();
            } else {
                console.error('No event found for booking');
            }
            
        } catch (error) {
            console.error('Error loading event for booking:', error);
            // Fallback to static data
            if (eventId && EventUtils && EventUtils.getEventById(eventId)) {
                this.currentEvent = EventUtils.getEventById(eventId);
                this.setupTicketTypes();
                this.populateEventData();
            }
        }
    }

    populateEventData() {
        if (!this.currentEvent) return;

        const event = this.currentEvent;
        
        // Get all event summary sections
        const summaryImages = document.querySelectorAll('.event-summary__img');
        const summaryTitles = document.querySelectorAll('.event-summary__title');
        const summaryDates = document.querySelectorAll('.event-summary__date');
        const summaryLocations = document.querySelectorAll('.event-summary__location');

        // Update all summary sections
        summaryImages.forEach(img => {
            if (typeof ImageUtils !== 'undefined' && ImageUtils.getEventImage) {
                img.src = ImageUtils.getEventImage(event, 'card');
            } else {
                img.src = `${event.image}?w=800&h=600&fit=crop&auto=format&q=80`;
            }
            img.alt = event.title;
        });

        summaryTitles.forEach(title => {
            title.textContent = event.title;
        });

        summaryDates.forEach(date => {
            date.textContent = event.date;
        });

        summaryLocations.forEach(location => {
            location.textContent = event.location;
        });

        // Ticket prices are now handled dynamically in renderTicketTypes()
    }

    setupEventListeners() {
        // Ticket quantity controls
        document.querySelectorAll('.ticket-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const ticketType = e.target.dataset.ticket;
                this.updateTicketQuantity(ticketType, action);
            });
        });

        // Step navigation
        document.getElementById('proceedToPayment').addEventListener('click', () => {
            this.goToStep('purchase');
        });

        // Payment form
        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.goToStep('completion');
        });

        // Email form
        document.getElementById('emailForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.completeBooking();
        });

        // Payment method selection
        document.querySelectorAll('input[name="payment"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.togglePaymentForm(e.target.value);
            });
        });
    }

    increaseTicket(ticketType) {
        if (this.ticketQuantities[ticketType] !== undefined) {
            this.ticketQuantities[ticketType]++;
            this.updateTicketDisplay(ticketType);
        }
    }
    
    decreaseTicket(ticketType) {
        if (this.ticketQuantities[ticketType] !== undefined && this.ticketQuantities[ticketType] > 0) {
            this.ticketQuantities[ticketType]--;
            this.updateTicketDisplay(ticketType);
        }
    }
    
    updateTicketDisplay(ticketType) {
        // Update quantity display
        const quantityElement = document.getElementById(`${ticketType}Quantity`);
        if (quantityElement) {
            quantityElement.textContent = this.ticketQuantities[ticketType];
        }
        
        // Update minus button state
        const minusBtn = document.querySelector(`[data-action="decrease"][data-ticket="${ticketType}"]`);
        if (minusBtn) {
            minusBtn.disabled = this.ticketQuantities[ticketType] === 0;
        }

        this.updateTotalAmount();
        this.updateProceedButton();
    }

    updateTicketQuantity(ticketType, action) {
        // Legacy method for backward compatibility
        if (action === 'increase') {
            this.increaseTicket(ticketType);
        } else if (action === 'decrease') {
            this.decreaseTicket(ticketType);
        }
    }

    updateTotalAmount() {
        // Calculate total dynamically for all ticket types
        this.totalAmount = 0;
        Object.keys(this.ticketQuantities).forEach(ticketType => {
            const quantity = this.ticketQuantities[ticketType];
            const price = this.ticketPrices[ticketType] || 0;
            this.totalAmount += quantity * price;
        });
        
        // Update total display
        const totalElement = document.getElementById('totalAmount');
        const purchaseTotalElement = document.getElementById('purchaseTotalAmount');
        
        if (totalElement) totalElement.textContent = EventUtils.formatPrice(this.totalAmount);
        if (purchaseTotalElement) purchaseTotalElement.textContent = EventUtils.formatPrice(this.totalAmount);
    }

    updateProceedButton() {
        const proceedBtn = document.getElementById('proceedToPayment');
        if (!proceedBtn) return;
        
        // Check if any tickets are selected
        const hasTickets = Object.values(this.ticketQuantities).some(quantity => quantity > 0);
        proceedBtn.disabled = !hasTickets;
    }

    goToStep(stepName) {
        // Hide all steps
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.add('hidden');
        });

        // Show target step
        document.getElementById(`step-${stepName}`).classList.remove('hidden');
        this.currentStep = stepName;

        // Update purchase summary if going to purchase step
        if (stepName === 'purchase') {
            this.updatePurchaseSummary();
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updatePurchaseSummary() {
        // Early Access summary
        const earlyRow = document.getElementById('earlySummaryRow');
        const earlyQty = document.getElementById('earlySummaryQty');
        const earlyPrice = document.getElementById('earlySummaryPrice');

        if (this.ticketQuantities.early > 0) {
            earlyRow.style.display = 'flex';
            earlyQty.textContent = this.ticketQuantities.early;
            earlyPrice.textContent = EventUtils.formatPrice(this.ticketQuantities.early * this.ticketPrices.early);
        } else {
            earlyRow.style.display = 'none';
        }

        // VIP Access summary
        const vipRow = document.getElementById('vipSummaryRow');
        const vipQty = document.getElementById('vipSummaryQty');
        const vipPrice = document.getElementById('vipSummaryPrice');

        if (this.ticketQuantities.vip > 0) {
            vipRow.style.display = 'flex';
            vipQty.textContent = this.ticketQuantities.vip;
            vipPrice.textContent = EventUtils.formatPrice(this.ticketQuantities.vip * this.ticketPrices.vip);
        } else {
            vipRow.style.display = 'none';
        }
    }

    togglePaymentForm(paymentMethod) {
        const paymentForm = document.getElementById('paymentForm');
        
        if (paymentMethod === 'apple') {
            // Hide form fields for Apple Pay
            paymentForm.style.display = 'none';
            document.getElementById('completePayment').textContent = 'Pay with Apple Pay';
        } else {
            // Show form fields for credit card
            paymentForm.style.display = 'block';
            document.getElementById('completePayment').textContent = 'Complete';
        }
    }

    completeBooking() {
        const email = document.getElementById('emailAddress').value;
        
        if (!email) {
            alert('Please enter your email address');
            return;
        }

        // Simulate sending tickets via email
        console.log('Sending tickets to:', email);
        console.log('Event:', this.currentEvent);
        console.log('Tickets:', this.ticketQuantities);
        console.log('Total:', this.totalAmount);

        // In a real application, this would:
        // 1. Generate QR codes for each ticket
        // 2. Send email with ticket details
        // 3. Save booking to database
        // 4. Redirect to confirmation page

        alert(`Tickets have been sent to ${email}!\n\nBooking Details:\n- Event: ${this.currentEvent.title}\n- Early Access: ${this.ticketQuantities.early} tickets\n- VIP Access: ${this.ticketQuantities.vip} tickets\n- Total: ${EventUtils.formatPrice(this.totalAmount)}`);

        // Redirect to events page
        setTimeout(() => {
            window.location.href = 'events.html';
        }, 2000);
    }
}

// Initialize booking manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.bookingManager = new BookingManager();
});

// Utility functions for form formatting
document.addEventListener('DOMContentLoaded', () => {
    // Format card number input
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }

    // Format expiry date input
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // Format CVC input (numbers only)
    const cardCVCInput = document.getElementById('cardCVC');
    if (cardCVCInput) {
        cardCVCInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        });
    }
});