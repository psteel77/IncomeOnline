import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Search, Sparkles, TrendingUp, Users, DollarSign, BookOpenCheck } from 'lucide-react';
import AccessGate from '../AccessGate';
import HeroLeadDialog from './HeroLeadDialog';

const scrollToTarget = (targetId) => {
  const el = document.getElementById(targetId || 'free-resources');
  if (el) {
    const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  }
};

const HeroSection = ({ content, authLoading, isAuthenticated, searchTerm, setSearchTerm, stats }) => {
  const hero = content?.hero || {};
  const badgeText = hero.badge || '199+ Verified Earning Platforms';
  const headlineLine1 = hero.headline_line1 || 'Discover the Best Ways to';
  const headlineLine2 = hero.headline_line2 || 'Earn Money Online';
  const subtitleLine1 = hero.subtitle_line1 || 'Your comprehensive directory of legitimate online earning opportunities';
  const subtitleLine2 = hero.subtitle_line2 || 'From Freelancing to Passive Income • One Time to Full Time';

  // CMS-editable hero pill (label + scroll target + optional email capture)
  const pillEnabled = hero.pill_enabled !== false; // default ON
  const pillLabel = hero.pill_label || 'Free MoneyRules Guides';
  const pillTarget = hero.pill_target || 'free-resources';
  const pillCaptureEmail = hero.pill_capture_email === true;

  const [leadDialogOpen, setLeadDialogOpen] = useState(false);

  const handlePillClick = () => {
    if (pillCaptureEmail) {
      setLeadDialogOpen(true);
    } else {
      scrollToTarget(pillTarget);
    }
  };

  return (
    <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 float-animation"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 float-animation-delay-1"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 float-animation-delay-2"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 mb-4 slide-up" data-testid="hero-badge">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">{badgeText}</span>
        </div>

        {/* Free MoneyRules Guides callout (CMS-editable label + target) */}
        {pillEnabled && (
          <div className="mb-6 slide-up slide-up-delay-1">
            <button
              type="button"
              onClick={handlePillClick}
              data-testid="hero-free-guides-cta"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-pink-300 text-amber-900 border border-amber-400 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <BookOpenCheck className="h-4 w-4" />
              <span className="text-sm font-extrabold uppercase tracking-wider">
                {pillLabel}
              </span>
              <span className="text-xs font-semibold opacity-80">↓</span>
            </button>
          </div>
        )}

        <HeroLeadDialog
          open={leadDialogOpen}
          onOpenChange={setLeadDialogOpen}
          onContinue={() => scrollToTarget(pillTarget)}
        />

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight slide-up slide-up-delay-1" data-testid="hero-heading">
          <span className="block text-gray-900">{headlineLine1}</span>
          <span className="block gradient-text-warm">{headlineLine2}</span>
        </h1>

        {/* Subtitle */}
        <div className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto slide-up slide-up-delay-2" data-testid="hero-subtitle">
          <p className="mb-2">{subtitleLine1}</p>
          <p>{subtitleLine2}</p>
        </div>
        
        {/* Access Gate - Show only when NOT authenticated */}
        {!authLoading && !isAuthenticated && (
          <div className="mb-12 slide-up slide-up-delay-3">
            <AccessGate />
          </div>
        )}
        
        {/* Search Bar - Show only when authenticated */}
        {!authLoading && isAuthenticated && (
          <div className="max-w-2xl mx-auto mb-12 slide-up slide-up-delay-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for platforms, skills, or earning methods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 pr-6 py-7 text-lg border-2 border-gray-200 focus:border-purple-500 rounded-xl shadow-lg bg-white/90 backdrop-blur-sm transition-all duration-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats - Show only when authenticated */}
        {!authLoading && isAuthenticated && stats && stats.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, index) => {
              const icons = [TrendingUp, Users, DollarSign, Sparkles];
              const Icon = icons[index % icons.length];
              const gradients = [
                'from-purple-500 to-indigo-600',
                'from-pink-500 to-rose-600',
                'from-rose-500 to-pink-600',
                'from-amber-500 to-orange-600'
              ];
              const displayValue = stat.value.replace(/\$/g, '$');
              
              return (
                <div 
                  key={index} 
                  className={`stagger-item hover-lift rounded-2xl p-5 bg-gradient-to-br ${gradients[index % gradients.length]} text-white shadow-lg`}
                >
                  <Icon className="h-6 w-6 mb-2 opacity-80" />
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{displayValue}</div>
                  <div className="text-sm opacity-90">{stat.label}</div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};

export default HeroSection;
