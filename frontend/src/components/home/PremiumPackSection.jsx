import React from 'react';
import { Card, CardContent } from '../ui/card';
import {
  Check, Sparkles, Lock, Gift, Calculator, BookOpenCheck, Unlock, FileText,
} from 'lucide-react';
import PayPalPremiumButton from '../PayPalPremiumButton';

const PACK_CONTENTS = [
  { icon: Unlock,        text: 'Full access to all 199+ verified platforms for 12 months (the $9.99 plan — included)' },
  { icon: BookOpenCheck, text: 'All 10 MoneyRules guides as print-ready PDFs (100+ pages)' },
  { icon: FileText,      text: '4 premium-only Strategy documents: Investor\u2019s Starter Kit, Buy-to-Let Profit, Tax-Efficiency Masterclass & 12-Month Money Makeover' },
  { icon: Calculator,    text: '6 interactive Excel calculators with live charts \u2014 type your numbers in, watch the graphs redraw' },
  { icon: Gift,          text: 'Printable welcome letter + first dibs on every new guide we publish' },
];

/**
 * Premium Pack = a SUPERSET of the $9.99 basic plan. Buying Premium ($14.99)
 * grants the same 12-month platform access PLUS the Wealth Generator bundle.
 * Payment is server-verified via the PayPal SDK (see PayPalPremiumButton):
 * on success the backend activates access, issues a one-time download token,
 * and the ZIP download starts automatically.
 */
const PremiumPackSection = () => {
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
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-400">Wealth Generator</span> Pack
          </h2>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
            Everything in the $9.99 plan <span className="font-semibold text-amber-200">plus</span> our complete toolkit — guides, premium strategies and interactive calculators.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Left: What's inside */}
          <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20">
            <CardContent className="p-7 text-white">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                <Gift className="h-5 w-5 text-amber-300" />
                Everything You Get
              </h3>
              <ul className="space-y-3.5" data-testid="premium-pack-contents">
                {PACK_CONTENTS.map(({ text }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mt-0.5 shadow-md">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm sm:text-base leading-relaxed text-white/90">{text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-5 border-t border-white/15 text-xs text-white/60 leading-relaxed">
                Platform access activates instantly. The bundle downloads as a single ZIP the moment your payment clears — keep it forever, edit freely.
              </div>
            </CardContent>
          </Card>

          {/* Right: Price + PayPal */}
          <Card className="border-0 shadow-2xl bg-white">
            <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400" />
            <CardContent className="p-7">
              <div className="text-center mb-6">
                <p className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2">Best value · One-off payment</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl sm:text-6xl font-extrabold text-slate-900" data-testid="premium-price">$14.99</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  12-month access + the full Wealth Generator bundle
                </p>
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  Just $5 more than basic access — for 20 guides &amp; tools
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-4 text-center">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pay securely with PayPal below. Your platform access unlocks and your pack
                  downloads automatically the moment payment is confirmed.
                </p>
              </div>

              <div className="relative z-0 w-full max-w-full overflow-hidden">
                <PayPalPremiumButton />
              </div>

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
