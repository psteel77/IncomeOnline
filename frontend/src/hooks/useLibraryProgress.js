import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const STORAGE_KEY = 'io_resource_email';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Track which free-resource guides the current visitor has already downloaded.
 *
 * How it works:
 *  1. When the user submits their email through ResourceDownloadDialog, we
 *     persist it in localStorage under `io_resource_email`.
 *  2. This hook reads that email on mount and asks the backend for their
 *     download history.
 *  3. Returns a Set of downloaded resource keys + helpers to refresh after
 *     a new download + record a new email.
 */
export default function useLibraryProgress() {
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
  });
  const [downloaded, setDownloaded] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchProgress = useCallback(async (emailOverride) => {
    const e = (emailOverride ?? email).trim();
    if (!e) {
      setDownloaded(new Set());
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/pdf/resources/progress`, {
        params: { email: e },
      });
      setDownloaded(new Set(res.data.downloaded || []));
      setTotal(res.data.total || 0);
    } catch {
      // Silent — progress is a nice-to-have, not critical
    } finally {
      setLoading(false);
    }
  }, [email]);

  // Initial fetch
  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const recordDownload = useCallback((newEmail, resourceKey) => {
    const lower = (newEmail || '').toLowerCase().trim();
    if (lower) {
      try { localStorage.setItem(STORAGE_KEY, lower); } catch {}
      if (lower !== email) setEmail(lower);
    }
    if (resourceKey) {
      setDownloaded((prev) => {
        const next = new Set(prev);
        next.add(resourceKey);
        return next;
      });
    }
    // Refresh from backend in background for authoritative state
    if (lower) fetchProgress(lower);
  }, [email, fetchProgress]);

  const reset = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setEmail('');
    setDownloaded(new Set());
  }, []);

  return {
    email,
    downloaded,
    downloadedCount: downloaded.size,
    total,
    loading,
    recordDownload,
    reset,
  };
}
