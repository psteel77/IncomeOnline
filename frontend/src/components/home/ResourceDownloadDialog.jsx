import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Download, Loader2, Mail, CheckCircle2, Send } from 'lucide-react';

/**
 * Email-capture gateway shown before a Free Resource download starts.
 * On submit, POSTs to /api/pdf/resources/request-download. Supports two delivery modes:
 *   - Instant download in a new tab (default)
 *   - Email the guide as a PDF attachment
 */
const ResourceDownloadDialog = ({ open, onOpenChange, resource, title, description, onSuccess }) => {
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('io_resource_email') || ''; } catch { return ''; }
  });
  const [consent, setConsent] = useState(true);
  const [deliverViaEmail, setDeliverViaEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMode, setSuccessMode] = useState('download'); // 'download' | 'email'

  const handleClose = (isOpen) => {
    if (!isOpen) {
      try {
        const saved = localStorage.getItem('io_resource_email') || '';
        setEmail(saved);
      } catch {
        setEmail('');
      }
      setConsent(true);
      setDeliverViaEmail(false);
      setError('');
      setSuccess(false);
      setSubmitting(false);
      setSuccessMode('download');
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/pdf/resources/request-download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), resource, consent, deliver_via_email: deliverViaEmail }),
      });

      if (!response.ok) {
        throw new Error('Download request failed. Please try again.');
      }

      const data = await response.json();
      try { localStorage.setItem('io_resource_email', email.trim().toLowerCase()); } catch {}
      setSuccess(true);
      setSuccessMode(deliverViaEmail ? 'email' : 'download');

      try { onSuccess && onSuccess(email.trim().toLowerCase(), resource); } catch {}

      // If the user didn't request email delivery, trigger the instant download.
      if (!deliverViaEmail) {
        const downloadUrl = `${backendUrl}${data.download_url}`;
        window.open(downloadUrl, '_blank');
      }

      setTimeout(() => handleClose(false), deliverViaEmail ? 3000 : 1800);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="resource-download-dialog">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg">Get your free guide</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm">
            {description || `Enter your email to download ${title}. We'll also let you know when new Income Online guides are published — no spam, unsubscribe anytime.`}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center" data-testid="resource-download-success">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
            {successMode === 'email' ? (
              <>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Check your inbox</h3>
                <p className="text-sm text-slate-600">We've emailed your guide to <span className="font-semibold">{email}</span>. It should arrive within a minute — look in Promotions if you can't find it.</p>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Your download is on its way</h3>
                <p className="text-sm text-slate-600">If it didn't start automatically, check your browser's pop-up blocker.</p>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="resource-email" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Email address
              </label>
              <Input
                id="resource-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                data-testid="resource-email-input"
                className="focus-visible:ring-purple-500"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <Checkbox
                checked={deliverViaEmail}
                onCheckedChange={(val) => setDeliverViaEmail(val === true)}
                disabled={submitting}
                data-testid="resource-email-delivery-checkbox"
                className="mt-0.5"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <span className="font-semibold">Email me the guide</span> as a PDF attachment instead of downloading it now.
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <Checkbox
                checked={consent}
                onCheckedChange={(val) => setConsent(val === true)}
                disabled={submitting}
                data-testid="resource-consent-checkbox"
                className="mt-0.5"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                Email me when new free guides are published. You can unsubscribe at any time.
              </span>
            </label>

            {error && (
              <p className="text-sm text-rose-600" data-testid="resource-download-error">{error}</p>
            )}

            <DialogFooter className="sm:justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={submitting}
                className="sm:w-auto w-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                data-testid="resource-download-submit"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold sm:w-auto w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing...
                  </>
                ) : deliverViaEmail ? (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Email Me the Guide
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Guide
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResourceDownloadDialog;
