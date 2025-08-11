// Simple, clean authentication for Blankrooms
class SimpleAuth {
  constructor() {
    this.storageKey = 'blankrooms_token';
    this.user = null;
    this.token = null;
  }

  async init() {
    await this.loadStoredAuth();
    this.updateUI();
    console.log('Auth init complete. User:', this.user, 'Token:', !!this.token);
  }

  async loadStoredAuth() {
    try {
      // Check localStorage first (remember me), then sessionStorage
      let token = localStorage.getItem(this.storageKey) || sessionStorage.getItem(this.storageKey);
      
      if (token) {
        const isValid = await this.verifyToken(token);
        if (isValid) {
          this.token = token;
        } else {
          this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      this.clearAuth();
    }
  }

  async verifyToken(token) {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.token = data.token;
        this.user = data.user;
        sessionStorage.setItem(this.storageKey, this.token);
        this.updateUI();
        return data;
      } else {
        throw new Error(data.error || 'Signup failed');
      }
    } catch (error) {
      throw error;
    }
  }

  async signIn(email, password, rememberMe = false) {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.token = data.token;
        this.user = data.user;
        
        // Store token based on rememberMe
        if (rememberMe) {
          localStorage.setItem(this.storageKey, this.token);
          sessionStorage.removeItem(this.storageKey);
        } else {
          sessionStorage.setItem(this.storageKey, this.token);
          localStorage.removeItem(this.storageKey);
        }
        
        this.updateUI();
        return data;
      } else {
        throw new Error(data.error || 'Sign in failed');
      }
    } catch (error) {
      throw error;
    }
  }

  signOut() {
    this.user = null;
    this.token = null;
    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.storageKey);
    this.updateUI();
    window.location.href = '/';
  }

  clearAuth() {
    this.signOut();
  }

  isAuthenticated() {
    return this.user !== null && this.token !== null;
  }

  isAdmin() {
    return this.user && this.user.role === 'admin';
  }

  isUser() {
    return this.user && this.user.role === 'user';
  }

  getCurrentUser() {
    return this.user;
  }

  getAuthHeaders() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }

  updateUI() {
    const authButtons = document.querySelectorAll('.nav__auth');

    if (this.isAuthenticated()) {
      authButtons.forEach(authEl => {
        authEl.innerHTML = `
          <div class="nav__user-menu">
            <span class="nav__user-name">${this.user.name}</span>
            <div class="nav__user-dropdown">
              ${this.isAdmin() ? 
                '<a href="/admin-dashboard.html" class="nav__dropdown-item">Admin Dashboard</a>' : 
                '<a href="/user-dashboard.html" class="nav__dropdown-item">My Tickets</a>'
              }
              <a href="#" class="nav__dropdown-item" onclick="window.auth.signOut()">Sign Out</a>
            </div>
          </div>
        `;
      });
    } else {
      authButtons.forEach(authEl => {
        authEl.innerHTML = `
          <a href="/signin.html" class="nav__signin">Sign in</a>
          <a href="/signup.html" class="nav__signup">Sign up</a>
        `;
      });
    }
  }

  // Simple route protection - only call this on protected pages
  requireAuth() {
    if (!this.isAuthenticated()) {
      console.log('Authentication required, redirecting to signin');
      window.location.href = '/signin.html';
      return false;
    }
    return true;
  }

  requireAdmin() {
    console.log('RequireAdmin check - User:', this.user, 'Token:', !!this.token, 'IsAuth:', this.isAuthenticated());
    
    if (!this.requireAuth()) return false;
    
    if (!this.isAdmin()) {
      console.log('User is not admin:', this.user?.role);
      alert('Admin access required');
      window.location.href = '/user-dashboard.html';
      return false;
    }
    console.log('Admin access granted');
    return true;
  }

  requireUser() {
    if (!this.requireAuth()) return false;
    
    if (!this.isUser()) {
      alert('User access required');
      window.location.href = '/admin-dashboard.html';
      return false;
    }
    return true;
  }

  // Get the correct dashboard URL for this user
  getDashboardUrl() {
    if (!this.isAuthenticated()) return '/signin.html';
    return this.isAdmin() ? '/admin-dashboard.html' : '/user-dashboard.html';
  }
}

// Create global instance
window.auth = new SimpleAuth();

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
  await window.auth.init();
});