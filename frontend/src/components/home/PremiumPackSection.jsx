import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Check, FileText, Sparkles, Lock, Gift, Calculator, BookOpenCheck, Loader2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PACK_CONTENTS = [
  { icon: BookOpenCheck, text: 'All 10 free MoneyRules Word guides (100+ pages total)' },
  { icon: Sparkles,      text: '2 EXCLUSIVE premium-only guides: Wealth Roadmap + FIRE Playbook' },
  { icon: Calculator,    text: '5 editable Excel spreadsheets — budget, debt, compounding, emergency fund, net worth' },
  { icon: FileText,      text: 'Printable welcome letter with library overview' },
  { icon: Gift,          text: 'Lifetime access + first dibs on every new guide we publish' },
];

const PremiumPackSection = () => {
  const paypalLoaded = useRef(false);
  const [emailForBuy, setEmailForBuy] = useState(() => {
    try { return localStorage.getItem('io_resource_email') || ''; } catch { return ''; }
  });
  const [phase, setPhase] = useState('idle'); // idle | processing | success | error
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  // Record purchase with our backend + issue a download URL
  const recordPurchase = async (orderId) => {
    setPhase('processing');
    try {
      const email = (emailForBuy || '').trim().toLowerCase() ||
        `buyer-${orderId.slice(0,8)}@pending.incomeonline.info`;
      const res = await axios.post(`${API}/pdf/premium-pack/purchase`, {
        email,
        paypal_order_id: orderId,
        amount: '12.99',
        currency: 'USD',
      });
      setDownloadUrl(`${BACKEND_URL}${res.data.download_url}`);
      setPhase('success');
      // Auto-trigger download
      setTimeout(() => { window.open(`${BACKEND_URL}${res.data.download_url}`, '_blank'); }, 800);
    } catch (e) {
      setError('Payment confirmed, but we couldn\'t issue your download. Please email us with your PayPal receipt.');
      setPhase('error');
    }
  };

  useEffect(() => {
    if (paypalLoaded.current) return;
    const BUTTON_ID = process.env.REACT_APP_PAYPAL_PREMIUM_PACK_BUTTON_ID;
    const CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;

    if (!BUTTON_ID || !CLIENT_ID) {
      // Env not configured — show fallback message
      return;
    }

    const render = () => {
      if (window.paypal && window.paypal.HostedButtons) {
        window.paypal.HostedButtons({
          hostedButtonId: BUTTON_ID,
          onApprove: (data) => {
            // Called after PayPal confirms payment
            recordPurchase(data.orderID || `HB-${Date.now()}`);
          },
        }).render('#paypal-container-premium').catch(() => {});
      }
    };

    const existing = document.querySelector('script[src*="paypal.com/sdk"]');
    if (existing) {
      paypalLoaded.current = true;
      setTimeout(render, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&components=hosted-buttons&disable-funding=venmo&currency=USD`;
    script.async = true;
    script.id = 'paypal-sdk-premium';
    script.onload = () => { paypalLoaded.current = true; setTimeout(render, 100); };
    document.head.appendChild(script);
    // eslint-disable-next-line
  }, []);

  const BUTTON_ID = process.env.REACT_APP_PAYPAL_PREMIUM_PACK_BUTTON_ID;

  return (
    <section
      id="premium-pack"
      className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      data-testid="premium-pack-section"
    >
      {/* Decorative background */}
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

              {phase === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-center" data-testid="premium-success">
                  <Check className="h-7 w-7 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">Thanks for your purchase!</p>
                  <p className="text-sm text-slate-600 mt-1">Your download should have started.</p>
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-3 text-sm font-semibold text-purple-700 hover:underline"
                    >
                      Click here if it didn't
                    </a>
                  )}
                </div>
              )}

              {phase === 'processing' && (
                <div className="flex items-center justify-center gap-2 py-6 text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Preparing your pack...
                </div>
              )}

              {phase === 'error' && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 text-sm text-rose-700" data-testid="premium-error">
                  {error}
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">
                  Your email (for delivery + receipt)
                </label>
                <input
                  type="email"
                  value={emailForBuy}
                  onChange={(e) => setEmailForBuy(e.target.value)}
                  placeholder="you@example.com"
                  data-testid="premium-email-input"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {BUTTON_ID ? (
                <div id="paypal-container-premium" data-testid="premium-paypal-container" className="relative z-0" />
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900" data-testid="premium-paypal-missing">
                  <p className="font-semibold mb-1">Setup required:</p>
                  <p className="leading-relaxed">
                    Create a PayPal Hosted Button for $12.99 in your PayPal business dashboard,
                    then add <code className="bg-amber-100 px-1 rounded">REACT_APP_PAYPAL_PREMIUM_PACK_BUTTON_ID</code>
                    {' '}to your frontend <code className="bg-amber-100 px-1 rounded">.env</code>.
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5" />
                Secure payment via PayPal — we never see your card details
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PremiumPackSection;
