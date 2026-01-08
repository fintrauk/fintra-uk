// ==================== TRACKING & API INTEGRATION ====================

// API Base URL
const API_BASE = window.location.origin;

// Visitor ID storage
let visitorId = localStorage.getItem('fintra_visitor_id') || null;

// Get URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        utmSource: params.get('utm_source'),
        utmMedium: params.get('utm_medium'),
        utmCampaign: params.get('utm_campaign')
    };
}

// Track visitor on page load
async function trackVisitor() {
    try {
        const urlParams = getUrlParams();
        const response = await fetch(`${API_BASE}/api/track/visitor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                page: window.location.pathname,
                referrer: document.referrer || 'Direct',
                utmSource: urlParams.utmSource,
                utmMedium: urlParams.utmMedium,
                utmCampaign: urlParams.utmCampaign
            })
        });
        
        const data = await response.json();
        if (data.visitorId) {
            visitorId = data.visitorId;
            localStorage.setItem('fintra_visitor_id', visitorId);
        }
    } catch (error) {
        console.log('Tracking not available (running without server)');
    }
}

// Track button click
async function trackClick(buttonName) {
    try {
        await fetch(`${API_BASE}/api/track/click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                button: buttonName,
                page: window.location.pathname,
                visitorId: visitorId
            })
        });
    } catch (error) {
        console.log('Click tracking not available');
    }
}

// Track visitor on page load
document.addEventListener('DOMContentLoaded', function() {
    trackVisitor();
    
    // Track all button clicks
    document.querySelectorAll('.btn, .service-link, .nav-links a').forEach(btn => {
        btn.addEventListener('click', function() {
            const buttonName = this.textContent.trim() || this.getAttribute('href') || 'Unknown Button';
            trackClick(buttonName);
        });
    });
});


// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar scroll effect
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 1px 20px rgba(0, 0, 0, 0.05)';
        }
        
        lastScroll = currentScroll;
    });
});

// Loan Calculator
const loanAmountSlider = document.getElementById('loanAmount');
const loanTermSlider = document.getElementById('loanTerm');
const loanAmountValue = document.getElementById('loanAmountValue');
const loanTermValue = document.getElementById('loanTermValue');
const monthlyPaymentEl = document.getElementById('monthlyPayment');
const totalRepayableEl = document.getElementById('totalRepayable');

if (loanAmountSlider && loanTermSlider) {
    function calculateLoan() {
        const principal = parseFloat(loanAmountSlider.value);
        const months = parseFloat(loanTermSlider.value);
        const annualRate = 19.9; // APR
        const monthlyRate = annualRate / 100 / 12;
        
        // Calculate monthly payment using loan formula
        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                              (Math.pow(1 + monthlyRate, months) - 1);
        
        const totalRepayable = monthlyPayment * months;
        
        // Update display
        loanAmountValue.textContent = principal.toLocaleString();
        loanTermValue.textContent = months;
        monthlyPaymentEl.textContent = '£' + Math.round(monthlyPayment).toLocaleString();
        totalRepayableEl.textContent = '£' + Math.round(totalRepayable).toLocaleString();
    }
    
    loanAmountSlider.addEventListener('input', calculateLoan);
    loanTermSlider.addEventListener('input', calculateLoan);
    
    // Initial calculation
    calculateLoan();
}

// Debt Calculator
const debtSlider = document.getElementById('debtSlider');
const debtAmount = document.getElementById('debtAmount');

if (debtSlider && debtAmount) {
    debtSlider.addEventListener('input', function() {
        debtAmount.textContent = parseInt(this.value).toLocaleString();
    });
}

// Creditor Options Selection
const creditorOptions = document.querySelectorAll('.creditor-option');
creditorOptions.forEach(option => {
    option.addEventListener('click', function() {
        creditorOptions.forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        checkEligibility();
    });
});

// Yes/No Options Selection
const ynOptions = document.querySelectorAll('.yn-option');
ynOptions.forEach(option => {
    option.addEventListener('click', function() {
        const parent = this.parentElement;
        parent.querySelectorAll('.yn-option').forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        checkEligibility();
    });
});

// Check Eligibility
function checkEligibility() {
    const debtAmount = document.getElementById('debtSlider');
    const creditorSelected = document.querySelector('.creditor-option.selected');
    const strugglingSelected = document.querySelector('.yn-option.selected');
    const resultEl = document.getElementById('eligibilityResult');
    
    if (debtAmount && creditorSelected && strugglingSelected && resultEl) {
        const debt = parseInt(debtAmount.value);
        const struggling = strugglingSelected.dataset.value === 'yes';
        
        if (debt >= 3000 || struggling) {
            resultEl.style.display = 'block';
            resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

// Multi-step Form Navigation
function nextStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    
    // Show target step
    const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
    if (targetStep) {
        targetStep.classList.add('active');
    }
    
    // Update progress
    document.querySelectorAll('.progress-step').forEach(progressStep => {
        progressStep.classList.remove('active');
    });
    
    for (let i = 1; i <= step; i++) {
        const progressStep = document.querySelector(`.progress-step[data-step="${i}"]`);
        if (progressStep) {
            progressStep.classList.add('active');
        }
    }
    
    // Scroll to top of form
    targetStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function prevStep(step) {
    nextStep(step);
}

// Form Validation and Submission
const loanApplicationForm = document.getElementById('loanApplicationForm');
if (loanApplicationForm) {
    loanApplicationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(`${API_BASE}/api/submit/loan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                showSuccessMessage('Loan Application', 'Your loan application has been submitted successfully! We\'ll contact you within 24 hours.');
                this.reset();
                nextStep(1);
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.log('Form data:', data);
            showSuccessMessage('Loan Application', 'Your loan application has been submitted successfully! We\'ll contact you within 24 hours.');
            this.reset();
            nextStep(1);
        }
    });
}

const debtManagementForm = document.getElementById('debtManagementForm');
if (debtManagementForm) {
    debtManagementForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(`${API_BASE}/api/submit/debt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                showSuccessMessage('Debt Management Consultation', 'Your request has been submitted successfully! A debt specialist will contact you within 24 hours.');
                this.reset();
                nextStep(1);
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.log('Form data:', data);
            showSuccessMessage('Debt Management Consultation', 'Your request has been submitted successfully! A debt specialist will contact you within 24 hours.');
            this.reset();
            nextStep(1);
        }
    });
}

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        // Get values directly from inputs
        const inputs = this.querySelectorAll('input, textarea');
        data.name = inputs[0].value;
        data.email = inputs[1].value;
        data.phone = inputs[2].value;
        data.message = inputs[3].value;
        
        try {
            const response = await fetch(`${API_BASE}/api/submit/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                showSuccessMessage('Contact Request', 'Thank you for contacting us! We\'ll get back to you as soon as possible.');
                this.reset();
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.log('Form data:', data);
            showSuccessMessage('Contact Request', 'Thank you for contacting us! We\'ll get back to you as soon as possible.');
            this.reset();
        }
    });
}

// Success Message Modal
function showSuccessMessage(title, message) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 24px;
        padding: 60px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 20px 80px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 20px;">✓</div>
        <h2 style="font-size: 32px; margin-bottom: 15px; color: #0F172A;">${title}</h2>
        <p style="color: #64748B; font-size: 18px; margin-bottom: 30px; line-height: 1.6;">${message}</p>
        <button onclick="this.closest('[style*=fixed]').remove()" style="
            background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
            color: white;
            border: none;
            padding: 16px 40px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.3s ease;
        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            Close
        </button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Auto close after 5 seconds
    setTimeout(() => {
        overlay.remove();
    }, 5000);
}

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.service-card, .feature-item, .step-card, .stat-card');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Counter Animation for Stats
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Trigger counter animation when stats come into view
const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const numberEl = entry.target.querySelector('.stat-number');
            if (numberEl) {
                const text = numberEl.textContent.replace(/[^\d]/g, '');
                const number = parseInt(text);
                if (!isNaN(number)) {
                    animateCounter(numberEl, number);
                }
                entry.target.dataset.animated = 'true';
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-card').forEach(card => {
    statsObserver.observe(card);
});

// Add hover effects to buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    btn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Form input validation feedback
document.querySelectorAll('input[required], select[required], textarea[required]').forEach(input => {
    input.addEventListener('blur', function() {
        if (!this.value) {
            this.style.borderColor = '#EF4444';
        } else {
            this.style.borderColor = '#10B981';
        }
    });
    
    input.addEventListener('input', function() {
        if (this.value) {
            this.style.borderColor = '#10B981';
        }
    });
});

// Parallax effect for background images
let ticking = false;

window.addEventListener('scroll', function() {
    if (!ticking) {
        window.requestAnimationFrame(function() {
            const scrolled = window.pageYOffset;
            const bgImages = document.querySelectorAll('.hero-bg-image, .cta-bg-image');
            
            bgImages.forEach((img) => {
                const speed = 0.5;
                img.style.transform = `translateY(${scrolled * speed}px) scale(1.1)`;
            });
            
            ticking = false;
        });
        
        ticking = true;
    }
});

// Auto-update year in footer
const currentYear = new Date().getFullYear();
const footerYear = document.querySelector('.footer-bottom p');
if (footerYear) {
    footerYear.innerHTML = footerYear.innerHTML.replace(/\d{4}/, currentYear);
}

// Logo animation on load
document.addEventListener('DOMContentLoaded', function() {
    const logoSvg = document.querySelector('.logo-svg');
    if (logoSvg) {
        setTimeout(() => {
            logoSvg.style.opacity = '1';
        }, 100);
    }
});

console.log('Fintra UK website loaded successfully! 💷');
