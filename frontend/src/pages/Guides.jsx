import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, ArrowRight, BookOpen, Clock, Loader2, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Guides = () => {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState('All');
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Wealth Generator Guides | Make & Manage Money in the UK | Income Online',
    description: 'Free UK money guides — side hustles, freelancing, passive income, budgeting, ISAs, SIPPs and tax. Practical, British-English advice from Income Online.',
    canonical: 'https://www.incomeonline.info/guides',
    ogImage: 'https://www.incomeonline.info/earnhub-logo.png',
  });

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API}/guides`)
      .then((res) => {
        if (cancelled) return;
        setGuides(res.data?.guides || []);
        setCategories(res.data?.categories || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = activeCat === 'All' ? guides : guides.filter((g) => g.category === activeCat);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-pink-50" data-testid="guides-page">
      <header className="sticky top-0 z-50 shadow-lg bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2 text-white hover:bg-white/10" data-testid="guides-back-home">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-lg sm:text-2xl font-bold text-white truncate text-center flex-1">Wealth Generator Guides</h1>
          <div className="hidden sm:block w-32" />
        </div>
      </header>

      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Free UK Money Guides</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600">
            Make money. Keep more of it.
          </h2>
          <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto">
            Practical, no-nonsense guides for UK readers — side hustles, freelancing, budgeting, ISAs, SIPPs and tax. Written in plain British English.
          </p>
        </div>
      </section>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex flex-wrap gap-2 justify-center" data-testid="guides-categories">
            {['All', ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                data-testid={`guides-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCat === cat ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20" data-testid="guides-loading">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-500 py-16" data-testid="guides-empty">New guides are on the way — check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((g) => (
                <Link key={g.id} to={`/guides/${g.slug}`} data-testid={`guide-card-${g.slug}`} className="group">
                  <Card className="h-full overflow-hidden border border-slate-200 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
                    {g.hero_image ? (
                      <div className="h-44 overflow-hidden">
                        <img src={g.hero_image} alt={g.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-44 bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-white/80" />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">{g.category}</Badge>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3.5 w-3.5" /> {g.read_minutes} min read
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-purple-700 transition-colors leading-snug">{g.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{g.excerpt}</p>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 mt-3 group-hover:gap-2.5 transition-all">
                        Read guide <ArrowRight className="h-4 w-4" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-14 px-4 bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-800">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to put these ideas to work?</h2>
          <p className="text-base sm:text-lg mb-6 opacity-90">Unlock our directory of 199+ verified UK earning platforms.</p>
          <Button size="lg" className="bg-white hover:bg-gray-100 text-purple-700 font-bold px-8" onClick={() => navigate('/')} data-testid="guides-cta-home">
            Browse the platforms
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Guides;
