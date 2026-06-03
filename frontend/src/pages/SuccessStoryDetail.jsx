import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useSEO from '../hooks/useSEO';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft, ChevronLeft, Loader2, XCircle, DollarSign,
  TrendingUp, Sparkles, ExternalLink, Star,
} from 'lucide-react';
import StoryLeadCapture from '../components/story/StoryLeadCapture';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const SITE_URL = 'https://www.incomeonline.info';

const SuccessStoryDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    axios
      .get(`${API}/seo/success-story/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (cancelled) return;
        setStory(res.data?.story || null);
        setRelated(res.data?.related || []);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const canonical = story ? `${SITE_URL}/success-stories/${story.slug}` : '';
  const title = story
    ? `${story.name} — ${story.earnings} on ${story.platform} | Success Story | Income Online`
    : (error ? 'Success story not found | Income Online' : '');
  const metaDesc = story
    ? `${story.name}'s success story: ${story.before} to ${story.after}. Earnings: ${story.earnings} via ${story.platform} in ${story.timeline}. ${story.highlight}.`.slice(0, 160)
    : '';

  const jsonLd = story ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: metaDesc,
    url: canonical,
    articleSection: story.category,
    publisher: { '@type': 'Organization', name: 'Income Online', url: SITE_URL },
    mainEntityOfPage: canonical,
    ...(story.sourceUrl ? { citation: story.sourceUrl } : {}),
  } : null;

  useSEO({
    title,
    description: metaDesc,
    canonical,
    ogImage: `${SITE_URL}/earnhub-logo.png`,
    jsonLd,
    noindex: error,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Success story not found</h1>
            <Button
              onClick={() => navigate('/success-stories')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white mt-4"
              data-testid="back-to-stories"
            >
              Read all success stories
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="story-home-link">
            <img src="/earnhub-logo.png" alt="Income Online" className="h-10 w-auto rounded" />
          </Link>
          <Button asChild variant="outline" size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
            <Link to="/success-stories"><ChevronLeft className="h-4 w-4 mr-1" />All stories</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="text-sm text-slate-600 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-purple-700">Home</Link>
          <span className="mx-2 text-slate-400">/</span>
          <Link to="/success-stories" className="hover:text-purple-700">Success Stories</Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="font-medium text-slate-800">{story.name}</span>
        </nav>

        <Card className="overflow-hidden border-0 shadow-xl mb-8" data-testid="story-detail-hero">
          <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
          <CardContent className="p-6 sm:p-10">
            <div className="flex gap-2 flex-wrap mb-4">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">{story.platform}</Badge>
              <Badge variant="outline" className="border-purple-300 text-purple-700">{story.category}</Badge>
              {story.verified && <Badge className="bg-green-600 text-white border-0">Verified</Badge>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4" data-testid="story-name">
              {story.name}: {story.after}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-rose-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-rose-600 mb-1">Before</p>
                <p className="text-slate-700">{story.before}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-600 mb-1">After</p>
                <p className="text-slate-700">{story.after}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 bg-green-50 rounded-lg p-4">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Earnings</p>
                  <p className="font-bold text-green-700">{story.earnings}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-4">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Timeline</p>
                  <p className="font-bold text-purple-700">{story.timeline}</p>
                </div>
              </div>
            </div>

            <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-5">{story.story}</p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-5">
              <p className="font-semibold text-yellow-800">{story.highlight}</p>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600 mb-1"><span className="font-semibold">Source:</span> {story.source}</p>
              <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-700 hover:underline">
                View original source <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Email lead magnet — converts SEO traffic into newsletter subscribers */}
        <div className="mb-8">
          <StoryLeadCapture platform={story.platform} />
        </div>

        {related.length > 0 && (
          <section className="mb-8" data-testid="related-stories">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">More success stories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link key={r.slug} to={`/success-stories/${r.slug}`} className="group"
                  data-testid={`related-story-${r.slug}`}>
                  <Card className="border-0 shadow-md hover:shadow-xl transition-shadow h-full">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-slate-800 group-hover:text-purple-700 transition-colors truncate">
                          {r.name}
                        </h3>
                        {r.verified && <Star className="h-4 w-4 fill-amber-400 text-amber-400 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{r.platform} · {r.category}</p>
                      <p className="text-sm font-semibold text-green-700">{r.earnings}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white">
          <CardContent className="p-8 sm:p-10 text-center">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-90" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Write your own success story</h2>
            <p className="text-base sm:text-lg opacity-95 mb-6 max-w-2xl mx-auto">
              Unlock the same 199+ verified platforms these earners used — one-time $9.99 yearly contribution.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" className="bg-white text-purple-700 hover:bg-purple-50 font-bold">
                <Link to="/donate">Unlock the full directory</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white">
                <Link to={`/platforms/${(story.platform || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}>
                  See {story.platform}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button variant="link" onClick={() => navigate('/success-stories')} className="text-purple-600">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to all success stories
          </Button>
        </div>
      </main>
    </div>
  );
};

export default SuccessStoryDetail;
