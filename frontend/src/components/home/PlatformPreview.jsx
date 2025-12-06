import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Star, Lock } from 'lucide-react';

const PlatformPreview = () => {
  const dummyPlatforms = [
    {
      name: 'Upwork',
      category: 'Freelancing',
      categoryColor: 'teal',
      description: "World's largest freelancing platform with millions of jobs",
      rating: '4.5/5',
      earning: '$500-$10,000+/mo',
      difficulty: 'Medium'
    },
    {
      name: 'Fiverr',
      category: 'Freelancing',
      categoryColor: 'teal',
      description: 'Sell your services starting at $5, scale to thousands',
      rating: '4.3/5',
      earning: '$100-$5,000+/mo',
      difficulty: 'Easy'
    },
    {
      name: 'YouTube',
      category: 'Content Creation',
      categoryColor: 'purple',
      description: 'Create videos and earn from ads, sponsorships, and more',
      rating: '4.7/5',
      earning: '$1,000-$50,000+/mo',
      difficulty: 'Hard'
    },
    {
      name: 'Swagbucks',
      category: 'Surveys',
      categoryColor: 'cyan',
      description: 'Complete surveys and tasks to earn rewards and cash',
      rating: '4.2/5',
      earning: '$50-$300/mo',
      difficulty: 'Easy'
    },
    {
      name: 'Etsy',
      category: 'E-commerce',
      categoryColor: 'green',
      description: 'Sell handmade, vintage items, and craft supplies',
      rating: '4.4/5',
      earning: '$200-$5,000+/mo',
      difficulty: 'Medium'
    },
    {
      name: 'Amazon FBA',
      category: 'E-commerce',
      categoryColor: 'green',
      description: 'Sell products on Amazon with fulfillment by Amazon',
      rating: '4.6/5',
      earning: '$1,000-$20,000+/mo',
      difficulty: 'Hard'
    }
  ];

  return (
    <section id="platforms-preview" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4">Featured Platforms</h2>
          <p className="text-lg text-slate-600 mb-2">20+ verified platforms ready for you to explore</p>
          <p className="text-sm text-amber-600 font-semibold">Unlock full details with a donation</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dummyPlatforms.map((platform, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 relative overflow-hidden" style={{ borderColor: '#43ADD8' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-teal-800" style={{ filter: 'blur(8px)', userSelect: 'none' }}>
                    {platform.name}
                  </CardTitle>
                  <Badge className={`bg-${platform.categoryColor}-600`}>{platform.category}</Badge>
                </div>
                <CardDescription className="text-slate-600 line-clamp-2">
                  {platform.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 backdrop-blur-[2px] flex items-center justify-center">
                  <Lock className="h-8 w-8" style={{ color: '#43ADD8' }} />
                </div>
                <div className="flex items-center gap-2 opacity-60">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{platform.rating}</span>
                </div>
                <div className="flex items-center justify-between text-sm opacity-60">
                  <span className="text-slate-600">Earning Potential:</span>
                  <span className="font-semibold text-emerald-700">{platform.earning}</span>
                </div>
                <div className="flex items-center justify-between text-sm opacity-60">
                  <span className="text-slate-600">Difficulty:</span>
                  <Badge variant={platform.difficulty === 'Easy' ? 'default' : 'secondary'}>{platform.difficulty}</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" style={{ borderColor: '#43ADD8', color: '#43ADD8' }} disabled>
                  <Lock className="mr-2 h-4 w-4" />
                  Unlock to Access
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* CTA to unlock */}
        <div className="mt-16 text-center">
          <Card className="shadow-lg max-w-2xl mx-auto border-2" style={{ background: 'linear-gradient(to bottom right, #e0f2fe, #bfdbfe)', borderColor: '#43ADD8' }}>
            <CardContent className="py-8">
              <Lock className="h-12 w-12 mx-auto mb-4" style={{ color: '#43ADD8' }} />
              <h3 className="text-2xl font-bold mb-3" style={{ color: '#43ADD8' }}>Unlock All Platform Details</h3>
              <p className="text-slate-700 mb-6">
                Get full access to detailed information, ratings, direct links, and earning strategies for all 20+ platforms
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

export default PlatformPreview;
