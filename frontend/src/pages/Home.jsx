import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, TrendingUp, Shield, Clock, Star, ExternalLink, Filter, Loader2, Lock, Menu, X, Download, FileText, CheckCircle2, Sparkles } from 'lucide-react';
import { categoriesAPI, platformsAPI, statsAPI, contentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AccessGate from '../components/AccessGate';
import HeroSection from '../components/home/HeroSection';
import CategoryPreview from '../components/home/CategoryPreview';
import PlatformPreview from '../components/home/PlatformPreview';
import DonationSection from '../components/home/DonationSection';
import ResourceDownloadDialog from '../components/home/ResourceDownloadDialog';
import ResourceLibraryBanner from '../components/home/ResourceLibraryBanner';
import useSEO from '../hooks/useSEO';
import useLibraryProgress from '../hooks/useLibraryProgress';

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
  const [resourceDialog, setResourceDialog] = useState({ open: false, resource: '', title: '' });
  const { isAuthenticated, loading: authLoading } = useAuth();
  const libProgress = useLibraryProgress();

  useSEO({
    title: 'Income Online | Discover 199+ Legitimate Ways to Earn Money Online',
    description: 'Your comprehensive directory of legitimate online earning opportunities. From freelancing to passive income, find 199+ verified platforms plus free financial guides.',
    canonical: 'https://www.incomeonline.info/',
    ogImage: 'https://www.incomeonline.info/earnhub-logo.png',
  });

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
    if (!platforms || !Array.isArray(platforms)) return [];
    return platforms.filter(platform => {
      const matchesSearch = platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           platform.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || platform.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, platforms]);

  const featuredPlatforms = useMemo(() => {
    if (!platforms || !Array.isArray(platforms)) return [];
    return platforms.filter(p => p.featured);
  }, [platforms]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-6"></div>
          <p className="text-white/80 text-lg">Loading earning opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-center glass p-8 rounded-2xl">
          <p className="text-red-400 mb-4 text-lg">{error}</p>
          <Button onClick={fetchData} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-purple-50/30 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 border-b border-purple-500/20 shadow-lg shadow-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo on the left */}
            <div className="flex items-center">
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <img 
                  src="/earnhub-logo.png" 
                  alt="Income Online - Your Earning Hub" 
                  className="h-16 md:h-20 w-auto cursor-pointer hover-scale rounded-lg"
                />
              </a>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="flex space-x-6 lg:space-x-8 max-md:hidden items-center ml-8">
              <a 
                href="#how-it-works" 
                onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="text-white hover:text-pink-300 transition-all duration-300 font-medium cursor-pointer no-underline animated-underline"
              >
                How It Works
              </a>
              <a 
                href="#categories-preview" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  const target = document.getElementById('categories-preview') || document.getElementById('categories');
                  target?.scrollIntoView({ behavior: 'smooth' }); 
                }}
                className="text-white hover:text-pink-300 transition-all duration-300 font-medium cursor-pointer no-underline animated-underline"
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
                className="text-white hover:text-pink-300 transition-all duration-300 font-medium cursor-pointer no-underline animated-underline"
              >
                Platforms
              </a>
              <a 
                href="#success-stories"
                onClick={(e) => { 
                  e.preventDefault(); 
                  const section = document.getElementById('success-stories');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = '/success-stories';
                  }
                }}
                className="text-white hover:text-pink-300 transition-all duration-300 font-medium cursor-pointer no-underline animated-underline"
              >
                Success Stories
              </a>
              <a 
                href="#support" 
                onClick={(e) => { e.preventDefault(); document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold rounded-full hover:from-pink-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-pink-500/30 cursor-pointer no-underline"
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
                href="#success-stories"
                onClick={(e) => { 
                  e.preventDefault(); 
                  const section = document.getElementById('success-stories');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = '/success-stories';
                  }
                  setMobileMenuOpen(false);
                }}
                className="block text-white hover:text-yellow-300 transition-colors font-medium py-2"
              >
                Success Stories
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

      {/* Resource Library Banner — prominent, animated, below hero */}
      <ResourceLibraryBanner count={7} />

      {/* Categories Section - Only show when authenticated */}
      {!authLoading && isAuthenticated && (
      <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-pink-50/50 to-white">
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
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 shadow-xl">
                  <CardContent className="py-16 text-center">
                    <Lock className="h-20 w-20 text-purple-600 mx-auto mb-6" />
                    <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600 mb-4">{content.platforms_featured?.locked_title || 'Platforms Locked'}</h3>
                    <p className="text-xl text-slate-700 mb-6 max-w-2xl mx-auto">
                      {content.platforms_featured?.locked_description || `Support us with a donation to unlock full access to all ${platforms.length}+ earning platforms with detailed reviews and direct links.`}
                    </p>
                    <div className="space-y-4">
                      <Button 
                        onClick={() => document.getElementById('support').scrollIntoView({ behavior: 'smooth' })}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6 border-0"
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
                <CardFooter className="flex flex-col gap-2">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 border-0" onClick={() => window.open(platform.link, '_blank')}>
                    Learn More
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                  {platform.ukAvailable === false && (
                    <p className="text-xs font-bold italic text-center" style={{ color: '#8B5CF6' }}>
                      Service not available to UK residents
                    </p>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* All Platforms Section - Only show when authenticated */}
      {!authLoading && isAuthenticated && (
      <section id="platforms" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.15)' }}>{content.platforms_all?.title || 'All Platforms'}</h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-600">{isAuthenticated ? `Explore our ${platforms.length} verified earning opportunities across 8 categories` : (content.platforms_all?.subtitle || 'Explore our comprehensive directory and find opportunities that match your skills and interests.')}</p>
          </div>

          {!authLoading && !isAuthenticated ? (
            // Show locked message for unauthenticated users
            <div className="max-w-2xl mx-auto">
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 shadow-xl">
                <CardContent className="py-16 text-center">
                  <Lock className="h-20 w-20 text-purple-600 mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600 mb-4">{content.platforms_all?.locked_title || 'Content Locked'}</h3>
                  <p className="text-xl text-slate-700 mb-6 max-w-2xl mx-auto">
                    {content.platforms_all?.locked_description || 'Make a donation to view all platforms and start your earning journey today.'}
                  </p>
                  <Button 
                    onClick={() => document.getElementById('support').scrollIntoView({ behavior: 'smooth' })}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6 border-0"
                  >
                    Donate Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Category Quick Navigation */}
              <div className="mb-10 p-6 bg-white rounded-xl shadow-lg border-2 border-purple-200">
                <h3 className="text-lg text-slate-600 mb-4 text-center">make money online, make money from home</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        const element = document.getElementById(`cat-${cat.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`);
                        if (element) {
                          const headerHeight = 80;
                          const elementPosition = element.getBoundingClientRect().top;
                          const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                        }
                      }}
                      className="px-3 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
                      style={{ 
                        backgroundColor: cat.name === 'Freelancing' ? '#7c3aed' :
                                        cat.name === 'Surveys & Research' ? '#db2777' :
                                        cat.name === 'Digital Creators/Innovators' ? '#8b5cf6' :
                                        cat.name === 'E-commerce' ? '#ea580c' :
                                        cat.name === 'Teaching & Tutoring' ? '#a855f7' :
                                        cat.name === 'Trading & Investing' ? '#6366f1' :
                                        cat.name === 'Remote Jobs' ? '#ec4899' :
                                        cat.name === 'Gig Economy' ? '#f97316' : '#7c3aed',
                        color: 'white'
                      }}
                    >
                      {cat.name.length > 15 ? cat.name.substring(0, 12) + '...' : cat.name}
                      <span className="block text-xs opacity-80">({cat.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platforms by Category */}
              {categories.map((category) => {
                const categoryPlatforms = platforms.filter(p => p.category === category.name);
                if (categoryPlatforms.length === 0) return null;
                
                const categoryColor = category.name === 'Freelancing' ? '#7c3aed' :
                                      category.name === 'Surveys & Research' ? '#db2777' :
                                      category.name === 'Digital Creators/Innovators' ? '#8b5cf6' :
                                      category.name === 'E-commerce' ? '#ea580c' :
                                      category.name === 'Teaching & Tutoring' ? '#a855f7' :
                                      category.name === 'Trading & Investing' ? '#6366f1' :
                                      category.name === 'Remote Jobs' ? '#ec4899' :
                                      category.name === 'Gig Economy' ? '#f97316' : '#7c3aed';
                
                return (
                  <div 
                    key={category.id} 
                    id={`cat-${category.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`}
                    className="mb-12"
                  >
                    {/* Category Header */}
                    <div className="flex items-center gap-4 mb-6 pb-3 border-b-4" style={{ borderColor: categoryColor }}>
                      <h3 
                        className="text-2xl sm:text-3xl font-bold"
                        style={{ color: categoryColor }}
                      >
                        {category.name}
                      </h3>
                      <span 
                        className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: categoryColor }}
                      >
                        {categoryPlatforms.length} platforms
                      </span>
                    </div>
                    
                    {/* Category Platforms Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryPlatforms.map((platform) => (
                        <Card key={platform.id} className="hover:shadow-lg transition-all duration-300 border border-slate-200">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg text-slate-900">{platform.name}</CardTitle>
                                {platform.featured && (
                                  <Badge className="mt-1 bg-amber-100 text-amber-700 text-xs">Featured</Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-semibold">{platform.rating}</span>
                              </div>
                            </div>
                            <CardDescription className="mt-3 text-sm line-clamp-3">{platform.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Earning:</span>
                              <span className="font-semibold text-emerald-700">{platform.earningsPotential}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Difficulty:</span>
                              <Badge variant="secondary" className="text-xs">{platform.difficulty}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Min Payout:</span>
                              <span className="font-medium">{platform.minPayout}</span>
                            </div>
                          </CardContent>
                          <CardFooter className="flex flex-col gap-2">
                            <Button 
                              variant="outline" 
                              className="w-full border-2 hover:text-white transition-all"
                              style={{ borderColor: categoryColor, color: categoryColor }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = categoryColor}
                              onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = categoryColor; }}
                              onClick={() => window.open(platform.link, '_blank')}
                            >
                              Learn More
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                            {platform.ukAvailable === false && (
                              <p className="text-xs font-bold italic text-center" style={{ color: '#8B5CF6' }}>
                                Service not available to UK residents
                              </p>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </section>
      )}

      {/* How It Works - Show ABOVE Browse Categories for unauthenticated users */}
      {!authLoading && !isAuthenticated && (
      <section id="how-it-works" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 mb-3 sm:mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.15)' }}>{content.how_it_works?.title || 'How It Works'}</h2>
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
                <h3 className="text-lg sm:text-xl font-bold text-purple-800 mb-2 sm:mb-3" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.1)' }}>{step.title}</h3>
                <p className="text-sm sm:text-base text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
          
          {/* Conclusion step (no image) - centered, spanning full width */}
          {(content.how_it_works?.steps || []).filter(step => !step.image || step.image.trim() === '').map((step, index) => (
            <div key={`conclusion-${index}`} className="mt-10 sm:mt-12 text-center max-w-4xl mx-auto">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600 leading-relaxed px-4">
                {step.title}
              </p>
              {step.description && step.description.trim() !== '' && (
                <p className="mt-3 text-base sm:text-lg text-slate-600">{step.description}</p>
              )}
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Preview Categories Section - Show to unauthenticated users AFTER How It Works */}
      {!authLoading && !isAuthenticated && (
        <CategoryPreview />
      )}

      {/* Preview Platforms Section - Show to unauthenticated users */}
      {!authLoading && !isAuthenticated && (
        <PlatformPreview />
      )}


      {/* Success Stories Section - Only show when authenticated */}
      {!authLoading && isAuthenticated && (
      <section id="success-stories" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.15)' }}>{content.success_stories?.title || 'Success Stories'}</h2>
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
                    <Badge className="mt-2 bg-purple-100 text-purple-700">{story.category}</Badge>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Free Resources Section - Always visible */}
      <section id="free-resources" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 mb-3">
              MoneyRules Library — 7 Free Guides
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-5">Professional Word documents you can download, edit and print</p>

            {/* Progress tracker (only visible once the user has downloaded at least one) */}
            {libProgress.downloadedCount > 0 && (
              <div
                className="max-w-md mx-auto"
                data-testid="library-progress-tracker"
              >
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    Your library progress
                  </span>
                  <span data-testid="library-progress-count">
                    {libProgress.downloadedCount} of 7 downloaded
                  </span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(100, (libProgress.downloadedCount / 7) * 100)}%` }}
                  />
                </div>
                {libProgress.downloadedCount === 7 ? (
                  <p className="mt-3 text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600 flex items-center justify-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-pink-500" />
                    Library complete — well done!
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    {7 - libProgress.downloadedCount} guide{7 - libProgress.downloadedCount === 1 ? '' : 's'} left to unlock
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                key: 'rule-of-72',
                title: 'The Rule of 72',
                subtitle: 'Complete Investment Guide',
                desc: 'The powerful shortcut that tells you exactly when your money will double. Worked examples, comparison tables, real scenarios.',
                accent: 'from-purple-500 via-pink-500 to-orange-500',
                iconBg: 'from-purple-600 to-pink-500',
                btn: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
              },
              {
                key: 'budget-503020',
                title: 'The 50/30/20 Rule',
                subtitle: 'Simplest Budget System',
                desc: 'Split every pound into Needs, Wants, and Savings. Worked examples at every income level and a 30-minute action plan.',
                accent: 'from-pink-500 via-orange-500 to-amber-500',
                iconBg: 'from-pink-600 to-orange-500',
                btn: 'from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700',
              },
              {
                key: 'passive-income',
                title: 'Passive Income',
                subtitle: "Beginner's Guide",
                desc: 'The 7 streams of passive income, honestly explained. What they really earn, how to start, and realistic timelines.',
                accent: 'from-purple-500 to-indigo-500',
                iconBg: 'from-purple-600 to-indigo-600',
                btn: 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
              },
              {
                key: 'debt-snowball',
                title: 'The Debt Snowball',
                subtitle: 'Clear Debts Faster',
                desc: 'The proven method to escape credit cards, overdrafts and loans — with worked UK examples and step-by-step rollover rules.',
                accent: 'from-rose-500 to-pink-600',
                iconBg: 'from-rose-600 to-pink-600',
                btn: 'from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700',
              },
              {
                key: 'emergency-fund',
                title: '3-Month Emergency Fund',
                subtitle: 'Financial Security Blueprint',
                desc: 'Why 3 months, where to keep it, and how to build it in 6–18 months. The single best money move you can make this year.',
                accent: 'from-emerald-500 to-teal-600',
                iconBg: 'from-emerald-600 to-teal-600',
                btn: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
              },
              {
                key: 'compound-interest',
                title: 'Compound Interest',
                subtitle: 'The Handbook',
                desc: 'Why Einstein called it the 8th wonder — the formula, real scenarios for retirement, children, house deposits, and the dark side of debt.',
                accent: 'from-indigo-500 via-purple-500 to-pink-500',
                iconBg: 'from-indigo-600 to-purple-600',
                btn: 'from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
              },
              {
                key: 'uk-tax-basics',
                title: 'UK Tax Basics',
                subtitle: 'For Freelancers',
                desc: 'Self Assessment without the jargon. £1,000 trading allowance, expenses you can claim, key dates, and the dreaded January surprise.',
                accent: 'from-amber-500 to-orange-600',
                iconBg: 'from-amber-600 to-orange-600',
                btn: 'from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
              },
            ].map((g) => {
              const isDone = libProgress.downloaded.has(g.key);
              return (
              <Card
                key={g.key}
                data-testid={`resource-card-${g.key}`}
                className={`relative overflow-hidden border-0 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white ${isDone ? 'ring-2 ring-purple-300' : ''}`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${g.accent}`}></div>
                {isDone && (
                  <div
                    className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-md"
                    data-testid={`downloaded-badge-${g.key}`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Downloaded
                  </div>
                )}
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${g.iconBg} rounded-xl flex items-center justify-center shadow-md`}>
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{g.title}</h3>
                      <p className="text-xs text-slate-500 font-medium">{g.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed line-clamp-3">{g.desc}</p>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      data-testid={`download-${g.key}-btn`}
                      size="sm"
                      className={`${isDone
                        ? 'bg-white text-purple-700 border-2 border-purple-300 hover:bg-purple-50'
                        : `bg-gradient-to-r ${g.btn} text-white`} font-semibold rounded-full shadow hover:shadow-md transition-all`}
                      onClick={() => setResourceDialog({ open: true, resource: g.key, title: `${g.title} — ${g.subtitle}` })}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      {isDone ? 'Download again' : 'Download'}
                    </Button>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">.docx · 10 pages</span>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Donation Section - Always visible */}
      <DonationSection />


      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-800">
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
              className="bg-white hover:bg-white/90 transition-all duration-300 hover:scale-105 px-6 sm:px-8 w-full sm:w-auto text-purple-700 font-bold"
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
              className="bg-white hover:bg-white/90 border-2 border-pink-300 transition-all duration-300 px-6 sm:px-8 w-full sm:w-auto text-purple-700 font-bold"
              onClick={() => window.location.href = '/success-stories'}
            >
              {content.cta?.button_secondary || 'Read Success Stories'}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-2 sm:col-span-2 md:col-span-1">
              <div className="mb-4">
                <img 
                  src="/earnhub-logo.png" 
                  alt="Income Online - Your Earning Hub" 
                  className="h-20 sm:h-28 w-auto rounded-lg"
                />
              </div>
              <p className="text-purple-200 text-xs sm:text-sm">{content.footer?.tagline || 'Your trusted guide to legitimate online earning opportunities'}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-pink-300">Categories</h4>
              <ul className="space-y-1 text-xs sm:text-sm text-purple-300">
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
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-pink-300">Resources</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-purple-300">
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
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  How It Works
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
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-pink-300">Company</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-purple-300">
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
          
          <div className="border-t border-purple-500/30 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-purple-200">
            <p>{content.footer?.copyright || '© 2025 Income Online. All rights reserved.'}</p>
          </div>
        </div>
      </footer>

      <ResourceDownloadDialog
        open={resourceDialog.open}
        onOpenChange={(open) => setResourceDialog((prev) => ({ ...prev, open }))}
        resource={resourceDialog.resource}
        title={resourceDialog.title}
        onSuccess={(email, resourceKey) => libProgress.recordDownload(email, resourceKey)}
      />
    </div>
  );
};

export default Home;