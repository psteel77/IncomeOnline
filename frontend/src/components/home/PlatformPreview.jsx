import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Lock, Star, ExternalLink } from 'lucide-react';

const PlatformPreview = () => {
  // Sample platforms to show as a preview
  const samplePlatforms = [
    {
      name: "Upwork",
      category: "Freelancing",
      description: "World's largest freelancing marketplace connecting businesses with independent professionals. Offer services in writing, design, development, and more.",
      earningsPotential: "$500-5,000/month",
      difficulty: "Medium",
      rating: 4.5
    },
    {
      name: "Swagbucks",
      category: "Surveys & Research",
      description: "Popular rewards platform for completing surveys, watching videos, and shopping online. Easy way to earn gift cards and cash in your spare time.",
      earningsPotential: "$50-300/month",
      difficulty: "Easy",
      rating: 4.2
    },
    {
      name: "Shopify",
      category: "E-commerce",
      description: "Leading ecommerce platform for building online stores. 8,000+ apps, multi-channel selling, dropshipping support. Powers millions of businesses worldwide.",
      earningsPotential: "$500-50,000/month",
      difficulty: "Medium",
      rating: 4.7
    }
  ];

  return (
    <section id="platforms-preview" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.15)' }}>Featured Platforms</h2>
          <p className="text-lg text-slate-600 mb-2">113+ verified platforms ready for you to explore</p>
          <p className="text-sm text-amber-600 font-semibold mb-3">Unlock full details with a donation</p>
          <p className="text-sm text-slate-500 italic">Here are some examples to give you a taste of what we have to offer...</p>
        </div>
        
        {/* Sample Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {samplePlatforms.map((platform, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 border-slate-200 relative overflow-hidden">
              {/* Sample Watermark */}
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-amber-100 text-amber-700 text-xs">SAMPLE</Badge>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-slate-800">{platform.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{platform.rating}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit text-xs">{platform.category}</Badge>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-slate-600 mb-4 line-clamp-3">{platform.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Earnings:</span>
                    <span className="font-semibold text-teal-600">{platform.earningsPotential}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Difficulty:</span>
                    <Badge variant="outline" className="text-xs">{platform.difficulty}</Badge>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-slate-200 text-slate-500 cursor-not-allowed" 
                  disabled
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Donate to Unlock Link
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Locked Message */}
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-slate-50 to-teal-50 rounded-xl p-8 border-2 border-teal-200">
          <Lock className="h-12 w-12 text-teal-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-yellow-700 mb-3" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>110+ More Platforms Available</h3>
          <p className="text-slate-700 mb-6">
            Support us with a donation to unlock full access to all platforms with detailed reviews, ratings, and direct links.
          </p>
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
            Donate to Unlock All
          </Button>
          <p className="text-sm text-slate-600 mt-4">
            Already donated? Check your email for the verification link
          </p>
        </div>
      </div>
    </section>
  );
};

export default PlatformPreview;
