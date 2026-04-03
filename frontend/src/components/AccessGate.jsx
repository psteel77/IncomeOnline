import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { UserPlus, Mail, ArrowRight, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccessGate = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleNewUser = () => {
    // Scroll to Support IncomeOnline section
    const supportSection = document.getElementById('support');
    if (supportSection) {
      const headerHeight = 80; // Account for sticky header
      const elementPosition = supportSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleReturningUser = async (e) => {
    e.preventDefault();
    if (!email) return;
    
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
      } else if (response.data.expired) {
        // Subscription expired
        setError(
          <div>
            <p className="font-semibold mb-2">Your 12-month subscription has expired.</p>
            <p className="text-sm mb-2">Please make a new donation to renew your access and continue exploring income opportunities.</p>
            <button
              type="button"
              onClick={handleNewUser}
              className="mt-2 text-sm font-semibold text-pink-600 hover:underline"
            >
              Renew subscription →
            </button>
          </div>
        );
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

  return (
    <Card className="max-w-2xl border-0 shadow-2xl mx-4 sm:mx-auto overflow-hidden bg-white/90 backdrop-blur-lg">
      <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
      <CardHeader className="text-center bg-gradient-to-br from-purple-50/50 to-pink-50/50 px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 mx-auto mb-3">
          <Sparkles className="h-3 w-3 text-purple-600" />
          <span className="text-xs font-medium text-purple-700">199+ Platforms Await</span>
        </div>
        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-2">
          Access the Income Online Community
        </CardTitle>
        <CardDescription className="text-base sm:text-lg text-gray-600">
          Choose your access type below
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* New User Card */}
          <div 
            className="group relative border-2 border-purple-200 rounded-2xl p-4 sm:p-6 hover:border-purple-400 hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-purple-50 overflow-hidden"
            onClick={handleNewUser}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="flex flex-col items-center text-center h-full relative z-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <UserPlus className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">New User</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 flex-grow">
                Join the Income Online community and get access to <span className="font-semibold text-purple-600">199+ verified</span> earning platforms
              </p>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-3 sm:py-4 text-sm sm:text-base font-bold mt-auto whitespace-nowrap rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all duration-300 border-0">
                Get Started
                <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Returning User Card */}
          <div 
            className="group relative border-2 border-amber-200 rounded-2xl p-4 sm:p-6 hover:border-amber-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-amber-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="flex flex-col items-center text-center h-full relative z-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <Mail className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">Returning User</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 flex-grow">
                Already a member? Enter your email to receive your access link
              </p>
              <form 
                className="w-full space-y-3"
                onSubmit={handleReturningUser}
              >
                {/* Only show email input if no success message */}
                {!message && (
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-sm py-3 bg-white border-2 border-gray-200 focus:border-amber-400 rounded-xl"
                    disabled={loading}
                  />
                )}
                
                {message && (
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3 flex items-start gap-2 text-left">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-800 text-xs sm:text-sm">{message}</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 flex items-start gap-2 text-left">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-red-800 text-xs sm:text-sm">{error}</div>
                  </div>
                )}
                
                {/* Only show button if no success message */}
                {!message && (
                  <Button 
                    type="submit"
                    className="w-full py-3 sm:py-4 text-xs sm:text-base font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-lg hover:shadow-amber-500/30 transition-all duration-300 border-0"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Request Access Link'}
                    <ArrowRight className="ml-1 h-4 w-4 flex-shrink-0" />
                  </Button>
                )}
              </form>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessGate;
