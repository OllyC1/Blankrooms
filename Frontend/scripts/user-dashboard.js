class UserDashboard {
    constructor() {
        this.currentFilter = 'all';
        this.tickets = [];
        this.qrModal = null;
        this.qrCanvasCache = new Map();
        
        this.init();
    }

    init() {
        // Check authentication
        if (!window.authManager.isAuthenticated() || !window.authManager.hasRole('user')) {
            window.location.href = 'signin.html?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }

        this.loadUserData();
        this.setupEventListeners();
        this.loadTickets();
    }

    loadUserData() {
        const user = window.authManager.getCurrentUser();
        if (user) {
            document.getElementById('welcomeTitle').textContent = `Welcome back, ${user.name}!`;
        }
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // QR Modal
        this.qrModal = document.getElementById('qrModal');
        document.getElementById('closeQrModal').addEventListener('click', () => {
            this.closeQrModal();
        });

        // Click outside modal to close
        this.qrModal.addEventListener('click', (e) => {
            if (e.target === this.qrModal) {
                this.closeQrModal();
            }
        });

        // Modal actions (use image-based download/share)
        document.getElementById('downloadTicket').addEventListener('click', async () => {
            if (this.currentTicketCanvas && this.currentTicketData) {
                await this.downloadTicket(this.currentTicketCanvas, this.currentTicketData);
            } else {
                alert('Please wait, generating your ticket image...');
            }
        });

        document.getElementById('shareTicket').addEventListener('click', async () => {
            if (this.currentTicketCanvas && this.currentTicketData) {
                await this.shareTicket(this.currentTicketCanvas, this.currentTicketData);
            } else {
                alert('Please wait, generating your ticket image...');
            }
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.qrModal.classList.contains('show')) {
                this.closeQrModal();
            }
        });
    }

    loadTickets() {
        this.tickets = window.authManager.getUserTickets();
        this.renderTickets();
        // Prewarm QR codes in the background for faster first open
        this.prewarmQRCodes();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('filter-btn--active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('filter-btn--active');
            }
        });

        this.renderTickets();
    }

    filterTickets() {
        const now = new Date();
        
        return this.tickets.filter(ticket => {
            const eventDate = new Date(ticket.eventDate);
            
            switch (this.currentFilter) {
                case 'upcoming':
                    return eventDate >= now;
                case 'past':
                    return eventDate < now;
                default:
                    return true;
            }
        });
    }

    renderTickets() {
        const ticketsGrid = document.getElementById('ticketsGrid');
        const emptyState = document.getElementById('emptyState');
        const filteredTickets = this.filterTickets();

        if (filteredTickets.length === 0) {
            ticketsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        ticketsGrid.style.display = 'grid';
        emptyState.style.display = 'none';

        ticketsGrid.innerHTML = filteredTickets.map(ticket => 
            this.createTicketCard(ticket)
        ).join('');

        // Add click listeners to ticket cards
        document.querySelectorAll('.ticket-card').forEach(card => {
            card.addEventListener('click', () => {
                const ticketId = card.dataset.ticketId;
                const ticket = this.tickets.find(t => t.id === ticketId);
                if (ticket) {
                    this.showQrModal(ticket);
                }
            });
        });
    }

    createTicketCard(ticket) {
        const eventDate = new Date(ticket.eventDate);
        const isUpcoming = eventDate >= new Date();
        const formattedDate = this.formatDate(eventDate);
        
        // Get event image from event data
        let eventImage = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&auto=format&q=80';
        if (typeof EVENTS_DATA !== 'undefined' && EVENTS_DATA[ticket.eventId]) {
            const event = EVENTS_DATA[ticket.eventId];
            if (typeof ImageUtils !== 'undefined') {
                eventImage = ImageUtils.getEventImage(event, 'card');
            } else {
                eventImage = `${event.image}?w=800&h=600&fit=crop&auto=format&q=80`;
            }
        }

        return `
            <div class="ticket-card" data-ticket-id="${ticket.id}">
                <div class="ticket-card__image">
                    <img src="${eventImage}" alt="${ticket.eventTitle}" class="ticket-card__img">
                    <div class="ticket-card__status ticket-card__status--${ticket.status}">
                        ${ticket.status}
                    </div>
                </div>
                <div class="ticket-card__content">
                    <h3 class="ticket-card__title">${ticket.eventTitle}</h3>
                    <div class="ticket-card__meta">
                        <div class="ticket-card__date">
                            📅 ${formattedDate}
                        </div>
                        <div class="ticket-card__location">
                            📍 ${ticket.eventLocation}
                        </div>
                    </div>
                    <div class="ticket-card__details">
                        <div>
                            <div class="ticket-card__type">${ticket.ticketType}</div>
                            <div class="ticket-card__quantity">Qty: ${ticket.quantity}</div>
                        </div>
                        <div class="ticket-card__price">£${ticket.price.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    formatDate(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-GB', options);
    }

    showQrModal(ticket) {
        // Update modal content
        document.getElementById('qrEventTitle').textContent = ticket.eventTitle;
        document.getElementById('qrEventDate').textContent = this.formatDate(new Date(ticket.eventDate));
        document.getElementById('qrTicketType').textContent = `${ticket.ticketType} - Qty: ${ticket.quantity}`;
        document.getElementById('qrCodeText').textContent = ticket.qrCode;

        // Generate or load cached QR code
        this.generateQrCode(ticket);

        // Show modal
        this.qrModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeQrModal() {
        this.qrModal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Clean up stored ticket data
        this.currentTicketCanvas = null;
        this.currentTicketData = null;
    }

    async generateQrCode(ticket) {
        const qrContainer = document.getElementById('qrCodeContainer');
        qrContainer.innerHTML = ''; // Clear existing QR code

        // Show loading state
        qrContainer.innerHTML = '<div style="width: 200px; height: 200px; background: #f8f9fa; display: flex; align-items: center; justify-content: center; color: #6c757d; flex-direction: column; border-radius: 8px;"><div style="font-size: 24px; margin-bottom: 10px;">📱</div><div style="font-size: 14px;">Generating QR Code...</div></div>';

        try {
            const cacheKey = ticket.qrCode || ticket.id;
            if (this.qrCanvasCache.has(cacheKey)) {
                const cachedCanvas = this.qrCanvasCache.get(cacheKey);
                qrContainer.innerHTML = '';
                qrContainer.appendChild(cachedCanvas);
                this.currentTicketCanvas = cachedCanvas;
                this.currentTicketData = {
                    id: ticket.id,
                    eventId: ticket.eventId,
                    eventTitle: ticket.eventTitle,
                    ticketType: ticket.ticketType,
                    quantity: ticket.quantity,
                    qrCode: ticket.qrCode,
                    userId: window.authManager.getCurrentUser().id
                };
                return;
            }

            // Prepare ticket data for QR generation
            const ticketData = {
                id: ticket.id,
                eventId: ticket.eventId,
                eventTitle: ticket.eventTitle,
                ticketType: ticket.ticketType,
                quantity: ticket.quantity,
                qrCode: ticket.qrCode,
                userId: window.authManager.getCurrentUser().id
            };

            // Use production QR generator
            const canvas = await window.productionQR.generateTicketQR(ticketData);
            // Cache the canvas for subsequent opens
            this.qrCanvasCache.set(cacheKey, canvas);
            
            // Display the QR code
            qrContainer.innerHTML = '';
            qrContainer.appendChild(canvas);
            
            // Store the canvas for download/share functionality (used by footer buttons)
            this.currentTicketCanvas = canvas;
            this.currentTicketData = ticketData;
            
            console.log('Production QR Code generated successfully');
            
        } catch (error) {
            console.error('QR Code generation failed:', error);
            this.showQRCodeError(qrContainer);
        }
    }

    // Removed inline action buttons to avoid duplication. Footer buttons handle actions.

    async prewarmQRCodes() {
        if (!Array.isArray(this.tickets) || this.tickets.length === 0) return;
        const userId = window.authManager.getCurrentUser().id;
        let delay = 0;
        for (const ticket of this.tickets) {
            const cacheKey = ticket.qrCode || ticket.id;
            if (this.qrCanvasCache.has(cacheKey)) continue;
            const ticketData = {
                id: ticket.id,
                eventId: ticket.eventId,
                eventTitle: ticket.eventTitle,
                ticketType: ticket.ticketType,
                quantity: ticket.quantity,
                qrCode: ticket.qrCode,
                userId
            };
            // Stagger generation to avoid UI jank
            setTimeout(async () => {
                try {
                    const canvas = await window.productionQR.generateTicketQR(ticketData);
                    this.qrCanvasCache.set(cacheKey, canvas);
                } catch (e) {
                    console.warn('Prewarm QR failed for', cacheKey, e);
                }
            }, delay);
            delay += 150; // 150ms between generations
        }
    }

    async downloadTicket(canvas, ticketData) {
        try {
            // Create a full ticket image with branding and details
            const ticketImage = await this.createFullTicketImage(canvas, ticketData);
            
            // Create download link
            const link = document.createElement('a');
            link.download = `ticket_${ticketData.eventTitle.replace(/\s+/g, '_')}_${ticketData.qrCode}.png`;
            link.href = ticketImage;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Ticket downloaded successfully');
            
        } catch (error) {
            console.error('Failed to download ticket:', error);
            alert('Failed to download ticket. Please try again.');
        }
    }

    async shareTicket(canvas, ticketData) {
        try {
            // Create full ticket image
            const ticketImage = await this.createFullTicketImage(canvas, ticketData);
            
            // Convert blob URL to file for sharing
            const response = await fetch(ticketImage);
            const blob = await response.blob();
            const file = new File([blob], `ticket_${ticketData.qrCode}.png`, { type: 'image/png' });

            // Check if Web Share API is available
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `My Ticket for ${ticketData.eventTitle}`,
                    text: `I'm going to ${ticketData.eventTitle}! Here's my ticket.`,
                    files: [file]
                });
            } else {
                // Fallback: copy image to clipboard or show share options
                await this.fallbackShare(ticketImage, ticketData);
            }
            
        } catch (error) {
            console.error('Failed to share ticket:', error);
            // Fallback to download
            this.downloadTicket(canvas, ticketData);
        }
    }

    async fallbackShare(imageUrl, ticketData) {
        // Create a modal with sharing options
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            max-width: 400px;
            width: 90%;
        `;

        content.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #333;">Share Your Ticket</h3>
            <p style="margin: 0 0 20px 0; color: #666;">Choose how you'd like to share your ticket:</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="window.copyTicketImageLink('${imageUrl}')" style="padding: 12px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    📋 Copy Image Link
                </button>
                <button onclick="window.open('${imageUrl}', '_blank')" style="padding: 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    🔗 Open Image
                </button>
                <button onclick="this.closest('.share-modal').remove()" style="padding: 12px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    ❌ Cancel
                </button>
            </div>
        `;

        modal.className = 'share-modal';
        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    async createFullTicketImage(qrCanvas, ticketData) {
        // Create a larger canvas for the full ticket
        const ticketCanvas = document.createElement('canvas');
        const ctx = ticketCanvas.getContext('2d');
        
        // Set ticket dimensions (600x800 for good quality)
        ticketCanvas.width = 600;
        ticketCanvas.height = 800;
        
        // Fill background with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, ticketCanvas.height);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ticketCanvas.width, ticketCanvas.height);
        
        // Add border
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, ticketCanvas.width - 20, ticketCanvas.height - 20);
        
        // Add inner border
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 20, ticketCanvas.width - 40, ticketCanvas.height - 40);
        
        // Add logo/branding area
        ctx.fillStyle = '#007bff';
        ctx.fillRect(30, 30, ticketCanvas.width - 60, 80);
        
        // Add brand text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BLANKROOMS', ticketCanvas.width / 2, 70);
        ctx.font = '18px Arial, sans-serif';
        ctx.fillText('EVENT TICKET', ticketCanvas.width / 2, 95);
        
        // Add event details
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Event:', 50, 150);
        ctx.font = '20px Arial, sans-serif';
        ctx.fillText(ticketData.eventTitle, 50, 180);
        
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText('Ticket Type:', 50, 220);
        ctx.font = '18px Arial, sans-serif';
        ctx.fillText(ticketData.ticketType, 50, 250);
        
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText('Quantity:', 50, 290);
        ctx.font = '18px Arial, sans-serif';
        ctx.fillText(`x${ticketData.quantity}`, 50, 320);
        
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText('Ticket ID:', 50, 360);
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText(ticketData.qrCode, 50, 390);
        
        // Add QR code in center
        const qrSize = 200;
        const qrX = (ticketCanvas.width - qrSize) / 2;
        const qrY = 420;
        
        // Draw QR code background
        ctx.fillStyle = 'white';
        ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
        
        // Draw the QR code
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
        
        // Add footer text
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Present this ticket at the event entrance', ticketCanvas.width / 2, 680);
        ctx.fillText('Generated on ' + new Date().toLocaleDateString(), ticketCanvas.width / 2, 700);
        ctx.fillText('BLANKROOMS Event Management System', ticketCanvas.width / 2, 720);
        
        // Convert to blob URL
        return new Promise((resolve) => {
            ticketCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                resolve(url);
            }, 'image/png', 0.95);
        });
    }

    waitForQRCodeLibrary(maxAttempts = 50) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            
            const checkLibrary = () => {
                attempts++;
                
                if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
                    resolve();
                } else if (window.QRCodeLibraryFailed) {
                    reject(new Error('QR Code library marked as failed'));
                } else if (attempts >= maxAttempts) {
                    reject(new Error('QR Code library failed to load'));
                } else {
                    setTimeout(checkLibrary, 100);
                }
            };
            
            checkLibrary();
        });
    }

    showQRCodeError(container) {
        const ticket = this.getCurrentModalTicket();
        if (ticket) {
            // Fallback: show ticket details in a QR-like format
            container.innerHTML = `
                <div style="width: 200px; height: 200px; background: #f8f9fa; border: 2px solid #dee2e6; display: flex; align-items: center; justify-content: center; color: #495057; flex-direction: column; text-align: center; padding: 15px; border-radius: 8px; font-family: monospace;">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #333;">📱 TICKET</div>
                    <div style="font-size: 10px; line-height: 1.2; margin-bottom: 8px; word-break: break-all;">
                        ${ticket.qrCode}
                    </div>
                    <div style="font-size: 8px; color: #6c757d; margin-bottom: 8px;">
                        ${ticket.eventTitle}<br>
                        ${ticket.ticketType} x${ticket.quantity}
                    </div>
                    <button onclick="window.userDashboard.retryQRGeneration()" style="padding: 4px 8px; border: 1px solid #6c757d; background: white; color: #6c757d; border-radius: 3px; font-size: 10px; cursor: pointer;">Retry QR</button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="width: 200px; height: 200px; background: #fee; border: 2px dashed #fcc; display: flex; align-items: center; justify-content: center; color: #c66; flex-direction: column; text-align: center; padding: 20px; border-radius: 8px;">
                    <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                    <div style="font-size: 14px; line-height: 1.4;">QR Code<br>Generation Failed</div>
                    <button onclick="window.userDashboard.retryQRGeneration()" style="margin-top: 10px; padding: 5px 10px; border: 1px solid #c66; background: white; color: #c66; border-radius: 4px; font-size: 12px; cursor: pointer;">Retry</button>
                </div>
            `;
        }
    }

    retryQRGeneration() {
        const ticket = this.getCurrentModalTicket();
        if (ticket) {
            this.generateQrCode(ticket);
        }
    }

    // Method to get current ticket data for external access
    getCurrentTicketData() {
        return this.currentTicketData;
    }

    async copyImageLink(imageUrl) {
        try {
            await navigator.clipboard.writeText(imageUrl);
            // Show success feedback
            const button = event.target;
            const originalText = button.innerHTML;
            button.innerHTML = '✅ Copied!';
            button.style.background = '#28a745';
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '#007bff';
            }, 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            // Fallback: show the URL
            alert(`Image URL: ${imageUrl}`);
        }
    }

    getCurrentModalTicket() {
        const eventTitle = document.getElementById('qrEventTitle').textContent;
        return this.tickets.find(ticket => ticket.eventTitle === eventTitle);
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.userDashboard = new UserDashboard();
    // Expose helper for share modal
    window.copyTicketImageLink = (url) => window.userDashboard.copyImageLink(url);
});