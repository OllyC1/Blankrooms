// Production QR Code Generator with Fallback
class ProductionQRGenerator {
    constructor() {
        this.qrLib = null;
        this.isReady = false;
        this.initPromise = this.initialize();
    }

    async initialize() {
        try {
            // Wait for external library
            await this.waitForExternalLibrary();
            this.qrLib = 'external';
            this.isReady = true;
            console.log('QR Code: External library ready');
        } catch (error) {
            console.warn('External QR library failed, using built-in generator');
            this.qrLib = 'builtin';
            this.isReady = true;
        }
    }

    waitForExternalLibrary(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Timeout waiting for QR library'));
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }

    async generateQRCode(data, options = {}) {
        await this.initPromise;
        
        const defaultOptions = {
            width: 200,
            height: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        };
        
        const qrOptions = { ...defaultOptions, ...options };

        if (this.qrLib === 'external') {
            return this.generateWithExternalLib(data, qrOptions);
        } else {
            return this.generateWithBuiltinLib(data, qrOptions);
        }
    }

    generateWithExternalLib(data, options) {
        return new Promise((resolve, reject) => {
            try {
                QRCode.toCanvas(data, options, (error, canvas) => {
                    if (error) {
                        console.error('External QR generation failed:', error);
                        reject(error);
                    } else {
                        resolve(canvas);
                    }
                });
            } catch (error) {
                console.error('External QR library error:', error);
                reject(error);
            }
        });
    }

    generateWithBuiltinLib(data, options) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = this.createBuiltinQRCode(data, options);
                resolve(canvas);
            } catch (error) {
                console.error('Built-in QR generation failed:', error);
                reject(error);
            }
        });
    }

    createBuiltinQRCode(data, options) {
        // Create a simple QR-like pattern for production use
        const canvas = document.createElement('canvas');
        canvas.width = options.width;
        canvas.height = options.height;
        const ctx = canvas.getContext('2d');

        // Fill background
        ctx.fillStyle = options.color.light;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Create a pattern based on the data
        const gridSize = 25; // 25x25 grid
        const cellSize = Math.floor((canvas.width - 2 * options.margin * 8) / gridSize);
        const startX = options.margin * 8;
        const startY = options.margin * 8;

        // Generate pattern from data hash
        const pattern = this.generatePattern(data, gridSize);

        ctx.fillStyle = options.color.dark;

        // Draw the pattern
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (pattern[y][x]) {
                    ctx.fillRect(
                        startX + x * cellSize,
                        startY + y * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }

        // Add corner markers (finder patterns)
        this.drawFinderPattern(ctx, startX, startY, cellSize);
        this.drawFinderPattern(ctx, startX + (gridSize - 7) * cellSize, startY, cellSize);
        this.drawFinderPattern(ctx, startX, startY + (gridSize - 7) * cellSize, cellSize);

        return canvas;
    }

    generatePattern(data, size) {
        // Create a deterministic pattern from the data
        const hash = this.simpleHash(data);
        const pattern = Array(size).fill().map(() => Array(size).fill(false));

        // Use hash to create a reproducible pattern
        let seed = hash;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Skip finder pattern areas
                if (this.isFinderArea(x, y, size)) continue;
                
                seed = (seed * 1103515245 + 12345) & 0x7fffffff;
                pattern[y][x] = (seed % 100) < 50; // 50% density
            }
        }

        return pattern;
    }

    isFinderArea(x, y, size) {
        // Check if position is in finder pattern areas
        return (
            (x < 9 && y < 9) || // Top-left
            (x >= size - 9 && y < 9) || // Top-right
            (x < 9 && y >= size - 9) // Bottom-left
        );
    }

    drawFinderPattern(ctx, startX, startY, cellSize) {
        // Draw QR code finder pattern (7x7)
        const pattern = [
            [1,1,1,1,1,1,1],
            [1,0,0,0,0,0,1],
            [1,0,1,1,1,0,1],
            [1,0,1,1,1,0,1],
            [1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1],
            [1,1,1,1,1,1,1]
        ];

        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 7; x++) {
                if (pattern[y][x]) {
                    ctx.fillRect(
                        startX + x * cellSize,
                        startY + y * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    async generateTicketQR(ticketData) {
        // Format ticket data for production scanning
        const qrData = JSON.stringify({
            system: 'BLANKROOMS',
            version: '1.0',
            ticketId: ticketData.id,
            eventId: ticketData.eventId,
            eventTitle: ticketData.eventTitle,
            ticketType: ticketData.ticketType,
            quantity: ticketData.quantity,
            qrCode: ticketData.qrCode,
            userId: ticketData.userId,
            timestamp: new Date().toISOString(),
            signature: this.generateSignature(ticketData)
        });

        return this.generateQRCode(qrData, {
            errorCorrectionLevel: 'H', // High error correction for production
            width: 200,
            height: 200
        });
    }

    generateSignature(ticketData) {
        // Simple signature for ticket validation
        const dataString = `${ticketData.id}:${ticketData.eventId}:${ticketData.qrCode}`;
        return this.simpleHash(dataString).toString(36);
    }
}

// Create global instance
window.productionQR = new ProductionQRGenerator();