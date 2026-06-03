import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import { Megaphone, Loader2, Send, Users, CheckCircle2, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Admin card to broadcast a one-time email (e.g. "New platforms added!")
 * to all opted-in Free-Resource subscribers + hero-pill leads.
 */
const BroadcastCard = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientCount, setRecipientCount] = useState(null);
  const [lastBroadcast, setLastBroadcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState(null); // {type:'success'|'error', text}

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json',
  });

  const loadInfo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/cms/broadcast`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRecipientCount(json.recipient_count);
      setLastBroadcast(json.last_broadcast || null);
    } catch (e) {
      setResult({ type: 'error', text: e.message || 'Failed to load broadcast info' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInfo(); }, [loadInfo]);

  const canSend = subject.trim().length > 0 && message.trim().length > 0 && (recipientCount || 0) > 0 && !sending;

  const doSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/cms/broadcast`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || `HTTP ${res.status}`);
      setResult({ type: 'success', text: `Sending to ${json.queued} subscriber${json.queued === 1 ? '' : 's'}… they'll arrive over the next few minutes.` });
      setSubject('');
      setMessage('');
      setTimeout(loadInfo, 1500);
    } catch (e) {
      setResult({ type: 'error', text: e.message || 'Failed to send broadcast' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card data-testid="broadcast-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-orange-500" /> Broadcast to Subscribers
        </CardTitle>
        <CardDescription>
          Send a one-time email (e.g. "New platforms added!") to everyone who signed up for free guides or via the hero pill.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 border-t pt-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users className="h-4 w-4 text-purple-600" />
          <span className="font-medium">Recipients:</span>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
          ) : (
            <span data-testid="broadcast-recipient-count" className="font-semibold text-slate-900">
              {recipientCount ?? 0} opted-in subscriber{(recipientCount ?? 0) === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
          <Input
            data-testid="broadcast-subject-input"
            placeholder="New platforms just added to Income Online!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending}
            maxLength={150}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
          <Textarea
            data-testid="broadcast-message-input"
            placeholder={"Hi there,\n\nWe've just added 12 new verified earning platforms…\n\nBlank lines start a new paragraph."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            rows={6}
          />
          <p className="text-xs text-slate-400 mt-1">Plain text. Leave a blank line between paragraphs. An unsubscribe link is added automatically.</p>
        </div>

        {result && (
          <div
            data-testid="broadcast-result"
            className={`flex items-start gap-2 text-sm rounded-md p-3 ${result.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
          >
            {result.type === 'success' ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
            <span>{result.text}</span>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          {lastBroadcast ? (
            <p className="text-xs text-slate-500" data-testid="broadcast-last">
              Last: "{lastBroadcast.subject}" — {lastBroadcast.sent_count}/{lastBroadcast.recipient_count} sent
              {lastBroadcast.status === 'sending' ? ' (in progress…)' : ''}
            </p>
          ) : <span />}
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!canSend}
            data-testid="broadcast-send-btn"
            className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-semibold"
          >
            {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</> : <><Send className="h-4 w-4 mr-2" /> Send Broadcast</>}
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent data-testid="broadcast-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Send this broadcast?</AlertDialogTitle>
            <AlertDialogDescription>
              This will email <strong>{recipientCount ?? 0}</strong> subscriber{(recipientCount ?? 0) === 1 ? '' : 's'} with the subject
              "<strong>{subject.trim()}</strong>". This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="broadcast-confirm-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doSend} data-testid="broadcast-confirm-send" className="bg-gradient-to-r from-orange-500 to-pink-600">
              Yes, send it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default BroadcastCard;
