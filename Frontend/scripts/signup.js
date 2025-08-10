class SignUpManager {
    constructor() {
        this.form = null;
        this.submitButton = null;
        this.isSubmitting = false;
        
        this.init();
    }

    init() {
        this.form = document.getElementById('signupForm');
        this.submitButton = document.getElementById('signupBtn');
        
        this.setupEventListeners();
        this.setupFormValidation();
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

        // Terms checkbox
        const termsCheckbox = document.getElementById('agreeTerms');
        termsCheckbox.addEventListener('change', () => {
            this.updateSubmitButton();
        });

        // Password strength indicator
        const passwordInput = document.getElementById('password');
        passwordInput.addEventListener('input', () => {
            this.checkPasswordStrength(passwordInput.value);
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

        // Name validation
        const nameInput = document.getElementById('fullName');
        nameInput.addEventListener('input', () => {
            const name = nameInput.value.trim();
            if (name && name.length < 2) {
                this.showFieldError(nameInput, 'Name must be at least 2 characters');
            }
        });
    }

    validateField(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (input.type) {
            case 'text':
                if (input.id === 'fullName') {
                    if (!value) {
                        errorMessage = 'Name is required';
                        isValid = false;
                    } else if (value.length < 2) {
                        errorMessage = 'Name must be at least 2 characters';
                        isValid = false;
                    }
                }
                break;
                
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

    checkPasswordStrength(password) {
        // This could be expanded to show password strength indicator
        // For now, just basic length check
        return password.length >= 6;
    }

    updateSubmitButton() {
        const formData = new FormData(this.form);
        const isFormValid = this.isFormValid(formData);
        
        this.submitButton.disabled = !isFormValid || this.isSubmitting;
    }

    isFormValid(formData) {
        const name = formData.get('fullName')?.trim();
        const email = formData.get('email')?.trim();
        const password = formData.get('password');
        const agreeTerms = formData.get('agreeTerms');

        return (
            name && name.length >= 2 &&
            email && this.isValidEmail(email) &&
            password && password.length >= 6 &&
            agreeTerms
        );
    }

    async handleSubmit() {
        if (this.isSubmitting) return;

        const formData = new FormData(this.form);
        
        // Validate all fields
        const inputs = this.form.querySelectorAll('.form-input');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // Check terms agreement
        const termsCheckbox = document.getElementById('agreeTerms');
        if (!termsCheckbox.checked) {
            alert('Please agree to the terms and conditions');
            return;
        }

        if (!isValid) {
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            // Simulate API call
            await this.simulateSignUp(formData);
            
            // Success - redirect or show success message
            this.handleSignUpSuccess(formData);
            
        } catch (error) {
            console.error('Sign up error:', error);
            this.handleSignUpError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    async simulateSignUp(formData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate potential errors (for demo purposes)
        const email = formData.get('email');
        if (email === 'test@error.com') {
            throw new Error('Email already exists');
        }
        
        // Log the registration data
        console.log('User registration data:', {
            name: formData.get('fullName'),
            email: formData.get('email'),
            timestamp: new Date().toISOString()
        });
        
        return { success: true, userId: Date.now() };
    }

    handleSignUpSuccess(formData) {
        const name = formData.get('fullName');
        const email = formData.get('email');
        
        // Show success message
        alert(`Welcome ${name}!\n\nYour account has been created successfully.\nA confirmation email has been sent to ${email}.`);
        
        // Clear form
        this.form.reset();
        
        // Redirect to events page after a short delay
        setTimeout(() => {
            window.location.href = 'events.html';
        }, 1500);
    }

    handleSignUpError(error) {
        let message = 'An error occurred during sign up. Please try again.';
        
        if (error.message === 'Email already exists') {
            message = 'This email is already registered. Please use a different email or sign in.';
        }
        
        alert(message);
    }

    setLoadingState(loading) {
        this.isSubmitting = loading;
        
        if (loading) {
            this.submitButton.classList.add('loading');
            this.submitButton.disabled = true;
        } else {
            this.submitButton.classList.remove('loading');
            this.updateSubmitButton();
        }
    }
}

// Initialize sign up manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.signUpManager = new SignUpManager();
});

// Additional utility functions
document.addEventListener('DOMContentLoaded', () => {
    // Auto-focus first input
    const firstInput = document.getElementById('fullName');
    if (firstInput) {
        firstInput.focus();
    }

    // Form input animations
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentNode.classList.remove('focused');
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Submit form with Ctrl/Cmd + Enter
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const form = document.getElementById('signupForm');
            if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true }));
            }
        }
    });
});