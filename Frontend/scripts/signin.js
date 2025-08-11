class SignInManager {
    constructor() {
        this.form = null;
        this.submitButton = null;
        this.isSubmitting = false;
        
        this.init();
    }

    init() {
        this.form = document.getElementById('signinForm');
        this.submitButton = document.getElementById('signinBtn');
        
        this.setupEventListeners();
        this.setupFormValidation();
        this.checkRedirectParams();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Real-time validation
        const inputs = this.form.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Demo account buttons
        const demoUserBtn = document.getElementById('demoUser');
        const demoAdminBtn = document.getElementById('demoAdmin');

        demoUserBtn.addEventListener('click', () => this.loginWithDemo('user'));
        demoAdminBtn.addEventListener('click', () => this.loginWithDemo('admin'));

        // Forgot password (placeholder)
        const forgotPasswordLink = document.querySelector('.forgot-password');
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Password reset functionality would be implemented here.\n\nFor demo purposes:\n- User: user@demo.com / password123\n- Admin: admin@demo.com / admin123');
        });
    }

    setupFormValidation() {
        // Email validation
        const emailInput = document.getElementById('email');
        emailInput.addEventListener('input', () => {
            const email = emailInput.value;
            if (email && !this.isValidEmail(email)) {
                this.showFieldError(emailInput, 'Please enter a valid email address');
            }
        });

        // Password validation
        const passwordInput = document.getElementById('password');
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            if (password && password.length < 6) {
                this.showFieldError(passwordInput, 'Password must be at least 6 characters');
            }
        });
    }

    checkRedirectParams() {
        // Check for redirect parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        
        if (redirectUrl) {
            // Store redirect URL for after successful login
            sessionStorage.setItem('signin_redirect', redirectUrl);
            
            // Show message about authentication requirement
            this.showInfoMessage('Please sign in to access that page.');
        }
    }

    showInfoMessage(message) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'auth-info-message';
        infoDiv.textContent = message;
        infoDiv.style.cssText = `
            background: #e3f2fd;
            border: 1px solid #2196f3;
            color: #1976d2;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
        `;
        
        this.form.parentNode.insertBefore(infoDiv, this.form);
        
        // Remove message after 10 seconds
        setTimeout(() => {
            if (infoDiv.parentNode) {
                infoDiv.remove();
            }
        }, 10000);
    }

    validateField(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (input.type) {
            case 'email':
                if (!value) {
                    errorMessage = 'Email is required';
                    isValid = false;
                } else if (!this.isValidEmail(value)) {
                    errorMessage = 'Please enter a valid email address';
                    isValid = false;
                }
                break;
                
            case 'password':
                if (!value) {
                    errorMessage = 'Password is required';
                    isValid = false;
                } else if (value.length < 6) {
                    errorMessage = 'Password must be at least 6 characters';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(input, errorMessage);
        } else {
            this.clearFieldError(input);
        }

        return isValid;
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #dc3545;
            font-size: 0.875rem;
            margin-top: 0.5rem;
            display: block;
        `;
        
        input.parentNode.appendChild(errorElement);
        input.classList.add('error');
        
        // Add error styles
        input.style.borderColor = '#dc3545';
        input.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
    }

    clearFieldError(input) {
        const errorElement = input.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
        
        input.classList.remove('error');
        input.style.borderColor = '';
        input.style.boxShadow = '';
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async handleSubmit() {
        if (this.isSubmitting) return;

        const formData = new FormData(this.form);
        
        // Validate all fields
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        let isValid = true;
        if (!this.validateField(emailInput)) isValid = false;
        if (!this.validateField(passwordInput)) isValid = false;

        if (!isValid) return;

        // Show loading state
        this.setLoadingState(true);

        try {
            const email = formData.get('email');
            const password = formData.get('password');
            const rememberMe = formData.get('rememberMe') === 'on';

            // Use simple auth
            const result = await window.auth.signIn(email, password, rememberMe);
            
            // Direct redirect to appropriate dashboard
            console.log('Signin successful, redirecting to dashboard');
            window.location.href = window.auth.getDashboardUrl();
            
        } catch (error) {
            console.error('Sign in error:', error);
            this.handleSignInError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    async loginWithDemo(userType) {
        if (this.isSubmitting) return;

        this.setLoadingState(true);

        try {
            const result = await window.authManager.loginWithDemo(userType);
            
            if (result.success) {
                this.handleSignInSuccess(result);
            }
            
        } catch (error) {
            console.error('Demo login error:', error);
            this.handleSignInError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    // Removed - using direct redirect in handleSubmit now

    handleSignInError(error) {
        let message = 'An error occurred during sign in. Please try again.';
        
        if (error.message === 'Invalid email or password') {
            message = 'Invalid email or password. Please check your credentials and try again.';
        }
        
        this.showErrorMessage(message);
        
        // Clear password field for security
        document.getElementById('password').value = '';
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.auth-message');
        existingMessages.forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message auth-message--${type}`;
        messageDiv.textContent = message;
        
        const styles = type === 'success' ? {
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            color: '#155724'
        } : {
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            color: '#721c24'
        };
        
        messageDiv.style.cssText = `
            background: ${styles.background};
            border: ${styles.border};
            color: ${styles.color};
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
            font-weight: 500;
        `;
        
        this.form.parentNode.insertBefore(messageDiv, this.form);
        
        // Remove message after delay
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, type === 'success' ? 3000 : 5000);
    }

    setLoadingState(loading) {
        this.isSubmitting = loading;
        
        if (loading) {
            this.submitButton.classList.add('loading');
            this.submitButton.disabled = true;
            
            // Disable demo buttons
            document.getElementById('demoUser').disabled = true;
            document.getElementById('demoAdmin').disabled = true;
        } else {
            this.submitButton.classList.remove('loading');
            this.submitButton.disabled = false;
            
            // Enable demo buttons
            document.getElementById('demoUser').disabled = false;
            document.getElementById('demoAdmin').disabled = false;
        }
    }
}

// Initialize sign in manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.signInManager = new SignInManager();
});

// Additional utility functions
document.addEventListener('DOMContentLoaded', () => {
    // Auto-focus email input
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.focus();
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Submit form with Ctrl/Cmd + Enter
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const form = document.getElementById('signinForm');
            if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true }));
            }
        }
    });
});