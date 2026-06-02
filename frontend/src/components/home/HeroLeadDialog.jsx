import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { BookOpenCheck, Loader2, ArrowRight } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lightweight lead-capture dialog shown when a visitor clicks the hero
 * "Free MoneyRules Guides" pill (only when CMS pill_capture_email is on).
 * Capturing an email is OPTIONAL — visitors can skip and still reach the guides.
 * On submit (or skip) `onContinue` is called so the page scrolls to the guides.
 */
const HeroLeadDialog = ({ open, onOpenChange, onContinue }) => {
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('io_resource_email') || ''; } catch { return ''; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const finish = () => {
    onOpenChange(false);
    // Let the dialog close animation start, then scroll.
    setTimeout(() => { try { onContinue && onContinue(); } catch {} }, 120);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${backendUrl}/api/leads/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean, source: 'hero_pill' }),
      });
      try { localStorage.setItem('io_resource_email', clean); } catch {}
    } catch {
      // Non-blocking — never trap the visitor if capture fails.
    } finally {
      setSubmitting(false);
      finish();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="hero-lead-dialog">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow">
              <BookOpenCheck className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-lg">Get the free guides</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Pop in your email and we'll tell you when new free MoneyRules guides drop. No spam, unsubscribe anytime — or skip straight to the library.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="hero-lead-email" className="text-sm font-medium text-slate-700 mb-1.5 block">
              Email address
            </label>
            <Input
              id="hero-lead-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              data-testid="hero-lead-email-input"
              className="focus-visible:ring-amber-500"
            />
            {error && (
              <p className="text-sm text-rose-600 mt-1.5" data-testid="hero-lead-error">{error}</p>
            )}
          </div>

          <DialogFooter className="sm:justify-between gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={finish}
              disabled={submitting}
              data-testid="hero-lead-skip-btn"
              className="text-slate-500 hover:text-slate-700 sm:w-auto w-full"
            >
              Skip to guides
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              data-testid="hero-lead-submit-btn"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold sm:w-auto w-full"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                <>Take me to the guides <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HeroLeadDialog;
