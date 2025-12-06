import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingUp, Star, Lock } from 'lucide-react';

const CategoryPreview = () => {
  const dummyCategories = [
    {
      title: 'Freelancing',
      icon: TrendingUp,
      color: 'teal',
      description: 'Offer your skills and services to clients worldwide',
      platforms: ['Upwork', 'Fiverr', 'Freelancer', 'And more...']
    },
    {
      title: 'Surveys & Research',
      icon: Star,
      color: 'cyan',
      description: 'Share your opinions and get paid for your insights',
      subtitle: 'Quick ROI opportunity:',
      platforms: ['Swagbucks', 'Survey Junkie', 'User Testing', 'And more...']
    },
    {
      title: 'Content Creation',
      icon: Star,
      color: 'purple',
      description: 'Create videos, write articles, or produce content',
      subtitle: 'High earning potential:',
      platforms: ['YouTube', 'Medium', 'Substack', 'And more...']
    },
    {
      title: 'E-commerce',
      icon: TrendingUp,
      color: 'green',
      description: 'Sell products online through various platforms',
      subtitle: 'Start your business:',
      platforms: ['Etsy', 'Amazon FBA', 'eBay', 'And more...']
    },
    {
      title: 'Teaching & Tutoring',
      icon: Star,
      color: 'blue',
      description: 'Share your knowledge and teach students online',
      subtitle: 'Make an impact:',
      platforms: ['VIPKid', 'Teachable', 'Udemy', 'And more...']
    },
    {
      title: 'Trading & Investing',
      icon: TrendingUp,
      color: 'indigo',
      description: 'Invest in stocks, crypto, and other assets',
      subtitle: 'Build wealth:',
      platforms: ['eToro', 'Robinhood', 'Coinbase', 'And more...']
    },
    {
      title: 'Remote Jobs',
      icon: Star,
      color: 'rose',
      description: 'Find full-time remote work opportunities',
      subtitle: 'Stable income:',
      platforms: ['Remote.co', 'We Work Remotely', 'FlexJobs', 'And more...']
    },
    {
      title: 'Gig Economy',
      icon: TrendingUp,
      color: 'amber',
      description: 'Take on flexible gigs and side hustles',
      subtitle: 'Extra income:',
      platforms: ['TaskRabbit', 'Uber', 'DoorDash', 'And more...']
    }
  ];

  return (
    <section id="categories-preview" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-cyan-50 to-teal-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4">Browse Categories</h2>
          <p className="text-lg text-slate-600 mb-2">8 earning categories with 20+ verified platforms</p>
          <p className="text-sm text-amber-600 font-semibold">Unlock full access with a donation</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dummyCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 relative overflow-hidden opacity-90" style={{ borderColor: '#43ADD8', background: 'linear-gradient(to bottom right, white, #e0f2fe)' }}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className={`text-xl font-bold text-${category.color}-800`}>{category.title}</CardTitle>
                    <IconComponent className={`h-8 w-8 text-${category.color}-600`} />
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

        {/* CTA to unlock */}
        <div className="mt-12 text-center">
          <Card className="shadow-lg max-w-2xl mx-auto border-2" style={{ background: 'linear-gradient(to bottom right, #e0f2fe, #bfdbfe)', borderColor: '#43ADD8' }}>
            <CardContent className="py-8">
              <Lock className="h-12 w-12 mx-auto mb-4" style={{ color: '#43ADD8' }} />
              <h3 className="text-2xl font-bold mb-3" style={{ color: '#43ADD8' }}>Unlock All 8 Categories</h3>
              <p className="text-slate-700 mb-6">
                Get full access to all categories including Teaching & Tutoring, Trading & Investing, Remote Jobs, and Gig Economy
              </p>
              <Button 
                className="font-bold text-lg px-8 py-6"
                style={{ backgroundColor: '#43ADD8', color: 'white' }}
                onClick={() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Make a Donation to Unlock
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CategoryPreview;