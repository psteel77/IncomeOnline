import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { LogOut, Save, Home, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Edit2, X, ChevronDown, ChevronUp, FileText, Download } from 'lucide-react';
import axios from 'axios';
import SitemapPingCard from '../components/admin/SitemapPingCard';
import SubscribersCard from '../components/admin/SubscribersCard';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const { isAdmin, adminUsername, loading: authLoading, logout } = useAdmin();
  const [content, setContent] = useState({});
  const [platforms, setPlatforms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '' });
  const [expandedSections, setExpandedSections] = useState({});
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [newPlatform, setNewPlatform] = useState({
    name: '',
    category: '',
    description: '',
    link: '',
    earningsPotential: '$100-500/month',
    difficulty: 'Medium',
    rating: 4.0,
    minPayout: '$10',
    featured: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const [contentRes, platformsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/api/cms/content`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/cms/platforms`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/cms/categories`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (contentRes.data.success) {
        const contentObj = {};
        contentRes.data.content.forEach(section => {
          contentObj[section.section_id] = section.content;
        });
        setContent(contentObj);
      }
      
      if (platformsRes.data.success) {
        setPlatforms(platformsRes.data.platforms);
      }
      
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.categories);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = useCallback((sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const updateSectionField = useCallback((sectionId, field, value) => {
    setContent(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value
      }
    }));
  }, []);

  const updateNestedField = useCallback((sectionId, parentField, index, field, value) => {
    setContent(prev => {
      const currentSection = prev[sectionId] || {};
      const newArray = [...(currentSection[parentField] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return {
        ...prev,
        [sectionId]: {
          ...currentSection,
          [parentField]: newArray
        }
      };
    });
  }, []);

  const addArrayItem = useCallback((sectionId, field, template) => {
    setContent(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: [...(prev[sectionId]?.[field] || []), template]
      }
    }));
  }, []);

  const removeArrayItem = useCallback((sectionId, field, index) => {
    setContent(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: prev[sectionId]?.[field]?.filter((_, i) => i !== index) || []
      }
    }));
  }, []);

  const saveSection = async (sectionId) => {
    const token = localStorage.getItem('adminToken');
    setSaving(true);
    setSaveStatus({ show: false, success: false, message: '' });

    try {
      const response = await axios.put(
        `${API_URL}/api/cms/content/${sectionId}`,
        { content: content[sectionId] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSaveStatus({
          show: true,
          success: true,
          message: 'Content saved successfully!'
        });
        setTimeout(() => setSaveStatus({ show: false, success: false, message: '' }), 3000);
      }
    } catch (error) {
      setSaveStatus({
        show: true,
        success: false,
        message: error.response?.data?.detail || 'Failed to save content'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlatform = async () => {
    const token = localStorage.getItem('adminToken');
    setSaving(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/cms/platforms`,
        newPlatform,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        setSaveStatus({ show: true, success: true, message: 'Platform added successfully!' });
        setShowAddPlatform(false);
        setNewPlatform({
          name: '', category: '', description: '', link: '',
          earningsPotential: '$100-500/month', difficulty: 'Medium',
          rating: 4.0, minPayout: '$10', featured: false
        });
        fetchData();
        setTimeout(() => setSaveStatus({ show: false, success: false, message: '' }), 3000);
      }
    } catch (error) {
      setSaveStatus({ show: true, success: false, message: error.response?.data?.detail || 'Failed to add platform' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePlatform = async (platformId) => {
    const token = localStorage.getItem('adminToken');
    setSaving(true);

    try {
      const response = await axios.put(
        `${API_URL}/api/cms/platforms/${platformId}`,
        editingPlatform,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        setSaveStatus({ show: true, success: true, message: 'Platform updated successfully!' });
        setEditingPlatform(null);
        fetchData();
        setTimeout(() => setSaveStatus({ show: false, success: false, message: '' }), 3000);
      }
    } catch (error) {
      setSaveStatus({ show: true, success: false, message: error.response?.data?.detail || 'Failed to update platform' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlatform = async (platformId) => {
    if (!window.confirm('Are you sure you want to delete this platform?')) return;
    
    const token = localStorage.getItem('adminToken');
    setSaving(true);

    try {
      const response = await axios.delete(
        `${API_URL}/api/cms/platforms/${platformId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSaveStatus({ show: true, success: true, message: 'Platform deleted successfully!' });
        fetchData();
        setTimeout(() => setSaveStatus({ show: false, success: false, message: '' }), 3000);
      }
    } catch (error) {
      setSaveStatus({ show: true, success: false, message: error.response?.data?.detail || 'Failed to delete platform' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Content Management System</h1>
              <p className="text-sm text-slate-600">Logged in as: {adminUsername}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/')} variant="outline" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                View Site
              </Button>
              <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Save Status Alert */}
      {saveStatus.show && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            saveStatus.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {saveStatus.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>{saveStatus.message}</span>
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* SEO / Sitemap Ping */}
        <SitemapPingCard />

        {/* Subscribers (captured emails from Free Resources gateway) */}
        <SubscribersCard />

        {/* Hero Section */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSection('hero')}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Badge, headline and subtitle above the search bar</CardDescription>
              </div>
              {expandedSections['hero'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections['hero'] && (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Badge Text</label>
                <Input
                  data-testid="hero-badge-input"
                  value={content.hero?.badge || ''}
                  onChange={(e) => updateSectionField('hero', 'badge', e.target.value)}
                  placeholder="199+ Verified Earning Platforms"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Headline Line 1 (dark)</label>
                  <Input
                    data-testid="hero-headline1-input"
                    value={content.hero?.headline_line1 || ''}
                    onChange={(e) => updateSectionField('hero', 'headline_line1', e.target.value)}
                    placeholder="Discover the Best Ways to"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Headline Line 2 (gradient)</label>
                  <Input
                    data-testid="hero-headline2-input"
                    value={content.hero?.headline_line2 || ''}
                    onChange={(e) => updateSectionField('hero', 'headline_line2', e.target.value)}
                    placeholder="Earn Money Online"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle Line 1</label>
                <Input
                  data-testid="hero-subtitle1-input"
                  value={content.hero?.subtitle_line1 || ''}
                  onChange={(e) => updateSectionField('hero', 'subtitle_line1', e.target.value)}
                  placeholder="Your comprehensive directory of legitimate online earning opportunities"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle Line 2</label>
                <Input
                  data-testid="hero-subtitle2-input"
                  value={content.hero?.subtitle_line2 || ''}
                  onChange={(e) => updateSectionField('hero', 'subtitle_line2', e.target.value)}
                  placeholder="From Freelancing to Passive Income • One Time to Full Time"
                />
              </div>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-3">Legacy fields (used by older components)</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Legacy Title</label>
                  <Input
                    value={content.hero?.title || ''}
                    onChange={(e) => updateSectionField('hero', 'title', e.target.value)}
                    placeholder="Legacy combined title"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Legacy Subtitle</label>
                  <Textarea
                    value={content.hero?.subtitle || ''}
                    onChange={(e) => updateSectionField('hero', 'subtitle', e.target.value)}
                    placeholder="Legacy combined subtitle"
                    rows={2}
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">CTA Button Text</label>
                  <Input
                    value={content.hero?.cta_text || ''}
                    onChange={(e) => updateSectionField('hero', 'cta_text', e.target.value)}
                    placeholder="Get Started"
                  />
                </div>
              </div>
              <Button data-testid="save-hero-btn" onClick={() => saveSection('hero')} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Hero Section'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Library Banner Section */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSection('library_banner')}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Library Banner</CardTitle>
                <CardDescription>Purple/pink banner directly below the hero</CardDescription>
              </div>
              {expandedSections['library_banner'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections['library_banner'] && (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Badge (small pill text)</label>
                <Input
                  data-testid="banner-badge-input"
                  value={content.library_banner?.badge || ''}
                  onChange={(e) => updateSectionField('library_banner', 'badge', e.target.value)}
                  placeholder="100% Free · MoneyRules Library"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Headline (use {'{count}'} for guide count)</label>
                <Input
                  data-testid="banner-headline-input"
                  value={content.library_banner?.headline || ''}
                  onChange={(e) => updateSectionField('library_banner', 'headline', e.target.value)}
                  placeholder="{count} FREE Financial Guides, Yours to Keep"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <Textarea
                  data-testid="banner-description-input"
                  value={content.library_banner?.description || ''}
                  onChange={(e) => updateSectionField('library_banner', 'description', e.target.value)}
                  rows={2}
                  placeholder="Download print-ready Word documents..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Primary CTA Button</label>
                  <Input
                    data-testid="banner-cta-primary-input"
                    value={content.library_banner?.cta_primary || ''}
                    onChange={(e) => updateSectionField('library_banner', 'cta_primary', e.target.value)}
                    placeholder="Get My Free Guides"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Link</label>
                  <Input
                    data-testid="banner-cta-secondary-input"
                    value={content.library_banner?.cta_secondary || ''}
                    onChange={(e) => updateSectionField('library_banner', 'cta_secondary', e.target.value)}
                    placeholder="or grab the $12.99 Premium Pack →"
                  />
                </div>
              </div>
              <Button data-testid="save-banner-btn" onClick={() => saveSection('library_banner')} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Library Banner'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Free Resources Section */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSection('free_resources')}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Free Resources Heading</CardTitle>
                <CardDescription>Title and subtitle above the 10 guides grid</CardDescription>
              </div>
              {expandedSections['free_resources'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections['free_resources'] && (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <Input
                  data-testid="free-resources-title-input"
                  value={content.free_resources?.title || ''}
                  onChange={(e) => updateSectionField('free_resources', 'title', e.target.value)}
                  placeholder="MoneyRules Library — 10 Free Guides"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
                <Input
                  data-testid="free-resources-subtitle-input"
                  value={content.free_resources?.subtitle || ''}
                  onChange={(e) => updateSectionField('free_resources', 'subtitle', e.target.value)}
                  placeholder="Professional Word documents you can download, edit and print"
                />
              </div>
              <Button data-testid="save-free-resources-btn" onClick={() => saveSection('free_resources')} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Free Resources'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* How It Works Section */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSection('how_it_works')}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>How It Works Section</CardTitle>
                <CardDescription>The 3-step process shown on the homepage</CardDescription>
              </div>
              {expandedSections['how_it_works'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections['how_it_works'] && (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Section Title</label>
                <Input
                  value={content.how_it_works?.title || ''}
                  onChange={(e) => updateSectionField('how_it_works', 'title', e.target.value)}
                  placeholder="Enter section title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Section Subtitle</label>
                <Input
                  value={content.how_it_works?.subtitle || ''}
                  onChange={(e) => updateSectionField('how_it_works', 'subtitle', e.target.value)}
                  placeholder="Enter section subtitle"
                />
              </div>
              
              <div className="space-y-4 mt-4">
                <label className="block text-sm font-medium text-slate-700">Steps</label>
                {(content.how_it_works?.steps || []).map((step, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-700">Step {index + 1}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removeArrayItem('how_it_works', 'steps', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={step.title || ''}
                      onChange={(e) => updateNestedField('how_it_works', 'steps', index, 'title', e.target.value)}
                      placeholder="Step title (e.g., 1. Browse & Search)"
                    />
                    <Textarea
                      value={step.description || ''}
                      onChange={(e) => updateNestedField('how_it_works', 'steps', index, 'description', e.target.value)}
                      placeholder="Step description"
                      rows={2}
                    />
                    <Input
                      value={step.image || ''}
                      onChange={(e) => updateNestedField('how_it_works', 'steps', index, 'image', e.target.value)}
                      placeholder="Image URL"
                    />
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => addArrayItem('how_it_works', 'steps', { title: '', description: '', image: '' })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Step
                </Button>
              </div>
              
              <Button onClick={() => saveSection('how_it_works')} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save How It Works'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Success Stories Section */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSection('success_stories')}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Success Stories Section</CardTitle>
                <CardDescription>Testimonials and success stories</CardDescription>
              </div>
              {expandedSections['success_stories'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections['success_stories'] && (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Section Title</label>
                <Input
                  value={content.success_stories?.title || ''}
                  onChange={(e) => updateSectionField('success_stories', 'title', e.target.value)}
                  placeholder="Enter section title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Section Subtitle</label>
                <Input
                  value={content.success_stories?.subtitle || ''}
                  onChange={(e) => updateSectionField('success_stories', 'subtitle', e.target.value)}
                  placeholder="Enter section subtitle"
                />
              </div>
              
              <div className="space-y-4 mt-4">
                <label className="block text-sm font-medium text-slate-700">Stories</label>
                {(content.success_stories?.stories || []).map((story, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-700">Story {index + 1}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removeArrayItem('success_stories', 'stories', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={story.quote || ''}
                      onChange={(e) => updateNestedField('success_stories', 'stories', index, 'quote', e.target.value)}
                      placeholder="Testimonial quote"
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={story.author || ''}
                        onChange={(e) => updateNestedField('success_stories', 'stories', index, 'author', e.target.value)}
                        placeholder="Author (e.g., Freelance Designer)"
                      />
                      <Input
                        value={story.category || ''}
                        onChange={(e) => updateNestedField('success_stories', 'stories', index, 'category', e.target.value)}
                        placeholder="Category (e.g., Freelancing)"
                      />
                    </div>
                    <Input
                      value={story.image || ''}
                      onChange={(e) => updateNestedField('success_stories', 'stories', index, 'image', e.target.value)}
                      placeholder="Image URL"
                    />
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => addArrayItem('success_stories', 'stories', { quote: '', author: '', category: '', image: '' })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Story
                </Button>
              </div>
              
              <Button onClick={() => saveSection('success_stories')} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Success Stories'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* CTA Section */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSection('cta')}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Call-to-Action Section</CardTitle>
                <CardDescription>The main CTA banner</CardDescription>
              </div>
              {expandedSections['cta'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections['cta'] && (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <Input
                  value={content.cta?.title || ''}
                  onChange={(e) => updateSectionField('cta', 'title', e.target.value)}
                  placeholder="Enter CTA title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
                <Input
                  value={content.cta?.subtitle || ''}
                  onChange={(e) => updateSectionField('cta', 'subtitle', e.target.value)}
                  placeholder="Enter CTA subtitle"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Primary Button Text</label>
                  <Input
                    value={content.cta?.button_primary || ''}
                    onChange={(e) => updateSectionField('cta', 'button_primary', e.target.value)}
                    placeholder="Primary button text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Button Text</label>
                  <Input
                    value={content.cta?.button_secondary || ''}
                    onChange={(e) => updateSectionField('cta', 'button_secondary', e.target.value)}
                    placeholder="Secondary button text"
                  />
                </div>
              </div>
              <Button onClick={() => saveSection('cta')} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save CTA Section'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Categories Section */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSection('categories')}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Categories Section</CardTitle>
                <CardDescription>Browse by category heading</CardDescription>
              </div>
              {expandedSections['categories'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections['categories'] && (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <Input
                  value={content.categories?.title || ''}
                  onChange={(e) => updateSectionField('categories', 'title', e.target.value)}
                  placeholder="Enter section title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
                <Input
                  value={content.categories?.subtitle || ''}
                  onChange={(e) => updateSectionField('categories', 'subtitle', e.target.value)}
                  placeholder="Enter section subtitle"
                />
              </div>
              <Button onClick={() => saveSection('categories')} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Categories Section'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Donation Section */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSection('donation')}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Donation Section</CardTitle>
                <CardDescription>Content for the donation/support section</CardDescription>
              </div>
              {expandedSections['donation'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections['donation'] && (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <Input
                  value={content.donation?.title || ''}
                  onChange={(e) => updateSectionField('donation', 'title', e.target.value)}
                  placeholder="Enter donation section title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <Textarea
                  value={content.donation?.description || ''}
                  onChange={(e) => updateSectionField('donation', 'description', e.target.value)}
                  placeholder="Enter description"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Why Donate Title</label>
                <Input
                  value={content.donation?.why_donate_title || ''}
                  onChange={(e) => updateSectionField('donation', 'why_donate_title', e.target.value)}
                  placeholder="Enter why donate title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Why Donate Description</label>
                <Textarea
                  value={content.donation?.why_donate_description || ''}
                  onChange={(e) => updateSectionField('donation', 'why_donate_description', e.target.value)}
                  placeholder="Enter why donate description"
                  rows={2}
                />
              </div>
              <Button onClick={() => saveSection('donation')} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Donation Section'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Featured Platforms Section */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSection('platforms_featured')}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Featured Platforms Section</CardTitle>
                <CardDescription>Featured platforms heading and paywall message</CardDescription>
              </div>
              {expandedSections['platforms_featured'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections['platforms_featured'] && (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <Input
                  value={content.platforms_featured?.title || ''}
                  onChange={(e) => updateSectionField('platforms_featured', 'title', e.target.value)}
                  placeholder="Enter section title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
                <Input
                  value={content.platforms_featured?.subtitle || ''}
                  onChange={(e) => updateSectionField('platforms_featured', 'subtitle', e.target.value)}
                  placeholder="Enter section subtitle"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Locked Title (for unauthenticated users)</label>
                <Input
                  value={content.platforms_featured?.locked_title || ''}
                  onChange={(e) => updateSectionField('platforms_featured', 'locked_title', e.target.value)}
                  placeholder="Enter locked message title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Locked Description</label>
                <Textarea
                  value={content.platforms_featured?.locked_description || ''}
                  onChange={(e) => updateSectionField('platforms_featured', 'locked_description', e.target.value)}
                  placeholder="Enter locked message description"
                  rows={2}
                />
              </div>
              <Button onClick={() => saveSection('platforms_featured')} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Featured Section'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* All Platforms Section */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSection('platforms_all')}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Platforms Section</CardTitle>
                <CardDescription>All platforms heading and paywall message</CardDescription>
              </div>
              {expandedSections['platforms_all'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections['platforms_all'] && (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <Input
                  value={content.platforms_all?.title || ''}
                  onChange={(e) => updateSectionField('platforms_all', 'title', e.target.value)}
                  placeholder="Enter section title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
                <Textarea
                  value={content.platforms_all?.subtitle || ''}
                  onChange={(e) => updateSectionField('platforms_all', 'subtitle', e.target.value)}
                  placeholder="Enter section subtitle"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Locked Title (for unauthenticated users)</label>
                <Input
                  value={content.platforms_all?.locked_title || ''}
                  onChange={(e) => updateSectionField('platforms_all', 'locked_title', e.target.value)}
                  placeholder="Enter locked message title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Locked Description</label>
                <Textarea
                  value={content.platforms_all?.locked_description || ''}
                  onChange={(e) => updateSectionField('platforms_all', 'locked_description', e.target.value)}
                  placeholder="Enter locked message description"
                  rows={2}
                />
              </div>
              <Button onClick={() => saveSection('platforms_all')} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save All Platforms Section'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Footer Section */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSection('footer')}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Footer Section</CardTitle>
                <CardDescription>Footer tagline and copyright text</CardDescription>
              </div>
              {expandedSections['footer'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections['footer'] && (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tagline</label>
                <Input
                  value={content.footer?.tagline || ''}
                  onChange={(e) => updateSectionField('footer', 'tagline', e.target.value)}
                  placeholder="Enter footer tagline"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Copyright</label>
                <Input
                  value={content.footer?.copyright || ''}
                  onChange={(e) => updateSectionField('footer', 'copyright', e.target.value)}
                  placeholder="Enter copyright text"
                />
              </div>
              <Button onClick={() => saveSection('footer')} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Footer Section'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Platforms Management Section */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSection('platforms_management')}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Platforms Management</CardTitle>
                <CardDescription>Add, edit, or delete earning platforms ({platforms.length} total)</CardDescription>
              </div>
              {expandedSections['platforms_management'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections['platforms_management'] && (
            <CardContent className="space-y-4 border-t pt-4">
              {/* Add Platform Button */}
              <div className="flex gap-2">
                <Button onClick={() => setShowAddPlatform(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Plus className="h-4 w-4 mr-2" /> Add New Platform
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`${API_URL}/api/pdf/platforms`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              </div>

              {/* Add Platform Modal */}
              {showAddPlatform && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Add New Platform</h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowAddPlatform(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Name *</label>
                          <Input
                            value={newPlatform.name}
                            onChange={(e) => setNewPlatform({...newPlatform, name: e.target.value})}
                            placeholder="Platform name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Category *</label>
                          <select
                            value={newPlatform.category}
                            onChange={(e) => setNewPlatform({...newPlatform, category: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-md"
                          >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Description *</label>
                        <Textarea
                          value={newPlatform.description}
                          onChange={(e) => setNewPlatform({...newPlatform, description: e.target.value})}
                          placeholder="Platform description"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Link *</label>
                        <Input
                          value={newPlatform.link}
                          onChange={(e) => setNewPlatform({...newPlatform, link: e.target.value})}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Earnings Potential</label>
                          <Input
                            value={newPlatform.earningsPotential}
                            onChange={(e) => setNewPlatform({...newPlatform, earningsPotential: e.target.value})}
                            placeholder="$100-500/month"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Difficulty</label>
                          <select
                            value={newPlatform.difficulty}
                            onChange={(e) => setNewPlatform({...newPlatform, difficulty: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-md"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Rating (1-5)</label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            value={newPlatform.rating}
                            onChange={(e) => setNewPlatform({...newPlatform, rating: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Min Payout</label>
                          <Input
                            value={newPlatform.minPayout}
                            onChange={(e) => setNewPlatform({...newPlatform, minPayout: e.target.value})}
                            placeholder="$10"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="featured"
                          checked={newPlatform.featured}
                          onChange={(e) => setNewPlatform({...newPlatform, featured: e.target.checked})}
                          className="h-4 w-4"
                        />
                        <label htmlFor="featured" className="text-sm font-medium">Featured Platform</label>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleAddPlatform} disabled={saving || !newPlatform.name || !newPlatform.category || !newPlatform.description || !newPlatform.link} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          {saving ? 'Adding...' : 'Add Platform'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddPlatform(false)}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Platform Modal */}
              {editingPlatform && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Edit Platform</h3>
                      <Button variant="ghost" size="sm" onClick={() => setEditingPlatform(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Name</label>
                          <Input
                            value={editingPlatform.name || ''}
                            onChange={(e) => setEditingPlatform({...editingPlatform, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Category</label>
                          <select
                            value={editingPlatform.category || ''}
                            onChange={(e) => setEditingPlatform({...editingPlatform, category: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-md"
                          >
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                          value={editingPlatform.description || ''}
                          onChange={(e) => setEditingPlatform({...editingPlatform, description: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Link</label>
                        <Input
                          value={editingPlatform.link || ''}
                          onChange={(e) => setEditingPlatform({...editingPlatform, link: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Earnings Potential</label>
                          <Input
                            value={editingPlatform.earningsPotential || ''}
                            onChange={(e) => setEditingPlatform({...editingPlatform, earningsPotential: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Difficulty</label>
                          <select
                            value={editingPlatform.difficulty || 'Medium'}
                            onChange={(e) => setEditingPlatform({...editingPlatform, difficulty: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-md"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Rating (1-5)</label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            value={editingPlatform.rating || 4.0}
                            onChange={(e) => setEditingPlatform({...editingPlatform, rating: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Min Payout</label>
                          <Input
                            value={editingPlatform.minPayout || ''}
                            onChange={(e) => setEditingPlatform({...editingPlatform, minPayout: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="edit-featured"
                          checked={editingPlatform.featured || false}
                          onChange={(e) => setEditingPlatform({...editingPlatform, featured: e.target.checked})}
                          className="h-4 w-4"
                        />
                        <label htmlFor="edit-featured" className="text-sm font-medium">Featured Platform</label>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={() => handleUpdatePlatform(editingPlatform.id)} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingPlatform(null)}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Platforms List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {platforms.map((platform) => (
                  <div key={platform.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{platform.name}</span>
                        {platform.featured && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Featured</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        {platform.category} | {platform.earningsPotential} | Rating: {platform.rating}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingPlatform(platform)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeletePlatform(platform.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

      </div>
    </div>
  );
};

export default AdminDashboard;
