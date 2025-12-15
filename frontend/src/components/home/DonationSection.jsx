import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

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
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.REACT_APP_PAYPAL_CLIENT_ID}&components=hosted-buttons&disable-funding=venmo&currency=GBP`;
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
    <section id="support" className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Single PayPal Donation Card */}
        <div className="max-w-3xl mx-auto px-4 sm:px-2">
          <Card className="bg-gradient-to-br from-white to-teal-50 shadow-xl border-2 border-teal-300">
            <CardHeader className="text-center px-4 sm:px-6 md:px-8 py-6 sm:py-8">
              <p className="text-sm sm:text-base mb-2" style={{ color: '#43ADD8' }}>help us to help you...</p>
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-3 sm:mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.15)' }}>
                Support IncomeOnline
              </CardTitle>
              <CardDescription className="text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed">
                Your contribution helps us grow and improve
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 md:px-10 py-6 sm:py-8">
              {/* Why Donate Section */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 sm:p-6 md:p-8 mb-6 border-2 border-teal-200">
                <p className="text-slate-700 text-sm sm:text-base md:text-lg leading-relaxed mb-4">
                  There are websites offering Income Online opportunities that are "free" but in our experience very few things on the Internet are genuinely "free". Many of the 'free' websites accept commissions/fees from other Platforms and direct you towards these out of their own financial interest.
                </p>
                <p className="text-slate-700 text-sm sm:text-base md:text-lg leading-relaxed mb-4">
                  By making a donation to access the online income opportunities via our web portal you have <span className="font-bold text-teal-800">3 Factor peace of mind</span>:
                </p>
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                      1
                    </div>
                    <p className="text-slate-700 text-sm sm:text-base md:text-lg leading-relaxed pt-0.5 sm:pt-1">
                      We do not accept commissions/fees/incentives or any other form of enrichment from any of the Platforms recommended on our site.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                      2
                    </div>
                    <p className="text-slate-700 text-sm sm:text-base md:text-lg leading-relaxed pt-0.5 sm:pt-1">
                      We are completely independent, we have no commercial link or personal relationship to any recommended Platform or potential provider of Income Online.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                      3
                    </div>
                    <p className="text-slate-700 text-sm sm:text-base md:text-lg leading-relaxed pt-0.5 sm:pt-1">
                      We will never sell or release your data to any third parties.
                    </p>
                  </div>
                </div>
                <p className="text-slate-700 text-sm sm:text-base md:text-lg leading-relaxed font-medium">
                  We believe that the modest donation we ask you to make in return for unlimited access to Income Online is a small price to pay when you consider the added benefit and peace of mind the 3 factors above give you.
                </p>
              </div>

              {/* ROI Section */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 sm:p-6 md:p-8 mb-6 border-2 border-amber-200">
                <p className="text-slate-700 text-sm sm:text-base md:text-lg leading-relaxed">
                  Once you join <span className="font-bold text-teal-800">incomeOnline</span> You might be overwhelmed by the sheer number of possibilities available to you so while you are considering your best way forward or you simply can't decide what really excites you (our Freelancers platform alone has more than 20,000 opportunities!), you could devote just 1 hour of your time to one of the many Survey and Research opportunities available on incomeOnline and earn more than the cost of your 'online income' fee so you could be showing a positive return on your investment within the hour!
                </p>
              </div>

              <div id="paypal-donation-area" className="bg-white rounded-xl p-4 sm:p-6 md:p-8 mb-6 border-2 border-teal-200">
                <p className="font-bold text-teal-800 text-sm sm:text-base md:text-lg leading-relaxed mb-0">
                  Click the button below to donate securely via PayPal
                </p>
                
                {/* PayPal Button - with CSS override for content alignment */}
                <div className="relative z-0 mt-2">
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

              {/* Security Notice */}
              <div className="mt-4 sm:mt-6 text-center px-2 sm:px-4">
                <p className="text-sm sm:text-base text-slate-600 mb-2">
                  🔒 Secure payment processing by PayPal
                </p>
                <p className="text-xs sm:text-sm text-slate-500">
                  We never see or store your payment information
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Thank You Message - no praying hands emoji */}
        <div className="mt-12 text-center bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-8 border-2 border-teal-200 max-w-4xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-yellow-700 mb-4" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>Thank You!</h3>
          <p className="text-slate-700 text-lg md:text-xl leading-relaxed">
            Your action today sets you on the path to fulfilling your income potential and discovering your passion while earning income online.
          </p>
        </div>

      </div>
    </section>
  );
};

export default DonationSection;
