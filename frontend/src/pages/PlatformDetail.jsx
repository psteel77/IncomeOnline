import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Star, ExternalLink, ChevronLeft, Loader2, CheckCircle2, XCircle,
  TrendingUp, Zap, CreditCard, Globe2, Sparkles,
} from 'lucide-react';
import useSEO from '../hooks/useSEO';
import SharePanel from '../components/platform/SharePanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const SITE_URL = 'https://www.incomeonline.info';

const DIFFICULTY_STYLES = {
  Easy: 'bg-green-100 text-green-700 border-green-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-rose-50 text-rose-700 border-rose-200',
};

const PlatformDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setRelated([]);
    axios
      .get(`${API}/seo/platform-by-slug/${encodeURIComponent(slug)}`)
      .then((res) => { if (!cancelled) setPlatform(res.data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    axios
      .get(`${API}/seo/related-platforms/${encodeURIComponent(slug)}?limit=6`)
      .then((res) => { if (!cancelled) setRelated(res.data?.related || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [slug]);

  // Derive SEO values (safe when platform is null — useSEO is a no-op for empty values)
  const canonical = platform ? `${SITE_URL}/platforms/${slug}` : '';
  const title = platform
    ? `${platform.name} Review: Earn ${platform.earningsPotential || 'Online'} | Income Online`
    : (error ? 'Platform not found | Income Online' : '');
  const metaDesc = platform
    ? `${platform.name} — ${platform.category}. ${platform.description} Earnings: ${platform.earningsPotential}. Difficulty: ${platform.difficulty}. Min payout: ${platform.minPayout}.`.slice(0, 160)
    : '';

  const jsonLd = platform ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: platform.name,
    description: platform.description,
    category: platform.category,
    url: canonical,
    ...(platform.rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: platform.rating,
        bestRating: 5,
        ratingCount: 1,
      },
    } : {}),
    offers: {
      '@type': 'Offer',
      url: platform.link,
      priceCurrency: 'GBP',
      price: '0',
      availability: 'https://schema.org/InStock',
    },
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

  if (error || !platform) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Platform not found</h1>
            <p className="text-slate-600 mb-6">
              We couldn't find a platform matching <span className="font-mono text-sm">/{slug}</span>.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              data-testid="back-to-home"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    name, category, description, earningsPotential, difficulty,
    rating, minPayout, paymentMethods = [], link, ukAvailable,
  } = platform;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">

      {/* Header bar */}
      <header className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="platform-detail-home-link">
            <img src="/earnhub-logo.png" alt="Income Online" className="h-10 w-auto rounded" />
          </Link>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
          >
            <Link to="/"><ChevronLeft className="h-4 w-4 mr-1" />All 199+ Platforms</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-600 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-purple-700">Home</Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="text-slate-500">{category}</span>
          <span className="mx-2 text-slate-400">/</span>
          <span className="font-medium text-slate-800">{name}</span>
        </nav>

        {/* Hero */}
        <Card className="overflow-hidden border-0 shadow-xl mb-8" data-testid="platform-detail-hero">
          <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
          <CardContent className="p-6 sm:p-10">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 mb-3">
                  {category}
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-2" data-testid="platform-name">
                  {name}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed">
                  {description}
                </p>
              </div>
              {rating && (
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-bold text-slate-800">{rating}</span>
                  <span className="text-sm text-slate-500">/ 5</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg"
                data-testid="visit-platform-btn"
              >
                <a href={link} target="_blank" rel="noopener noreferrer nofollow">
                  Visit {name}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Link to="/">Browse all 199+ platforms</Link>
              </Button>
            </div>

            {/* Share panel */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <SharePanel url={canonical} title={`${name} — ${category} on Income Online`} />
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={TrendingUp} label="Earnings potential" value={earningsPotential} accent="from-purple-500 to-pink-500" />
          <StatCard icon={Zap} label="Difficulty" value={difficulty} badgeClass={DIFFICULTY_STYLES[difficulty]} accent="from-pink-500 to-orange-500" />
          <StatCard icon={CreditCard} label="Minimum payout" value={minPayout} accent="from-orange-500 to-amber-500" />
          <StatCard
            icon={Globe2}
            label="Available in UK"
            value={ukAvailable ? 'Yes' : 'No'}
            accent={ukAvailable ? 'from-green-500 to-emerald-500' : 'from-slate-400 to-slate-500'}
            valueIcon={ukAvailable ? CheckCircle2 : XCircle}
            valueIconColor={ukAvailable ? 'text-green-600' : 'text-rose-500'}
          />
        </div>

        {/* Payment methods */}
        {paymentMethods.length > 0 && (
          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Payment methods
              </h2>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((m) => (
                  <Badge key={m} variant="outline" className="bg-white border-purple-200 text-slate-700 text-sm px-3 py-1">
                    {m}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related platforms — internal links for SEO crawl depth + keep browsing */}
        {related.length > 0 && (
          <section className="mb-8" data-testid="related-platforms">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">
              Related platforms in {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/platforms/${r.slug}`}
                  className="group"
                  data-testid={`related-platform-${r.slug}`}
                >
                  <Card className="border-0 shadow-md hover:shadow-xl transition-shadow h-full">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-bold text-slate-800 group-hover:text-purple-700 transition-colors truncate">
                          {r.name}
                        </h3>
                        {r.rating && (
                          <span className="flex items-center gap-1 text-sm text-slate-600 flex-shrink-0">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {r.rating}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mb-3">{r.category}</p>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-purple-700">
                        <TrendingUp className="h-4 w-4" />
                        {r.earningsPotential || '—'}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Convert CTA */}
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white">
          <CardContent className="p-8 sm:p-10 text-center">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-90" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Discover 198 more verified platforms like {name}
            </h2>
            <p className="text-base sm:text-lg opacity-95 mb-6 max-w-2xl mx-auto">
              Unlock our full directory of 199+ legitimate online earning opportunities with detailed reviews, payment info, and real success stories — all for a one-time £9.99 yearly contribution.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-purple-700 hover:bg-purple-50 font-bold text-base px-8 shadow-lg"
            >
              <Link to="/donate">Unlock the full directory</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-purple-200 py-8 px-4 mt-12">
        <div className="max-w-5xl mx-auto text-center text-sm">
          <p>© 2026 Income Online. All rights reserved.</p>
          <p className="mt-1 opacity-75">Your trusted guide to legitimate online earning opportunities.</p>
        </div>
      </footer>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, accent, badgeClass, valueIcon: ValueIcon, valueIconColor }) => (
  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
    <CardContent className="p-5">
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center mb-3 shadow`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      {badgeClass ? (
        <Badge className={`${badgeClass} font-semibold`} variant="outline">{value || '—'}</Badge>
      ) : (
        <p className="text-base font-bold text-slate-800 flex items-center gap-1.5">
          {ValueIcon && <ValueIcon className={`h-4 w-4 ${valueIconColor}`} />}
          {value || '—'}
        </p>
      )}
    </CardContent>
  </Card>
);

export default PlatformDetail;
