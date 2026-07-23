import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useSEO from '../hooks/useSEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, ExternalLink, Star, TrendingUp, DollarSign, Filter, Search, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SuccessStories = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Success Stories | Real People Earning Money Online | Income Online',
    description: 'Read 60+ verified success stories from real people earning online — from Upwork freelancing to Prolific surveys. See how others grew their income.',
    canonical: 'https://www.incomeonline.info/success-stories',
    ogImage: 'https://www.incomeonline.info/earnhub-logo.png',
  });

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API}/seo/success-stories`)
      .then((res) => { if (!cancelled) setStories(res.data?.stories || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);



  const categories = ['All', ...new Set(stories.map(s => s.category))];

  const filteredStories = stories.filter(story => {
    const matchesCategory = selectedCategory === 'All' || story.category === selectedCategory;
    const matchesSearch = story.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.story.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-lg bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:bg-white/10 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold text-white truncate text-center flex-1 min-w-0">
              Success Stories
            </h1>
            <div className="hidden sm:block w-32 flex-shrink-0"></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-10 sm:py-16 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-text">
            Real People, Real Success
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-700 max-w-3xl mx-auto mb-6 sm:mb-8 px-2">
            These are genuine success stories from people who used online platforms to transform their financial situation. 
            Every story includes the source where we found it, so you can verify for yourself.
          </p>
          <div className="flex items-center justify-center gap-4 mb-12 flex-wrap">
            <Badge className="px-4 py-2 text-base bg-gradient-to-r from-purple-600 to-pink-600 border-0">
              <Star className="mr-2 h-4 w-4" />
              {stories.length} Verified Stories
            </Badge>
            <Badge className="px-4 py-2 text-base bg-gradient-to-r from-orange-500 to-amber-500 border-0">
              <TrendingUp className="mr-2 h-4 w-4" />
              All Sources Cited
            </Badge>
          </div>

          {/* Search and Filter */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredStories.length} of {stories.length} stories
            </p>
          </div>
        </div>
      </section>

      {/* Success Stories Grid */}
      <section className="pb-20 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20" data-testid="stories-loading">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredStories.map((story) => (
              <Card 
                key={story.id} 
                className="hover:shadow-2xl transition-all duration-300 border-2"
                style={{ borderColor: '#8b5cf6' }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div className="min-w-0 flex-1">
                      <Link to={`/success-stories/${story.slug}`} data-testid={`story-link-${story.slug}`}>
                        <CardTitle className="text-xl sm:text-2xl mb-2 break-words hover:underline" style={{ color: '#7c3aed' }}>
                          {story.name}
                        </CardTitle>
                      </Link>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <Badge style={{ backgroundColor: '#7c3aed' }}>{story.platform}</Badge>
                        <Badge variant="outline" style={{ borderColor: '#8b5cf6', color: '#7c3aed' }}>
                          {story.category}
                        </Badge>
                      </div>
                    </div>
                    {story.verified && (
                      <Badge className="bg-green-600 flex-shrink-0 whitespace-nowrap">
                        <Star className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <div>
                        <span className="font-semibold text-red-600">Before:</span>
                        <p className="text-slate-600 break-words">{story.before}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-green-600">After:</span>
                        <p className="text-slate-600 break-words">{story.after}</p>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">Earnings</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-green-700 break-words">{story.earnings}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4" style={{ color: '#7c3aed' }} />
                          <span className="text-sm font-semibold" style={{ color: '#7c3aed' }}>Timeline</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold break-words" style={{ color: '#7c3aed' }}>{story.timeline}</p>
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
                        style={{ color: '#7c3aed' }}
                      >
                        View Original Source
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    {/* Read full story (own SEO landing page) */}
                    <Link
                      to={`/success-stories/${story.slug}`}
                      data-testid={`read-full-story-${story.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-colors"
                    >
                      Read full story
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Write Your Own Success Story?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join Income Online and get access to the same platforms these successful people used
          </p>
          <Button 
            size="lg" 
            className="bg-white hover:bg-gray-100 text-lg px-8 py-6 font-bold text-purple-700"
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
            className="mt-4 text-purple-600 hover:text-purple-700"
          >
            Return to Income Online Homepage
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default SuccessStories;
