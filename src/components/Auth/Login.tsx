import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Building2, Users, TrendingUp, Shield, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard when user is authenticated and profile is loaded
  useEffect(() => {
    if (currentUser && userProfile && !authLoading) {
      console.log('User authenticated and profile loaded, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, userProfile, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      console.log('Starting login process for:', email);
      await login(email, password);
      // Navigation will be handled by useEffect after profile loads
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to log in. Please check your credentials.';
      
      if (error?.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled. Please contact support.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed login attempts. Please try again later.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid credentials. Please check your email and password.';
            break;
          default:
            errorMessage = `Login failed: ${error.code}`;
        }
      } else if (error?.message?.includes('No document to update')) {
        errorMessage = 'Account setup incomplete. Please contact your administrator.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while authenticating or loading profile
  if ((authLoading && currentUser) || (currentUser && !userProfile && !error)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-gray-900 to-primary flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Dashboard...</h2>
            <p className="text-gray-600">Please wait while we set up your workspace</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-gray-900 to-primary flex">
      {/* Left side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-gray-900/90"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 leading-tight text-white">
              Manage Your
              <span className="text-secondary block">Digital Agency</span>
            </h1>
            <p className="text-xl text-gray-200 leading-relaxed">
              Complete multi-tenant solution for digital marketing agencies to manage clients, leads, and invoices efficiently.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-secondary/20 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Multi-Tenant Architecture</h3>
                <p className="text-gray-200">Separate data for each client with role-based access</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-secondary/20 p-3 rounded-lg">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Lead Management</h3>
                <p className="text-gray-200">Track and manage leads for all your clients</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-secondary/20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Invoice Generation</h3>
                <p className="text-gray-200">Professional invoicing with automated workflows</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-secondary/20 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Secure & Scalable</h3>
                <p className="text-gray-200">Enterprise-grade security with unlimited scalability</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-primary p-4 rounded-2xl shadow-lg">
                <Building2 className="h-12 w-12 text-secondary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-gray-600">
              Sign in to your agency dashboard
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="Enter your password"
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

              <button
                type="submit"
                disabled={loading || authLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading || authLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an agency account?{' '}
                  <Link
                    to="/register-agency"
                    className="font-medium text-accent hover:text-primary transition-colors"
                  >
                    Register your agency
                  </Link>
                </p>
              </div>

              {/* Demo Accounts */}
              <div className="border-t pt-6">
                <p className="text-sm text-gray-600 mb-4 text-center">Demo Accounts:</p>
                <div className="space-y-2 text-xs">
                  <div className="bg-blue-50 p-2 rounded">
                    <strong>Super Admin:</strong> admin@vritix.com / password123
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <strong>Agency Admin:</strong> admin@agency.com / password123
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <strong>Client:</strong> client@company.com / password123
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;