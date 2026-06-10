import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { BookOpen, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Inline email lead-magnet shown at the bottom of every Wealth Generator Guide.
 * Funnels UK organic search traffic into the newsletter (stored in
 * `resource_subscribers`, source `guide`, surfaced in the admin Subscribers +
 * Lead Sources cards and broadcastable later) — the top of the £9.99/£14.99 funnel.
 */
const GuideLeadCapture = () => {
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('io_resource_email') || ''; } catch { return ''; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      await fetch(`${BACKEND_URL}/api/leads/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean, source: 'guide' }),
      });
      try { localStorage.setItem('io_resource_email', clean); } catch { /* ignore */ }
      setDone(true);
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="mt-10 rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-purple-50 border-2 border-amber-200 shadow-lg"
      data-testid="guide-lead-capture"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {done ? (
            <div className="flex items-center gap-2 py-2" data-testid="guide-lead-success">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="font-semibold text-slate-800">
                You're in! We'll email you the free MoneyRules guides and our latest UK money tips.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
                Get our 10 free MoneyRules guides
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Enjoyed this? Pop in your email and we'll send you all 10 free print-ready MoneyRules
                guides — investing, budgeting, tax, ISAs and more. No spam, unsubscribe anytime.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  data-testid="guide-lead-email-input"
                  className="focus-visible:ring-amber-500 bg-white flex-1"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  data-testid="guide-lead-submit-btn"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold whitespace-nowrap"
                >
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                  ) : (
                    <>Send me the free guides <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
              {error && (
                <p className="text-sm text-rose-600 mt-2" data-testid="guide-lead-error">{error}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuideLeadCapture;
