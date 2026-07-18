import React, { useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { LogIn, LogOut, Mail, CheckCircle2, AlertCircle, Loader2, CalendarClock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RENEW_NUDGE_DAYS = 30; // show a renew nudge when this many days (or fewer) remain

const fmtDate = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
};

/**
 * Header Log in / My Account control. For returning members who haven't clicked
 * their "Access All Areas" email link yet — lets them request a fresh login
 * link from any page. When authenticated, shows an avatar that opens a
 * "My Account" menu with membership expiry + a renew nudge before it lapses.
 */
export const LoginButton = ({ className = '', onNavigate }) => {
  const { isAuthenticated, userEmail, expiresAt, daysRemaining, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, node }

  const base = 'text-white hover:text-pink-300 transition-colors font-medium cursor-pointer no-underline';

  if (loading) return null;

  if (isAuthenticated) {
    const local = (userEmail || '').split('@')[0];
    const initials = (local.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2) || '?').toUpperCase();
    const expiryLabel = fmtDate(expiresAt);
    const showRenew = typeof daysRemaining === 'number' && daysRemaining <= RENEW_NUDGE_DAYS;
    const renew = () => { window.location.href = '/donate'; onNavigate?.(); };

    return (
      <span className={`inline-flex items-center ${className}`} data-testid="signed-in-indicator">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="account-avatar"
              title="My account"
              className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-xs ring-2 ring-white/40 shadow-md cursor-pointer hover:ring-white/70 transition-all"
            >
              {initials}
              {showRenew && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-purple-900" data-testid="renew-dot" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64" data-testid="account-menu">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-xs font-normal text-slate-500">Signed in as</span>
              <span className="truncate font-semibold text-slate-800">{userEmail}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5" data-testid="membership-status">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CalendarClock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                {expiryLabel ? (
                  <span>Access until <span className="font-semibold">{expiryLabel}</span></span>
                ) : (
                  <span className="text-emerald-700 font-medium">Full access active</span>
                )}
              </div>
              {typeof daysRemaining === 'number' && (
                <p className={`text-xs mt-1 ml-6 ${showRenew ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                  {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining
                </p>
              )}
            </div>
            {showRenew && (
              <>
                <div className="px-2 pb-1">
                  <button
                    type="button"
                    onClick={renew}
                    data-testid="renew-btn"
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-md px-3 py-2 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" /> Renew for another year
                  </button>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem data-testid="logout-btn" onClick={() => { logout(); onNavigate?.(); }} className="cursor-pointer text-rose-600 focus:text-rose-700">
              <LogOut className="h-4 w-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setResult({ ok: false, node: 'Please enter a valid email address.' });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/auth/request-access`, { email: value });
      if (res.data.success) {
        setResult({ ok: true, node: 'Access link sent! Check your inbox (and spam folder) for your "Access All Areas" link.' });
        setEmail('');
      } else if (res.data.expired) {
        setResult({ ok: false, node: 'Your 12-month access has expired. Please renew from the "Get full access" section.' });
      } else {
        setResult({ ok: false, node: "We couldn't find that email. Check it matches the one you paid with, or get access from the donation section." });
      }
    } catch (err) {
      setResult({ ok: false, node: err?.response?.data?.detail || 'Something went wrong. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        data-testid="login-link"
        onClick={() => { setResult(null); setOpen(true); onNavigate?.(); }}
        className={`${base} ${className} inline-flex items-center gap-1.5`}
      >
        <LogIn className="h-4 w-4" /> Log in
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" data-testid="login-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-purple-600" /> Member log in
            </DialogTitle>
            <DialogDescription>
              Already paid? Enter your email and we'll send you a one-click "Access All Areas" link.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-3 pt-1">
            <Input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (result) setResult(null); }}
              placeholder="the email you paid with"
              autoComplete="email"
              autoFocus
              data-testid="login-email-input"
            />
            <Button type="submit" disabled={busy} data-testid="login-submit-btn" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              Send my access link
            </Button>
          </form>

          {result && (
            <div
              data-testid="login-result-message"
              className={`flex items-start gap-2 text-sm rounded-lg p-3 ${result.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}
            >
              {result.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
              <span>{result.node}</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginButton;
