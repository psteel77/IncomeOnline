import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const DonationSection = () => {
  return (
    <section id="support" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-6">
            Support Income Online
          </h2>
          <p className="text-xl md:text-2xl text-slate-700 mb-6 max-w-3xl mx-auto leading-relaxed">
            Help us keep this directory up-to-date for everyone
          </p>
          <p className="text-lg md:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            Your donation helps us maintain and expand our platform, bringing more earning opportunities to people worldwide.
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-yellow-700 text-xl mb-3">Keep it relevant</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Your support helps us keep the platform live and relevant
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-yellow-700 text-xl mb-3">More Platforms</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                We can add more verified earning opportunities and update existing ones
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-yellow-700 text-xl mb-3">Better Features</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Your donations fund new features like reviews, comparisons, and earnings calculators
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* PayPal Button Card */}
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-white to-teal-50 shadow-xl border-2 border-teal-300">
            <CardHeader className="text-center px-8 py-8">
              <CardTitle className="text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4">
                Make a Donation
              </CardTitle>
              <CardDescription className="text-lg md:text-xl text-slate-700 leading-relaxed">
                Your contribution helps us grow and improve
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 py-8">
              {/* Why Donate Section */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 md:p-8 mb-6 border-2 border-teal-200">
                <p className="text-slate-700 text-base md:text-lg leading-relaxed mb-4">
                  There are websites that offer Income Online opportunities that are "free" but in my experience very few things on the Internet are genuinely "free". 
                  Many of the 'free' websites accept commissions/fees from other Platforms and direct you towards these out of their own financial interest.
                </p>
                <p className="text-slate-700 text-base md:text-lg leading-relaxed mb-4">
                  By making a donation to access the online income opportunities via our web portal you have <span className="font-bold text-teal-800">3 Factor peace of mind</span>:
                </p>
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <p className="text-slate-700 text-base md:text-lg leading-relaxed pt-1">
                      We do not accept commissions/fees from any of the Platforms on our site.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <p className="text-slate-700 text-base md:text-lg leading-relaxed pt-1">
                      We are completely independent with no commercial link to any Platform.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <p className="text-slate-700 text-base md:text-lg leading-relaxed pt-1">
                      We will never sell or release your data.
                    </p>
                  </div>
                </div>
                <p className="text-slate-700 text-base md:text-lg leading-relaxed font-medium">
                  We believe that the donation we ask you to make in return for unlimited access to Income Online is a small price to pay when you consider the added benefit and peace of mind the 3 factors above give you.
                </p>
              </div>

              {/* ROI Section */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 md:p-8 mb-6 border-2 border-amber-200">
                <p className="text-slate-700 text-base md:text-lg leading-relaxed">
                  Once you join <span className="font-bold text-teal-800">incomeOnline</span> You might be overwhelmed by the sheer number of possibilities available to you so while you are considering your best way forward or you simply can't decide what really excites you (our Freelancers platform alone has more than 20,000 opportunities!), you could devote just 1 hour of your time to one of the many Survey and Research opportunities available on incomeOnline and earn more than the cost of your 'online income' fee so you could be showing a positive return on your investment within the hour!
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-teal-200">
                <div className="text-center mb-6">
                  <p className="text-slate-700 font-medium text-lg leading-relaxed">
                    Click the button below to donate securely via PayPal
                  </p>
                </div>
                
                {/* PayPal Button */}
                <div className="flex justify-center items-center min-h-[60px]">
                  <div id="paypal-container-homepage" className="w-full max-w-md"></div>
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
        </div>

        {/* Thank You Message */}
        <div className="mt-12 text-center bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-8 border-2 border-teal-200 max-w-4xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-yellow-700 mb-4">Thank You!</h3>
          <p className="text-slate-700 text-lg md:text-xl leading-relaxed">
            Your action today sets you on the path to fulfilling your income potential and discovering your passion while earning income online.
          </p>
        </div>

      </div>
    </section>
  );
};

export default DonationSection;