import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Lock, Download, BookOpen, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const TOTAL_PILLARS = 20;

// The Pillars that are actually available so far.
const PILLARS = [
  {
    n: 1,
    title: 'The Complete Beginner’s Guide to Making Money Online',
    blurb: 'Your honest roadmap to building an income stack — no hype, just what works.',
    free: true,
    route: 'pillar-1',
    file: 'Pillar_1_The_Complete_Beginners_Guide_to_Making_Money_Online.pdf',
  },
  {
    n: 2,
    title: 'Affiliate Marketing: Building Your First Passive Income Stream',
    blurb: 'Turn honest recommendations into commissions the right way.',
    free: false,
    route: 'pillar-2',
    file: 'Pillar_2_Affiliate_Marketing_Building_Your_First_Passive_Income_Stream.pdf',
  },
];

const scrollToJoin = () => {
  const el = document.getElementById('support');
  if (el) {
    const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  }
};

const PillarSeriesSection = () => {
  const { isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(null);

  const downloadFree = (p) => {
    window.open(`${API}/pdf/${p.route}`, '_blank');
  };

  const downloadMember = async (p) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast.error('Please sign in with your membership to download this Pillar.');
      scrollToJoin();
      return;
    }
    setBusy(p.n);
    try {
      const res = await axios.get(`${API}/pdf/${p.route}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = p.file;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloading Pillar ${p.n} — enjoy!`);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        toast.error('This Pillar is for members. Join to unlock the full series.');
        scrollToJoin();
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      id="pillar-series"
      className="py-16 px-4 sm:px-6 lg:px-8 bg-white"
      data-testid="pillar-series-section"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 rounded-full px-3 py-1 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest">The Pillar Series</span>
          </div>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 mb-3"
            data-testid="pillar-series-title"
          >
            The {TOTAL_PILLARS} Pillars of Online Income
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Deep-dive, print-ready brochures that build into a complete playbook.{' '}
            <span className="font-semibold text-purple-700">Pillar 1 is free</span> — the rest of the
            series is included with membership.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p) => (
            <div
              key={p.n}
              className="relative flex flex-col rounded-2xl border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm hover:shadow-lg transition-shadow"
              data-testid={`pillar-card-${p.n}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                  Pillar {p.n} of {TOTAL_PILLARS}
                </span>
                {p.free ? (
                  <span
                    className="text-xs font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full"
                    data-testid={`pillar-badge-free-${p.n}`}
                  >
                    FIRST ONE FREE
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full"
                    data-testid={`pillar-badge-members-${p.n}`}
                  >
                    <Lock className="h-3 w-3" /> Members
                  </span>
                )}
              </div>

              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mb-3 shadow">
                <BookOpen className="h-5 w-5 text-white" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 leading-snug mb-1.5">{p.title}</h3>
              <p className="text-sm text-slate-600 mb-5 flex-1">{p.blurb}</p>

              {p.free ? (
                <Button
                  onClick={() => downloadFree(p)}
                  data-testid={`pillar-download-${p.n}`}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Free
                </Button>
              ) : isAuthenticated ? (
                <Button
                  onClick={() => downloadMember(p)}
                  disabled={busy === p.n}
                  data-testid={`pillar-download-${p.n}`}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                >
                  {busy === p.n ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing…</>
                  ) : (
                    <><Download className="mr-2 h-4 w-4" /> Download</>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={scrollToJoin}
                  data-testid={`pillar-join-${p.n}`}
                  variant="outline"
                  className="w-full border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-bold"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Join to Unlock
                </Button>
              )}
            </div>
          ))}

          {/* Coming-soon placeholders for the rest of the series */}
          <div
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center"
            data-testid="pillar-coming-soon"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-200 flex items-center justify-center mb-3">
              <Sparkles className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-500">Pillars 3–{TOTAL_PILLARS}</p>
            <p className="text-xs text-slate-400 mt-1">More brochures added regularly — included with membership.</p>
            {!isAuthenticated && (
              <button
                onClick={scrollToJoin}
                data-testid="pillar-coming-soon-join"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800"
              >
                Become a member <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PillarSeriesSection;
