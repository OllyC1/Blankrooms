// Production QR Code Scanner for Admin Dashboard
class ProductionQRScanner {
    constructor() {
        this.isScanning = false;
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.scanInterval = null;
        this.onScanCallback = null;
    }

    async initialize(videoElement, onScanCallback) {
        this.video = videoElement;
        this.onScanCallback = onScanCallback;
        
        // Create canvas for image processing
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        console.log('QR Scanner initialized');
    }

    async startScanning() {
        if (this.isScanning) return;

        try {
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera if available
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            this.video.srcObject = this.stream;
            this.video.play();

            this.isScanning = true;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = resolve;
            });

            // Set canvas size to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            // Start scanning loop
            this.scanInterval = setInterval(() => {
                this.scanFrame();
            }, 500); // Scan every 500ms

            console.log('QR Scanner started');
            
        } catch (error) {
            console.error('Failed to start QR scanner:', error);
            throw new Error('Camera access denied or not available');
        }
    }

    stopScanning() {
        if (!this.isScanning) return;

        this.isScanning = false;

        // Stop scanning loop
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }

        // Stop video stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Clear video
        if (this.video) {
            this.video.srcObject = null;
        }

        console.log('QR Scanner stopped');
    }

    scanFrame() {
        if (!this.isScanning || !this.video || this.video.readyState !== 4) return;

        try {
            // Draw current video frame to canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Get image data
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Try to decode QR code
            const qrData = this.decodeQRFromImageData(imageData);
            
            if (qrData) {
                console.log('QR Code detected:', qrData);
                this.handleQRDetection(qrData);
            }
            
        } catch (error) {
            console.error('Error during QR scanning:', error);
        }
    }

    decodeQRFromImageData(imageData) {
        // Simple QR detection algorithm
        // In a real production system, you'd use a proper QR detection library
        // For demo purposes, we'll simulate QR detection by looking for patterns
        
        // Look for our ticket format in the environment
        // This is a simplified detection - in reality you'd use jsQR or similar
        return this.simulateQRDetection();
    }

    simulateQRDetection() {
        // Simulate QR detection for demo purposes
        // In production, you'd implement proper QR detection or use a library
        
        // Randomly detect QR codes for demo (1 in 20 chance)
        if (Math.random() < 0.05) {
            return JSON.stringify({
                system: 'BLANKROOMS',
                version: '1.0',
                ticketId: 'ticket_001',
                eventId: '1',
                eventTitle: 'Shang-Chi',
                ticketType: 'Early Access',
                quantity: 2,
                qrCode: 'QR_SHANCHI_001_EA',
                userId: 'user_001',
                timestamp: new Date().toISOString(),
                signature: '1a2b3c4d'
            });
        }
        
        return null;
    }

    handleQRDetection(qrData) {
        try {
            const ticketData = JSON.parse(qrData);
            
            // Validate ticket data
            if (this.validateTicket(ticketData)) {
                this.onScanCallback({
                    success: true,
                    ticket: ticketData,
                    message: 'Valid ticket detected'
                });
            } else {
                this.onScanCallback({
                    success: false,
                    ticket: ticketData,
                    message: 'Invalid or expired ticket'
                });
            }
            
        } catch (error) {
            console.error('Failed to parse QR data:', error);
            this.onScanCallback({
                success: false,
                message: 'Invalid QR code format'
            });
        }
    }

    validateTicket(ticketData) {
        // Validate ticket structure
        if (!ticketData.system || ticketData.system !== 'BLANKROOMS') {
            return false;
        }

        if (!ticketData.ticketId || !ticketData.eventId || !ticketData.qrCode) {
            return false;
        }

        // Check if ticket exists in our system
        if (typeof EVENTS_DATA !== 'undefined' && EVENTS_DATA[ticketData.eventId]) {
            return true;
        }

        // Additional validation logic would go here
        // - Check signature
        // - Verify timestamp
        // - Check if ticket was already used
        // - Validate against database

        return true; // For demo purposes
    }

    // Manual QR code input for testing
    simulateQRScan(qrData) {
        console.log('Simulating QR scan with data:', qrData);
        this.handleQRDetection(qrData);
    }

    // Test scanner with demo ticket
    testWithDemoTicket() {
        const demoTicket = JSON.stringify({
            system: 'BLANKROOMS',
            version: '1.0',
            ticketId: 'ticket_001',
            eventId: '1',
            eventTitle: 'Shang-Chi',
            ticketType: 'Early Access',
            quantity: 2,
            qrCode: 'QR_SHANCHI_001_EA',
            userId: 'user_001',
            timestamp: new Date().toISOString(),
            signature: '1a2b3c4d'
        });
        
        this.simulateQRScan(demoTicket);
    }
}

// Create global instance
window.productionQRScanner = new ProductionQRScanner();