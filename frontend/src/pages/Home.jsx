import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, TrendingUp, Shield, Clock, Star, ExternalLink, Filter, Loader2 } from 'lucide-react';
import { categoriesAPI, platformsAPI, statsAPI } from '../services/api';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [categoriesData, platformsData, statsData] = await Promise.all([
        categoriesAPI.getAll(),
        platformsAPI.getAll(),
        statsAPI.get()
      ]);
      
      setCategories(categoriesData);
      setPlatforms(platformsData.platforms);
      setStats(statsData);
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
          <Button onClick={fetchData} className="bg-emerald-600 hover:bg-emerald-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
              <span className="text-2xl font-bold text-slate-900">EarnHub</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#categories" className="text-slate-600 hover:text-slate-900 transition-colors">Categories</a>
              <a href="#platforms" className="text-slate-600 hover:text-slate-900 transition-colors">Platforms</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
            </nav>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 hover:scale-105">
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
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Discover the Best Ways to<br />Earn Money Online
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
            Your comprehensive directory of legitimate online earning opportunities. From freelancing to passive income, find the perfect way to make money online.
          </p>
          
          {/* Search Bar */}
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-emerald-600 mb-2">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Browse by Category</h2>
            <p className="text-lg text-slate-600">Choose your preferred way to earn money online</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${category.borderColor} bg-gradient-to-br ${category.color} hover:scale-105`}
                onClick={() => {
                  setSelectedCategory(category.name);
                  document.getElementById('platforms').scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <CardHeader>
                  <CardTitle className={`${category.textColor} text-xl`}>{category.name}</CardTitle>
                  <CardDescription className="text-slate-600">{category.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Badge variant="secondary" className="bg-white">{category.count} platforms</Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Platforms */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Featured Platforms</h2>
            <p className="text-lg text-slate-600">Top-rated and most popular earning opportunities</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPlatforms.map((platform) => (
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
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300" onClick={() => window.open(platform.link, '_blank')}>
                    Visit Platform
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* All Platforms Section */}
      <section id="platforms" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">All Platforms</h2>
              <p className="text-lg text-slate-600">Showing {filteredPlatforms.length} platforms</p>
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
            {filteredPlatforms.map((platform) => (
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
                  <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50" onClick={() => window.open(platform.link, '_blank')}>
                    Learn More
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600">Start earning money online in three simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Browse & Search</h3>
              <p className="text-slate-600">Explore our comprehensive directory of 277+ platforms and find opportunities that match your skills and interests.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. Choose Verified Platforms</h3>
              <p className="text-slate-600">Select from our curated list of legitimate, trusted platforms with real earning potential and user reviews.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Start Earning</h3>
              <p className="text-slate-600">Sign up on your chosen platforms and begin your online earning journey with confidence and clarity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Online Earning Journey?</h2>
          <p className="text-xl text-emerald-50 mb-8">Join thousands of people already earning money online through our platform</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 transition-all duration-300 hover:scale-105 px-8">
              Explore All Platforms
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 transition-all duration-300 px-8">
              Read Success Stories
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
                <span className="text-xl font-bold">EarnHub</span>
              </div>
              <p className="text-slate-400 text-sm">Your trusted directory for online earning opportunities.</p>
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
          
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>© 2025 EarnHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;