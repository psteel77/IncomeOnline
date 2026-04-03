import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Shield, Heart, Lock, Sparkles, CheckCircle } from 'lucide-react';

const DonationSection = () => {
  const paypalLoaded = useRef(false);

  useEffect(() => {
    // Load PayPal SDK for donation button
    if (paypalLoaded.current) return;
    
    const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
    if (existingScript) {
      paypalLoaded.current = true;
      if (window.paypal && window.paypal.HostedButtons) {
        setTimeout(() => {
          window.paypal.HostedButtons({
            hostedButtonId: process.env.REACT_APP_PAYPAL_BUTTON_ID,
          }).render("#paypal-container-donation").then(() => {
            console.log('PayPal donation button rendered successfully');
          }).catch((error) => {
            console.log('PayPal donation button render error:', error);
          });
        }, 100);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.REACT_APP_PAYPAL_CLIENT_ID}&components=hosted-buttons&disable-funding=venmo&currency=USD`;
    script.async = true;
    script.id = 'paypal-sdk-donation';
    
    script.onload = () => {
      paypalLoaded.current = true;
      setTimeout(() => {
        if (window.paypal && window.paypal.HostedButtons) {
          window.paypal.HostedButtons({
            hostedButtonId: process.env.REACT_APP_PAYPAL_BUTTON_ID,
          }).render("#paypal-container-donation").then(() => {
            console.log('PayPal donation button rendered successfully');
          }).catch((error) => {
            console.log('PayPal donation button render error:', error);
          });
        }
      }, 100);
    };
    
    document.head.appendChild(script);
  }, []);

  return (
    <section id="support" className="py-20 px-2 sm:px-4 md:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 float-animation"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 float-animation-delay-1"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <Heart className="h-4 w-4 text-pink-400" />
            <span className="text-sm font-medium text-white/90">Support Our Mission</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Support <span className="gradient-text-warm">IncomeOnline</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Your contribution helps us maintain an independent, unbiased platform
          </p>
        </div>

        {/* Main Donation Card */}
        <div className="max-w-3xl mx-auto">
          <Card className="border-0 shadow-2xl overflow-hidden bg-white/10 backdrop-blur-lg">
            <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
            <CardContent className="px-6 sm:px-8 md:px-10 py-8">
              
              {/* Trust Factors */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  3-Factor Peace of Mind
                </h3>
                <div className="space-y-4">
                  {[
                    "We do not accept commissions, fees, or incentives from any recommended platforms.",
                    "We are completely independent with no commercial links to any platform.",
                    "We will never sell or release your data to any third parties."
                  ].map((text, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                        {index + 1}
                      </div>
                      <p className="text-white/80 text-sm sm:text-base leading-relaxed pt-1">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Value Proposition */}
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-amber-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">Quick Return on Investment</h4>
                    <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                      Devote just <span className="font-semibold text-amber-400">1 hour</span> to one of our Survey and Research opportunities and earn more than the cost of your access fee. Show a positive ROI within the hour!
                    </p>
                  </div>
                </div>
              </div>

              {/* PayPal Section */}
              <div id="paypal-donation-area" className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
                <div className="text-center mb-4">
                  <Lock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-bold text-gray-800 text-lg">
                    Secure Payment via PayPal
                  </p>
                  <p className="text-gray-500 text-sm">
                    Get 12 months unlimited access
                  </p>
                </div>
                
                {/* PayPal Button */}
                <div className="relative z-0">
                  <style>{`
                    #paypal-container-donation {
                      width: 100%;
                    }
                    #paypal-container-donation iframe {
                      width: 100% !important;
                    }
                    #paypal-container-donation .paypal-button-container {
                      width: 100% !important;
                    }
                  `}</style>
                  <div id="paypal-container-donation" className="w-full relative z-0"></div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                <Lock className="h-4 w-4" />
                <span>We never see or store your payment information</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Thank You Section */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/20">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 flex items-center justify-center gap-2">
              <Heart className="h-6 w-6 text-pink-400" />
              Thank You!
            </h3>
            <p className="text-white/80 text-lg max-w-xl">
              Your action today sets you on the path to fulfilling your income potential and discovering your passion while earning online.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DonationSection;
