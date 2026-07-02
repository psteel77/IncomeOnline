import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Download, Loader2, RefreshCw, CreditCard, Search, UserPlus, CheckCircle2, AlertCircle, Crown } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Admin card listing PAYING members (the `users` collection) — i.e. people who
 * completed a £9.99 / £14.99 PayPal payment. Distinct from the free-guide
 * "Subscribers" card. Includes CSV export and a manual "grant access" form to
 * register someone who paid on PayPal but wasn't auto-registered.
 */
const DonorsCard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ total: 0, active: 0, expired: 0, premium: 0, donors: [] });
  const [filter, setFilter] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState(null); // { ok: bool, text: string }

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/donors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e.message || 'Failed to load donors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addDonor = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddMsg({ ok: false, text: 'Please enter a valid email address.' });
      return;
    }
    setAdding(true);
    setAddMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/add-donor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.detail || json.message || `HTTP ${res.status}`);
      }
      setAddMsg({ ok: true, text: `${email}: ${json.message || 'Access granted (12 months).'} A welcome email with their login link was sent.` });
      setNewEmail('');
      load();
    } catch (e) {
      setAddMsg({ ok: false, text: e.message || 'Failed to add donor' });
    } finally {
      setAdding(false);
    }
  };

  const filtered = (data.donors || []).filter((d) => {
    if (!filter.trim()) return true;
    return (d.email || '').toLowerCase().includes(filter.toLowerCase());
  });

  const escapeCSV = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const exportCSV = () => {
    const rows = [['email', 'plan', 'status', 'donated_at', 'expires_at', 'last_login']];
    filtered.forEach((d) => {
      rows.push([
        d.email,
        d.is_premium ? 'Premium (£14.99)' : 'Basic (£9.99)',
        d.status,
        d.donated_at || '',
        d.expires_at || '',
        d.last_login || '',
      ]);
    });
    const csv = rows.map((r) => r.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paying_members_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card data-testid="donors-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-emerald-600" /> Paying Members (Donors)</CardTitle>
            <CardDescription>Everyone who completed a £9.99 / £14.99 PayPal payment — separate from free-guide subscribers</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading} data-testid="refresh-donors-btn">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={exportCSV} disabled={loading || filtered.length === 0} data-testid="export-donors-csv-btn" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 border-t pt-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div><span className="font-medium">Total:</span> <span data-testid="donors-total">{data.total || 0}</span></div>
          <div className="text-emerald-700"><span className="font-medium">Active:</span> <span data-testid="donors-active">{data.active || 0}</span></div>
          <div className="text-slate-500"><span className="font-medium">Expired:</span> <span data-testid="donors-expired">{data.expired || 0}</span></div>
          <div className="text-amber-600 flex items-center gap-1"><Crown className="h-4 w-4" /><span className="font-medium">Premium:</span> <span data-testid="donors-premium">{data.premium || 0}</span></div>
        </div>

        {/* Manual grant-access form — for people who paid on PayPal but weren't auto-registered */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Manually grant 12-month access (e.g. a confirmed PayPal payer who wasn't registered)
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              type="email"
              placeholder="paying-customer@email.com"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); if (addMsg) setAddMsg(null); }}
              className="flex-1 min-w-[220px]"
              data-testid="add-donor-email-input"
            />
            <Button onClick={addDonor} disabled={adding} data-testid="add-donor-btn" className="bg-emerald-600 hover:bg-emerald-700">
              {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Grant access
            </Button>
          </div>
          {addMsg && (
            <p className={`mt-2 text-xs flex items-start gap-1.5 ${addMsg.ok ? 'text-emerald-700' : 'text-rose-600'}`} data-testid="add-donor-message">
              {addMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
              {addMsg.text}
            </p>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Filter by email…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
            data-testid="donors-filter-input"
          />
        </div>

        {loading ? (
          <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-purple-600 mx-auto" /></div>
        ) : error ? (
          <p className="text-sm text-rose-600" data-testid="donors-error">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No paying members match your filter.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm" data-testid="donors-table">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Email</th>
                  <th className="text-left px-3 py-2 font-semibold">Plan</th>
                  <th className="text-center px-3 py-2 font-semibold">Status</th>
                  <th className="text-left px-3 py-2 font-semibold">Paid</th>
                  <th className="text-left px-3 py-2 font-semibold">Expires</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.email} className="border-t border-slate-100 hover:bg-slate-50" data-testid="donor-row">
                    <td className="px-3 py-2 font-medium text-slate-800 break-all">{d.email}</td>
                    <td className="px-3 py-2">
                      {d.is_premium ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold"><Crown className="h-3 w-3" /> Premium</span>
                      ) : (
                        <span className="inline-block bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">Basic</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {d.status === 'active' ? (
                        <span className="inline-block bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">active</span>
                      ) : (
                        <span className="inline-block bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-semibold">{d.status}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{(d.donated_at || '').slice(0, 10)}</td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{(d.expires_at || '').slice(0, 10)}</td>
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

export default DonorsCard;
