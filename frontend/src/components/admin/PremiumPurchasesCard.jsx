import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Crown, Loader2, RefreshCw, PoundSterling, ShoppingBag, Download, AlertCircle, TrendingUp, Users } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const PREMIUM_PRICE = 14.99;

const StatTile = ({ icon: Icon, label, value, sub, color, testid }) => (
  <div className="rounded-lg border border-slate-200 p-4 bg-white" data-testid={testid}>
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
  </div>
);

const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

/**
 * Admin card: Premium Pack (£14.99) purchases — revenue, count, downloads + recent buyers table.
 * Reads the admin-protected GET /api/pdf/premium-pack/purchases endpoint.
 */
const PremiumPurchasesCard = () => {
  const [data, setData] = useState(null);
  const [conv, setConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState('');

  const runCurrencyMigration = useCallback(async () => {
    setMigrating(true);
    setMigrateMsg('');
    try {
      const res = await fetch(`${API_URL}/api/admin/migrate-currency-gbp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setMigrateMsg(
        d.updated > 0
          ? `Done — converted ${d.updated} of ${d.total_platforms} platforms to £.`
          : `All ${d.total_platforms} platforms already in £. Nothing to change.`
      );
    } catch (e) {
      setMigrateMsg(`Failed: ${e.message}`);
    } finally {
      setMigrating(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('adminToken')}` };
      const [pRes, cRes] = await Promise.all([
        fetch(`${API_URL}/api/pdf/premium-pack/purchases`, { headers }),
        fetch(`${API_URL}/api/admin/conversion-stats`, { headers }),
      ]);
      if (!pRes.ok) throw new Error(`HTTP ${pRes.status}`);
      setData(await pRes.json());
      if (cRes.ok) setConv(await cRes.json());
    } catch (e) {
      setError(e.message || 'Failed to load premium purchases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const purchases = data?.purchases || [];
  const total = data?.total || 0;
  const revenue = purchases.reduce((sum, p) => {
    const a = parseFloat(p.amount);
    return sum + (Number.isFinite(a) ? a : PREMIUM_PRICE);
  }, 0);
  const downloads = purchases.reduce((sum, p) => sum + (p.download_count || 0), 0);

  return (
    <Card data-testid="premium-purchases-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" /> Premium Pack Purchases
            </CardTitle>
            <CardDescription>
              The £14.99 Wealth Generator pack — revenue, buyers and downloads.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} data-testid="premium-purchases-refresh-btn">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 border-t pt-4">
        {loading && !data ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : error ? (
          <div className="flex items-start gap-2 text-sm rounded-md p-3 bg-rose-50 text-rose-700" data-testid="premium-purchases-error">
            <AlertCircle className="h-4 w-4 mt-0.5" /> <span>{error}</span>
          </div>
        ) : data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatTile testid="premium-stat-count" icon={ShoppingBag} color="text-purple-600" label="Purchases" value={total} sub="verified PayPal buyers" />
              <StatTile testid="premium-stat-revenue" icon={PoundSterling} color="text-emerald-600" label="Revenue" value={`£${revenue.toFixed(2)}`} sub={`@ £${PREMIUM_PRICE.toFixed(2)} each`} />
              <StatTile testid="premium-stat-downloads" icon={Download} color="text-blue-500" label="Downloads" value={downloads} sub="total pack downloads" />
            </div>

            {conv && (
              <div className="border-t pt-3" data-testid="premium-conversion">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" /> Basic → Premium upgrade rate
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-end justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-3xl font-extrabold text-amber-700" data-testid="premium-upgrade-rate">{conv.upgrade_rate}%</div>
                      <div className="text-xs text-amber-700/80 mt-0.5">of paying members chose Premium</div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center" data-testid="conv-basic">
                        <div className="flex items-center gap-1 text-slate-500 text-xs uppercase tracking-wide"><Users className="h-3.5 w-3.5" /> Basic £9.99</div>
                        <div className="text-xl font-bold text-slate-800">{conv.basic_only}</div>
                      </div>
                      <div className="text-center" data-testid="conv-premium">
                        <div className="flex items-center gap-1 text-purple-600 text-xs uppercase tracking-wide"><Crown className="h-3.5 w-3.5" /> Premium £14.99</div>
                        <div className="text-xl font-bold text-purple-700">{conv.premium_buyers}</div>
                      </div>
                      <div className="text-center" data-testid="conv-total-revenue">
                        <div className="flex items-center gap-1 text-emerald-600 text-xs uppercase tracking-wide"><PoundSterling className="h-3.5 w-3.5" /> Total rev</div>
                        <div className="text-xl font-bold text-emerald-700">£{conv.total_revenue_usd.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  {/* Stacked bar: basic vs premium share */}
                  <div className="mt-3 h-2.5 w-full rounded-full overflow-hidden bg-slate-200 flex">
                    <div className="bg-slate-400 h-full" style={{ width: `${conv.total_paying ? (conv.basic_only / conv.total_paying * 100) : 0}%` }} />
                    <div className="bg-purple-600 h-full" style={{ width: `${conv.total_paying ? (conv.premium_buyers / conv.total_paying * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            )}

            {purchases.length === 0 ? (
              <p className="text-sm text-slate-400 py-2" data-testid="premium-purchases-empty">No premium purchases yet.</p>
            ) : (
              <div className="border-t pt-3 overflow-x-auto">
                <table className="w-full text-sm" data-testid="premium-purchases-table">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-4 font-medium">Email</th>
                      <th className="py-2 pr-4 font-medium">Amount</th>
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 font-medium text-right">Downloads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={p.id || p.token} className="border-t border-slate-100" data-testid={`premium-purchase-row-${p.id || p.token}`}>
                        <td className="py-2 pr-4 text-slate-800 break-all">{p.email}</td>
                        <td className="py-2 pr-4 text-slate-600">{p.currency || 'GBP'} {p.amount || PREMIUM_PRICE.toFixed(2)}</td>
                        <td className="py-2 pr-4 text-slate-500">{fmtDate(p.created_at)}</td>
                        <td className="py-2 pr-4 text-right text-slate-600">{p.download_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* One-time production setup: convert live platform earnings $ -> £ */}
        <div className="border-t pt-4 mt-1" data-testid="currency-migration">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <p className="text-sm font-semibold text-slate-700">Convert platform prices to £ (GBP)</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Run this once after going live to switch all platform earnings figures from $ to £. Safe to click again — it skips anything already in £.
              </p>
              {migrateMsg && (
                <p className="text-xs font-medium text-emerald-700 mt-1.5" data-testid="currency-migration-result">{migrateMsg}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runCurrencyMigration}
              disabled={migrating}
              data-testid="currency-migration-btn"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              {migrating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PoundSterling className="h-4 w-4" />}
              <span className="ml-1.5">{migrating ? 'Converting…' : 'Convert to £'}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumPurchasesCard;
