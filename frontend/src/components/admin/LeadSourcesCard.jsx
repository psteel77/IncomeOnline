import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, RefreshCw, TrendingUp, Sparkles, BookOpen, MousePointerClick } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SOURCE_STYLE = {
  hero_pill: { icon: MousePointerClick, color: 'text-purple-600', bar: 'bg-purple-500' },
  success_story: { icon: Sparkles, color: 'text-pink-600', bar: 'bg-pink-500' },
  'free-guide': { icon: BookOpen, color: 'text-orange-600', bar: 'bg-orange-500' },
};

/**
 * Admin card: which acquisition surface is converting captured leads best.
 */
const LeadSourcesCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/leads/by-source`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e.message || 'Failed to load lead sources');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sources = data?.sources || [];
  const maxCount = sources.reduce((m, s) => Math.max(m, s.count), 0) || 1;

  return (
    <Card data-testid="lead-sources-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" /> Leads by Source
            </CardTitle>
            <CardDescription>
              Which CTA / SEO surface captures the most emails — track what's converting.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} data-testid="lead-sources-refresh-btn">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 border-t pt-4">
        {loading && !data ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : error ? (
          <p className="text-sm text-rose-600" data-testid="lead-sources-error">{error}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-6 text-sm">
              <div><span className="font-medium">Total subscribers:</span> <span data-testid="lead-sources-total">{data.total_subscribers || 0}</span></div>
              <div><span className="font-medium">Newsletter opt-in:</span> <span data-testid="lead-sources-optin">{data.newsletter_opt_in_count || 0}</span></div>
            </div>

            {sources.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center" data-testid="lead-sources-empty">
                No tagged lead sources yet. They'll appear here as visitors use the hero pill, success-story capture or download guides.
              </p>
            ) : (
              <div className="space-y-3">
                {sources.map((s) => {
                  const style = SOURCE_STYLE[s.source] || { icon: TrendingUp, color: 'text-slate-600', bar: 'bg-slate-400' };
                  const Icon = style.icon;
                  const pct = Math.round((s.count / maxCount) * 100);
                  return (
                    <div key={s.source} data-testid={`lead-source-row-${s.source}`}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 font-medium text-slate-700">
                          <Icon className={`h-4 w-4 ${style.color}`} /> {s.label}
                        </span>
                        <span className="tabular-nums text-slate-600">
                          <span className="font-semibold text-slate-900">{s.count}</span>
                          <span className="text-slate-400"> · {s.opted_in} opted-in</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${style.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadSourcesCard;
