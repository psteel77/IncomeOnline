import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  BookOpen, Plus, Pencil, Trash2, Loader2, Sparkles, Save, X, Eye, EyeOff, RefreshCw,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const CATEGORIES = ['Side Hustles', 'Freelancing', 'Passive Income', 'Saving & Budgeting', 'Investing', 'Tax & ISAs', 'Getting Started'];

const EMPTY = {
  id: null, title: '', category: 'Getting Started', excerpt: '', meta_description: '',
  tags: '', hero_image: '', content: '', status: 'draft', author: 'Income Online',
};

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const GuidesManager = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/guides/admin/all`, { headers: authHeaders() });
      setGuides(res.data?.guides || []);
    } catch (e) {
      toast.error('Failed to load guides');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setAiTopic(''); setEditing({ ...EMPTY }); };
  const openEdit = async (g) => {
    setAiTopic('');
    try {
      const res = await axios.get(`${API}/guides/admin/get/${g.id}`, { headers: authHeaders() });
      const full = res.data?.guide || {};
      setEditing({
        id: full.id,
        title: full.title || '',
        category: full.category || 'Getting Started',
        excerpt: full.excerpt || '',
        meta_description: full.meta_description || '',
        tags: (full.tags || []).join(', '),
        hero_image: full.hero_image || '',
        content: full.content || '',
        status: full.status || 'draft',
        author: full.author || 'Income Online',
        slug: full.slug,
      });
    } catch {
      toast.error('Could not open guide for editing');
    }
  };

  const generateDraft = async () => {
    if (!aiTopic.trim()) { toast.error('Enter a topic first'); return; }
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/guides/generate-draft`,
        { topic: aiTopic.trim(), category: editing?.category || 'Getting Started' },
        { headers: authHeaders() });
      const d = res.data || {};
      setEditing((prev) => ({
        ...prev,
        title: d.title || prev.title,
        meta_description: d.meta_description || prev.meta_description,
        excerpt: d.excerpt || prev.excerpt,
        category: d.category || prev.category,
        tags: (d.tags && d.tags.length) ? d.tags.join(', ') : prev.tags,
        content: d.content || prev.content,
      }));
      toast.success('Draft generated — review & edit, then save');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const save = async (publish) => {
    if (!editing.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    const payload = {
      title: editing.title,
      category: editing.category,
      excerpt: editing.excerpt,
      meta_description: editing.meta_description,
      tags: editing.tags.split(',').map((t) => t.trim()).filter(Boolean),
      hero_image: editing.hero_image,
      content: editing.content,
      author: editing.author || 'Income Online',
      status: publish ? 'published' : 'draft',
    };
    try {
      if (editing.id) {
        await axios.put(`${API}/guides/${editing.id}`, payload, { headers: authHeaders() });
      } else {
        await axios.post(`${API}/guides`, payload, { headers: authHeaders() });
      }
      toast.success(publish ? 'Guide published' : 'Draft saved');
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (g, newStatus) => {
    // Dedicated status endpoint — never blanks content.
    try {
      await axios.patch(`${API}/guides/${g.id}/status`, { status: newStatus }, { headers: authHeaders() });
      toast.success(newStatus === 'published' ? 'Published' : 'Unpublished');
      load();
    } catch (e) {
      toast.error('Could not update status');
    }
  };

  const remove = async (g) => {
    if (!window.confirm(`Delete "${g.title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/guides/${g.id}`, { headers: authHeaders() });
      toast.success('Guide deleted');
      load();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  // ---------------- Editor ----------------
  if (editing) {
    return (
      <Card data-testid="guides-editor">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              {editing.id ? 'Edit Guide' : 'New Guide'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} data-testid="guide-editor-close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 border-t pt-4">
          {/* AI assist */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
            <Label className="text-xs font-semibold text-purple-800 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-4 w-4" /> AI draft assistant (UK-focused)
            </Label>
            <div className="flex gap-2">
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Best cashback apps in the UK for 2026"
                data-testid="guide-ai-topic"
                className="bg-white"
              />
              <Button onClick={generateDraft} disabled={generating} data-testid="guide-ai-generate" className="bg-purple-600 hover:bg-purple-700 flex-shrink-0">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="ml-1.5 hidden sm:inline">{generating ? 'Writing…' : 'Generate'}</span>
              </Button>
            </div>
            <p className="text-[11px] text-purple-600/80 mt-1.5">Generates a British-English draft you can edit before publishing.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="g-title">Title</Label>
              <Input id="g-title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} data-testid="guide-field-title" />
            </div>
            <div>
              <Label htmlFor="g-cat">Category</Label>
              <select id="g-cat" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                data-testid="guide-field-category" className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="g-img">Hero image URL (optional)</Label>
              <Input id="g-img" value={editing.hero_image} onChange={(e) => setEditing({ ...editing, hero_image: e.target.value })} data-testid="guide-field-image" placeholder="https://…" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="g-excerpt">Excerpt (card summary)</Label>
              <Textarea id="g-excerpt" rows={2} value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} data-testid="guide-field-excerpt" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="g-meta">Meta description (SEO, ≤155 chars)</Label>
              <Input id="g-meta" value={editing.meta_description} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} data-testid="guide-field-meta" maxLength={160} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="g-tags">Tags (comma-separated)</Label>
              <Input id="g-tags" value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} data-testid="guide-field-tags" placeholder="side hustles, uk, passive income" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="g-content">Content (Markdown)</Label>
              <Textarea id="g-content" rows={16} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                data-testid="guide-field-content" className="font-mono text-sm" placeholder="## Heading&#10;&#10;Write your guide in Markdown…" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => save(false)} disabled={saving} data-testid="guide-save-draft">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="ml-1.5">Save draft</span>
            </Button>
            <Button onClick={() => save(true)} disabled={saving} data-testid="guide-publish" className="bg-purple-600 hover:bg-purple-700">
              <Eye className="h-4 w-4" /> <span className="ml-1.5">Publish</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------------- List ----------------
  return (
    <Card data-testid="guides-manager">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" /> Wealth Generator Guides
            </CardTitle>
            <CardDescription>Write, edit and publish UK money guides for SEO &amp; organic traffic.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading} data-testid="guides-refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={openNew} data-testid="guide-new-btn" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4" /> <span className="ml-1.5">New guide</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="border-t pt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : guides.length === 0 ? (
          <p className="text-sm text-slate-400 py-4" data-testid="guides-manager-empty">No guides yet — click "New guide" to write your first.</p>
        ) : (
          <div className="space-y-2" data-testid="guides-list">
            {guides.map((g) => (
              <div key={g.id} data-testid={`guide-row-${g.slug}`} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 truncate">{g.title}</p>
                    {g.status === 'published'
                      ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Published</Badge>
                      : <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Draft</Badge>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{g.category} · {g.read_minutes} min · /guides/{g.slug}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" title={g.status === 'published' ? 'Unpublish' : 'Publish'}
                    onClick={() => setStatus(g, g.status === 'published' ? 'draft' : 'published')} data-testid={`guide-toggle-${g.slug}`}>
                    {g.status === 'published' ? <EyeOff className="h-4 w-4 text-amber-600" /> : <Eye className="h-4 w-4 text-emerald-600" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(g)} data-testid={`guide-edit-${g.slug}`}>
                    <Pencil className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(g)} data-testid={`guide-delete-${g.slug}`}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuidesManager;
