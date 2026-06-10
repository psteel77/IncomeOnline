import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useSEO from '../hooks/useSEO';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Clock, Loader2, ArrowRight } from 'lucide-react';
import GuideLeadCapture from '../components/guides/GuideLeadCapture';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Markdown → styled React elements (readable typography without the prose plugin)
const mdComponents = {
  h1: ({ node, ...p }) => <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-8 mb-3" {...p} />,
  h2: ({ node, ...p }) => <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-8 mb-3" {...p} />,
  h3: ({ node, ...p }) => <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mt-6 mb-2" {...p} />,
  p:  ({ node, ...p }) => <p className="text-[17px] leading-relaxed text-slate-700 mb-4" {...p} />,
  ul: ({ node, ...p }) => <ul className="list-disc pl-6 mb-4 space-y-1.5 text-slate-700" {...p} />,
  ol: ({ node, ...p }) => <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-slate-700" {...p} />,
  li: ({ node, ...p }) => <li className="text-[17px] leading-relaxed" {...p} />,
  a:  ({ node, ...p }) => <a className="text-purple-700 font-medium underline hover:text-purple-900" target="_blank" rel="noreferrer" {...p} />,
  strong: ({ node, ...p }) => <strong className="font-semibold text-slate-900" {...p} />,
  em: ({ node, ...p }) => <em className="text-slate-600" {...p} />,
  blockquote: ({ node, ...p }) => <blockquote className="border-l-4 border-purple-300 pl-4 italic text-slate-600 my-4" {...p} />,
  table: ({ node, ...p }) => <div className="overflow-x-auto my-4"><table className="w-full text-sm border-collapse" {...p} /></div>,
  th: ({ node, ...p }) => <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold" {...p} />,
  td: ({ node, ...p }) => <td className="border border-slate-200 px-3 py-2" {...p} />,
};

const GuideDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    axios.get(`${API}/guides/${slug}`)
      .then((res) => {
        if (cancelled) return;
        setGuide(res.data?.guide || null);
        setRelated(res.data?.related || []);
      })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  useSEO({
    title: guide ? `${guide.title} | Wealth Generator Guides | Income Online` : 'Guide | Income Online',
    description: guide ? (guide.meta_description || guide.excerpt) : 'UK money guide from Income Online.',
    canonical: `https://www.incomeonline.info/guides/${slug}`,
    ogImage: guide?.hero_image || 'https://www.incomeonline.info/earnhub-logo.png',
    jsonLd: guide ? {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: guide.title,
      description: guide.meta_description || guide.excerpt,
      articleSection: guide.category,
      datePublished: guide.published_at,
      dateModified: guide.updated_at,
      author: { '@type': 'Organization', name: guide.author || 'Income Online' },
      publisher: { '@type': 'Organization', name: 'Income Online' },
      inLanguage: 'en-GB',
      mainEntityOfPage: `https://www.incomeonline.info/guides/${slug}`,
      ...(guide.hero_image ? { image: guide.hero_image } : {}),
    } : null,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" data-testid="guide-loading">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </div>
    );
  }

  if (notFound || !guide) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center" data-testid="guide-not-found">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Guide not found</h1>
        <p className="text-slate-500 mb-6">It may have been moved or unpublished.</p>
        <Button onClick={() => navigate('/guides')}>Read all guides</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="guide-detail-page">
      <header className="sticky top-0 z-50 shadow-md bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center">
          <Button variant="ghost" onClick={() => navigate('/guides')} className="flex items-center gap-2 text-white hover:bg-white/10" data-testid="guide-back-link">
            <ArrowLeft className="h-5 w-5" /> All guides
          </Button>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="text-sm text-slate-400 mb-4" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-purple-600">Home</Link>
          <span className="mx-1.5">›</span>
          <Link to="/guides" className="hover:text-purple-600">Guides</Link>
        </nav>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">{guide.category}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" /> {guide.read_minutes} min read
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4" data-testid="guide-title">{guide.title}</h1>
        {guide.excerpt && <p className="text-lg text-slate-500 mb-6 leading-relaxed">{guide.excerpt}</p>}

        {guide.hero_image && (
          <img src={guide.hero_image} alt={guide.title} className="w-full rounded-2xl mb-8 shadow-lg object-cover max-h-[420px]" />
        )}

        <div data-testid="guide-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {guide.content}
          </ReactMarkdown>
        </div>

        {guide.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100">
            {guide.tags.map((t) => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">#{t}</span>
            ))}
          </div>
        )}

        {/* Email lead-magnet — funnels guide readers into the newsletter */}
        <GuideLeadCapture />

        {/* CTA */}
        <div className="mt-10 rounded-2xl bg-gradient-to-r from-purple-700 to-pink-600 p-6 sm:p-8 text-white text-center" data-testid="guide-cta">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Want the full toolkit?</h2>
          <p className="opacity-90 mb-5">Unlock 199+ verified UK earning platforms for a one-time £9.99/year.</p>
          <Button size="lg" className="bg-white hover:bg-gray-100 text-purple-700 font-bold px-8" onClick={() => navigate('/donate')}>
            Get full access
          </Button>
        </div>
      </article>

      {related.length > 0 && (
        <section className="bg-slate-50 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-5">More guides</h2>
            <div className="space-y-3">
              {related.map((r) => (
                <Link key={r.id} to={`/guides/${r.slug}`} data-testid={`related-guide-${r.slug}`}
                  className="flex items-center justify-between gap-3 bg-white rounded-xl p-4 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group">
                  <div>
                    <p className="font-semibold text-slate-800 group-hover:text-purple-700">{r.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.category} · {r.read_minutes} min read</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-purple-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default GuideDetail;
