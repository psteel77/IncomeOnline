import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Lock } from 'lucide-react';

const PlatformPreview = () => {
  return (
    <section id="platforms-preview" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4">Featured Platforms</h2>
          <p className="text-lg text-slate-600 mb-2">50+ verified platforms ready for you to explore</p>
          <p className="text-sm text-amber-600 font-semibold">Unlock full details with a donation</p>
        </div>
        
        {/* Locked Message - replaces the platform cards */}
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-xl border-2 border-teal-300 bg-gradient-to-br from-slate-50 to-teal-50">
            <CardContent className="py-12 sm:py-16 text-center px-6 sm:px-8">
              <Lock className="h-16 w-16 sm:h-20 sm:w-20 text-teal-600 mx-auto mb-6" />
              <h3 className="text-2xl sm:text-3xl font-bold text-yellow-700 mb-4">🔒 Featured Platforms Locked</h3>
              <p className="text-lg sm:text-xl text-slate-700 mb-6 max-w-2xl mx-auto">
                Support us with a donation to unlock full access to all 50+ earning platforms with detailed reviews, ratings, and direct links.
              </p>
              <div className="space-y-4">
                <Button 
                  size="lg"
                  className="bg-teal-600 hover:bg-teal-700 text-white text-lg px-8 py-6"
                  onClick={() => {
                    const paypalArea = document.getElementById('paypal-donation-area');
                    if (paypalArea) {
                      const headerHeight = 80;
                      const elementPosition = paypalArea.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                    } else {
                      document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Donate to Unlock
                </Button>
                <p className="text-sm text-slate-600">
                  Already donated? Check your email for the verification link
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PlatformPreview;
