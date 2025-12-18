import React from 'react';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';
import AccessGate from '../AccessGate';

const HeroSection = ({ content, authLoading, isAuthenticated, searchTerm, setSearchTerm, stats }) => {
  return (
    <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="grid grid-cols-2 gap-4 h-full">
          <img 
            src="https://images.unsplash.com/photo-1586227740560-8cf2732c1531?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxyZW1vdGUlMjB3b3JrfGVufDB8fHx8MTc2NDA3MzA2OXww&ixlib=rb-4.1.0&q=85"
            alt="Remote work"
            className="w-full h-full object-cover"
          />
          <img 
            src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHxyZW1vdGUlMjB3b3JrfGVufDB8fHx8MTc2NDA3MzA2OXww&ixlib=rb-4.1.0&q=85"
            alt="Online collaboration"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <p className="text-sm sm:text-base md:text-lg text-slate-600 mb-2">How to make money online....</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-500 mb-4 sm:mb-6 leading-tight px-2">
          <span className="block">Discover the Best Ways to</span>
          <span className="block">Earn Money Online</span>
        </h1>
        <div className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-12 max-w-4xl mx-auto px-2 text-center">
          <p className="mb-1">Your comprehensive directory of legitimate online earning opportunities</p>
          <p className="mb-1">- all in one easy to use location!</p>
          <p className="mb-1">From Freelancing to Passive Income, One Time to Part Time to Full Time</p>
          <p>Find the perfect way for you to make money online</p>
        </div>
        
        {/* Access Gate - Show only when NOT authenticated */}
        {!authLoading && !isAuthenticated && (
          <div className="mb-16">
            <AccessGate />
          </div>
        )}
        
        {/* Search Bar - Show only when authenticated */}
        {!authLoading && isAuthenticated && (
          <div className="max-w-2xl mx-auto mb-16">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search for platforms, skills, or earning methods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg border-2 border-slate-200 focus:border-emerald-500 rounded-xl shadow-sm"
            />
          </div>
        </div>
        )}

        {/* Stats - Show only when authenticated */}
        {!authLoading && isAuthenticated && (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-4xl mx-auto px-2">
          {stats.map((stat, index) => {
            // Colorful gradient backgrounds matching category boxes
            const colors = [
              { bg: 'linear-gradient(to bottom right, #e0f2fe, #bfdbfe)', border: '#0891b2', text: '#0891b2' }, // cyan
              { bg: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)', border: '#2563eb', text: '#2563eb' }, // blue
              { bg: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)', border: '#0d9488', text: '#0d9488' }, // teal
              { bg: 'linear-gradient(to bottom right, #ede9fe, #ddd6fe)', border: '#7c3aed', text: '#7c3aed' }  // violet
            ];
            const color = colors[index % colors.length];
            // Convert $ to £ in stat values
            const displayValue = stat.value.replace(/\$/g, '£');
            return (
              <div key={index} className="rounded-xl p-4 sm:p-6 shadow-md border-2 hover:shadow-lg transition-shadow" style={{ background: color.bg, borderColor: color.border }}>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{ color: color.text }}>{displayValue}</div>
                <div className="text-xs sm:text-sm text-slate-700 font-medium">{stat.label}</div>
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