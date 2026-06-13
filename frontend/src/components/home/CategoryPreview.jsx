import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingUp, Star, Lock, Sparkles, Zap, Users, ShoppingBag, BookOpen, LineChart, Briefcase, Clock } from 'lucide-react';

const CategoryPreview = () => {
  const dummyCategories = [
    {
      title: 'Freelancing',
      icon: Briefcase,
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: 'from-violet-50 to-purple-100',
      description: 'Offer your skills and services to clients worldwide',
      platforms: ['Upwork', 'Fiverr', 'Toptal', 'And 7 more...']
    },
    {
      title: 'Surveys & Research',
      icon: Users,
      gradient: 'from-rose-500 to-pink-600',
      bgGradient: 'from-rose-50 to-pink-100',
      description: 'Share your opinions and get paid for your insights',
      subtitle: 'Quick ROI opportunity:',
      platforms: ['Swagbucks', 'Prolific', 'Qmee', 'And 19 more...']
    },
    {
      title: 'Digital Creators',
      icon: Sparkles,
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-100',
      description: 'Create videos, write articles, or produce content',
      subtitle: 'High earning potential:',
      platforms: ['Shutterstock', 'Twitch', 'TikTok', 'And 11 more...']
    },
    {
      title: 'E-commerce',
      icon: ShoppingBag,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-100',
      description: 'Sell products online through various platforms',
      subtitle: 'Start your business:',
      platforms: ['Vinted', 'Depop', 'Etsy', 'And 12 more...']
    },
    {
      title: 'Teaching & Tutoring',
      icon: BookOpen,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-100',
      description: 'Share your knowledge and teach students online',
      subtitle: 'Make an impact:',
      platforms: ['MyTutor', 'Udemy', 'Preply', 'And 7 more...']
    },
    {
      title: 'Trading & Investing',
      icon: LineChart,
      gradient: 'from-indigo-500 to-blue-600',
      bgGradient: 'from-indigo-50 to-blue-100',
      description: 'Invest in stocks, crypto, and other assets',
      subtitle: 'Build wealth:',
      platforms: ['Coinbase', 'Trading 212', 'Robinhood', 'And 8 more...']
    },
    {
      title: 'Remote Jobs',
      icon: Zap,
      gradient: 'from-fuchsia-500 to-pink-600',
      bgGradient: 'from-fuchsia-50 to-pink-100',
      description: 'Find full-time remote work opportunities',
      subtitle: 'Stable income:',
      platforms: ['FlexJobs', 'Indeed', 'Remote.co', 'And 12 more...']
    },
    {
      title: 'Gig Economy',
      icon: Clock,
      gradient: 'from-purple-500 to-indigo-600',
      bgGradient: 'from-purple-50 to-indigo-100',
      description: 'Take on flexible gigs and side hustles',
      subtitle: 'Extra income:',
      platforms: ['Bolt', 'Stuart', 'Airtasker', 'And 14 more...']
    }
  ];

  return (
    <section id="categories-preview" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-purple-50/50 to-pink-50/50"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 mb-4">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">8 Categories • 199+ Platforms</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Browse Categories</span>
          </h2>
          <p className="text-lg text-gray-600 mb-2 max-w-2xl mx-auto">
            Discover <span className="font-semibold text-purple-600">100+ ways</span> to make money online, all verified and organized
          </p>
          <p className="text-sm text-pink-600 font-semibold mb-6">
            ✨ 12 months full access for just one small donation
          </p>
          
          {/* Category Quick Navigation */}
          <div className="w-full mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100">
            <p className="text-gray-500 mb-4 text-sm">Quick jump to categories</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {dummyCategories.map((cat, index) => (
                <div
                  key={index}
                  className={`stagger-item px-3 py-2 text-xs font-medium rounded-lg text-center text-white bg-gradient-to-r ${cat.gradient} hover-scale cursor-pointer shadow-md`}
                >
                  {cat.title.length > 12 ? cat.title.substring(0, 10) + '...' : cat.title}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dummyCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={index} 
                className={`stagger-item hover-lift group cursor-pointer border-0 shadow-lg overflow-hidden bg-gradient-to-br ${category.bgGradient}`}
              >
                <div className={`h-2 bg-gradient-to-r ${category.gradient}`}></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${category.gradient} shadow-lg`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-medium text-gray-500">View all →</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-800">{category.title}</CardTitle>
                  <CardDescription className="text-gray-600 text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium mb-2">{category.subtitle || 'Popular platforms:'}</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {category.platforms.map((platform, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${category.gradient}`}></span>
                          {platform}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Card */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto border-0 shadow-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
            <CardContent className="py-10 px-8 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg pulse-glow">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 gradient-text">Unlock All Platform Details</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get full access to detailed information, ratings, direct links, and earning strategies for all <span className="font-semibold text-purple-600">199+ platforms</span>
              </p>
              <Button 
                className="font-bold text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-5 sm:py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all duration-300 max-w-full whitespace-normal break-words h-auto leading-tight"
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
                <span className="inline sm:hidden">🔓 Donate to Unlock</span>
                <span className="hidden sm:inline">🔓 Make a Donation to Unlock</span>
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Already donated? Check your email for the Access All Areas link
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CategoryPreview;
