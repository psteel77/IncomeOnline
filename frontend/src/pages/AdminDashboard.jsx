import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { LogOut, Save, Home, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

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

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const updateSectionField = (sectionId, field, value) => {
    setContent(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value
      }
    }));
  };

  const updateNestedField = (sectionId, parentField, index, field, value) => {
    setContent(prev => {
      const newArray = [...(prev[sectionId]?.[parentField] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return {
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [parentField]: newArray
        }
      };
    });
  };

  const addArrayItem = (sectionId, field, template) => {
    setContent(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: [...(prev[sectionId]?.[field] || []), template]
      }
    }));
  };

  const removeArrayItem = (sectionId, field, index) => {
    setContent(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: prev[sectionId]?.[field]?.filter((_, i) => i !== index) || []
      }
    }));
  };

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
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const SectionWrapper = ({ id, title, description, children }) => (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => toggleSection(id)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {expandedSections[id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>
      {expandedSections[id] && (
        <CardContent className="space-y-4 border-t pt-4">
          {children}
        </CardContent>
      )}
    </Card>
  );

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
        
        {/* Hero Section */}
        <SectionWrapper id="hero" title="Hero Section" description="Main heading and subheading on the homepage">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <Input
              value={content.hero?.title || ''}
              onChange={(e) => updateSectionField('hero', 'title', e.target.value)}
              placeholder="Enter hero title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
            <Textarea
              value={content.hero?.subtitle || ''}
              onChange={(e) => updateSectionField('hero', 'subtitle', e.target.value)}
              placeholder="Enter hero subtitle"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">CTA Button Text</label>
            <Input
              value={content.hero?.cta_text || ''}
              onChange={(e) => updateSectionField('hero', 'cta_text', e.target.value)}
              placeholder="Enter button text"
            />
          </div>
          <Button onClick={() => saveSection('hero')} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Hero Section'}
          </Button>
        </SectionWrapper>

        {/* How It Works Section */}
        <SectionWrapper id="how_it_works" title="How It Works Section" description="The 3-step process shown on the homepage">
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
          
          <Button onClick={() => saveSection('how_it_works')} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save How It Works'}
          </Button>
        </SectionWrapper>

        {/* Success Stories Section */}
        <SectionWrapper id="success_stories" title="Success Stories Section" description="Testimonials and success stories">
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
          
          <Button onClick={() => saveSection('success_stories')} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Success Stories'}
          </Button>
        </SectionWrapper>

        {/* CTA Section */}
        <SectionWrapper id="cta" title="Call-to-Action Section" description="The main CTA banner">
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
          <Button onClick={() => saveSection('cta')} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save CTA Section'}
          </Button>
        </SectionWrapper>

        {/* Categories Section */}
        <SectionWrapper id="categories" title="Categories Section" description="Browse by category heading">
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
          <Button onClick={() => saveSection('categories')} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Categories Section'}
          </Button>
        </SectionWrapper>

        {/* Donation Section */}
        <SectionWrapper id="donation" title="Donation Section" description="Content for the donation/support section">
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
          <Button onClick={() => saveSection('donation')} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Donation Section'}
          </Button>
        </SectionWrapper>

        {/* Featured Platforms Section */}
        <SectionWrapper id="platforms_featured" title="Featured Platforms Section" description="Featured platforms heading and paywall message">
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
          <Button onClick={() => saveSection('platforms_featured')} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Featured Section'}
          </Button>
        </SectionWrapper>

        {/* All Platforms Section */}
        <SectionWrapper id="platforms_all" title="All Platforms Section" description="All platforms heading and paywall message">
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
          <Button onClick={() => saveSection('platforms_all')} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Platforms Section'}
          </Button>
        </SectionWrapper>

        {/* Footer Section */}
        <SectionWrapper id="footer" title="Footer Section" description="Footer tagline and copyright text">
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
          <Button onClick={() => saveSection('footer')} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Footer Section'}
          </Button>
        </SectionWrapper>

        {/* Platforms Management Section */}
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => toggleSection('platforms_management')}
          >
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
              <Button onClick={() => setShowAddPlatform(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4 mr-2" /> Add New Platform
              </Button>

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
                        <Button onClick={handleAddPlatform} disabled={saving || !newPlatform.name || !newPlatform.category || !newPlatform.description || !newPlatform.link} className="bg-teal-600 hover:bg-teal-700">
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
                        <Button onClick={() => handleUpdatePlatform(editingPlatform.id)} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
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
