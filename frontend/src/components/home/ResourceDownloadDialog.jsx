import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Download, Loader2, Mail, CheckCircle2 } from 'lucide-react';

/**
 * Email-capture gateway shown before a Free Resource download starts.
 * On submit, POSTs to /api/pdf/resources/request-download, then triggers the download.
 */
const ResourceDownloadDialog = ({ open, onOpenChange, resource, title, description }) => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleClose = (isOpen) => {
    if (!isOpen) {
      // reset state when closing
      setEmail('');
      setConsent(true);
      setError('');
      setSuccess(false);
      setSubmitting(false);
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
        body: JSON.stringify({ email: email.trim(), resource, consent }),
      });

      if (!response.ok) {
        throw new Error('Download request failed. Please try again.');
      }

      const data = await response.json();
      setSuccess(true);

      // Trigger the download in a new tab
      const downloadUrl = `${backendUrl}${data.download_url}`;
      window.open(downloadUrl, '_blank');

      // Auto-close after short success moment
      setTimeout(() => handleClose(false), 1800);
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
            <h3 className="text-base font-semibold text-slate-900 mb-1">Your download is on its way</h3>
            <p className="text-sm text-slate-600">If it didn't start automatically, check your browser's pop-up blocker.</p>
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
