import React, { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons, FUNDING } from '@paypal/react-paypal-js';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;
const DONATION_AMOUNT = '9.99';
const DONATION_CURRENCY = 'GBP';

// Simple RFC 5322-lite check — good enough to avoid sending recovery emails
// to garbage strings. Backend re-validates via Pydantic EmailStr.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PayPalDonateButton = ({ amount = DONATION_AMOUNT, onSuccess }) => {
  const [status, setStatus] = useState('idle'); // idle | processing | success | error
  const [donorEmail, setDonorEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');

  // If the donor lands here from an abandoned-donation recovery email, the
  // URL fragment looks like `#support?resume=foo@bar.com`. Pre-fill so they
  // don't re-type.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    const match = hash.match(/[?&]resume=([^&]+)/);
    if (match) {
      try {
        setRecoveryEmail(decodeURIComponent(match[1]));
      } catch {
        // ignore malformed value
      }
    }
  }, []);

  const captureIntent = async () => {
    const email = recoveryEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return;
    try {
      await axios.post(`${API}/paypal/intent`, { email });
    } catch (err) {
      // Non-blocking; the donation flow proceeds even if intent capture fails.
      console.warn('Donation intent capture failed:', err?.message || err);
    }
  };

  if (!PAYPAL_CLIENT_ID) {
    return (
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-amber-800 text-sm" data-testid="paypal-config-missing">
        PayPal is not configured for this environment. Set
        <code className="mx-1 px-1 bg-amber-100 rounded">REACT_APP_PAYPAL_CLIENT_ID</code>
        in your frontend .env to enable donations.
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div
        className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 flex items-start gap-3 text-left"
        data-testid="paypal-success-message"
      >
        <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-emerald-900 mb-1">Thank you for your support!</p>
          <p className="text-emerald-800 text-sm mb-2">
            Your 12-month access has been activated for{' '}
            <span className="font-semibold">{donorEmail}</span>.
          </p>
          <p className="flex items-center gap-1.5 text-emerald-700 text-sm">
            <Mail className="h-4 w-4" />
            Check your inbox (and spam folder) for the welcome email with your access link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Optional recovery email — captures intent so we can email the donor if they don't complete */}
      <label className="block text-left">
        <span className="block text-sm font-semibold text-gray-700 mb-1">
          Email (optional)
          <span className="ml-1 text-xs font-normal text-gray-500">
            — we'll save your place if you don't finish
          </span>
        </span>
        <input
          type="email"
          value={recoveryEmail}
          onChange={(e) => setRecoveryEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          data-testid="donation-recovery-email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </label>

      <PayPalScriptProvider
        options={{
          'client-id': PAYPAL_CLIENT_ID,
          currency: DONATION_CURRENCY,
          intent: 'capture',
          components: 'buttons',
          // Apple Pay isn't registered for this domain and throws
          // ELIGIBLE_PAYMENT_METHOD_ERROR (GetApplepayConfig) which bubbles up
          // to onError. Disable Apple Pay + Venmo so the SDK doesn't probe them.
          'disable-funding': 'venmo,applepay',
        }}
      >
        <PayPalButtons
          fundingSource={FUNDING.PAYPAL}
          fundingSource={FUNDING.PAYPAL}
          style={{ layout: 'vertical', shape: 'rect', label: 'donate' }}
          disabled={status === 'processing'}
          forceReRender={[amount]}
          onClick={(data, actions) => {
            // Fire-and-forget: record the intent the moment they open the
            // PayPal popup. We don't block opening if it fails.
            captureIntent();
            return actions.resolve();
          }}
          createOrder={async () => {
            // Create the order SERVER-SIDE (client-side actions.order.create()
            // returns 403 NOT_AUTHORIZED on this live account).
            try {
              const resp = await axios.post(`${API}/paypal/create-order`, {
                kind: 'donation',
              });
              return resp.data.id;
            } catch (err) {
              const detail =
                err?.response?.data?.detail ||
                'Could not start the PayPal checkout. Please try again.';
              console.error('create-order failed:', detail);
              setErrorMsg(detail);
              setStatus('error');
              throw err;
            }
          }}
          onApprove={async (data) => {
            setStatus('processing');
            setErrorMsg('');
            try {
              const orderID = data.orderID;

              if (!orderID) {
                throw new Error('PayPal did not return an order ID. Please contact support.');
              }

              // Backend captures the order server-side, verifies status +
              // amount, extracts payer email from PayPal's response, then
              // registers / renews the donor.
              const resp = await axios.post(`${API}/paypal/register-donor`, {
                order_id: orderID,
              });

              const verifiedEmail = resp?.data?.email || '';

              setDonorEmail(verifiedEmail);
              setStatus('success');
              if (typeof onSuccess === 'function') {
                onSuccess({ email: verifiedEmail, orderId: orderID });
              }
            } catch (err) {
              console.error('Donation completion failed:', err);
              setErrorMsg(
                err?.response?.data?.detail ||
                  err?.response?.data?.message ||
                  err?.message ||
                  'We received your payment but could not register your access. Please contact support with your PayPal transaction ID.'
              );
              setStatus('error');
            }
          }}
          onError={(err) => {
            console.error('PayPal error:', err);
            setErrorMsg('PayPal encountered an error. Please try again or contact support.');
            setStatus('error');
          }}
          onCancel={() => {
            setStatus('idle');
            setErrorMsg('');
          }}
        />
      </PayPalScriptProvider>

      {status === 'processing' && (
        <p
          className="text-sm text-gray-600 text-center animate-pulse"
          data-testid="paypal-processing-message"
        >
          Finalising your access… please don't close this window.
        </p>
      )}

      {status === 'error' && errorMsg && (
        <div
          className="bg-red-50 border-2 border-red-300 rounded-xl p-3 flex items-start gap-2 text-left"
          data-testid="paypal-error-message"
        >
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{errorMsg}</p>
        </div>
      )}
    </div>
  );
};

export default PayPalDonateButton;
