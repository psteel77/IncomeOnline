import React, { useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { LogIn, LogOut, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Header Log in / Log out control. For returning members who haven't clicked
 * their "Access All Areas" email link yet — lets them request a fresh login
 * link from any page. When already authenticated, shows Log out instead.
 *
 * Props:
 *   className  - classes for the trigger link (defaults suit dark headers)
 *   onNavigate - optional callback (e.g. close a mobile menu) fired on action
 */
export const LoginButton = ({ className = '', onNavigate }) => {
  const { isAuthenticated, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, node }

  const base = 'text-white hover:text-pink-300 transition-colors font-medium cursor-pointer no-underline';

  if (loading) return null;

  if (isAuthenticated) {
    return (
      <button
        type="button"
        data-testid="logout-btn"
        onClick={() => { logout(); onNavigate?.(); }}
        className={`${base} ${className} inline-flex items-center gap-1.5`}
      >
        <LogOut className="h-4 w-4" /> Log out
      </button>
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
