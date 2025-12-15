import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Star, ExternalLink } from 'lucide-react';
import { categoriesAPI, platformsAPI, contentAPI } from '../services/api';

const PDFView = () => {
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesData, platformsData, contentData] = await Promise.all([
        categoriesAPI.getAll(),
        platformsAPI.getAll(),
        contentAPI.getAll()
      ]);
      
      setCategories(categoriesData);
      setPlatforms(platformsData.platforms);
      setContent(contentData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading platforms...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="text-center mb-12 border-b-4 border-teal-500 pb-8">
        <h1 className="text-5xl font-bold text-teal-700 mb-4">IncomeOnline</h1>
        <p className="text-2xl text-slate-600">Your Complete Directory of {platforms.length} Online Earning Platforms</p>
        <p className="text-lg text-amber-600 mt-2">8 Categories • Verified & Legitimate Opportunities</p>
      </div>

      {/* How It Works */}
      <div className="mb-12 bg-gradient-to-r from-teal-50 to-cyan-50 p-8 rounded-xl">
        <h2 className="text-3xl font-bold text-amber-600 mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-xl font-bold text-teal-700 mb-2">1. Browse & Search</h3>
            <p className="text-slate-600">Explore our comprehensive directory and find opportunities that match your skills.</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-xl font-bold text-teal-700 mb-2">2. Choose Verified Platforms</h3>
            <p className="text-slate-600">Select from our curated list of legitimate, trusted platforms.</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-xl font-bold text-teal-700 mb-2">3. Start Earning</h3>
            <p className="text-slate-600">Sign up and begin your online earning journey with confidence.</p>
          </div>
        </div>
      </div>

      {/* Platforms by Category */}
      {categories.map((category) => {
        const categoryPlatforms = platforms.filter(p => p.category === category.name);
        if (categoryPlatforms.length === 0) return null;
        
        const categoryColor = category.name === 'Freelancing' ? '#0891b2' :
                              category.name === 'Surveys & Research' ? '#2563eb' :
                              category.name === 'Digital Creators/Innovators' ? '#7c3aed' :
                              category.name === 'E-commerce' ? '#0d9488' :
                              category.name === 'Teaching & Tutoring' ? '#4f46e5' :
                              category.name === 'Trading & Investing' ? '#1d4ed8' :
                              category.name === 'Remote Jobs' ? '#6366f1' :
                              category.name === 'Gig Economy' ? '#0284c7' : '#43ADD8';
        
        return (
          <div key={category.id} className="mb-12 break-inside-avoid">
            {/* Category Header */}
            <div className="flex items-center gap-4 mb-6 pb-3 border-b-4" style={{ borderColor: categoryColor }}>
              <h2 className="text-3xl font-bold" style={{ color: categoryColor }}>{category.name}</h2>
              <span className="px-4 py-2 rounded-full text-white font-semibold" style={{ backgroundColor: categoryColor }}>
                {categoryPlatforms.length} platforms
              </span>
            </div>
            
            {/* Category Platforms Grid */}
            <div className="grid grid-cols-2 gap-4">
              {categoryPlatforms.map((platform) => (
                <Card key={platform.id} className="border-2" style={{ borderColor: categoryColor }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-slate-900">{platform.name}</CardTitle>
                        {platform.featured && (
                          <Badge className="mt-1 bg-amber-100 text-amber-700 text-xs">Featured</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{platform.rating}</span>
                      </div>
                    </div>
                    <CardDescription className="mt-2 text-sm">{platform.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Earning Potential:</span>
                      <span className="font-semibold text-emerald-700">{platform.earningsPotential}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Difficulty:</span>
                      <span className="font-medium">{platform.difficulty}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Min Payout:</span>
                      <span className="font-medium">{platform.minPayout}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Link:</span>
                      <span className="font-medium text-teal-600 text-xs break-all">{platform.link}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="mt-12 text-center border-t-4 border-teal-500 pt-8">
        <h2 className="text-2xl font-bold text-teal-700 mb-2">www.incomeonline.info</h2>
        <p className="text-slate-600">© 2025 Income Online. All rights reserved.</p>
        <p className="text-amber-600 mt-2">Your trusted guide to legitimate online earning opportunities</p>
      </div>
    </div>
  );
};

export default PDFView;
