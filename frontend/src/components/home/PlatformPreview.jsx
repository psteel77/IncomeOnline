import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Lock, Star, ExternalLink } from 'lucide-react';

const PlatformPreview = () => {
  // 6 top rated opportunities as specified
  const samplePlatforms = [
    {
      name: "Upwork",
      category: "Freelancing",
      description: "World's largest freelancing marketplace connecting businesses with independent professionals for writing, design, development, and more.",
      earningsPotential: "$400-4,000/month",
      difficulty: "Medium",
      rating: 4.5,
      color: "#7c3aed"
    },
    {
      name: "Survey Junkie",
      category: "Surveys & Research",
      description: "Leading survey platform with millions of members. Share opinions on brands and products for cash rewards via PayPal or gift cards.",
      earningsPotential: "$50-200/month",
      difficulty: "Easy",
      rating: 4.3,
      color: "#db2777"
    },
    {
      name: "Prolific",
      category: "Surveys & Research",
      description: "Academic research platform with fair pay. Participate in university studies and get paid $6-12/hour. Highly rated by researchers.",
      earningsPotential: "$100-300/month",
      difficulty: "Easy",
      rating: 4.7,
      color: "#8b5cf6"
    },
    {
      name: "Toptal",
      category: "Freelancing",
      description: "Elite freelance network for top 3% of developers, designers, and finance experts. Premium clients like Google and Airbnb.",
      earningsPotential: "$5,000-15,000/month",
      difficulty: "Hard",
      rating: 4.8,
      color: "#a855f7"
    },
    {
      name: "We Work Remotely",
      category: "Remote Jobs",
      description: "Largest remote work community with quality job listings. No scams, curated positions from companies like Amazon and Google.",
      earningsPotential: "$2,000-8,000/month",
      difficulty: "Medium",
      rating: 4.6,
      color: "#6366f1"
    },
    {
      name: "Preply",
      category: "Teaching & Tutoring",
      description: "Global tutoring platform for languages and academics. Set your own rates and schedule, connect with students worldwide.",
      earningsPotential: "$400-2,500/month",
      difficulty: "Medium",
      rating: 4.3,
      color: "#4f46e5"
    }
  ];

  return (
    <section id="platforms-preview" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.15)' }}>6 Top Rated Opportunities</h2>
          <p className="text-lg text-slate-600 mb-2">199+ verified platforms ready for you to explore</p>
          <p className="text-sm text-amber-600 font-semibold mb-3">Unlock full details with a donation</p>
          <p className="text-sm text-slate-500 italic">Here is a taster of what we have to offer so you can make money online...</p>
        </div>
        
        {/* 6 Sample Platform Cards - 3 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {samplePlatforms.map((platform, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 relative overflow-hidden" style={{ borderColor: platform.color }}>
              {/* Sample Watermark */}
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-amber-100 text-amber-700 text-xs">SAMPLE</Badge>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-800">{platform.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{platform.rating}</span>
                  </div>
                </div>
                <Badge style={{ backgroundColor: platform.color, color: 'white' }} className="w-fit text-xs mt-1">{platform.category}</Badge>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{platform.description}</p>
                
                <div className="space-y-1 mb-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Earnings:</span>
                    <span className="font-semibold text-purple-600">{platform.earningsPotential}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Difficulty:</span>
                    <Badge variant="outline" className="text-xs">{platform.difficulty}</Badge>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-slate-200 text-slate-500 cursor-not-allowed text-sm py-2" 
                  disabled
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Unlock with Donation
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Locked Message */}
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border-2 border-purple-200">
          <Lock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600 mb-3">100+ More Platforms Available</h3>
          <p className="text-slate-700 mb-6">
            Support us with a donation to unlock full access to all platforms with detailed reviews, ratings, and direct links.
          </p>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6 border-0 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
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
