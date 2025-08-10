// Authentication System for Blankrooms
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.storageKey = 'blankrooms_auth';
        this.sessionKey = 'blankrooms_session';
        
        // Demo users for testing
        this.demoUsers = {
            'user@demo.com': {
                id: 'user_001',
                email: 'user@demo.com',
                name: 'Demo User',
                password: 'password123',
                role: 'user',
                tickets: [
                    {
                        id: 'ticket_001',
                        eventId: '1',
                        eventTitle: 'Shang-Chi',
                        eventDate: '3 March 2025',
                        eventLocation: 'Newcastle, UK',
                        ticketType: 'Early Access',
                        quantity: 2,
                        price: 80,
                        purchaseDate: '2024-12-20T10:30:00Z',
                        qrCode: 'QR_SHANCHI_001_EA',
                        status: 'confirmed'
                    },
                    {
                        id: 'ticket_002',
                        eventId: '2',
                        eventTitle: 'Bend Pot',
                        eventDate: '6 March 2024',
                        eventLocation: 'Newcastle, UK',
                        ticketType: 'VIP Access',
                        quantity: 1,
                        price: 80,
                        purchaseDate: '2024-12-19T15:45:00Z',
                        qrCode: 'QR_BENDPOT_002_VIP',
                        status: 'confirmed'
                    }
                ],
                preferences: {
                    emailNotifications: true,
                    smsNotifications: false
                }
            },
            'admin@demo.com': {
                id: 'admin_001',
                email: 'admin@demo.com',
                name: 'Demo Admin',
                password: 'admin123',
                role: 'admin',
                permissions: ['events', 'users', 'analytics', 'content'],
                lastLogin: new Date().toISOString()
            }
        };
        
        this.init();
    }

    init() {
        this.loadStoredAuth();
        this.setupAuthInterceptors();
    }

    // Load stored authentication from localStorage
    loadStoredAuth() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const authData = JSON.parse(stored);
                if (this.isValidToken(authData.token)) {
                    this.currentUser = authData.user;
                    this.updateUIForAuthState();
                } else {
                    this.clearAuth();
                }
            }
        } catch (error) {
            console.error('Error loading stored auth:', error);
            this.clearAuth();
        }
    }

    // Validate token (simplified for demo)
    isValidToken(token) {
        if (!token) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } catch {
            return false;
        }
    }

    // Generate demo JWT token
    generateToken(user) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            sub: user.id,
            email: user.email,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }));
        const signature = btoa('demo_signature'); // In production, use proper signing
        
        return `${header}.${payload}.${signature}`;
    }

    // Sign in user
    async signIn(email, password, rememberMe = false) {
        try {
            // Check demo users
            const user = this.demoUsers[email];
            if (!user || user.password !== password) {
                throw new Error('Invalid email or password');
            }

            // Generate token
            const token = this.generateToken(user);
            
            // Store auth data
            const authData = {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    permissions: user.permissions || []
                },
                token,
                loginTime: new Date().toISOString()
            };

            // Store in localStorage if remember me is checked
            if (rememberMe) {
                localStorage.setItem(this.storageKey, JSON.stringify(authData));
            } else {
                sessionStorage.setItem(this.sessionKey, JSON.stringify(authData));
            }

            this.currentUser = authData.user;
            this.updateUIForAuthState();

            return {
                success: true,
                user: authData.user,
                redirectUrl: this.getRedirectUrl(authData.user.role)
            };

        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    // Get redirect URL based on role
    getRedirectUrl(role) {
        switch (role) {
            case 'admin':
                return 'admin-dashboard.html';
            case 'user':
                return 'user-dashboard.html';
            default:
                return 'events.html';
        }
    }

    // Sign out user
    signOut() {
        this.currentUser = null;
        localStorage.removeItem(this.storageKey);
        sessionStorage.removeItem(this.sessionKey);
        this.updateUIForAuthState();
        
        // Redirect to home page
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }

    // Clear authentication
    clearAuth() {
        this.signOut();
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Check if user has specific role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    // Check if user has permission
    hasPermission(permission) {
        return this.currentUser && 
               this.currentUser.permissions && 
               this.currentUser.permissions.includes(permission);
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get user tickets (for regular users)
    getUserTickets() {
        if (!this.currentUser || this.currentUser.role !== 'user') {
            return [];
        }

        const fullUser = this.demoUsers[this.currentUser.email];
        return fullUser ? fullUser.tickets || [] : [];
    }

    // Update UI based on authentication state
    updateUIForAuthState() {
        const authButtons = document.querySelectorAll('.nav__auth');
        const signupButtons = document.querySelectorAll('.nav__signup');

        if (this.isAuthenticated()) {
            // Update navigation to show user menu
            authButtons.forEach(authEl => {
                authEl.innerHTML = `
                    <div class="nav__user-menu">
                        <span class="nav__user-name">${this.currentUser.name}</span>
                        <div class="nav__user-dropdown">
                            ${this.currentUser.role === 'admin' ? 
                                '<a href="admin-dashboard.html" class="nav__dropdown-item">Admin Dashboard</a>' : 
                                '<a href="user-dashboard.html" class="nav__dropdown-item">My Tickets</a>'
                            }
                            <a href="#" class="nav__dropdown-item" onclick="window.authManager.signOut()">Sign Out</a>
                        </div>
                    </div>
                `;
            });
        } else {
            // Show sign up button
            authButtons.forEach(authEl => {
                authEl.innerHTML = '<a href="signup.html" class="nav__signup">Sign up</a>';
            });
        }
    }

    // Setup auth interceptors for protected routes
    setupAuthInterceptors() {
        // Check for protected routes on page load
        window.addEventListener('DOMContentLoaded', () => {
            this.checkRoutePermissions();
        });
    }

    // Check if current route requires authentication
    checkRoutePermissions() {
        const path = window.location.pathname;
        const protectedRoutes = {
            '/admin-dashboard.html': 'admin',
            '/user-dashboard.html': 'user'
        };

        const requiredRole = protectedRoutes[path];
        if (requiredRole) {
            if (!this.isAuthenticated()) {
                // Redirect to sign in
                window.location.href = 'signin.html?redirect=' + encodeURIComponent(path);
                return;
            }

            if (!this.hasRole(requiredRole)) {
                // Insufficient permissions
                alert('You do not have permission to access this page.');
                window.location.href = this.getRedirectUrl(this.currentUser.role);
                return;
            }
        }
    }

    // Handle demo login
    loginWithDemo(userType) {
        const email = userType === 'admin' ? 'admin@demo.com' : 'user@demo.com';
        const password = userType === 'admin' ? 'admin123' : 'password123';
        
        return this.signIn(email, password, false);
    }
}

// Global auth manager instance
window.authManager = new AuthManager();

// Export for modules (if using)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}