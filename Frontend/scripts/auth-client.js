// Secure authentication client for Blankrooms
class SecureAuthManager {
  constructor() {
    this.storageKey = 'blankrooms_token';
    this.user = null;
    this.token = null;
    // Don't auto-init to avoid race conditions
  }

  async init() {
    await this.loadStoredAuth();
    this.updateUIForAuthState();
  }

  async loadStoredAuth() {
    try {
      // Check localStorage first (remember me), then sessionStorage
      let token = localStorage.getItem(this.storageKey) || sessionStorage.getItem(this.storageKey);
      
      if (token) {
        const isValid = await this.verifyToken(token);
        if (isValid) {
          this.token = token;
          return true;
        } else {
          this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      this.clearAuth();
    }
    return false;
  }

  async verifyToken(token) {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  async signUp(name, email, password) {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.token = data.token;
        this.user = data.user;
        
        // Store token (default to sessionStorage for security)
        sessionStorage.setItem(this.storageKey, this.token);
        
        this.updateUIForAuthState();
        
        return {
          success: true,
          user: this.user,
          redirectUrl: data.redirectUrl
        };
      } else {
        throw new Error(data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async signIn(email, password, rememberMe = false) {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.token = data.token;
        this.user = data.user;
        
        // Store token based on rememberMe preference
        if (rememberMe) {
          localStorage.setItem(this.storageKey, this.token);
          sessionStorage.removeItem(this.storageKey);
        } else {
          sessionStorage.setItem(this.storageKey, this.token);
          localStorage.removeItem(this.storageKey);
        }
        
        this.updateUIForAuthState();
        
        return {
          success: true,
          user: this.user,
          redirectUrl: data.redirectUrl
        };
      } else {
        throw new Error(data.error || 'Sign in failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  signOut() {
    this.user = null;
    this.token = null;
    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.storageKey);
    this.updateUIForAuthState();
    
    // Redirect to home page
    if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }

  clearAuth() {
    this.signOut();
  }

  isAuthenticated() {
    return this.user !== null && this.token !== null;
  }

  hasRole(role) {
    return this.user && this.user.role === role;
  }

  getCurrentUser() {
    return this.user;
  }

  getAuthHeaders() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }

  updateUIForAuthState() {
    const authButtons = document.querySelectorAll('.nav__auth');

    if (this.isAuthenticated()) {
      // Update navigation to show user menu
      authButtons.forEach(authEl => {
        authEl.innerHTML = `
          <div class="nav__user-menu">
            <span class="nav__user-name">${this.user.name}</span>
            <div class="nav__user-dropdown">
              ${this.user.role === 'admin' ? 
                '<a href="/admin-dashboard.html" class="nav__dropdown-item">Admin Dashboard</a>' : 
                '<a href="/user-dashboard.html" class="nav__dropdown-item">My Tickets</a>'
              }
              <a href="#" class="nav__dropdown-item" onclick="window.secureAuth.signOut()">Sign Out</a>
            </div>
          </div>
        `;
      });
    } else {
      // Show sign up button
      authButtons.forEach(authEl => {
        authEl.innerHTML = `
          <a href="/signin.html" class="nav__signin">Sign in</a>
          <a href="/signup.html" class="nav__signup">Sign up</a>
        `;
      });
    }
  }

  // Protected route checking
  checkRoutePermissions() {
    const path = window.location.pathname;
    const protectedRoutes = {
      '/admin-dashboard.html': 'admin',
      '/user-dashboard.html': 'user'
    };

    console.log('Checking route permissions for:', path);
    console.log('Auth state:', {
      isAuthenticated: this.isAuthenticated(),
      user: this.user,
      token: !!this.token
    });

    const requiredRole = protectedRoutes[path];
    if (requiredRole) {
      if (!this.isAuthenticated()) {
        console.log('Not authenticated, redirecting to signin');
        window.location.href = '/signin.html?redirect=' + encodeURIComponent(path);
        return false;
      }

      if (!this.hasRole(requiredRole)) {
        console.log('Insufficient permissions. Required:', requiredRole, 'User role:', this.user?.role);
        // Insufficient permissions
        alert('You do not have permission to access this page.');
        window.location.href = this.user.role === 'admin' ? '/admin-dashboard.html' : '/user-dashboard.html';
        return false;
      }
      
      console.log('Route access granted for role:', this.user.role);
    }
    return true;
  }
}

// Create global instance
window.secureAuth = new SecureAuthManager();

// Backward compatibility
window.authManager = window.secureAuth;

// Check route permissions on page load (after auth is initialized)
window.addEventListener('DOMContentLoaded', async () => {
  // Wait for auth to be fully initialized
  await window.secureAuth.init();
  // Then check route permissions
  window.secureAuth.checkRoutePermissions();
});