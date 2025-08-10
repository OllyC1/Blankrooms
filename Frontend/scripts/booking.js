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
        
        this.init();
    }

    init() {
        this.loadEventFromURL();
        this.setupEventListeners();
        this.updateTotalAmount();
    }

    loadEventFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('eventId');
        
        if (eventId && EventUtils.getEventById(eventId)) {
            this.currentEvent = EventUtils.getEventById(eventId);
        } else {
            // Default to first event if no ID provided or invalid
            this.currentEvent = EventUtils.getEventById(1);
        }
        
        this.populateEventData();
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

        // Update ticket prices based on event
        document.getElementById('earlyPrice').textContent = EventUtils.formatPrice(this.ticketPrices.early);
        document.getElementById('vipPrice').textContent = EventUtils.formatPrice(this.ticketPrices.vip);
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

    updateTicketQuantity(ticketType, action) {
        if (action === 'increase') {
            this.ticketQuantities[ticketType]++;
        } else if (action === 'decrease' && this.ticketQuantities[ticketType] > 0) {
            this.ticketQuantities[ticketType]--;
        }

        // Update quantity display
        document.getElementById(`${ticketType}Quantity`).textContent = this.ticketQuantities[ticketType];
        
        // Update minus button state
        const minusBtn = document.querySelector(`[data-action="decrease"][data-ticket="${ticketType}"]`);
        minusBtn.disabled = this.ticketQuantities[ticketType] === 0;

        this.updateTotalAmount();
        this.updateProceedButton();
    }

    updateTotalAmount() {
        this.totalAmount = (this.ticketQuantities.early * this.ticketPrices.early) + 
                          (this.ticketQuantities.vip * this.ticketPrices.vip);
        
        // Update total display
        document.getElementById('totalAmount').textContent = EventUtils.formatPrice(this.totalAmount);
        document.getElementById('purchaseTotalAmount').textContent = EventUtils.formatPrice(this.totalAmount);
    }

    updateProceedButton() {
        const proceedBtn = document.getElementById('proceedToPayment');
        const hasTickets = this.ticketQuantities.early > 0 || this.ticketQuantities.vip > 0;
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