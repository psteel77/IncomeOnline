import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Lock, Download, BookOpen, Sparkles, Crown, Check, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fallback list (used if the metadata endpoint is unreachable). Kept in sync
// with the backend PILLARS table in pdf_routes.py.
const FALLBACK_PILLARS = [
  { n: 1, title: 'The Complete Beginner’s Guide to Making Money Online', tier: 'free' },
  { n: 2, title: '75 Ways to Make Money Online', tier: 'basic' },
  { n: 3, title: 'Best Side Hustles in the UK', tier: 'basic' },
  { n: 4, title: 'Best Survey Sites Compared', tier: 'basic' },
  { n: 5, title: 'Best Freelance Platforms', tier: 'basic' },
  { n: 6, title: 'How to Earn £500 a Month from Home', tier: 'basic' },
  { n: 7, title: 'How to Earn £1,000 a Month from Home', tier: 'basic' },
  { n: 8, title: '25 Best Online Jobs for Retirees', tier: 'basic' },
  { n: 9, title: 'Best AI Side Hustles', tier: 'basic' },
  { n: 10, title: 'Best Work-From-Home Jobs', tier: 'basic' },
  { n: 11, title: 'Best Online Jobs for Students', tier: 'premium' },
  { n: 12, title: 'Best Online Jobs for Parents', tier: 'premium' },
  { n: 13, title: 'Best Passive Income Ideas', tier: 'premium' },
  { n: 14, title: 'Best Cashback Websites', tier: 'premium' },
  { n: 15, title: 'Best User-Testing Websites', tier: 'premium' },
  { n: 16, title: 'Best GPT (Get-Paid-To) Sites', tier: 'premium' },
  { n: 17, title: 'Best Mystery Shopping Apps', tier: 'premium' },
  { n: 18, title: 'Build Multiple Income Streams', tier: 'premium' },
  { n: 19, title: 'Passive Income for Beginners', tier: 'premium' },
  { n: 20, title: 'Avoiding Online Money-Making Scams', tier: 'premium' },
];

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) {
    const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const TierBadge = ({ tier, accessible }) => {
  if (accessible && tier !== 'free') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full" data-testid="pillar-tier-unlocked">
        <Check className="h-2.5 w-2.5" /> UNLOCKED
      </span>
    );
  }
  if (tier === 'free') {
    return (
      <span className="text-[11px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full" data-testid="pillar-tier-free">
        FREE
      </span>
    );
  }
  if (tier === 'basic') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full" data-testid="pillar-tier-basic">
        <Lock className="h-2.5 w-2.5" /> £9.99
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full" data-testid="pillar-tier-premium">
      <Crown className="h-2.5 w-2.5" /> £14.99
    </span>
  );
};

const pillarFilename = (p) => {
  const slug = (p.title || '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `Pillar_${p.n}_${slug}.pdf`;
};

const PillarSeriesSection = () => {
  const { isAuthenticated, isPremium } = useAuth();
  const [pillars, setPillars] = useState(FALLBACK_PILLARS);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API}/pdf/pillars`)
      .then((res) => {
        if (!cancelled && Array.isArray(res.data?.pillars) && res.data.pillars.length) {
          setPillars(res.data.pillars);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Can the current visitor open this pillar?
  const hasAccess = (tier) => {
    if (tier === 'free') return true;
    if (tier === 'basic') return isAuthenticated;
    return isAuthenticated && isPremium; // premium
  };

  const download = async (p) => {
    // Free pillar — open directly, no auth.
    if (p.tier === 'free') {
      window.open(`${API}/pdf/pillar/${p.n}`, '_blank');
      return;
    }
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast.error('Please sign in with your membership to download this Pillar.');
      return;
    }
    setBusy(p.n);
    try {
      const res = await axios.get(`${API}/pdf/pillar/${p.n}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = pillarFilename(p);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloading Pillar ${p.n} — enjoy!`);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403 && p.tier === 'premium') {
        toast.error('This Pillar is for Premium members (£14.99).');
        scrollToId('premium-pack');
      } else if (status === 401 || status === 403) {
        toast.error('This Pillar is for members. Join to unlock the series.');
        scrollToId('root');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setBusy(null);
    }
  };

  const renderButton = (p) => {
    if (hasAccess(p.tier)) {
      return (
        <Button
          onClick={() => download(p)}
          disabled={busy === p.n}
          data-testid={`pillar-download-${p.n}`}
          className={`w-full font-bold text-white ${
            p.tier === 'premium'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
          }`}
        >
          {busy === p.n ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing…</>
          ) : (
            <><Download className="mr-2 h-4 w-4" /> {p.tier === 'free' ? 'Download Free' : 'Download'}</>
          )}
        </Button>
      );
    }
    // Locked — route the visitor to the right payment tier.
    if (p.tier === 'basic') {
      return (
        <Button
          onClick={() => scrollToId('root')}
          data-testid={`pillar-unlock-${p.n}`}
          variant="outline"
          className="w-full border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-bold"
        >
          <Lock className="mr-2 h-4 w-4" /> Unlock — £9.99
        </Button>
      );
    }
    // premium locked (visitor is either logged-out or a £9.99 member)
    return (
      <Button
        onClick={() => scrollToId('premium-pack')}
        data-testid={`pillar-unlock-${p.n}`}
        className="w-full font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
      >
        <Crown className="mr-2 h-4 w-4" /> {isAuthenticated ? 'Upgrade — £14.99' : 'Go Premium — £14.99'}
      </Button>
    );
  };

  return (
    <section
      id="pillar-series"
      className="py-16 px-4 sm:px-6 lg:px-8 bg-white"
      data-testid="pillar-series-section"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 rounded-full px-3 py-1 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest">The Pillar Series</span>
          </div>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 mb-3"
            data-testid="pillar-series-title"
          >
            The 20 Pillars of Online Income
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Deep-dive, print-ready brochures that build into a complete money-making playbook.
          </p>
        </div>

        {/* Who gets what — 3-tier access explainer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto" data-testid="pillar-tiers-legend">
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5 text-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-500 text-white px-2.5 py-0.5 rounded-full mb-2">FREE</span>
            <p className="text-sm font-bold text-slate-900">Pillar 1</p>
            <p className="text-xs text-slate-600 mt-1">Free for everyone — no payment needed.</p>
          </div>
          <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-5 text-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-purple-600 text-white px-2.5 py-0.5 rounded-full mb-2"><Lock className="h-2.5 w-2.5" /> £9.99</span>
            <p className="text-sm font-bold text-slate-900">Pillars 1–10</p>
            <p className="text-xs text-slate-600 mt-1">Unlocked with a one-off £9.99 membership.</p>
          </div>
          <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full mb-2"><Crown className="h-2.5 w-2.5" /> £14.99</span>
            <p className="text-sm font-bold text-slate-900">All 20 Pillars</p>
            <p className="text-xs text-slate-600 mt-1">The complete series for Premium members.</p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="text-center mb-6" data-testid="pillar-member-status">
            {isPremium ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 bg-amber-100 rounded-full px-3 py-1">
                <Crown className="h-4 w-4" /> Premium member — all 20 Pillars unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 bg-purple-100 rounded-full px-3 py-1">
                <Check className="h-4 w-4" /> Member — Pillars 1–10 unlocked ·{' '}
                <button onClick={() => scrollToId('premium-pack')} className="underline hover:text-purple-900" data-testid="pillar-upgrade-link">
                  upgrade for all 20
                </button>
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((p) => {
            const accessible = hasAccess(p.tier);
            return (
              <div
                key={p.n}
                className={`relative flex flex-col rounded-2xl border-2 p-5 shadow-sm hover:shadow-lg transition-shadow ${
                  p.tier === 'premium'
                    ? 'border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/60'
                    : 'border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50'
                }`}
                data-testid={`pillar-card-${p.n}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
                    Pillar {p.n} / 20
                  </span>
                  <TierBadge tier={p.tier} accessible={accessible} />
                </div>

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow ${
                  p.tier === 'premium'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-purple-600 to-pink-500'
                }`}>
                  {accessible ? <BookOpen className="h-5 w-5 text-white" /> : <Lock className="h-5 w-5 text-white" />}
                </div>

                <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-4 flex-1">{p.title}</h3>

                {renderButton(p)}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        {!isPremium && (
          <div className="mt-10 text-center">
            <Button
              onClick={() => scrollToId(isAuthenticated ? 'premium-pack' : 'root')}
              data-testid="pillar-series-cta"
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-8"
              size="lg"
            >
              {isAuthenticated ? 'Upgrade to Premium — unlock all 20' : 'Unlock the full series'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PillarSeriesSection;
