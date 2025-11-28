import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, Heart, Gift, Star } from 'lucide-react';

const Donate = () => {
  useEffect(() => {
    // Check if script already loaded
    if (document.querySelector('script[src*="paypal.com/sdk"]')) {
      // Script already exists, just render button
      if (window.paypal && window.paypal.HostedButtons) {
        window.paypal.HostedButtons({
          hostedButtonId: "8M5AKKB9LJW3S",
        }).render("#paypal-container-8M5AKKB9LJW3S").catch((error) => {
          console.log('PayPal button render error:', error);
        });
      }
      return;
    }

    // Load PayPal SDK script
    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=BAAb5JvCWdn7JYDqhUeZ_O2MbGr5ASqqkdLndrBFU6s5q0EGRu3VHw5cgW6zHe7Vd-bh5gwq6kenrUGuzY&components=hosted-buttons&disable-funding=venmo&currency=GBP';
    script.async = true;
    script.id = 'paypal-sdk';
    
    script.onload = () => {
      // Render PayPal button after SDK loads
      setTimeout(() => {
        if (window.paypal && window.paypal.HostedButtons) {
          window.paypal.HostedButtons({
            hostedButtonId: "8M5AKKB9LJW3S",
          }).render("#paypal-container-8M5AKKB9LJW3S").catch((error) => {
            console.log('PayPal button render error:', error);
          });
        }
      }, 100);
    };
    
    script.onerror = () => {
      console.error('Failed to load PayPal SDK');
    };
    
    document.head.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-teal-50">
      {/* Header */}
      <header className="border-b border-teal-600 sticky top-0 z-50 shadow-md" style={{backgroundColor: '#43ADD8'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <a href="/">
                <img 
                  src="/earnhub-logo.jpeg" 
                  alt="Income Online - Your Earning Hub" 
                  className="h-36 w-auto cursor-pointer"
                />
              </a>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-white hover:text-yellow-300 transition-colors font-medium">Home</a>
              <a href="/#categories" className="text-white hover:text-yellow-300 transition-colors font-medium">Categories</a>
              <a href="/#platforms" className="text-white hover:text-yellow-300 transition-colors font-medium">Platforms</a>
              <a href="/donate" className="text-yellow-300 font-bold">Support Us</a>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white border-2 border-teal-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle className="text-yellow-700">Keep It Free</CardTitle>
              <CardDescription>
                Your support helps us keep the platform 100% free for all users
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white border-2 border-teal-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <Gift className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle className="text-yellow-700">More Platforms</CardTitle>
              <CardDescription>
                We can add more verified earning opportunities and update existing ones
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white border-2 border-teal-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle className="text-yellow-700">Better Features</CardTitle>
              <CardDescription>
                Your donations fund new features like reviews, comparisons, and earnings calculators
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* PayPal Button Section */}
        <Card className="bg-white shadow-xl border-2 border-teal-300">
          <CardHeader className="text-center bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-2">
              Make a Donation
            </CardTitle>
            <CardDescription className="text-lg text-slate-700">
              Every contribution helps us grow and improve
            </CardDescription>
          </CardHeader>
          <CardContent className="py-8">
            {/* PayPal Button Container */}
            <div className="bg-gradient-to-br from-slate-50 to-teal-50 rounded-lg p-8 border-2 border-teal-200">
              <div className="text-center mb-6">
                <p className="text-slate-700 font-medium mb-4">
                  Click the button below to donate securely via PayPal
                </p>
              </div>
              
              {/* PayPal Button */}
              <div className="flex justify-center">
                <div id="paypal-container-8M5AKKB9LJW3S"></div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                🔒 Secure payment processing by PayPal
              </p>
              <p className="text-xs text-slate-500 mt-2">
                We never see or store your payment information
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Thank You Message */}
        <div className="mt-12 text-center bg-white rounded-lg p-8 border-2 border-teal-200">
          <h3 className="text-2xl font-bold text-yellow-700 mb-4">Thank You! 🙏</h3>
          <p className="text-slate-700 text-lg mb-4">
            Your generosity helps thousands of people discover legitimate online earning opportunities.
          </p>
          <p className="text-slate-600">
            Together, we're making online earning accessible to everyone, everywhere.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-800 via-teal-900 to-cyan-900 text-white py-12 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img 
                  src="/earnhub-logo.jpeg" 
                  alt="Income Online - Your Earning Hub" 
                  className="h-30 w-auto"
                />
              </div>
              <p className="text-slate-400 text-sm">Your trusted directory for online earning opportunities.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="/" className="hover:text-white cursor-pointer transition-colors">Home</a></li>
                <li><a href="/#categories" className="hover:text-white cursor-pointer transition-colors">Categories</a></li>
                <li><a href="/#platforms" className="hover:text-white cursor-pointer transition-colors">Platforms</a></li>
                <li><a href="/donate" className="hover:text-white cursor-pointer transition-colors">Donate</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white cursor-pointer transition-colors">Getting Started</li>
                <li className="hover:text-white cursor-pointer transition-colors">Success Stories</li>
                <li className="hover:text-white cursor-pointer transition-colors">Blog</li>
                <li className="hover:text-white cursor-pointer transition-colors">FAQ</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-white cursor-pointer transition-colors">Contact</li>
                <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>© 2025 Income Online. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Donate;
