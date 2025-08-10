/**
 * BLANK ROOMS - MAIN JAVASCRIPT
 * Modern, performant interactions
 */

// ===================================
// UTILITY FUNCTIONS
// ===================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// ===================================
// NAVIGATION FUNCTIONALITY
// ===================================

class Navigation {
    constructor() {
        this.header = $('.header');
        this.navToggle = $('.nav__toggle');
        this.navMenu = $('.nav__menu');
        this.navLinks = $$('.nav__link');
        this.isMenuOpen = false;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.handleScroll();
    }
    
    bindEvents() {
        // Mobile menu toggle
        if (this.navToggle) {
            this.navToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Smooth scroll for navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // Header scroll effect
        window.addEventListener('scroll', throttle(() => this.handleScroll(), 16));
        
        // Close mobile menu on resize
        window.addEventListener('resize', debounce(() => this.handleResize(), 250));
        
        // Close mobile menu on outside click
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
    }
    
    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        
        if (this.isMenuOpen) {
            this.openMobileMenu();
        } else {
            this.closeMobileMenu();
        }
    }
    
    openMobileMenu() {
        this.navMenu.classList.add('nav__menu--open');
        this.navToggle.classList.add('nav__toggle--open');
        document.body.classList.add('no-scroll');
        
        // Animate menu items
        this.navLinks.forEach((link, index) => {
            link.style.animationDelay = `${index * 0.1}s`;
            link.classList.add('nav__link--animate');
        });
    }
    
    closeMobileMenu() {
        this.navMenu.classList.remove('nav__menu--open');
        this.navToggle.classList.remove('nav__toggle--open');
        document.body.classList.remove('no-scroll');
        
        this.navLinks.forEach(link => {
            link.classList.remove('nav__link--animate');
            link.style.animationDelay = '';
        });
    }
    
    handleNavClick(e) {
        const href = e.target.getAttribute('href');
        
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = $(href);
            
            if (target) {
                this.smoothScrollTo(target);
            }
            
            // Close mobile menu if open
            if (this.isMenuOpen) {
                this.closeMobileMenu();
            }
        }
    }
    
    handleScroll() {
        const scrollY = window.scrollY;
        
        // Header background opacity based on scroll
        if (scrollY > 100) {
            this.header.classList.add('header--scrolled');
        } else {
            this.header.classList.remove('header--scrolled');
        }
        
        // Update active navigation link
        this.updateActiveLink();
    }
    
    handleResize() {
        if (window.innerWidth > 768 && this.isMenuOpen) {
            this.closeMobileMenu();
        }
    }
    
    handleOutsideClick(e) {
        if (this.isMenuOpen && 
            !this.navMenu.contains(e.target) && 
            !this.navToggle.contains(e.target)) {
            this.closeMobileMenu();
        }
    }
    
    smoothScrollTo(target) {
        const headerHeight = this.header.offsetHeight;
        const targetPosition = target.offsetTop - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
    
    updateActiveLink() {
        // This would be implemented when we have sections to scroll to
        // For now, we'll keep it simple
    }
}

// ===================================
// HERO SECTION INTERACTIONS
// ===================================

class HeroSection {
    constructor() {
        this.hero = $('.hero');
        this.ctaButton = $('.hero__cta');
        this.floatingElements = $$('.floating-element');
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.initParallax();
        this.initFloatingElements();
    }
    
    bindEvents() {
        // CTA button interactions
        if (this.ctaButton) {
            this.ctaButton.addEventListener('click', () => this.handleCtaClick());
            this.ctaButton.addEventListener('mouseenter', () => this.handleCtaHover());
        }
        
        // Parallax scrolling
        window.addEventListener('scroll', throttle(() => this.handleParallax(), 16));
        
        // Mouse movement for floating elements
        this.hero.addEventListener('mousemove', throttle((e) => this.handleMouseMove(e), 32));
    }
    
    handleCtaClick() {
        // Add click animation
        this.ctaButton.style.transform = 'scale(0.98) translateY(-1px)';
        
        setTimeout(() => {
            this.ctaButton.style.transform = '';
        }, 150);
        
        // Here you would typically handle the actual navigation or modal opening
        console.log('CTA clicked - navigate to events page');
    }
    
    handleCtaHover() {
        // Create ripple effect
        this.createRippleEffect();
    }
    
    createRippleEffect() {
        const ripple = document.createElement('div');
        ripple.classList.add('ripple-effect');
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin-left: -10px;
            margin-top: -10px;
        `;
        
        this.ctaButton.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    initParallax() {
        const bgImage = $('.hero__bg-image');
        if (bgImage) {
            bgImage.style.willChange = 'transform';
        }
    }
    
    handleParallax() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        const bgImage = $('.hero__bg-image');
        if (bgImage) {
            bgImage.style.transform = `translateY(${rate}px)`;
        }
    }
    
    initFloatingElements() {
        this.floatingElements.forEach((element, index) => {
            element.style.willChange = 'transform';
            
            // Add random initial rotation
            const randomRotation = Math.random() * 360;
            element.style.transform = `rotate(${randomRotation}deg)`;
        });
    }
    
    handleMouseMove(e) {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        
        const xPercent = (clientX / innerWidth - 0.5) * 2;
        const yPercent = (clientY / innerHeight - 0.5) * 2;
        
        this.floatingElements.forEach((element, index) => {
            const intensity = (index + 1) * 5;
            const x = xPercent * intensity;
            const y = yPercent * intensity;
            
            element.style.transform = `translate(${x}px, ${y}px)`;
        });
    }
}

// ===================================
// PERFORMANCE MONITORING
// ===================================

class PerformanceMonitor {
    constructor() {
        this.init();
    }
    
    init() {
        // Monitor performance
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.reportPerformance();
                }, 0);
            });
        }
    }
    
    reportPerformance() {
        const perfData = performance.getEntriesByType('navigation')[0];
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        
        if (loadTime > 3000) {
            console.warn('Page load time is slow:', loadTime + 'ms');
        }
    }
}

// ===================================
// ACCESSIBILITY ENHANCEMENTS
// ===================================

class AccessibilityEnhancer {
    constructor() {
        this.init();
    }
    
    init() {
        this.handleKeyboardNavigation();
        this.handleFocusManagement();
        this.handleReducedMotion();
    }
    
    handleKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }
    
    handleFocusManagement() {
        const focusableElements = $$('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
        
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.classList.add('focused');
            });
            
            element.addEventListener('blur', () => {
                element.classList.remove('focused');
            });
        });
    }
    
    handleReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        if (prefersReducedMotion.matches) {
            document.body.classList.add('reduced-motion');
        }
        
        prefersReducedMotion.addEventListener('change', () => {
            if (prefersReducedMotion.matches) {
                document.body.classList.add('reduced-motion');
            } else {
                document.body.classList.remove('reduced-motion');
            }
        });
    }
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    const navigation = new Navigation();
    const heroSection = new HeroSection();
    const performanceMonitor = new PerformanceMonitor();
    const accessibilityEnhancer = new AccessibilityEnhancer();
    
    // Add ripple animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .keyboard-navigation *:focus {
            outline: 2px solid #007bff !important;
            outline-offset: 2px !important;
        }
        
        .reduced-motion * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    `;
    document.head.appendChild(style);
    
    console.log('🎵 Blank Rooms initialized successfully');
});

// ===================================
// ERROR HANDLING
// ===================================

window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Navigation, HeroSection, PerformanceMonitor, AccessibilityEnhancer };
}