import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Search, Calendar, Clock, ArrowRight, Tag, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const postsPerPage = 9;
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [selectedCategory, currentPage]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * postsPerPage;
      let url = `${API_URL}/api/blog/posts?limit=${postsPerPage}&offset=${offset}`;
      
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
        setTotalPosts(data.total);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/blog/categories`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const estimateReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content ? content.split(/\s+/).length : 0;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-teal-50">
      <Helmet>
        <title>Blog | Income Online - Tips & Guides for Online Earning</title>
        <meta name="description" content="Expert tips, guides, and success stories to help you earn money online. Learn strategies for freelancing, passive income, and more." />
        <link rel="canonical" href="https://www.incomeonline.info/blog" />
      </Helmet>

      {/* Header */}
      <header className="border-b border-teal-800 sticky top-0 z-50 shadow-lg" style={{backgroundColor: '#165e84'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <img 
                src="/earnhub-logo.png" 
                alt="Income Online" 
                className="h-16 md:h-20 w-auto cursor-pointer"
              />
            </Link>
            
            <nav className="flex items-center space-x-4 md:space-x-6">
              <Link to="/" className="text-white hover:text-yellow-300 transition-colors font-medium">
                Home
              </Link>
              <Link to="/blog" className="text-yellow-300 font-bold">
                Blog
              </Link>
              <Link to="/success-stories" className="text-white hover:text-yellow-300 transition-colors font-medium">
                Success Stories
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500 mb-4">
          Income Online Blog
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
          Expert tips, guides, and success stories to help you earn money online
        </p>
        
        {/* Search Bar */}
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 text-base border-2 border-slate-200 focus:border-teal-500 rounded-xl shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
                className={selectedCategory === null ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                All Posts
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.name}
                  variant={selectedCategory === cat.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedCategory(cat.name); setCurrentPage(1); }}
                  className={selectedCategory === cat.name ? "bg-teal-600 hover:bg-teal-700" : ""}
                >
                  {cat.name} ({cat.count})
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Loading articles...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-slate-600">No articles found</p>
              <p className="text-slate-500 mt-2">Check back soon for new content!</p>
              <Button 
                onClick={() => navigate('/')}
                className="mt-6 bg-teal-600 hover:bg-teal-700"
              >
                Go to Homepage
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <Card 
                    key={post.id} 
                    className="hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden cursor-pointer group"
                    onClick={() => navigate(`/blog/${post.slug}`)}
                    data-testid={`blog-post-${post.slug}`}
                  >
                    {post.featured_image && (
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={post.featured_image} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-teal-700 border-teal-300">
                          {post.category}
                        </Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {estimateReadTime(post.content)}
                        </span>
                      </div>
                      <CardTitle className="text-xl text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-slate-600 line-clamp-3 mb-4">
                        {post.excerpt}
                      </CardDescription>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(post.published_at)}
                        </span>
                        <span className="text-teal-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read more <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="px-4 py-2 text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-8 px-4 sm:px-6 lg:px-8" style={{backgroundColor: '#165e84'}}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-200">© 2025 Income Online. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
            <Link to="/blog" className="text-slate-400 hover:text-white transition-colors">Blog</Link>
            <Link to="/success-stories" className="text-slate-400 hover:text-white transition-colors">Success Stories</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Blog;
