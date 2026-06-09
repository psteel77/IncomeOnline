import React from 'react';
import { Button } from '../ui/button';
import { BookOpenCheck, Sparkles, ChevronDown } from 'lucide-react';

/**
 * Prominent animated banner promoting the MoneyRules resource library.
 * Sits below the hero to catch visitors immediately.
 *
 * Copy is CMS-driven (see `library_banner` content section) with safe fallbacks.
 */
const ResourceLibraryBanner = ({ count = 10, content }) => {
  const cms = content || {};
  const badge = cms.badge || '100% Free · MoneyRules Library';
  // Headline supports a {count} placeholder for the number of guides.
  const rawHeadline = cms.headline || '{count} FREE Financial Guides, Yours to Keep';
  const description = cms.description || 'Download print-ready PDF guides on investing, budgeting, debt, tax, passive income, credit, ISAs and more — no payment, no catch.';
  const ctaPrimary = cms.cta_primary || 'Get My Free Guides';
  const ctaSecondary = cms.cta_secondary || 'or grab the £14.99 Premium Pack →';

  // Replace {count} and highlight the FREE word if it's in the headline
  const headlineText = rawHeadline.replace('{count}', String(count));
  const headlineParts = headlineText.split(/\b(FREE|Free)\b/);

  const scrollToLibrary = () => {
    const el = document.getElementById('free-resources');
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section
      className="relative overflow-hidden py-8 sm:py-10 px-4 sm:px-6 lg:px-8"
      data-testid="resource-library-banner"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 animate-gradient-x" />
      {/* Subtle noise overlay */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35) 0%, transparent 40%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.25) 0%, transparent 45%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8 text-white">
          {/* Pulsing icon */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl animate-pulse" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
              <BookOpenCheck className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
          </div>

          {/* Copy */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-amber-300 text-amber-900 rounded-full px-3 py-1 mb-2 shadow-md" data-testid="library-banner-badge">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-extrabold uppercase tracking-widest">{badge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1.5 leading-tight" data-testid="library-banner-headline">
              {headlineParts.map((part, i) =>
                /^(FREE|Free)$/.test(part) ? (
                  <span key={i} className="bg-white text-purple-700 px-2 rounded-md">{part}</span>
                ) : (
                  <React.Fragment key={i}>{part}</React.Fragment>
                )
              )}
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-2xl" data-testid="library-banner-description">
              {description}
            </p>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0 flex flex-col gap-2">
            <Button
              onClick={scrollToLibrary}
              size="lg"
              data-testid="library-banner-cta"
              className="bg-white text-purple-700 hover:bg-purple-50 font-bold text-base px-6 py-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
            >
              {ctaPrimary}
              <ChevronDown className="ml-2 h-5 w-5 group-hover:translate-y-0.5 transition-transform" />
            </Button>
            <button
              onClick={() => {
                const el = document.getElementById('premium-pack');
                if (el) {
                  const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
                  window.scrollTo({ top, behavior: 'smooth' });
                }
              }}
              data-testid="library-banner-premium-link"
              className="text-xs font-semibold text-white/90 hover:text-white underline underline-offset-2 text-center transition-colors"
            >
              {ctaSecondary}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResourceLibraryBanner;
