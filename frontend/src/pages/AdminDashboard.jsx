import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { LogOut, Save, Home, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const { isAdmin, adminUsername, loading: authLoading, logout } = useAdmin();
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchContent();
    }
  }, [isAdmin]);

  const fetchContent = async () => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await axios.get(`${API_URL}/api/cms/content`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Convert array to object for easier access
        const contentObj = {};
        response.data.content.forEach(section => {
          contentObj[section.section_id] = section.content;
        });
        setContent(contentObj);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
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

  const updateArrayField = (sectionId, field, index, value) => {
    setContent(prev => {
      const newArray = [...(prev[sectionId]?.[field] || [])];
      newArray[index] = value;
      return {
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [field]: newArray
        }
      };
    });
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
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                View Site
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
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
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>Main heading and subheading on the homepage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button 
              onClick={() => saveSection('hero')} 
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Hero Section'}
            </Button>
          </CardContent>
        </Card>

        {/* Categories Section */}
        <Card>
          <CardHeader>
            <CardTitle>Categories Section</CardTitle>
            <CardDescription>Browse by category heading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button 
              onClick={() => saveSection('categories')} 
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Categories Section'}
            </Button>
          </CardContent>
        </Card>

        {/* Donation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Section</CardTitle>
            <CardDescription>Content for the donation/support section</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button 
              onClick={() => saveSection('donation')} 
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Donation Section'}
            </Button>
          </CardContent>
        </Card>

        {/* Featured Platforms Section */}
        <Card>
          <CardHeader>
            <CardTitle>Featured Platforms Section</CardTitle>
            <CardDescription>Featured platforms heading and paywall message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button 
              onClick={() => saveSection('platforms_featured')} 
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Featured Section'}
            </Button>
          </CardContent>
        </Card>

        {/* All Platforms Section */}
        <Card>
          <CardHeader>
            <CardTitle>All Platforms Section</CardTitle>
            <CardDescription>All platforms heading and paywall message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button 
              onClick={() => saveSection('platforms_all')} 
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save All Platforms Section'}
            </Button>
          </CardContent>
        </Card>

        {/* Footer Section */}
        <Card>
          <CardHeader>
            <CardTitle>Footer Section</CardTitle>
            <CardDescription>Footer tagline and copyright text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button 
              onClick={() => saveSection('footer')} 
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Footer Section'}
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default AdminDashboard;
