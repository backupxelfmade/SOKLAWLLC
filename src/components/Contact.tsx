import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Monday.com CRM Integration Configuration
 * 
 * Setup Requirements:
 * 1. Create a Monday.com board with the following columns:
 *    - text: First Name (column ID: 'text')
 *    - text_mkv9gdmd: Last Name (column ID: 'text_mkv9gdmd')
 *    - email: Email Address (column ID: 'email')
 *    - text5: Phone Number (column ID: 'text5')
 *    - dropdown_mkv9sy3b: Legal Service (column ID: 'dropdown_mkv9sy3b')
 *    - long_text: Message (column ID: 'long_text')
 * 
 * 2. Generate API token from Monday.com Developer section
 * 3. Update boardId with your actual board ID
 */
const MONDAY_CONFIG = {
  apiUrl: 'https://api.monday.com/v2',
  apiToken: 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTg1NzA3MywiYWFpIjoxMSwidWlkIjo4MTM4NDE2NywiaWFkIjoiMjAyNS0wOC0yOVQwMTo0ODowOS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MzEwNDg2MTgsInJnbiI6InVzZTEifQ.u-h44kbC4RMWTLr4q3Ha1ofdXeVSUfz4SvKjJj1dW20',
  boardId: '9924465558',
  
  // Monday.com column mapping - update these IDs to match your board
  columnMapping: {
    firstName: 'text', // First name column
    lastName: 'text_mkv9gdmd', // Last name column
    email: 'email', // Email column
    phone: 'text5', // Phone column
    legalService: 'long_text_mkvabq2g', // Service dropdown column
    message: 'long_text_mkvam9kb' // Message column
  }
};

// Form validation rules
const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[0-9\s\-\(\)]{10,}$/,
  required: ['firstName', 'lastName', 'email', 'legalService', 'message']
};

const Contact = () => {
  const sectionRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    legalService: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [validationErrors, setValidationErrors] = useState({});
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll('.animate-on-scroll');
            elements.forEach((element, index) => {
              setTimeout(() => {
                element.classList.add('animate-fade-in-up');
              }, index * 100);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear submit status when user modifies form
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
    }
  };

  /**
   * Validate form data before submission
   */
  const validateForm = () => {
    const errors = {};
    
    // Check required fields
    VALIDATION_RULES.required.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        errors[field] = 'This field is required';
      }
    });
    
    // Validate email format
    if (formData.email && !VALIDATION_RULES.email.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Validate phone format (optional field)
    if (formData.phone && !VALIDATION_RULES.phone.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Submit form data to Monday.com CRM
   * Implements robust error handling and retry logic
   */
  const submitToMonday = async (formData) => {
    try {
      // Prepare column values for Monday.com API
      const columnValues = {};
      
      // Map form fields to Monday.com columns with proper data types
      if (formData.firstName) {
        columnValues[MONDAY_CONFIG.columnMapping.firstName] = formData.firstName;
      }
      if (formData.lastName) {
        columnValues[MONDAY_CONFIG.columnMapping.lastName] = formData.lastName;
      }
      if (formData.email) {
        // Email columns require specific format
        columnValues[MONDAY_CONFIG.columnMapping.email] = {
          email: formData.email,
          text: formData.email
        };
      }
      if (formData.phone) {
        // Phone stored as text column
        columnValues[MONDAY_CONFIG.columnMapping.phone] = formData.phone;
      }
      if (formData.legalService) {
        // Dropdown columns require labels array format
        columnValues[MONDAY_CONFIG.columnMapping.legalService] = {
          labels: [formData.legalService]
        };
      }
      if (formData.message) {
        columnValues[MONDAY_CONFIG.columnMapping.message] = formData.message;
      }

      // Create GraphQL mutation for Monday.com
      const mutation = `
        mutation {
          create_item (
            board_id: ${MONDAY_CONFIG.boardId},
            item_name: "${formData.firstName} ${formData.lastName} - ${formData.legalService || 'Legal Inquiry'}",
            column_values: "${JSON.stringify(columnValues).replace(/"/g, '\\"')}"
          ) {
            id
            name
          }
        }
      `;

      // Execute API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(MONDAY_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': MONDAY_CONFIG.apiToken,
          'API-Version': '2023-10'
        },
        signal: controller.signal,
        body: JSON.stringify({
          query: mutation
        })
      });
      
      clearTimeout(timeoutId);

      const result = await response.json();

      // Handle Monday.com API errors
      if (result.errors) {
        const errorMessage = result.errors[0]?.message || 'Unknown API error';
        throw new Error(`Monday.com API Error: ${errorMessage}`);
      }
      
      if (!result.data?.create_item) {
        throw new Error('Failed to create item in Monday.com');
      }

      return result.data.create_item;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      console.error('Monday.com submission error:', error);
      throw error;
    }
  };

  /**
   * Main form submission handler with comprehensive error handling
   */
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Validate form before submission
    if (!validateForm()) {
      setSubmitStatus('validation_error');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setValidationErrors({});

    try {
      // Primary strategy: Monday.com API submission
      try {
        const result = await submitToMonday(formData);
        console.log('Successfully submitted to Monday.com:', result.id);
        setSubmitStatus('success');
        resetForm();
        setRetryCount(0); // Reset retry count on success
        return;
        
      } catch (error) {
        console.warn('Monday.com submission failed:', error.message);
        
        // Fallback strategy: Email submission
        const emailBody = `
New Contact Form Submission from SOK Law Website:

Contact Information:
Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone || 'Not provided'}

Legal Service Requested: ${formData.legalService}

Client Message:
${formData.message}

Additional Information:
- Submission Date: ${new Date().toLocaleString()}
- Source: Website Contact Form
- CRM Integration: Failed (using email fallback)
- Error: ${error.message}

Please follow up with this client within 24 hours.
        `.trim();

        const subject = `URGENT: New Legal Consultation Request - ${formData.firstName} ${formData.lastName}`;
        const mailtoUrl = `mailto:Info@soklaw.co.ke?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
        
        // Open email client
        window.open(mailtoUrl, '_blank');
        
        setSubmitStatus('email_fallback');
        resetForm();
      }

    } catch (error) {
      console.error('Form submission error:', error);
      
      // Implement retry logic for network errors
      if (retryCount < 2 && (error instanceof Error && (error.message.includes('network') || error.message.includes('timeout')))) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          handleSubmit();
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      legalService: '',
      message: ''
    });
    setValidationErrors({});
    setRetryCount(0);
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    setSubmitStatus('idle');
    setRetryCount(0);
    handleSubmit();
  };

  const officeInfo = [
    {
      city: 'Nairobi Office',
      address: 'Upper Hill, ABC Place, 5th Floor\nWaiyaki Way, Nairobi',
      phone: '+254 700 123 456',
      email: 'Info@soklaw.co.ke'
    },
  ];

  return (
    <section ref={sectionRef} id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="animate-on-scroll opacity-0 text-4xl md:text-5xl font-bold mb-6">
            Get In Touch
          </h2>
          <p className="animate-on-scroll opacity-0 text-xl max-w-3xl mx-auto">
            Ready to discuss your legal needs? Contact us today for a consultation 
            with our experienced legal team.
          </p>
          <div className="animate-on-scroll opacity-0 w-24 h-1 bg-gradient-to-r from-yellow-600 to-yellow-500 mx-auto mt-6"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="animate-on-scroll opacity-0">
              <h3 className="text-2xl font-bold mb-6">
                Our Office Locations
              </h3>
              
              {officeInfo.map((office, index) => (
                <div key={index} className="mb-8 p-4 md:p-6 bg-gray-50 rounded-xl border hover:shadow-lg transition-shadow duration-300">
                  <h4 className="text-xl font-semibold mb-4">
                    {office.city}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 mt-1 flex-shrink-0 text-yellow-600" />
                      <p className="whitespace-pre-line text-sm md:text-base">
                        {office.address}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 flex-shrink-0 text-yellow-600" />
                      <a href={`tel:${office.phone}`} className="transition-colors hover:text-yellow-600 text-sm md:text-base">
                        {office.phone}
                      </a>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 flex-shrink-0 text-yellow-600" />
                      <a href={`mailto:${office.email}`} className="transition-colors hover:text-yellow-600 text-sm md:text-base">
                        {office.email}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="animate-on-scroll opacity-0 p-4 md:p-6 bg-yellow-50 rounded-xl border border-yellow-200">
              <h4 className="text-xl font-semibold mb-4 flex items-center text-yellow-800">
                <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                Business Hours
              </h4>
              <div className="space-y-2 text-yellow-700 text-sm md:text-base">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>9:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Emergency Only</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="animate-on-scroll opacity-0">
            <div className="bg-white p-4 md:p-8 rounded-2xl shadow-xl border">
              <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
                Request a Consultation
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Name and Last Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Your first name"
                      required
                      autoComplete="given-name"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        validationErrors.firstName 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {validationErrors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Your last name"
                      required
                      autoComplete="family-name"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        validationErrors.lastName 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {validationErrors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email and Phone Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      required
                      autoComplete="email"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        validationErrors.email 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+254 700 000 000"
                      autoComplete="tel"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        validationErrors.phone 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Legal Service Required */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Legal Service Required *
                  </label>
                  <select
                    name="legalService"
                    value={formData.legalService}
                    onChange={handleInputChange}
                    required
                    aria-label="Select legal service"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors appearance-none bg-white pr-12 ${
                      validationErrors.legalService 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select a service</option>
                    <option value="Civil and Criminal Litigation">Civil and Criminal Litigation</option>
                    <option value="Alternative Dispute Resolution">Alternative Dispute Resolution</option>
                    <option value="Commercial and Corporate Law">Commercial and Corporate Law</option>
                    <option value="Bank Securities and Real Estate">Bank Securities and Real Estate</option>
                    <option value="Employment Law">Employment Law</option>
                    <option value="Family Law">Family Law</option>
                    <option value="Energy Law">Energy Law</option>
                    <option value="Construction Law">Construction Law</option>
                    <option value="Health and Medical Law">Health and Medical Law</option>
                    <option value="Finance and Banking Law">Finance and Banking Law</option>
                    <option value="Insurance and Personal Injury">Insurance and Personal Injury</option>
                    <option value="Agricultural Law">Agricultural Law</option>
                    <option value="Legal Consultancy">Legal Consultancy</option>
                    <option value="Other">Other</option>
                  </select>
                  {validationErrors.legalService && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.legalService}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Please describe your legal matter and how we can help you..."
                    required
                    rows={5}
                    maxLength={1000}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors resize-vertical ${
                      validationErrors.message 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  ></textarea>
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {formData.message.length}/1000 characters
                  </div>
                  {validationErrors.message && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-label={isSubmitting ? 'Sending message...' : 'Send message'}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold py-4 px-6 rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {retryCount > 0 ? `Retrying... (${retryCount}/2)` : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>

              {/* Status Messages */}
              <div className="mt-4 space-y-3">
                {/* Validation Error */}
                {submitStatus === 'validation_error' && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 text-orange-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Please check your form</p>
                      <p className="text-sm">All required fields must be completed with valid information.</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {submitStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Message sent successfully!</p>
                      <p className="text-sm">Your inquiry has been submitted to our CRM system. We'll contact you within 24 hours.</p>
                    </div>
                  </div>
                )}

                {/* Email Fallback Success */}
                {submitStatus === 'email_fallback' && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Message prepared for email!</p>
                      <p className="text-sm">Your email client should open with your message. Please send it to complete your inquiry.</p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Unable to submit your message</p>
                      <p className="text-sm">Please try again or contact us directly at Info@soklaw.co.ke</p>
                      <button
                        onClick={handleRetry}
                        className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .animate-on-scroll {
          transition: all 0.6s ease-out;
          transform: translateY(20px);
        }
        
        .animate-fade-in-up {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        
        /* Custom select arrow */
        select {
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23666'%3E%3Cpath d='M8 10.5L4 6.5h8z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }
      `}</style>
    </section>
  );
};

export default Contact;