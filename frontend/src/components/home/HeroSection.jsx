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
        <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-500 mb-6 leading-tight">
          {content.hero?.title || 'Discover the Best Ways to Earn Money Online'}
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
          {content.hero?.subtitle || 'Your comprehensive directory of legitimate online earning opportunities. From freelancing to passive income, find the perfect way to make money online.'}
        </p>
        
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;