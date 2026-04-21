import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  Check, FileText, Sparkles, Lock, Gift, Calculator, BookOpenCheck,
  Loader2, ExternalLink, CheckCircle2, AlertCircle,
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
// PayPal NCP link — env var is preferred (lets you swap the link without a
// rebuild) but we fall back to the production link so a forgotten Vercel env
// var never leaves the Premium Pack section unclickable on mobile/desktop.
const PAYPAL_NCP_FALLBACK = 'https://www.paypal.com/ncp/payment/JDBV4RABDSM96';
const PAYPAL_URL = process.env.REACT_APP_PAYPAL_PREMIUM_PACK_URL || PAYPAL_NCP_FALLBACK;

const PACK_CONTENTS = [
  { icon: BookOpenCheck, text: 'All 10 free MoneyRules Word guides (100+ pages total)' },
  { icon: Sparkles,      text: '2 EXCLUSIVE premium-only guides: Wealth Roadmap + FIRE Playbook' },
  { icon: Calculator,    text: '5 editable Excel spreadsheets — budget, debt, compounding, emergency fund, net worth' },
  { icon: FileText,      text: 'Printable welcome letter with library overview' },
  { icon: Gift,          text: 'Lifetime access + first dibs on every new guide we publish' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Premium Pack purchase flow using PayPal NCP (No-Code Payment) link:
 *  1. User enters email, clicks "Pay $12.99 via PayPal" — we record a pending purchase
 *     and open PayPal NCP in a new tab.
 *  2. User pays on PayPal (we don't get a webhook — NCP doesn't expose one).
 *  3. User returns, clicks "I've paid — unlock my pack".
 *  4. Backend issues a one-time download token and the ZIP downloads immediately.
 */
const PremiumPackSection = () => {
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('io_resource_email') || ''; } catch { return ''; }
  });
  const [phase, setPhase] = useState('idle'); // idle | awaiting_payment | confirming | success | error
  const [purchaseId, setPurchaseId] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  const handleOpenPayPal = async () => {
    setError('');
    const e = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(e)) {
      setError('Please enter a valid email — we\'ll deliver your pack receipt here.');
      return;
    }
    try { localStorage.setItem('io_resource_email', e); } catch {}

    try {
      // Record the pending purchase server-side (for audit + reconciliation)
      const res = await axios.post(`${API}/pdf/premium-pack/purchase`, {
        email: e,
        paypal_order_id: 'NCP-PENDING',
        amount: '12.99',
        currency: 'USD',
      });
      setPurchaseId(res.data.token);
      setDownloadUrl(`${BACKEND_URL}${res.data.download_url}`);
      setPhase('awaiting_payment');
      // Open PayPal NCP in a new tab
      window.open(PAYPAL_URL, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Something went wrong preparing the payment. Please try again.');
    }
  };

  const handleConfirmPaid = () => {
    if (!downloadUrl) return;
    setPhase('confirming');
    // Trigger the download in a new tab
    window.open(downloadUrl, '_blank');
    setTimeout(() => setPhase('success'), 900);
  };

  const isSetup = !!PAYPAL_URL;

  return (
    <section
      id="premium-pack"
      className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      data-testid="premium-pack-section"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-25" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-10 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 mb-4">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span className="text-sm font-semibold uppercase tracking-wider">Premium Upgrade</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 leading-tight">
            The MoneyRules <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-400">Premium Pack</span>
          </h2>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
            Everything you need for a lifetime of better money decisions — in one download.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Left: What's inside */}
          <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20">
            <CardContent className="p-7 text-white">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                <Gift className="h-5 w-5 text-amber-300" />
                What's Inside
              </h3>
              <ul className="space-y-3.5">
                {PACK_CONTENTS.map(({ icon: Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mt-0.5 shadow-md">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm sm:text-base leading-relaxed text-white/90">{text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-5 border-t border-white/15 text-xs text-white/60 leading-relaxed">
                Delivered as a single ZIP file the moment your payment clears. Keep forever. Edit freely. Share with family.
              </div>
            </CardContent>
          </Card>

          {/* Right: Price + PayPal */}
          <Card className="border-0 shadow-2xl bg-white">
            <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400" />
            <CardContent className="p-7">
              <div className="text-center mb-6">
                <p className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2">One-off payment</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl sm:text-6xl font-extrabold text-slate-900">$12.99</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">Lifetime access · Instant download</p>
              </div>

              {/* ===== PHASE: IDLE ===== */}
              {phase === 'idle' && (
                <>
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <label htmlFor="premium-email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">
                      Your email (for receipt + delivery)
                    </label>
                    <input
                      id="premium-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      data-testid="premium-email-input"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-rose-600 mb-3" data-testid="premium-error">{error}</p>
                  )}

                  {isSetup ? (
                    <Button
                      onClick={handleOpenPayPal}
                      size="lg"
                      data-testid="premium-pay-btn"
                      className="w-full max-w-full bg-gradient-to-r from-[#003087] to-[#0070ba] hover:from-[#002060] hover:to-[#005ea6] text-white font-bold text-sm sm:text-base py-5 sm:py-6 px-3 sm:px-4 shadow-lg hover:shadow-xl transition-all duration-300 group whitespace-normal break-words"
                    >
                      <span className="sm:hidden">Pay $12.99 · PayPal</span>
                      <span className="hidden sm:inline">Pay $12.99 via PayPal</span>
                      <ExternalLink className="ml-2 h-4 w-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  ) : null}
                </>
              )}

              {/* ===== PHASE: AWAITING PAYMENT ===== */}
              {phase === 'awaiting_payment' && (
                <div data-testid="premium-awaiting">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900 leading-relaxed">
                      <p className="font-semibold mb-1">PayPal opened in a new tab.</p>
                      <p>Complete your $12.99 payment there, then come back here and click below.</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleConfirmPaid}
                    size="lg"
                    data-testid="premium-confirm-paid-btn"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-base py-6 shadow-lg"
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    I've paid — unlock my pack
                  </Button>
                  <button
                    onClick={() => window.open(PAYPAL_URL, '_blank', 'noopener,noreferrer')}
                    className="w-full mt-3 text-xs text-slate-500 hover:text-purple-700 underline"
                  >
                    Didn't see PayPal? Click here to reopen the payment page
                  </button>
                </div>
              )}

              {/* ===== PHASE: CONFIRMING ===== */}
              {phase === 'confirming' && (
                <div className="flex items-center justify-center gap-2 py-6 text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Preparing your download...
                </div>
              )}

              {/* ===== PHASE: SUCCESS ===== */}
              {phase === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center" data-testid="premium-success">
                  <CheckCircle2 className="h-9 w-9 text-green-600 mx-auto mb-3" />
                  <p className="font-bold text-slate-900 text-lg">Thank you!</p>
                  <p className="text-sm text-slate-600 mt-1 mb-4">Your download should have started automatically.</p>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="premium-manual-download"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Didn't start? Click here to download manually
                  </a>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Purchase ref: <code className="text-slate-500">{purchaseId.slice(0, 8)}</code> · Receipt will also arrive in your PayPal email.
                  </p>
                </div>
              )}

              {phase === 'idle' && (
                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5" />
                  Secure payment via PayPal — we never see your card details
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PremiumPackSection;
