import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Shield, 
  Users,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const AgencyRegistration: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Agency Info
    name: '',
    domain: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    
    // Admin User Info
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    
    // Selected modules
    selectedModules: ['leads'] as ('leads' | 'invoices')[],
    
    // Terms acceptance
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { registerAgency } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleModuleChange = (module: 'leads' | 'invoices', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedModules: checked
        ? [...prev.selectedModules, module]
        : prev.selectedModules.filter(m => m !== module)
    }));
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.contactEmail || !formData.contactPhone) {
      setError('Please fill in all required agency information.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.adminName || !formData.adminEmail || !formData.password) {
      setError('Please fill in all admin user information.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep3 = () => {
    if (formData.selectedModules.length === 0) {
      setError('Please select at least one module.');
      return false;
    }
    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (step) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }
    
    if (isValid && step < 3) {
      setStep(step + 1);
    } else if (isValid && step === 3) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const agencyData = {
        name: formData.name,
        domain: formData.domain,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        address: formData.address,
        selectedModules: formData.selectedModules
      };

      const adminData = {
        name: formData.adminName,
        email: formData.adminEmail,
        password: formData.password
      };

      await registerAgency(agencyData, adminData);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to register agency. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-gray-900 to-primary flex">
      {/* Left side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-gray-900/90"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 leading-tight text-white">
              Start Your
              <span className="text-secondary block">Digital Agency</span>
            </h1>
            <p className="text-xl text-gray-200 leading-relaxed">
              Join thousands of agencies managing their clients, leads, and invoices with our comprehensive platform.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-secondary/20 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">30-Day Free Trial</h3>
                <p className="text-gray-200">No credit card required to get started</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-secondary/20 p-3 rounded-lg">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Multi-User Support</h3>
                <p className="text-gray-200">Collaborate with your team seamlessly</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-secondary/20 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Enterprise Security</h3>
                <p className="text-gray-200">Bank-level security for your data</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-primary p-4 rounded-2xl shadow-lg">
                <Building2 className="h-12 w-12 text-secondary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Register Your Agency
            </h2>
            <p className="mt-2 text-gray-600">
              Step {step} of 3 - {step === 1 ? 'Agency Information' : step === 2 ? 'Admin Account' : 'Choose Modules'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            {/* Step 1: Agency Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Agency Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agency Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="Your Agency Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain (Optional)
                  </label>
                  <input
                    type="text"
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="youragency.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    required
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="contact@youragency.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    required
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="Your agency address"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Admin Account */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Account</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Name *
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    required
                    value={formData.adminName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="Admin Full Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email *
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    required
                    value={formData.adminEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="admin@youragency.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Choose Modules */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Your Modules</h3>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="leads"
                        checked={formData.selectedModules.includes('leads')}
                        onChange={(e) => handleModuleChange('leads', e.target.checked)}
                        className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                      />
                      <label htmlFor="leads" className="ml-3 block text-sm font-medium text-gray-900">
                        Lead Management
                      </label>
                    </div>
                    <p className="ml-7 text-sm text-gray-500">
                      Track and manage leads, follow-ups, and conversions
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="invoices"
                        checked={formData.selectedModules.includes('invoices')}
                        onChange={(e) => handleModuleChange('invoices', e.target.checked)}
                        className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                      />
                      <label htmlFor="invoices" className="ml-3 block text-sm font-medium text-gray-900">
                        Invoice Management
                      </label>
                    </div>
                    <p className="ml-7 text-sm text-gray-500">
                      Create, send, and track professional invoices
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                  />
                  <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                    I accept the{' '}
                    <a href="#" className="text-accent hover:text-primary">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-accent hover:text-primary">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
                >
                  Back
                </button>
              )}
              
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="ml-auto flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : step === 3 ? (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Agency
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-accent hover:text-primary transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyRegistration;