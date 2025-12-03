import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, TrendingUp, Shield, Clock, Star, ExternalLink, Filter, Loader2, Lock } from 'lucide-react';
import { categoriesAPI, platformsAPI, statsAPI, contentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AccessGate from '../components/AccessGate';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [stats, setStats] = useState([]);
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paypalLoaded = useRef(false);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Category images mapping
  const categoryImages = {
    'Freelancing': 'https://images.unsplash.com/photo-1519337364444-c5eeec430101?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwcHJvZmVzc2lvbmFscyUyMHdvcmtpbmclMjBsYXB0b3B8ZW58MHx8fHwxNzY0MDczMTUwfDA&ixlib=rb-4.1.0&q=85',
    'Surveys & Research': 'https://images.unsplash.com/photo-1627634777217-c864268db30c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHxkaXZlcnNlJTIwcHJvZmVzc2lvbmFscyUyMHdvcmtpbmclMjBsYXB0b3B8ZW58MHx8fHwxNzY0MDczMTUwfDA&ixlib=rb-4.1.0&q=85',
    'Content Creation': 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHxyZW1vdGUlMjB3b3JrfGVufDB8fHx8MTc2NDA3MzA2OXww&ixlib=rb-4.1.0&q=85',
    'Trading & Investing': 'https://images.unsplash.com/photo-1654262609484-76d1a8f3b016?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHxkaXZlcnNlJTIwcHJvZmVzc2lvbmFscyUyMHdvcmtpbmclMjBsYXB0b3B8ZW58MHx8fHwxNzY0MDczMTUwfDA&ixlib=rb-4.1.0&q=85',
    'E-commerce': 'https://images.unsplash.com/photo-1586227740560-8cf2732c1531?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxyZW1vdGUlMjB3b3JrfGVufDB8fHx8MTc2NDA3MzA2OXww&ixlib=rb-4.1.0&q=85',
    'Teaching & Tutoring': 'https://images.unsplash.com/photo-1588912914074-b93851ff14b8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwyfHxvbmxpbmUlMjB0ZWFjaGluZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc2NDA3MzE1Nnww&ixlib=rb-4.1.0&q=85',
    'Remote Jobs': 'https://images.unsplash.com/photo-1629184510982-cf91280c1d53?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxmcmVlbGFuY2VyJTIwd29ya2luZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc2NDA3MzExMnww&ixlib=rb-4.1.0&q=85',
    'Gig Economy': 'https://images.unsplash.com/photo-1758611971587-ddc6656822d9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHw0fHxmcmVlbGFuY2VyJTIwd29ya2luZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc2NDA3MzExMnww&ixlib=rb-4.1.0&q=85'
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Load PayPal SDK for donation button
    if (paypalLoaded.current) return;
    
    const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
    if (existingScript) {
      paypalLoaded.current = true;
      if (window.paypal && window.paypal.HostedButtons) {
        setTimeout(() => {
          window.paypal.HostedButtons({
            hostedButtonId: "8M5AKKB9LJW3S",
          }).render("#paypal-container-homepage").catch((error) => {
            console.log('PayPal button render error:', error);
          });
        }, 100);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=BAAb5JvCWdn7JYDqhUeZ_O2MbGr5ASqqkdLndrBFU6s5q0EGRu3VHw5cgW6zHe7Vd-bh5gwq6kenrUGuzY&components=hosted-buttons&disable-funding=venmo&currency=GBP';
    script.async = true;
    script.id = 'paypal-sdk-homepage';
    
    script.onload = () => {
      paypalLoaded.current = true;
      setTimeout(() => {
        if (window.paypal && window.paypal.HostedButtons) {
          window.paypal.HostedButtons({
            hostedButtonId: "8M5AKKB9LJW3S",
          }).render("#paypal-container-homepage").catch((error) => {
            console.log('PayPal button render error:', error);
          });
        }
      }, 100);
    };
    
    document.head.appendChild(script);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [categoriesData, platformsData, statsData, contentData] = await Promise.all([
        categoriesAPI.getAll(),
        platformsAPI.getAll(),
        statsAPI.get(),
        contentAPI.getAll()
      ]);
      
      setCategories(categoriesData);
      setPlatforms(platformsData.platforms);
      setStats(statsData);
      setContent(contentData);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlatforms = useMemo(() => {
    return platforms.filter(platform => {
      const matchesSearch = platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           platform.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || platform.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, platforms]);

  const featuredPlatforms = platforms.filter(p => p.featured);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading earning opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchData} className="bg-teal-600 hover:bg-teal-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-teal-50">
      {/* Header */}
      <header className="border-b border-teal-800 sticky top-0 z-50 shadow-md" style={{backgroundColor: '#165e84'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo on the left */}
            <div className="flex items-center">
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <img 
                  src="/earnhub-logo.jpeg" 
                  alt="Income Online - Your Earning Hub" 
                  className="h-24 w-auto cursor-pointer"
                />
              </a>
            </div>
            <nav className="hidden md:flex space-x-6 lg:space-x-8">
              <a 
                href="#categories" 
                onClick={(e) => { e.preventDefault(); document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="text-white hover:text-yellow-300 transition-colors font-medium cursor-pointer"
              >
                Categories
              </a>
              <a 
                href="#platforms" 
                onClick={(e) => { e.preventDefault(); document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="text-white hover:text-yellow-300 transition-colors font-medium cursor-pointer"
              >
                Platforms
              </a>
              <a 
                href="#how-it-works" 
                onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="text-white hover:text-yellow-300 transition-colors font-medium cursor-pointer"
              >
                How It Works
              </a>
              <a 
                href="#support" 
                onClick={(e) => { e.preventDefault(); document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="text-yellow-300 hover:text-yellow-200 transition-colors font-bold cursor-pointer"
              >
                Donate
              </a>
            </nav>
            <Button 
              className="bg-yellow-500 hover:bg-yellow-400 text-teal-900 font-bold transition-all duration-300 hover:scale-105"
              onClick={() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="grid grid-cols-2 gap-4 h-full">
            <img 
              src="https://images.unsplash.com/photo-1586227740560-8cf2732c1531?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxyZW1vdGUlMjB3b3JrfGVufDB8fHx8MTc2NDA3MzA2OXww&ixlib=rb-4.1.0&q=85"
              alt="Remote work"
              className="w-full h-full object-cover"
            />
            <img 
              src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHxyZW1vdGUlMjB3b3JrfGVufDB8fHx8MTc2NDA3MzA2OXww&ixlib=rb-4.1.0&q=85"
              alt="Online collaboration"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-500 mb-6 leading-tight">
            {content.hero?.title || 'Discover the Best Ways to Earn Money Online'}
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
            {content.hero?.subtitle || 'Your comprehensive directory of legitimate online earning opportunities. From freelancing to passive income, find the perfect way to make money online.'}
          </p>
          
          {/* Access Gate - Show only when NOT authenticated */}
          {!authLoading && !isAuthenticated && (
            <div className="mb-16">
              <AccessGate />
            </div>
          )}
          
          {/* Search Bar - Show only when authenticated */}
          {!authLoading && isAuthenticated && (
            <div className="max-w-2xl mx-auto mb-16">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search for platforms, skills, or earning methods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg border-2 border-slate-200 focus:border-emerald-500 rounded-xl shadow-sm"
              />
            </div>
          </div>
          )}

          {/* Stats - Show only when authenticated */}
          {!authLoading && isAuthenticated && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Categories Section - Only show when authenticated */}
      {!authLoading && isAuthenticated && (
      <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-50 via-cyan-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4">{content.categories?.title || 'Browse by Category'}</h2>
            <p className="text-lg text-slate-600">{content.categories?.subtitle || 'Choose your preferred way to earn money online'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${category.borderColor} bg-gradient-to-br ${category.color} hover:scale-105 overflow-hidden`}
                onClick={() => {
                  setSelectedCategory(category.name);
                  document.getElementById('platforms').scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="relative h-32 overflow-hidden">
                  <img 
                    src={categoryImages[category.name]}
                    alt={category.name}
                    className="w-full h-full object-cover opacity-60"
                  />
                </div>
                <CardHeader>
                  <CardTitle className={`${category.textColor} text-xl`}>{category.name}</CardTitle>
                  <CardDescription className="text-slate-600">{category.description}</CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col items-start space-y-2">
                  <Badge variant="secondary" className="bg-white">{category.count} platforms</Badge>
                  <p className="text-xs text-slate-500 font-medium">{category.totalOpportunities}</p>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Featured Platforms - Only show when authenticated */}
      {!authLoading && isAuthenticated && (
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4">{content.platforms_featured?.title || 'Featured Platforms'}</h2>
            <p className="text-lg text-slate-600">{content.platforms_featured?.subtitle || 'Top-rated and most popular earning opportunities'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {!authLoading && !isAuthenticated ? (
              // Show locked message
              <div className="col-span-full">
                <Card className="bg-gradient-to-br from-slate-50 to-teal-50 border-2 border-teal-300 shadow-xl">
                  <CardContent className="py-16 text-center">
                    <Lock className="h-20 w-20 text-teal-600 mx-auto mb-6" />
                    <h3 className="text-3xl font-bold text-yellow-700 mb-4">{content.platforms_featured?.locked_title || '🔒 Platforms Locked'}</h3>
                    <p className="text-xl text-slate-700 mb-6 max-w-2xl mx-auto">
                      {content.platforms_featured?.locked_description || `Support us with a donation to unlock full access to all ${platforms.length}+ earning platforms with detailed reviews and direct links.`}
                    </p>
                    <div className="space-y-4">
                      <Button 
                        onClick={() => document.getElementById('support').scrollIntoView({ behavior: 'smooth' })}
                        size="lg"
                        className="bg-teal-600 hover:bg-teal-700 text-white text-lg px-8 py-6"
                      >
                        Donate to Unlock
                      </Button>
                      <p className="text-sm text-slate-600">
                        Already donated? Check your email for the verification link
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : featuredPlatforms.map((platform) => (
              <Card key={platform.id} className="hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-emerald-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-slate-900">{platform.name}</CardTitle>
                      <Badge variant="outline" className="mt-2 text-emerald-700 border-emerald-300">{platform.category}</Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-slate-700">{platform.rating}</span>
                    </div>
                  </div>
                  <CardDescription className="mt-4 text-slate-600">{platform.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Earning Potential:</span>
                    <span className="font-semibold text-emerald-700">{platform.earningsPotential}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Difficulty:</span>
                    <Badge variant={platform.difficulty === 'Easy' ? 'default' : platform.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                      {platform.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Min. Payout:</span>
                    <span className="font-medium text-slate-700">{platform.minPayout}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white transition-all duration-300" onClick={() => window.open(platform.link, '_blank')}>
                    Visit Platform
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* All Platforms Section - Only show when authenticated */}
      {!authLoading && isAuthenticated && (
      <section id="platforms" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-cyan-50 to-teal-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-2">{content.platforms_all?.title || 'All Platforms'}</h2>
              <p className="text-lg text-slate-600">{isAuthenticated ? `Showing ${filteredPlatforms.length} platforms` : (content.platforms_all?.subtitle || 'Explore our comprehensive directory and find opportunities that match your skills and interests.')}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Filter className="h-5 w-5 text-slate-500" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {!authLoading && !isAuthenticated ? (
              // Show locked message
              <div className="col-span-full">
                <Card className="bg-gradient-to-br from-slate-50 to-teal-50 border-2 border-teal-300 shadow-xl">
                  <CardContent className="py-16 text-center">
                    <Lock className="h-20 w-20 text-teal-600 mx-auto mb-6" />
                    <h3 className="text-3xl font-bold text-yellow-700 mb-4">{content.platforms_all?.locked_title || '🔒 Content Locked'}</h3>
                    <p className="text-xl text-slate-700 mb-6 max-w-2xl mx-auto">
                      {content.platforms_all?.locked_description || 'Make a donation to view all platforms and start your earning journey today.'}
                    </p>
                    <Button 
                      onClick={() => document.getElementById('support').scrollIntoView({ behavior: 'smooth' })}
                      size="lg"
                      className="bg-teal-600 hover:bg-teal-700 text-white text-lg px-8 py-6"
                    >
                      Donate Now
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : filteredPlatforms.map((platform) => (
              <Card key={platform.id} className="hover:shadow-lg transition-all duration-300 border border-slate-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-slate-900">{platform.name}</CardTitle>
                      <Badge variant="outline" className="mt-2 text-xs">{platform.category}</Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold">{platform.rating}</span>
                    </div>
                  </div>
                  <CardDescription className="mt-3 text-sm">{platform.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Earning:</span>
                    <span className="font-semibold text-emerald-700">{platform.earningsPotential}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Difficulty:</span>
                    <Badge variant="secondary" className="text-xs">{platform.difficulty}</Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full border-teal-600 text-teal-600 hover:bg-teal-50" onClick={() => window.open(platform.link, '_blank')}>
                    Learn More
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600">Start earning money online in three simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1629184510982-cf91280c1d53?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxmcmVlbGFuY2VyJTIwd29ya2luZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc2NDA3MzExMnww&ixlib=rb-4.1.0&q=85"
                  alt="Browse and search"
                  className="w-full h-48 object-cover rounded-xl shadow-md mx-auto"
                />
              </div>
              <h3 className="text-xl font-bold text-yellow-700 mb-3">1. Browse & Search</h3>
              <p className="text-slate-600">Explore our comprehensive directory and find opportunities that match your skills and interests.</p>
            </div>
            
            <div className="text-center">
              <div className="mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1758611971587-ddc6656822d9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHw0fHxmcmVlbGFuY2VyJTIwd29ya2luZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc2NDA3MzExMnww&ixlib=rb-4.1.0&q=85"
                  alt="Choose platforms"
                  className="w-full h-48 object-cover rounded-xl shadow-md mx-auto"
                />
              </div>
              <h3 className="text-xl font-bold text-yellow-700 mb-3">2. Choose Verified Platforms</h3>
              <p className="text-slate-600">Select from our curated list of legitimate, trusted platforms with real earning potential and user reviews.</p>
            </div>
            
            <div className="text-center">
              <div className="mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1551727974-8af20a3322f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHN1Y2Nlc3NmdWx8ZW58MHx8fHwxNzY0MDczMTE3fDA&ixlib=rb-4.1.0&q=85"
                  alt="Start earning"
                  className="w-full h-48 object-cover rounded-xl shadow-md mx-auto"
                />
              </div>
              <h3 className="text-xl font-bold text-yellow-700 mb-3">3. Start Earning</h3>
              <p className="text-slate-600">Sign up on your chosen platforms and begin your online earning journey with confidence and clarity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section - Only show when authenticated */}
      {!authLoading && isAuthenticated && (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-50 to-cyan-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4">Success Stories</h2>
            <p className="text-lg text-slate-600">Real people earning real money online</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3">
                  <img 
                    src="https://images.unsplash.com/photo-1758518731027-78a22c8852ec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxzdWNjZXNzJTIwY2VsZWJyYXRpb258ZW58MHx8fHwxNzY0MDczMTg4fDA&ixlib=rb-4.1.0&q=85"
                    alt="Success story"
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="md:w-2/3 p-6">
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4 italic">"I went from struggling to find work to earning $5,000+ monthly through freelancing platforms. This directory helped me discover legitimate opportunities I never knew existed!"</p>
                  <p className="font-semibold text-slate-900">- Freelance Designer</p>
                  <Badge className="mt-2 bg-teal-100 text-teal-700">Freelancing</Badge>
                </CardContent>
              </div>
            </Card>

            <Card className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3">
                  <img 
                    src="https://images.unsplash.com/photo-1758519290801-c07424a5142a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHw0fHxhY2hpZXZlbWVudCUyMGJ1c2luZXNzfGVufDB8fHx8MTc2NDA3MzE5NHww&ixlib=rb-4.1.0&q=85"
                    alt="Success story"
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="md:w-2/3 p-6">
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4 italic">"Teaching online changed my life! I now reach students worldwide and earn consistently while working from home. The flexibility is incredible!"</p>
                  <p className="font-semibold text-slate-900">- Online Educator</p>
                  <Badge className="mt-2 bg-teal-100 text-teal-700">Teaching & Tutoring</Badge>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>
      )}

      {/* Donation Section - Always visible */}
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

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{background: 'linear-gradient(to right, #43ADD8, #3b9fcc)'}}>
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1758518731027-78a22c8852ec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxzdWNjZXNzJTIwY2VsZWJyYXRpb258ZW58MHx8fHwxNzY0MDczMTg4fDA&ixlib=rb-4.1.0&q=85"
            alt="Success celebration"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Online Earning Journey?</h2>
          <p className="text-xl text-emerald-50 mb-8">Join thousands of people already earning money online through our platform</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-teal-600 hover:bg-teal-50 transition-all duration-300 hover:scale-105 px-8">
              Explore All Platforms
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 transition-all duration-300 px-8">
              Read Success Stories
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-12 px-4 sm:px-6 lg:px-8" style={{backgroundColor: '#165e84'}}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img 
                  src="/earnhub-logo.jpeg" 
                  alt="Income Online - Your Earning Hub" 
                  className="h-28 w-auto"
                />
              </div>
              <p className="text-slate-200 text-sm">{content.footer?.tagline || 'Your trusted guide to legitimate online earning opportunities'}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white cursor-pointer transition-colors">Freelancing</li>
                <li className="hover:text-white cursor-pointer transition-colors">Surveys</li>
                <li className="hover:text-white cursor-pointer transition-colors">Content Creation</li>
                <li className="hover:text-white cursor-pointer transition-colors">Trading</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white cursor-pointer transition-colors">Getting Started</li>
                <li className="hover:text-white cursor-pointer transition-colors">Success Stories</li>
                <li className="hover:text-white cursor-pointer transition-colors">Blog</li>
                <li className="hover:text-white cursor-pointer transition-colors">FAQ</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-white cursor-pointer transition-colors">Contact</li>
                <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-teal-700 pt-8 text-center text-sm text-slate-200">
            <p>{content.footer?.copyright || '© 2025 Income Online. All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;