# UK Financial Solutions Website

A modern, dynamic website for a UK-based financial solutions provider offering loans and debt management services to individuals with bad credit scores.

## 🌟 Features

### Home Page (index.html)
- Eye-catching hero section with animated gradient orbs
- Service overview cards for Loans and Debt Management
- Trust indicators and statistics
- Why choose us section
- Contact form
- Fully responsive design

### Loans Page (loans.html)
- Interactive loan calculator with real-time calculations
- Multi-step application form (3 steps)
  - Step 1: Personal Details
  - Step 2: Employment Information
  - Step 3: Financial Information
- Visual loan features and benefits
- Dynamic sliders for loan amount and term

### Debt Management Page (debt-management.html)
- 4-step process explanation
- Benefits visualization
- Debt eligibility checker with interactive elements
- Multi-step consultation request form (3 steps)
  - Step 1: Personal Information
  - Step 2: Debt Details
  - Step 3: Income & Expenses

## 🎨 Design Features

- **Hyper-modern UI** with gradient backgrounds and floating orbs
- **Smooth animations** on scroll and hover
- **Interactive elements** with visual feedback
- **Glassmorphism effects** for cards and panels
- **Responsive design** for mobile, tablet, and desktop
- **Accessible** and user-friendly interface

## 🚀 Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid, Flexbox, and animations
- **Vanilla JavaScript** - Interactive functionality without dependencies
- **Google Fonts** - Inter font family for clean typography

## 📱 Responsive Breakpoints

- Desktop: 1024px and above
- Tablet: 768px - 1023px
- Mobile: 480px - 767px
- Small Mobile: Below 480px

## 🎯 Key Functionalities

### Loan Calculator
- Calculates monthly payments based on loan amount and term
- Uses 19.9% APR (representative rate)
- Real-time updates as sliders are adjusted
- Shows total repayable amount

### Multi-Step Forms
- Progress indicators
- Form validation with visual feedback
- Smooth transitions between steps
- Success modal on submission
- Form data logging to console (for development)

### Debt Eligibility Checker
- Interactive debt amount slider
- Creditor count selection
- Payment struggle assessment
- Dynamic eligibility result display

### Interactive Elements
- Animated counters for statistics
- Parallax scrolling effects
- Smooth scroll navigation
- Hover animations on cards and buttons
- Intersection Observer for scroll animations

## 🔧 Setup & Usage

### Local Development

1. Open `index.html` in a web browser
2. Or use a local server:
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (if you have http-server installed)
   npx http-server
   ```
3. Visit `http://localhost:8000` in your browser

### File Structure
```
loan-campaign/
├── index.html              # Home page
├── loans.html              # Loans application page
├── debt-management.html    # Debt management page
├── styles.css              # All styles
├── script.js               # All JavaScript functionality
└── README.md              # This file
```

## 🎨 Color Scheme

- **Primary**: #6366F1 (Indigo)
- **Secondary**: #10B981 (Green)
- **Accent**: #8B5CF6 (Purple)
- **Dark**: #0F172A
- **Gray**: #64748B
- **Light**: #F1F5F9

## 📋 Forms Overview

### Loan Application Form
Collects:
- Personal details (name, DOB, contact)
- Address information
- Employment status and details
- Monthly income and expenses
- Loan amount and purpose
- Bank information
- Consent checkboxes

### Debt Management Form
Collects:
- Personal information
- Total debt amount
- Number of creditors
- Types of debt
- Cause of debt
- Payment status
- Income and expenses breakdown
- Household dependents

## ⚠️ Important Notes

- This is a **front-end demo** - forms log to console
- For production, connect forms to backend API
- Add proper form validation and sanitization
- Implement GDPR-compliant data handling
- Ensure FCA compliance for financial services
- Add SSL certificate for security
- Implement proper error handling

## 🔒 Compliance Considerations

When deploying to production:
- Ensure FCA authorization and compliance
- Add proper privacy policy and T&Cs
- Implement GDPR-compliant data handling
- Add cookie consent banner
- Ensure responsible lending messages
- Include proper APR warnings and examples
- Add affordability checks

## 🚀 Future Enhancements

- Backend API integration
- Database for applications
- Email notifications
- User dashboard/portal
- Document upload functionality
- Credit check integration
- Payment gateway integration
- Live chat support
- Blog section
- FAQ section

## 📞 Support

For questions or issues, contact:
- Email: help@ukfinancial.co.uk
- Phone: 0800 123 4567

---

**Note**: This website is designed for demonstration purposes. Always ensure compliance with UK financial regulations and FCA guidelines when operating financial services.

© 2026 UK Financial Solutions. All rights reserved.
