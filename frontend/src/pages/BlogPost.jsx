import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar, Clock, ArrowLeft, Share2, Tag, Loader2, ChevronRight, Twitter, Facebook, Linkedin, Link2, Check } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchRecentPosts();
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/blog/posts/${slug}`);
      const data = await response.json();
      
      if (data.success) {
        setPost(data.post);
      } else {
        setError('Post not found');
      }
    } catch (err) {
      setError('Failed to load post');
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/blog/recent?limit=5`);
      const data = await response.json();
      
      if (data.success) {
        setRecentPosts(data.posts.filter(p => p.slug !== slug));
      }
    } catch (err) {
      console.error('Error fetching recent posts:', err);
    }
  };

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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: url
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  // Convert markdown-like content to HTML
  const renderContent = (content) => {
    if (!content) return '';
    
    // Simple markdown conversion
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-slate-900 mt-8 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-teal-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Lists
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4 list-decimal">$2</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="text-slate-700 leading-relaxed mb-4">')
      .replace(/\n/g, '<br />');
    
    return `<p class="text-slate-700 leading-relaxed mb-4">${html}</p>`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Article Not Found</h1>
          <p className="text-slate-600 mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/blog')} className="bg-teal-600 hover:bg-teal-700">
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-teal-50">
      <Helmet>
        <title>{post.title} | Income Online Blog</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        <link rel="canonical" href={`https://www.incomeonline.info/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Header */}
      <header className="border-b border-teal-800 sticky top-0 z-50 shadow-lg" style={{backgroundColor: '#165e84'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <img 
                src="/earnhub-logo.jpeg" 
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

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center text-sm text-slate-500">
          <Link to="/" className="hover:text-teal-600">Home</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link to="/blog" className="hover:text-teal-600">Blog</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-slate-700 truncate">{post.title}</span>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Featured Image */}
        {post.featured_image && (
          <div className="rounded-xl overflow-hidden shadow-lg mb-8">
            <img 
              src={post.featured_image} 
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Badge variant="outline" className="text-teal-700 border-teal-300">
            {post.category}
          </Badge>
          <span className="text-sm text-slate-500 flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(post.published_at)}
          </span>
          <span className="text-sm text-slate-500 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {estimateReadTime(post.content)}
          </span>
          {post.views && (
            <span className="text-sm text-slate-500">
              {post.views} views
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
          {post.title}
        </h1>

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-slate-500" />
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-slate-100">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Share & Navigation */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/blog')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Article
          </Button>
        </div>

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">More Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentPosts.slice(0, 4).map((recentPost) => (
                <Card 
                  key={recentPost.slug}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/blog/${recentPost.slug}`)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-slate-900 hover:text-teal-600 transition-colors line-clamp-2">
                      {recentPost.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">
                      {formatDate(recentPost.published_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </article>

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

export default BlogPost;
