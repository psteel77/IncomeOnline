import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Heart, Gift, Star, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoginButton from '../components/LoginButton';
import PayPalDonateButton from '../components/PayPalDonateButton';

const Donate = () => {
  const { isAuthenticated, userEmail, loading: authLoading } = useAuth();
  const isMember = !authLoading && isAuthenticated;
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-purple-50/30 to-white">
      <Helmet>
        <title>Support Income Online | Make a Donation</title>
        <meta name="description" content="Support Income Online with a donation and get 12 months full access to 199+ verified online earning platforms." />
        <link rel="canonical" href="https://www.incomeonline.info/donate" />
        <meta property="og:title" content="Support Income Online | Make a Donation" />
        <meta property="og:url" content="https://www.incomeonline.info/donate" />
      </Helmet>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 border-b border-purple-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <a href="/">
                <img 
                  src="/earnhub-logo.png" 
                  alt="Income Online - Your Earning Hub" 
                  className="h-20 w-auto cursor-pointer rounded-lg hover:scale-105 transition-transform"
                />
              </a>
            </div>
            <nav className="hidden md:flex space-x-8 items-center">
              <a href="/" className="text-white hover:text-pink-300 transition-colors font-medium">Home</a>
              <a href="/#categories" className="text-white hover:text-pink-300 transition-colors font-medium">Categories</a>
              <a href="/#platforms" className="text-white hover:text-pink-300 transition-colors font-medium">Platforms</a>
              <LoginButton />
              <a href="/donate" className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold rounded-full">Support Us</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-6">
            Support Income Online
          </h1>
          <p className="text-xl text-slate-700 mb-4">
            Help us keep this directory free and up-to-date for everyone
          </p>
          <p className="text-lg text-slate-600">
            Your donation helps us maintain and expand our platform, bringing more earning opportunities to people worldwide.
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-white border-2 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-yellow-700 text-xl mb-3">Keep it relevant</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Your support helps us keep the platform live and relevant
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white border-2 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-yellow-700 text-xl mb-3">More Platforms</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                We can add more verified earning opportunities and update existing ones
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white border-2 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-yellow-700 text-xl mb-3">Better Features</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Your donations fund new features like reviews, comparisons, and earnings calculators
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* PayPal Button Section — members already have access, so show a
            confirmation instead of a payment demand */}
        <div className="max-w-3xl mx-auto">
          {isMember ? (
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 shadow-xl border-2 border-emerald-300" data-testid="donate-member-card">
              <CardHeader className="text-center px-8 py-8">
                <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="text-3xl md:text-4xl text-emerald-700 mb-3">
                  You already have full access
                </CardTitle>
                <CardDescription className="text-lg md:text-xl text-slate-700 leading-relaxed">
                  {userEmail ? <>Signed in as <span className="font-semibold">{userEmail}</span>. </> : null}
                  Your 12-month membership is active — no further payment needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 text-center">
                <a
                  href="/#platforms"
                  data-testid="donate-member-browse-btn"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-full transition-colors shadow-lg"
                >
                  Browse all 199+ platforms <ArrowRight className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl border-2 border-purple-300">
              <CardHeader className="text-center px-8 py-8">
                <CardTitle className="text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4">
                  Make a Donation
                </CardTitle>
                <CardDescription className="text-lg md:text-xl text-slate-700 leading-relaxed">
                  Every contribution helps us grow and improve
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 py-8">
                <div className="bg-white rounded-xl p-8 border-2 border-purple-200">
                  <div className="text-center mb-6">
                    <p className="text-slate-700 font-medium text-lg leading-relaxed">
                      Click the button below to donate securely via PayPal
                    </p>
                  </div>

                  {/* PayPal Button (JS SDK + onApprove → auto-registers donor) */}
                  <div className="flex justify-center items-center min-h-[60px]">
                    <div className="w-full max-w-md">
                      <PayPalDonateButton />
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 text-center px-4">
                  <p className="text-base text-slate-600 mb-2">
                    🔒 Secure payment processing by PayPal
                  </p>
                  <p className="text-sm text-slate-500">
                    We never see or store your payment information
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Thank You Message */}
        <div className="mt-12 text-center bg-white rounded-lg p-8 border-2 border-purple-200">
          <h3 className="text-2xl font-bold text-yellow-700 mb-4">Thank You! 🙏</h3>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-4">
            Your action today not only sets you on the path to fulfilling your income potential...
          </p>
          <p className="text-slate-700 text-lg mb-4 leading-relaxed">
            Your generosity helps thousands of people discover legitimate online earning opportunities.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Together, we&apos;re making online earning accessible to everyone, everywhere.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white py-12 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img 
                  src="/earnhub-logo.png" 
                  alt="Income Online - Your Earning Hub" 
                  className="h-20 w-auto rounded-lg"
                />
              </div>
              <p className="text-purple-200 text-sm">Your trusted directory for online earning opportunities.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-pink-300">Quick Links</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li><a href="/" className="hover:text-white cursor-pointer transition-colors">Home</a></li>
                <li><a href="/#categories" className="hover:text-white cursor-pointer transition-colors">Categories</a></li>
                <li><a href="/#platforms" className="hover:text-white cursor-pointer transition-colors">Platforms</a></li>
                <li><a href="/donate" className="hover:text-white cursor-pointer transition-colors">Donate</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-pink-300">Resources</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li className="hover:text-white cursor-pointer transition-colors">Getting Started</li>
                <li className="hover:text-white cursor-pointer transition-colors">Success Stories</li>
                <li className="hover:text-white cursor-pointer transition-colors">How It Works</li>
                <li className="hover:text-white cursor-pointer transition-colors">FAQ</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-pink-300">Company</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-white cursor-pointer transition-colors">Contact</li>
                <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-purple-500/30 pt-8 text-center text-sm text-purple-200">
            <p>© 2025 Income Online. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Donate;
