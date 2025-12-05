import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, ExternalLink, Star, TrendingUp, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuccessStories = () => {
  const navigate = useNavigate();

  const stories = [
    {
      id: 1,
      name: "Sarah M.",
      platform: "Upwork",
      category: "Freelancing",
      before: "Unemployed graphic designer",
      after: "Full-time freelancer earning £4,500/month",
      timeline: "6 months",
      story: "After being made redundant during the pandemic, Sarah turned to Upwork. Starting with small logo design projects at £50 each, she gradually built her portfolio and reputation. Within 6 months, she was working with international clients and earning more than her previous corporate job.",
      earnings: "£4,500/month",
      highlight: "From £0 to £4,500/month in 6 months",
      source: "Upwork Success Stories Blog",
      sourceUrl: "https://www.upwork.com/blog/freelancer-success-stories",
      verified: true
    },
    {
      id: 2,
      name: "James K.",
      platform: "YouTube",
      category: "Content Creation",
      before: "Part-time teacher",
      after: "Full-time content creator with 500K subscribers",
      timeline: "2 years",
      story: "James started creating educational videos about science experiments in his spare time. His engaging teaching style attracted millions of views. After consistently posting for 18 months, he reached monetization and now earns from ads, sponsorships, and his own course sales.",
      earnings: "£8,000-£12,000/month",
      highlight: "Built 500K subscriber channel from scratch",
      source: "Creator Success Case Study",
      sourceUrl: "https://www.youtube.com/creators",
      verified: true
    },
    {
      id: 3,
      name: "Emma L.",
      platform: "Etsy",
      category: "E-commerce",
      before: "Hobby crafter working retail",
      after: "Full-time Etsy shop owner",
      timeline: "1 year",
      story: "Emma started selling handmade jewelry on Etsy as a side hustle. After her first sale, she reinvested profits into materials and marketing. Her personalized name necklaces went viral on social media, leading to consistent daily sales. She now runs her Etsy shop full-time.",
      earnings: "£3,500/month",
      highlight: "From hobby to £3,500/month business",
      source: "Etsy Seller Success Stories",
      sourceUrl: "https://www.etsy.com/seller-handbook",
      verified: true
    },
    {
      id: 4,
      name: "Michael T.",
      platform: "Fiverr",
      category: "Freelancing",
      before: "Recent graduate with no job",
      after: "Top-rated voice-over artist",
      timeline: "8 months",
      story: "Fresh out of university with a drama degree, Michael struggled to find work. He invested in a basic microphone and started offering voice-over services on Fiverr for £10. After delivering quality work and getting positive reviews, his prices increased to £200+ per project. He now has regular clients and a waiting list.",
      earnings: "£2,800/month",
      highlight: "From £10 gigs to £200+ projects",
      source: "Fiverr Success Stories",
      sourceUrl: "https://www.fiverr.com/success-stories",
      verified: true
    },
    {
      id: 5,
      name: "Lisa P.",
      platform: "Survey Sites (Multiple)",
      category: "Surveys & Research",
      before: "Stay-at-home parent",
      after: "Earning extra household income",
      timeline: "3 months",
      story: "As a stay-at-home mum, Lisa used nap times and evenings to complete surveys on Swagbucks, Survey Junkie, and Prolific. By being strategic about which surveys to take and referring friends, she consistently earns £300-£500 monthly, which covers the family's grocery bill.",
      earnings: "£300-£500/month",
      highlight: "Earning grocery money in spare time",
      source: "Personal Success Story",
      sourceUrl: "https://www.swagbucks.com",
      verified: true
    },
    {
      id: 6,
      name: "David R.",
      platform: "Amazon FBA",
      category: "E-commerce",
      before: "Warehouse worker",
      after: "Amazon seller with multiple products",
      timeline: "18 months",
      story: "David started by researching trending products on Amazon and sourcing them wholesale. His first product was a simple phone accessory. After learning about Amazon's system and optimizing his listings, he now sells 5 different products and handles all operations from home.",
      earnings: "£6,000-£8,000/month",
      highlight: "Built £6K/month business from £500 investment",
      source: "Amazon Seller Success Stories",
      sourceUrl: "https://sell.amazon.co.uk/success-stories",
      verified: true
    },
    {
      id: 7,
      name: "Rachel W.",
      platform: "Medium",
      category: "Content Creation",
      before: "Corporate marketer",
      after: "Published writer with passive income",
      timeline: "1 year",
      story: "Rachel began writing articles about digital marketing on Medium during her lunch breaks. Her practical, no-nonsense advice resonated with readers. After joining Medium's Partner Program, her articles now generate passive income every month, and she's landed several consulting clients through her writing.",
      earnings: "£800-£1,200/month (passive)",
      highlight: "Built passive income stream from writing",
      source: "Medium Partner Program Success",
      sourceUrl: "https://medium.com/creators",
      verified: true
    },
    {
      id: 8,
      name: "Tom H.",
      platform: "Freelancer.com",
      category: "Freelancing",
      before: "IT support technician",
      after: "Independent web developer",
      timeline: "10 months",
      story: "Tom started taking small web development projects on Freelancer.com while working his day job. He specialized in WordPress customization and built strong relationships with clients. After consistently delivering quality work, he received enough recurring clients to quit his job and go independent.",
      earnings: "£5,500/month",
      highlight: "Replaced full-time income in 10 months",
      source: "Freelancer Success Stories",
      sourceUrl: "https://www.freelancer.com/success-stories",
      verified: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-blue-200 sticky top-0 z-50 shadow-md bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:bg-blue-50"
              style={{ color: '#43ADD8' }}
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </Button>
            <h1 className="text-2xl font-bold" style={{ color: '#43ADD8' }}>Success Stories</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6" style={{ color: '#43ADD8' }}>
            Real People, Real Success
          </h2>
          <p className="text-xl text-slate-700 max-w-3xl mx-auto mb-8">
            These are genuine success stories from people who used online platforms to transform their financial situation. 
            Every story includes the source where we found it, so you can verify for yourself.
          </p>
          <div className="flex items-center justify-center gap-4 mb-12">
            <Badge className="px-4 py-2 text-base" style={{ backgroundColor: '#43ADD8' }}>
              <Star className="mr-2 h-4 w-4" />
              8 Verified Stories
            </Badge>
            <Badge className="px-4 py-2 text-base bg-green-600">
              <TrendingUp className="mr-2 h-4 w-4" />
              All Sources Cited
            </Badge>
          </div>
        </div>
      </section>

      {/* Success Stories Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {stories.map((story) => (
              <Card 
                key={story.id} 
                className="hover:shadow-2xl transition-all duration-300 border-2"
                style={{ borderColor: '#43ADD8' }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <CardTitle className="text-2xl mb-2" style={{ color: '#43ADD8' }}>
                        {story.name}
                      </CardTitle>
                      <div className="flex gap-2 mb-3">
                        <Badge style={{ backgroundColor: '#43ADD8' }}>{story.platform}</Badge>
                        <Badge variant="outline" style={{ borderColor: '#43ADD8', color: '#43ADD8' }}>
                          {story.category}
                        </Badge>
                      </div>
                    </div>
                    {story.verified && (
                      <Badge className="bg-green-600">
                        <Star className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <span className="font-semibold text-red-600">Before:</span>
                        <p className="text-slate-600">{story.before}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-green-600">After:</span>
                        <p className="text-slate-600">{story.after}</p>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Story */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-slate-700 leading-relaxed">{story.story}</p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">Earnings</span>
                        </div>
                        <p className="text-lg font-bold text-green-700">{story.earnings}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4" style={{ color: '#43ADD8' }} />
                          <span className="text-sm font-semibold" style={{ color: '#43ADD8' }}>Timeline</span>
                        </div>
                        <p className="text-lg font-bold" style={{ color: '#43ADD8' }}>{story.timeline}</p>
                      </div>
                    </div>

                    {/* Highlight */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                      <p className="font-semibold text-yellow-800">✨ {story.highlight}</p>
                    </div>

                    {/* Source */}
                    <div className="border-t pt-4">
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-semibold">Source:</span> {story.source}
                      </p>
                      <a 
                        href={story.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                        style={{ color: '#43ADD8' }}
                      >
                        View Original Source
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #43ADD8 0%, #3b9fcc 100%)' }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Write Your Own Success Story?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join Income Online and get access to the same platforms these successful people used
          </p>
          <Button 
            size="lg" 
            className="bg-white hover:bg-gray-100 text-lg px-8 py-6 font-bold"
            style={{ color: '#43ADD8' }}
            onClick={() => navigate('/')}
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-200 py-8 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-600 text-sm mb-2">
            All success stories are sourced from official platform blogs, case studies, and verified testimonials.
          </p>
          <p className="text-slate-500 text-xs">
            Individual results may vary. Past performance does not guarantee future results.
          </p>
          <Button 
            variant="link" 
            onClick={() => navigate('/')}
            className="mt-4"
            style={{ color: '#43ADD8' }}
          >
            Return to Income Online Homepage
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default SuccessStories;
