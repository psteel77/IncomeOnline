import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, TrendingUp, Shield, Clock, Star, ExternalLink, Filter, Loader2, Lock, Menu, X } from 'lucide-react';
import { categoriesAPI, platformsAPI, statsAPI, contentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AccessGate from '../components/AccessGate';
import HeroSection from '../components/home/HeroSection';
import CategoryPreview from '../components/home/CategoryPreview';
import PlatformPreview from '../components/home/PlatformPreview';
import DonationSection from '../components/home/DonationSection';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [stats, setStats] = useState([]);
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Category images mapping
  const categoryImages = {
    'Freelancing': 'https://images.unsplash.com/photo-1519337364444-c5eeec430101?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwcHJvZmVzc2lvbmFscyUyMHdvcmtpbmclMjBsYXB0b3B8ZW58MHx8fHwxNzY0MDczMTUwfDA&ixlib=rb-4.1.0&q=85',
    'Surveys & Research': 'https://images.unsplash.com/photo-1627634777217-c864268db30c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHxkaXZlcnNlJTIwcHJvZmVzc2lvbmFscyUyMHdvcmtpbmclMjBsYXB0b3B8ZW58MHx8fHwxNzY0MDczMTUwfDA&ixlib=rb-4.1.0&q=85',
    'Digital Creators/Innovators': 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHxyZW1vdGUlMjB3b3JrfGVufDB8fHx8MTc2NDA3MzA2OXww&ixlib=rb-4.1.0&q=85',
    'Trading & Investing': 'https://images.unsplash.com/photo-1654262609484-76d1a8f3b016?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHxkaXZlcnNlJTIwcHJvZmVzc2lvbmFscyUyMHdvcmtpbmclMjBsYXB0b3B8ZW58MHx8fHwxNzY0MDczMTUwfDA&ixlib=rb-4.1.0&q=85',
    'E-commerce': 'https://images.unsplash.com/photo-1586227740560-8cf2732c1531?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxyZW1vdGUlMjB3b3JrfGVufDB8fHx8MTc2NDA3MzA2OXww&ixlib=rb-4.1.0&q=85',
    'Teaching & Tutoring': 'https://images.unsplash.com/photo-1588912914074-b93851ff14b8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwyfHxvbmxpbmUlMjB0ZWFjaGluZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc2NDA3MzE1Nnww&ixlib=rb-4.1.0&q=85',
    'Remote Jobs': 'https://images.unsplash.com/photo-1629184510982-cf91280c1d53?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxmcmVlbGFuY2VyJTIwd29ya2luZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc2NDA3MzExMnww&ixlib=rb-4.1.0&q=85',
    'Gig Economy': 'https://images.unsplash.com/photo-1758611971587-ddc6656822d9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHw0fHxmcmVlbGFuY2VyJTIwd29ya2luZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc2NDA3MzExMnww&ixlib=rb-4.1.0&q=85'
  };

  useEffect(() => {
    fetchData();
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
                  className="h-20 md:h-24 w-auto cursor-pointer"
                />
              </a>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="flex space-x-6 lg:space-x-8 max-md:hidden items-center">
              <a 
                href="#categories-preview" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  const target = document.getElementById('categories-preview') || document.getElementById('categories');
                  target?.scrollIntoView({ behavior: 'smooth' }); 
                }}
                className="text-white hover:text-yellow-300 transition-colors font-medium cursor-pointer"
              >
                Categories
              </a>
              <a 
                href="#platforms-preview" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  const target = document.getElementById('platforms-preview') || document.getElementById('platforms');
                  target?.scrollIntoView({ behavior: 'smooth' }); 
                }}
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
                className="text-yellow-300 hover:text-yellow-200 transition-colors font-bold text-lg cursor-pointer"
              >
                Get Started NOW
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 space-y-3">
              <a 
                href="#categories-preview" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  const target = document.getElementById('categories-preview') || document.getElementById('categories');
                  target?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
                className="block text-white hover:text-yellow-300 transition-colors font-medium py-2"
              >
                Categories
              </a>
              <a 
                href="#platforms-preview" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  const target = document.getElementById('platforms-preview') || document.getElementById('platforms');
                  target?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
                className="block text-white hover:text-yellow-300 transition-colors font-medium py-2"
              >
                Platforms
              </a>
              <a 
                href="#how-it-works" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
                className="block text-white hover:text-yellow-300 transition-colors font-medium py-2"
              >
                How It Works
              </a>
              <a 
                href="#support" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
                className="block text-yellow-300 hover:text-yellow-200 transition-colors font-bold py-2 text-lg"
              >
                Get Started NOW
              </a>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection 
        content={content}
        authLoading={authLoading}
        isAuthenticated={isAuthenticated}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        stats={stats}
      />

      {/* Categories Section - Only show when authenticated */}
      {!authLoading && isAuthenticated && (
      <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-50 via-cyan-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.15)' }}>{content.categories?.title || 'Browse by Category'}</h2>
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
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.15)' }}>{content.platforms_featured?.title || 'Featured Platforms'}</h2>
            <p className="text-lg text-slate-600">{content.platforms_featured?.subtitle || 'Top-rated and most popular earning opportunities'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {!authLoading && !isAuthenticated ? (
              // Show locked message
              <div className="col-span-full">
                <Card className="bg-gradient-to-br from-slate-50 to-teal-50 border-2 border-teal-300 shadow-xl">
                  <CardContent className="py-16 text-center">
                    <Lock className="h-20 w-20 text-teal-600 mx-auto mb-6" />
                    <h3 className="text-3xl font-bold text-yellow-700 mb-4" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>{content.platforms_featured?.locked_title || '🔒 Platforms Locked'}</h3>
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
      <section id="platforms" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-cyan-50 to-teal-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.15)' }}>{content.platforms_all?.title || 'All Platforms'}</h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600">{isAuthenticated ? `Showing ${filteredPlatforms.length} platforms` : (content.platforms_all?.subtitle || 'Explore our comprehensive directory and find opportunities that match your skills and interests.')}</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none w-full sm:w-auto"
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
                    <h3 className="text-3xl font-bold text-yellow-700 mb-4" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>{content.platforms_all?.locked_title || '🔒 Content Locked'}</h3>
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
      <section id="how-it-works" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-3 sm:mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.15)' }}>{content.how_it_works?.title || 'How It Works'}</h2>
            <p className="text-base sm:text-lg text-slate-600">{content.how_it_works?.subtitle || 'Join the IncomeOnline community and start earning online in three simple steps'}</p>
          </div>
          
          {/* Regular steps with images - show in 3-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {(content.how_it_works?.steps || [
              { title: '1. Browse & Search', description: 'Explore our comprehensive directory and find opportunities that match your skills and interests.', image: 'https://images.unsplash.com/photo-1629184510982-cf91280c1d53?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxmcmVlbGFuY2VyJTIwd29ya2luZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc2NDA3MzExMnww&ixlib=rb-4.1.0&q=85' },
              { title: '2. Choose Verified Platforms', description: 'Select from our curated list of legitimate, trusted platforms with real earning potential and user reviews.', image: 'https://images.unsplash.com/photo-1758611971587-ddc6656822d9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHw0fHxmcmVlbGFuY2VyJTIwd29ya2luZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc2NDA3MzExMnww&ixlib=rb-4.1.0&q=85' },
              { title: '3. Start Earning', description: 'Sign up on your chosen platforms and begin your online earning journey with confidence and clarity.', image: 'https://images.unsplash.com/photo-1551727974-8af20a3322f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHN1Y2Nlc3NmdWx8ZW58MHx8fHwxNzY0MDczMTE3fDA&ixlib=rb-4.1.0&q=85' }
            ]).filter(step => step.image && step.image.trim() !== '').map((step, index) => (
              <div key={index} className="text-center">
                <div className="mb-4 sm:mb-6">
                  <img 
                    src={step.image}
                    alt={step.title}
                    className="w-full h-40 sm:h-48 object-cover rounded-xl shadow-md mx-auto"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-yellow-700 mb-2 sm:mb-3" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>{step.title}</h3>
                <p className="text-sm sm:text-base text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
          
          {/* Conclusion step (no image) - centered, spanning full width */}
          {(content.how_it_works?.steps || []).filter(step => !step.image || step.image.trim() === '').map((step, index) => (
            <div key={`conclusion-${index}`} className="mt-10 sm:mt-12 text-center max-w-4xl mx-auto">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-700 leading-relaxed px-4" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
                {step.title}
              </p>
              {step.description && step.description.trim() !== '' && (
                <p className="mt-3 text-base sm:text-lg text-slate-600">{step.description}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Preview Categories Section - Show to unauthenticated users */}
      {!authLoading && !isAuthenticated && (
        <CategoryPreview />
      )}

      {/* Preview Platforms Section - Show to unauthenticated users */}
      {!authLoading && !isAuthenticated && (
        <PlatformPreview />
      )}


      {/* Success Stories Section - Only show when authenticated */}
      {!authLoading && isAuthenticated && (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-50 to-cyan-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.15)" }} mb-4">{content.success_stories?.title || 'Success Stories'}</h2>
            <p className="text-lg text-slate-600">{content.success_stories?.subtitle || 'Real people earning real money online'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(content.success_stories?.stories || [
              { quote: "I went from struggling to find work to earning $5,000+ monthly through freelancing platforms. This directory helped me discover legitimate opportunities I never knew existed!", author: "Freelance Designer", category: "Freelancing", image: "https://images.unsplash.com/photo-1758518731027-78a22c8852ec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxzdWNjZXNzJTIwY2VsZWJyYXRpb258ZW58MHx8fHwxNzY0MDczMTg4fDA&ixlib=rb-4.1.0&q=85" },
              { quote: "Teaching online changed my life! I now reach students worldwide and earn consistently while working from home. The flexibility is incredible!", author: "Online Educator", category: "Teaching & Tutoring", image: "https://images.unsplash.com/photo-1758519290801-c07424a5142a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHw0fHxhY2hpZXZlbWVudCUyMGJ1c2luZXNzfGVufDB8fHx8MTc2NDA3MzE5NHww&ixlib=rb-4.1.0&q=85" }
            ]).map((story, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3">
                    <img 
                      src={story.image}
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
                    <p className="text-slate-700 mb-4 italic">"{story.quote}"</p>
                    <p className="font-semibold text-slate-900">- {story.author}</p>
                    <Badge className="mt-2 bg-teal-100 text-teal-700">{story.category}</Badge>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Donation Section - Always visible */}
      <DonationSection />


      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{background: 'linear-gradient(to right, #43ADD8, #3b9fcc)'}}>
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1758518731027-78a22c8852ec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxzdWNjZXNzJTIwY2VsZWJyYXRpb258ZW58MHx8fHwxNzY0MDczMTg4fDA&ixlib=rb-4.1.0&q=85"
            alt="Success celebration"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10 px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">{content.cta?.title || 'Ready to Start Your Online Earning Journey?'}</h2>
          <p className="text-base sm:text-lg md:text-xl text-emerald-50 mb-6 sm:mb-8">{content.cta?.subtitle || 'Join thousands of people already earning money online through our platform'}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button 
              size="lg" 
              className="bg-white hover:bg-white/90 transition-all duration-300 hover:scale-105 px-6 sm:px-8 w-full sm:w-auto"
              style={{ color: '#43ADD8' }}
              onClick={() => {
                const target = document.getElementById('platforms-preview') || document.getElementById('platforms');
                target?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {content.cta?.button_primary || 'Explore All Platforms'}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white hover:bg-white/90 border-2 transition-all duration-300 px-6 sm:px-8 w-full sm:w-auto"
              style={{ color: '#43ADD8', borderColor: '#43ADD8' }}
              onClick={() => window.location.href = '/success-stories'}
            >
              {content.cta?.button_secondary || 'Read Success Stories'}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8" style={{backgroundColor: '#165e84'}}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-2 sm:col-span-2 md:col-span-1">
              <div className="mb-4">
                <img 
                  src="/earnhub-logo.jpeg" 
                  alt="Income Online - Your Earning Hub" 
                  className="h-20 sm:h-28 w-auto"
                />
              </div>
              <p className="text-slate-200 text-xs sm:text-sm">{content.footer?.tagline || 'Your trusted guide to legitimate online earning opportunities'}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Categories</h4>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-400">
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-0.5"
                  onClick={() => {
                    if (isAuthenticated) {
                      setSelectedCategory('Freelancing');
                      document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      const el = document.getElementById('category-freelancing');
                      if (el) {
                        const headerHeight = 80;
                        const elementPosition = el.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                      }
                    }
                  }}
                >
                  Freelancing
                </li>
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-0.5"
                  onClick={() => {
                    if (isAuthenticated) {
                      setSelectedCategory('Surveys & Research');
                      document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      const el = document.getElementById('category-surveys-and-research');
                      if (el) {
                        const headerHeight = 80;
                        const elementPosition = el.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                      }
                    }
                  }}
                >
                  Surveys & Research
                </li>
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-0.5"
                  onClick={() => {
                    if (isAuthenticated) {
                      setSelectedCategory('Digital Creators/Innovators');
                      document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      const el = document.getElementById('category-digital-creators/innovators');
                      if (el) {
                        const headerHeight = 80;
                        const elementPosition = el.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                      }
                    }
                  }}
                >
                  Digital Creators/Innovators
                </li>
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-0.5"
                  onClick={() => {
                    if (isAuthenticated) {
                      setSelectedCategory('Trading & Investing');
                      document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      const el = document.getElementById('category-trading-and-investing');
                      if (el) {
                        const headerHeight = 80;
                        const elementPosition = el.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                      }
                    }
                  }}
                >
                  Trading & Investing
                </li>
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-0.5"
                  onClick={() => {
                    if (isAuthenticated) {
                      setSelectedCategory('E-commerce');
                      document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      const el = document.getElementById('category-e-commerce');
                      if (el) {
                        const headerHeight = 80;
                        const elementPosition = el.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                      }
                    }
                  }}
                >
                  E-commerce
                </li>
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-0.5"
                  onClick={() => {
                    if (isAuthenticated) {
                      setSelectedCategory('Teaching & Tutoring');
                      document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      const el = document.getElementById('category-teaching-and-tutoring');
                      if (el) {
                        const headerHeight = 80;
                        const elementPosition = el.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                      }
                    }
                  }}
                >
                  Teaching & Tutoring
                </li>
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-0.5"
                  onClick={() => {
                    if (isAuthenticated) {
                      setSelectedCategory('Remote Jobs');
                      document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      const el = document.getElementById('category-remote-jobs');
                      if (el) {
                        const headerHeight = 80;
                        const elementPosition = el.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                      }
                    }
                  }}
                >
                  Remote Jobs
                </li>
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-0.5"
                  onClick={() => {
                    if (isAuthenticated) {
                      setSelectedCategory('Gig Economy');
                      document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      const el = document.getElementById('category-gig-economy');
                      if (el) {
                        const headerHeight = 80;
                        const elementPosition = el.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                      }
                    }
                  }}
                >
                  Gig Economy
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Resources</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-400">
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-1"
                  onClick={() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Getting Started
                </li>
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-1"
                  onClick={() => window.location.href = '/success-stories'}
                >
                  Success Stories
                </li>
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-1"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Blog
                </li>
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-1"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  FAQ
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-400">
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-1"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  About Us
                </li>
                <li className="hover:text-white cursor-pointer transition-colors py-1">
                  <a href="mailto:welcome@incomeonline.info" className="hover:text-white">Contact</a>
                </li>
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-1"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Privacy Policy
                </li>
                <li 
                  className="hover:text-white cursor-pointer transition-colors py-1"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Terms of Service
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-teal-700 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-slate-200">
            <p>{content.footer?.copyright || '© 2025 Income Online. All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;