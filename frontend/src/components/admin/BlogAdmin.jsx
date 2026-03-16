import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Save, Plus, Trash2, Edit2, X, Eye, EyeOff, ChevronDown, ChevronUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BlogAdmin = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '' });
  const [showAddPost, setShowAddPost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  const [newPost, setNewPost] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    category: 'General',
    tags: [],
    status: 'draft',
    meta_description: ''
  });
  
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.get(`${API_URL}/api/blog/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e, isEditing = false) => {
    const title = e.target.value;
    if (isEditing) {
      setEditingPost({
        ...editingPost,
        title,
        slug: generateSlug(title)
      });
    } else {
      setNewPost({
        ...newPost,
        title,
        slug: generateSlug(title)
      });
    }
  };

  const handleAddTag = (e, isEditing = false) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim();
      if (isEditing) {
        if (!editingPost.tags.includes(tag)) {
          setEditingPost({
            ...editingPost,
            tags: [...editingPost.tags, tag]
          });
        }
      } else {
        if (!newPost.tags.includes(tag)) {
          setNewPost({
            ...newPost,
            tags: [...newPost.tags, tag]
          });
        }
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove, isEditing = false) => {
    if (isEditing) {
      setEditingPost({
        ...editingPost,
        tags: editingPost.tags.filter(tag => tag !== tagToRemove)
      });
    } else {
      setNewPost({
        ...newPost,
        tags: newPost.tags.filter(tag => tag !== tagToRemove)
      });
    }
  };

  const handleAddPost = async () => {
    const token = localStorage.getItem('adminToken');
    setSaving(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/blog/admin/posts`,
        newPost,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        setSaveStatus({ show: true, success: true, message: 'Blog post created successfully!' });
        setShowAddPost(false);
        setNewPost({
          title: '', slug: '', content: '', excerpt: '', featured_image: '',
          category: 'General', tags: [], status: 'draft', meta_description: ''
        });
        fetchPosts();
        setTimeout(() => setSaveStatus({ show: false, success: false, message: '' }), 3000);
      }
    } catch (error) {
      setSaveStatus({ 
        show: true, 
        success: false, 
        message: error.response?.data?.detail || 'Failed to create post' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePost = async () => {
    const token = localStorage.getItem('adminToken');
    setSaving(true);

    try {
      const response = await axios.put(
        `${API_URL}/api/blog/admin/posts/${editingPost.id}`,
        editingPost,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        setSaveStatus({ show: true, success: true, message: 'Blog post updated successfully!' });
        setEditingPost(null);
        fetchPosts();
        setTimeout(() => setSaveStatus({ show: false, success: false, message: '' }), 3000);
      }
    } catch (error) {
      setSaveStatus({ 
        show: true, 
        success: false, 
        message: error.response?.data?.detail || 'Failed to update post' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    
    const token = localStorage.getItem('adminToken');
    setSaving(true);

    try {
      const response = await axios.delete(
        `${API_URL}/api/blog/admin/posts/${postId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSaveStatus({ show: true, success: true, message: 'Blog post deleted successfully!' });
        fetchPosts();
        setTimeout(() => setSaveStatus({ show: false, success: false, message: '' }), 3000);
      }
    } catch (error) {
      setSaveStatus({ 
        show: true, 
        success: false, 
        message: error.response?.data?.detail || 'Failed to delete post' 
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not published';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const blogCategories = [
    'General',
    'Freelancing Tips',
    'Survey Strategies',
    'E-commerce',
    'Remote Work',
    'Passive Income',
    'Success Stories',
    'Platform Reviews'
  ];

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-slate-50 transition-colors" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Blog Management</CardTitle>
            <CardDescription>Create and manage blog posts ({posts.length} total)</CardDescription>
          </div>
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-4 border-t pt-4">
          {/* Save Status Alert */}
          {saveStatus.show && (
            <div className={`p-4 rounded-lg flex items-center gap-2 ${
              saveStatus.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {saveStatus.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{saveStatus.message}</span>
            </div>
          )}

          {/* Add Post Button */}
          <Button onClick={() => setShowAddPost(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" /> Create New Blog Post
          </Button>

          {/* Add Post Modal */}
          {showAddPost && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Create New Blog Post</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddPost(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <Input
                      value={newPost.title}
                      onChange={(e) => handleTitleChange(e)}
                      placeholder="Enter post title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                    <Input
                      value={newPost.slug}
                      onChange={(e) => setNewPost({...newPost, slug: e.target.value})}
                      placeholder="post-url-slug"
                    />
                    <p className="text-xs text-slate-500 mt-1">URL: /blog/{newPost.slug || 'your-post-slug'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={newPost.category}
                        onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      >
                        {blogCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={newPost.status}
                        onChange={(e) => setNewPost({...newPost, status: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Excerpt (Short description) *</label>
                    <Textarea
                      value={newPost.excerpt}
                      onChange={(e) => setNewPost({...newPost, excerpt: e.target.value})}
                      placeholder="Brief summary of your post..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Content *</label>
                    <Textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                      placeholder="Write your blog post content here... (Supports basic markdown: **bold**, *italic*, ## headings, - lists)"
                      rows={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Featured Image URL</label>
                    <Input
                      value={newPost.featured_image}
                      onChange={(e) => setNewPost({...newPost, featured_image: e.target.value})}
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => handleAddTag(e)}
                      placeholder="Type a tag and press Enter"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newPost.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Meta Description (SEO)</label>
                    <Textarea
                      value={newPost.meta_description}
                      onChange={(e) => setNewPost({...newPost, meta_description: e.target.value})}
                      placeholder="SEO meta description (150-160 characters)"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleAddPost} 
                      disabled={saving || !newPost.title || !newPost.content || !newPost.excerpt}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {saving ? 'Creating...' : 'Create Post'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddPost(false)}>Cancel</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Post Modal */}
          {editingPost && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Edit Blog Post</h3>
                  <Button variant="ghost" size="sm" onClick={() => setEditingPost(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <Input
                      value={editingPost.title || ''}
                      onChange={(e) => handleTitleChange(e, true)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                    <Input
                      value={editingPost.slug || ''}
                      onChange={(e) => setEditingPost({...editingPost, slug: e.target.value})}
                    />
                    <p className="text-xs text-slate-500 mt-1">URL: /blog/{editingPost.slug}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={editingPost.category || 'General'}
                        onChange={(e) => setEditingPost({...editingPost, category: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      >
                        {blogCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={editingPost.status || 'draft'}
                        onChange={(e) => setEditingPost({...editingPost, status: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Excerpt</label>
                    <Textarea
                      value={editingPost.excerpt || ''}
                      onChange={(e) => setEditingPost({...editingPost, excerpt: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Content</label>
                    <Textarea
                      value={editingPost.content || ''}
                      onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                      rows={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Featured Image URL</label>
                    <Input
                      value={editingPost.featured_image || ''}
                      onChange={(e) => setEditingPost({...editingPost, featured_image: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => handleAddTag(e, true)}
                      placeholder="Type a tag and press Enter"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(editingPost.tags || []).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeTag(tag, true)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Meta Description (SEO)</label>
                    <Textarea
                      value={editingPost.meta_description || ''}
                      onChange={(e) => setEditingPost({...editingPost, meta_description: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleUpdatePost} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Posts List */}
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No blog posts yet. Create your first post!
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{post.title}</span>
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                        {post.status === 'published' ? (
                          <><Eye className="h-3 w-3 mr-1" /> Published</>
                        ) : (
                          <><EyeOff className="h-3 w-3 mr-1" /> Draft</>
                        )}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-500">
                      {post.category} | {formatDate(post.published_at)} | {post.views || 0} views
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {post.status === 'published' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        title="View Post"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setEditingPost(post)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700" 
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default BlogAdmin;
