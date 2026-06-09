import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Download, Loader2, RefreshCw, Users, Mail, Search } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Admin card showing captured Free-Resource subscribers.
 * Includes a CSV export button and simple email/resource filter.
 */
const SubscribersCard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ total: 0, newsletter_opt_in_count: 0, subscribers: [] });
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/pdf/resources/subscribers?limit=1000`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message || 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = (data.subscribers || []).filter((s) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      (s.email || '').toLowerCase().includes(q) ||
      (s.resources_downloaded || []).join(',').toLowerCase().includes(q)
    );
  });

  const escapeCSV = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const exportCSV = () => {
    const rows = [['email', 'first_seen_at', 'last_seen_at', 'download_count', 'newsletter_opt_in', 'resources_downloaded']];
    filtered.forEach((s) => {
      rows.push([
        s.email,
        s.first_seen_at || '',
        s.last_seen_at || '',
        s.download_count || 0,
        s.newsletter_opt_in ? 'yes' : 'no',
        (s.resources_downloaded || []).join('; '),
      ]);
    });
    const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resource_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card data-testid="subscribers-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-purple-600" /> Free-Resource Subscribers</CardTitle>
            <CardDescription>Emails captured via the Free Resources download gateway</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading} data-testid="refresh-subscribers-btn">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={exportCSV} disabled={loading || filtered.length === 0} data-testid="export-subscribers-csv-btn" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 border-t pt-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-purple-600" /><span className="font-medium">Total:</span> <span data-testid="subscribers-total">{data.total || 0}</span></div>
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-pink-600" /><span className="font-medium">Newsletter opt-in:</span> <span data-testid="subscribers-opted-in">{data.newsletter_opt_in_count || 0}</span></div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Filter by email or resource…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
            data-testid="subscribers-filter-input"
          />
        </div>

        {loading ? (
          <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-purple-600 mx-auto" /></div>
        ) : error ? (
          <p className="text-sm text-rose-600" data-testid="subscribers-error">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No subscribers match your filter.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm" data-testid="subscribers-table">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Email</th>
                  <th className="text-left px-3 py-2 font-semibold">First Seen</th>
                  <th className="text-right px-3 py-2 font-semibold">Downloads</th>
                  <th className="text-center px-3 py-2 font-semibold">Opt-in</th>
                  <th className="text-left px-3 py-2 font-semibold">Resources</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.email} className="border-t border-slate-100 hover:bg-slate-50" data-testid="subscriber-row">
                    <td className="px-3 py-2 font-medium text-slate-800 break-all">{s.email}</td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{(s.first_seen_at || '').slice(0, 10)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.download_count || 0}</td>
                    <td className="px-3 py-2 text-center">
                      {s.newsletter_opt_in ? (
                        <span className="inline-block bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">yes</span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600 text-xs">
                      {(s.resources_downloaded || []).slice(0, 4).map((r) => (
                        <span key={r} className="inline-block bg-purple-50 text-purple-700 rounded px-1.5 py-0.5 mr-1 mb-1">{r}</span>
                      ))}
                      {(s.resources_downloaded || []).length > 4 && (
                        <span className="text-slate-400">+{s.resources_downloaded.length - 4} more</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscribersCard;
