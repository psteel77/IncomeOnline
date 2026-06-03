import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { LifeBuoy, Loader2, RefreshCw, Clock, MailCheck, CheckCircle2, DollarSign, AlertCircle, Play, FlaskConical } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

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

/**
 * Admin card: abandoned-donation recovery funnel stats + manual "run now" trigger.
 */
const RecoveryStatsCard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/paypal/recovery-stats`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats(await res.json());
    } catch (e) {
      setResult({ type: 'error', text: e.message || 'Failed to load recovery stats' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runNow = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/paypal/run-recovery`, { method: 'POST', headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || `HTTP ${res.status}`);
      setResult({ type: 'success', text: `Scan complete — ${json.sent.length} recovery email${json.sent.length === 1 ? '' : 's'} sent, ${json.skipped_already_subscribed.length} already subscribed.` });
      await load();
    } catch (e) {
      setResult({ type: 'error', text: e.message || 'Failed to run recovery' });
    } finally {
      setRunning(false);
    }
  };

  const sched = stats?.scheduler;

  return (
    <Card data-testid="recovery-stats-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-emerald-600" /> Donation Recovery
            </CardTitle>
            <CardDescription>
              Automatically emails people who started a donation but didn't finish — and the revenue it's rescuing.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} data-testid="recovery-refresh-btn">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 border-t pt-4">
        {loading && !stats ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile testid="recovery-stat-pending" icon={Clock} color="text-amber-500" label="Pending" value={stats.pending} sub="awaiting recovery" />
              <StatTile testid="recovery-stat-sent" icon={MailCheck} color="text-blue-500" label="Emails Sent" value={stats.recovery_sent} sub="awaiting conversion" />
              <StatTile testid="recovery-stat-rescued" icon={CheckCircle2} color="text-emerald-600" label="Rescued" value={stats.converted_after_recovery} sub={`${stats.recovery_conversion_rate}% of emailed`} />
              <StatTile testid="recovery-stat-revenue" icon={DollarSign} color="text-emerald-600" label="Revenue Rescued" value={`$${stats.revenue_rescued_usd.toFixed(2)}`} sub={`@ $${stats.price_usd.toFixed(2)} each`} />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2 border-t pt-3">
              <span data-testid="recovery-scheduler-status">
                {sched?.enabled
                  ? `Auto-recovery: ON · every ${sched.interval_hours}h · ${sched.delay_hours}h after abandon`
                  : 'Auto-recovery: OFF'}
              </span>
              <span>{stats.converted} total converted · {stats.total_intents} intents</span>
            </div>

            {Array.isArray(stats.subject_ab_test) && stats.subject_ab_test.length > 0 && (
              <div className="border-t pt-3" data-testid="recovery-ab-test">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  <FlaskConical className="h-4 w-4 text-purple-600" /> Subject line A/B test
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stats.subject_ab_test.map((v) => (
                    <div key={v.variant} className="rounded-lg border border-slate-200 p-3 bg-white" data-testid={`recovery-ab-variant-${v.variant}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 rounded px-1.5 py-0.5">Variant {v.variant}</span>
                        <span className="text-xs text-slate-400">{v.emailed} emailed</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug mb-2 line-clamp-2">"{v.subject}"</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-emerald-600">{v.conversion_rate}%</span>
                        <span className="text-xs text-slate-400">{v.converted} converted · ${v.revenue_rescued_usd.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <div
                data-testid="recovery-result"
                className={`flex items-start gap-2 text-sm rounded-md p-3 ${result.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
              >
                {result.type === 'success' ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                <span>{result.text}</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={runNow} disabled={running} data-testid="recovery-run-now-btn" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running…</> : <><Play className="h-4 w-4 mr-2" /> Run recovery now</>}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecoveryStatsCard;
