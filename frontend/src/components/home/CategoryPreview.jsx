import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingUp, Star, Lock } from 'lucide-react';

const CategoryPreview = () => {
  const dummyCategories = [
    {
      title: 'Freelancing',
      icon: TrendingUp,
      color: '#0891b2', // cyan-600
      description: 'Offer your skills and services to clients worldwide',
      platforms: ['Upwork', 'Fiverr', 'Toptal', 'And 7 more...']
    },
    {
      title: 'Surveys & Research',
      icon: Star,
      color: '#2563eb', // blue-600
      description: 'Share your opinions and get paid for your insights',
      subtitle: 'Quick ROI opportunity:',
      platforms: ['Swagbucks', 'Prolific', 'Qmee', 'And 19 more...']
    },
    {
      title: 'Digital Creators/Innovators',
      icon: Star,
      color: '#7c3aed', // violet-600
      description: 'Create videos, write articles, or produce content',
      subtitle: 'High earning potential:',
      platforms: ['Shutterstock', 'Twitch', 'TikTok', 'And 11 more...']
    },
    {
      title: 'E-commerce',
      icon: TrendingUp,
      color: '#0d9488', // teal-600
      description: 'Sell products online through various platforms',
      subtitle: 'Start your business:',
      platforms: ['Poshmark', 'Vinted', 'Zazzle', 'And 12 more...']
    },
    {
      title: 'Teaching & Tutoring',
      icon: Star,
      color: '#4f46e5', // indigo-600
      description: 'Share your knowledge and teach students online',
      subtitle: 'Make an impact:',
      platforms: ['MyTutor', 'Udemy', 'Preply', 'And 7 more...']
    },
    {
      title: 'Trading & Investing',
      icon: TrendingUp,
      color: '#1d4ed8', // blue-700
      description: 'Invest in stocks, crypto, and other assets',
      subtitle: 'Build wealth:',
      platforms: ['Coinbase', 'eToro', 'Robinhood', 'And 8 more...']
    },
    {
      title: 'Remote Jobs',
      icon: Star,
      color: '#6366f1', // indigo-500
      description: 'Find full-time remote work opportunities',
      subtitle: 'Stable income:',
      platforms: ['FlexJobs', 'Indeed', 'Remote.co', 'And 12 more...']
    },
    {
      title: 'Gig Economy',
      icon: TrendingUp,
      color: '#0284c7', // sky-600
      description: 'Take on flexible gigs and side hustles',
      subtitle: 'Extra income:',
      platforms: ['TaskRabbit', 'Deliveroo', 'Just Eat', 'And 13 more...']
    }
  ];

  return (
    <section id="categories-preview" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-cyan-50 to-teal-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>Browse Categories</h2>
          <p className="text-lg text-slate-600 mb-2">8 earning categories with 130+ verified platforms - presenting you with more than 100 ways to make money online</p>
          <p className="text-sm text-amber-600 font-semibold mb-3">You gain 12 months full and unlimited access in return for a small donation</p>
          {/* Category Quick Navigation Box - matching authenticated view */}
          <div className="w-full mb-4 p-6 bg-white rounded-xl shadow-lg border-2 border-teal-200">
            <h3 className="text-lg text-slate-600 mb-4 text-center">make money online, make money from home</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {dummyCategories.map((cat, index) => (
                <div
                  key={index}
                  className="px-3 py-2 text-sm font-medium rounded-lg text-center text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.title.length > 15 ? cat.title.substring(0, 12) + '...' : cat.title}
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-500 italic">Here are some less crowded examples to give you a taste of what we have to offer you at IncomeOnline...</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dummyCategories.map((category, index) => {
            const IconComponent = category.icon;
            const categoryId = category.title.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
            return (
              <Card 
                key={index} 
                id={`category-${categoryId}`}
                className="hover:shadow-xl transition-all duration-300 border-2 relative overflow-hidden opacity-90" 
                style={{ borderColor: '#43ADD8', background: 'linear-gradient(to bottom right, white, #e0f2fe)' }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl font-bold" style={{ color: category.color }}>{category.title}</CardTitle>
                    <IconComponent className="h-8 w-8" style={{ color: category.color }} />
                  </div>
                  <CardDescription className="text-slate-600">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg">
                    <p className="text-sm text-slate-700 font-medium mb-2">{category.subtitle || 'Popular platforms include:'}</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {category.platforms.map((platform, i) => (
                        <li key={i}>• {platform}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Single CTA to unlock - after Gig Economy */}
        <div className="mt-8 sm:mt-12 text-center px-4 sm:px-2">
          <Card className="shadow-lg mx-auto border-2 max-w-full sm:max-w-2xl" style={{ background: 'linear-gradient(to bottom right, #e0f2fe, #bfdbfe)', borderColor: '#43ADD8' }}>
            <CardContent className="py-6 sm:py-8 px-4 sm:px-6">
              <Lock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4" style={{ color: '#43ADD8' }} />
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 text-center" style={{ color: '#43ADD8' }}>Unlock All Platform Details</h3>
              <p className="text-sm sm:text-base text-slate-700 mb-4 sm:mb-6 text-center px-2">
                Get full access to detailed information, ratings, direct links, and earning strategies for all 130+ platforms
              </p>
              <div className="flex flex-col items-center gap-3">
                <Button 
                  className="font-bold text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full max-w-xs sm:max-w-none sm:w-auto"
                  style={{ backgroundColor: '#43ADD8', color: 'white' }}
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
                  Make a Donation to Unlock
                </Button>
                <p className="text-sm text-slate-600">
                  Already donated? Check your email for the Access All Areas link
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CategoryPreview;
