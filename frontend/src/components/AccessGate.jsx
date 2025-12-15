import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { UserPlus, Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccessGate = () => {
  const [userType, setUserType] = useState(null); // 'new' or 'returning'
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleNewUser = () => {
    // Scroll to PayPal donation button area with offset for sticky header
    const paypalContainer = document.getElementById('paypal-donation-area');
    if (paypalContainer) {
      const headerHeight = 80; // Account for sticky header
      const elementPosition = paypalContainer.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    } else {
      // Fallback to support section
      const donationSection = document.getElementById('support');
      if (donationSection) {
        donationSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleReturningUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post(`${API}/auth/request-access`, {
        email: email.toLowerCase()
      });

      if (response.data.success) {
        setMessage('✅ Access link sent! Check your email inbox (and spam folder) for your "Access All Areas" link.');
        setEmail('');
      } else {
        // Email not found in database
        setError(
          <div>
            <p className="font-semibold mb-2">Email not found in our database.</p>
            <p className="text-sm mb-2">Please:</p>
            <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
              <li>Check you entered the email address you used when joining</li>
              <li>Or visit the donation section below to gain access</li>
            </ol>
          </div>
        );
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Access request error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!userType) {
    return (
      <Card className="max-w-2xl bg-white border-2 border-teal-300 shadow-xl mx-4 sm:mx-auto">
        <CardHeader className="text-center bg-gradient-to-br from-teal-50 to-white px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl text-teal-800 mb-2">
            Access the Income Online Community
          </CardTitle>
          <CardDescription className="text-base sm:text-lg text-slate-700">
            Choose your access type below
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* New User Card */}
            <div 
              className="border-2 border-teal-200 rounded-xl p-4 sm:p-6 hover:border-teal-400 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-white to-teal-50"
              onClick={handleNewUser}
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-600 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-teal-800 mb-2 sm:mb-4">New User</h3>
                <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-4 flex-grow">
                  Join the Income Online community and get access to 110+ verified earning platforms
                </p>
                <Button className="w-full bg-teal-600 hover:bg-teal-700 py-3 sm:py-4 text-sm sm:text-base font-bold mt-auto whitespace-nowrap">
                  Get Started
                  <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
              </div>
            </div>

            {/* Returning User Card */}
            <div 
              className="border-2 border-amber-200 rounded-xl p-4 sm:p-6 hover:border-amber-400 hover:shadow-lg transition-all bg-gradient-to-br from-white to-amber-50"
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 sm:mb-4" style={{ backgroundColor: '#d97706' }}>
                  <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-amber-800 mb-2 sm:mb-4">Returning User</h3>
                <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-4 flex-grow">
                  Already a member? Enter your email to receive your access link
                </p>
                <form 
                  className="w-full space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setUserType('returning');
                    // Trigger the email submission after setting state
                    setTimeout(() => {
                      const form = document.getElementById('returning-user-form');
                      if (form) {
                        const submitBtn = form.querySelector('button[type="submit"]');
                        if (submitBtn) submitBtn.click();
                      }
                    }, 100);
                  }}
                >
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-sm py-3 bg-white"
                    disabled={loading}
                  />
                  <Button 
                    type="submit"
                    className="w-full py-3 sm:py-4 text-xs sm:text-base font-bold"
                    style={{ backgroundColor: '#d97706' }}
                    disabled={loading || !email}
                  >
                    {loading ? 'Sending...' : 'Request Access Link'}
                    <ArrowRight className="ml-1 h-4 w-4 flex-shrink-0" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Returning User Form
  return (
    <Card id="returning-user-form" className="max-w-md mx-4 sm:mx-auto bg-white border-2 border-teal-300 shadow-xl">
      <CardHeader className="text-center bg-gradient-to-br from-teal-50 to-white px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl text-teal-800">
          Welcome Back!
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-slate-700">
          Enter your email to receive your access link
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleReturningUser} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-base py-5 sm:py-6"
              disabled={loading}
            />
          </div>

          {message && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-xs sm:text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-800 text-xs sm:text-sm">{error}</div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-5 sm:py-6 text-base"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Access Link'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setUserType(null);
                setMessage('');
                setError('');
                setEmail('');
              }}
              className="text-sm text-teal-600 hover:text-teal-700 py-2"
            >
              ← Back to options
            </button>
          </div>

          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs sm:text-sm text-amber-800 text-center">
              Not a member yet?{' '}
              <button
                type="button"
                onClick={handleNewUser}
                className="font-semibold text-amber-900 hover:underline"
              >
                Donate to join →
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AccessGate;
