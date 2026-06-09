import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Shield, Heart, Lock, Sparkles } from 'lucide-react';
import PayPalDonateButton from '../PayPalDonateButton';

const DonationSection = () => {
  return (
    <section id="support" className="py-20 px-3 sm:px-4 md:px-6 lg:px-8 relative overflow-hidden w-full max-w-full">
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
            <CardContent className="px-3 sm:px-6 md:px-8 lg:px-10 py-8">
              
              {/* Trust Factors */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 border border-white/20">
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
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
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
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 border border-amber-500/30">
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
              <div id="paypal-donation-area" className="bg-white rounded-2xl p-3 sm:p-6 mb-6 shadow-lg overflow-hidden">
                <div className="text-center mb-4">
                  <Lock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-bold text-gray-800 text-lg">
                    Secure Payment via PayPal
                  </p>
                  <p className="text-gray-500 text-sm mb-3">
                    Get 12 months unlimited access
                  </p>

                  {/* Visible price — set so visitors know exactly what they're paying before opening PayPal */}
                  <div className="inline-flex items-baseline gap-1 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 via-pink-100 to-amber-100 border border-purple-200">
                    <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">One-time</span>
                    <span className="text-3xl font-extrabold text-purple-700">$9.99</span>
                    <span className="text-sm font-semibold text-purple-700">USD</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Recover the cost on day one — every job after that is profit.
                  </p>
                </div>

                {/* PayPal Button (JS SDK + onApprove → auto-registers donor) */}
                <div className="relative z-0 w-full max-w-full overflow-hidden">
                  <PayPalDonateButton />
                </div>
              </div>

              {/* Premium upsell pointer */}
              <a
                href="#premium-pack"
                data-testid="premium-upsell-link"
                className="block bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/40 hover:to-pink-600/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 mb-6 border border-amber-400/40 transition-colors duration-300 group"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm sm:text-base">
                      Want the full toolkit? Upgrade to <span className="text-amber-300">Premium — $14.99</span>
                    </p>
                    <p className="text-white/75 text-xs sm:text-sm mt-1 leading-relaxed">
                      Includes <span className="font-semibold text-white">everything above</span> plus the Wealth Generator bundle:
                      10 guides, 4 premium Strategy docs &amp; 6 interactive calculators.
                      <span className="ml-1 text-amber-300 font-semibold group-hover:underline">See what's inside &rarr;</span>
                    </p>
                  </div>
                </div>
              </a>

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
