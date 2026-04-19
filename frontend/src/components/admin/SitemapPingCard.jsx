import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { RefreshCcw, CheckCircle2, XCircle, AlertCircle, Clock, Globe, Loader2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatRelative = (iso) => {
  if (!iso) return 'never';
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const BUCKET_STYLES = {
  ok: {
    Icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border-green-300',
    text: 'Reachable',
  },
  retired: {
    Icon: AlertCircle,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    text: 'Endpoint retired',
  },
  unreachable: {
    Icon: XCircle,
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    text: 'Unreachable',
  },
  error: {
    Icon: XCircle,
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    text: 'Error',
  },
};

const ResultBadge = ({ bucket, statusCode }) => {
  const style = BUCKET_STYLES[bucket] || BUCKET_STYLES.error;
  const { Icon } = style;
  return (
    <Badge className={`${style.className} gap-1 font-medium hover:opacity-100`} variant="outline">
      <Icon className="h-3 w-3" />
      {style.text}{statusCode ? ` · ${statusCode}` : ''}
    </Badge>
  );
};

const SitemapPingCard = () => {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [error, setError] = useState('');

  const loadStatus = async () => {
    try {
      const res = await axios.get(`${API}/seo/sitemap-ping?limit=1`);
      setLatest(res.data.latest);
    } catch (e) {
      setError('Could not load ping history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handlePing = async () => {
    setPinging(true);
    setError('');
    try {
      const res = await axios.post(`${API}/seo/sitemap-ping`);
      setLatest({
        pinged_at: res.data.pinged_at,
        sitemap_url: res.data.sitemap_url,
        results: res.data.results,
      });
    } catch (e) {
      setError('Ping failed. Please try again.');
    } finally {
      setPinging(false);
    }
  };

  return (
    <Card data-testid="sitemap-ping-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Sitemap Ping
            </CardTitle>
            <CardDescription>
              Nudge search engines + verify your sitemap is reachable.
            </CardDescription>
          </div>
          <Button
            onClick={handlePing}
            disabled={pinging}
            data-testid="sitemap-ping-btn"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {pinging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pinging...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Ping Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading status...
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
              <Clock className="h-4 w-4 text-slate-400" />
              <span data-testid="sitemap-last-ping">
                Last pinged:{' '}
                <span className="font-semibold text-slate-800">
                  {formatRelative(latest?.pinged_at)}
                </span>
              </span>
            </div>

            {latest?.sitemap_url && (
              <p className="text-xs text-slate-500 mb-4 break-all">
                <span className="font-medium">Sitemap URL:</span>{' '}
                <a
                  href={latest.sitemap_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  {latest.sitemap_url}
                </a>
              </p>
            )}

            {latest?.results?.length > 0 && (
              <div className="space-y-2">
                {latest.results.map((r) => (
                  <div
                    key={r.engine}
                    className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
                    data-testid={`ping-result-${r.engine}`}
                  >
                    <span className="text-sm text-slate-700">{r.label}</span>
                    <ResultBadge bucket={r.bucket} statusCode={r.status_code} />
                  </div>
                ))}
              </div>
            )}

            {/* Context note */}
            <div className="mt-4 p-3 rounded-md bg-purple-50 border border-purple-100 text-xs text-purple-900 leading-relaxed">
              <strong>Note:</strong> Google and Bing officially retired their public
              sitemap-ping endpoints in 2023. Seeing "Endpoint retired" here is expected,
              not a bug — it means Google now relies on the sitemap you registered in
              Search Console + on its regular crawler. The "Sitemap reachability" check
              confirms your file is live and servable.
            </div>

            {error && (
              <p className="mt-3 text-sm text-rose-600" data-testid="ping-error">{error}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SitemapPingCard;
