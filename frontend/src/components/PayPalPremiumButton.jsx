import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { CheckCircle, AlertCircle, Download, Mail } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;
const PREMIUM_AMOUNT = '14.99';
const PREMIUM_CURRENCY = 'USD';

/**
 * Premium Pack purchase — server-verified PayPal SDK flow ($14.99).
 * On approval the backend re-fetches the order from PayPal, confirms the amount,
 * grants 12-month platform access AND issues a one-time download token for the
 * Wealth Generator bundle ZIP, which we trigger immediately.
 */
const PayPalPremiumButton = () => {
  const [status, setStatus] = useState('idle'); // idle | processing | success | error
  const [donorEmail, setDonorEmail] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!PAYPAL_CLIENT_ID) {
    return (
      <div
        className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-amber-800 text-sm"
        data-testid="premium-paypal-config-missing"
      >
        PayPal is not configured for this environment. Set
        <code className="mx-1 px-1 bg-amber-100 rounded">REACT_APP_PAYPAL_CLIENT_ID</code>
        in your frontend .env to enable purchases.
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div
        className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 text-left"
        data-testid="premium-success"
      >
        <div className="flex items-start gap-3 mb-3">
          <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-emerald-900 mb-1">Thank you — Premium unlocked!</p>
            <p className="text-emerald-800 text-sm">
              12-month platform access is now active for{' '}
              <span className="font-semibold">{donorEmail}</span>, and your download should
              have started automatically.
            </p>
          </div>
        </div>
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="premium-manual-download"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
          >
            <Download className="h-4 w-4" />
            Didn't start? Click here to download your Premium Pack
          </a>
        )}
        <p className="flex items-center gap-1.5 text-emerald-700 text-sm mt-3">
          <Mail className="h-4 w-4" />
          We've also emailed your download link and access details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PayPalScriptProvider
        options={{
          'client-id': PAYPAL_CLIENT_ID,
          currency: PREMIUM_CURRENCY,
          intent: 'capture',
          'disable-funding': 'venmo',
        }}
      >
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
          disabled={status === 'processing'}
          forceReRender={[PREMIUM_AMOUNT]}
          createOrder={(data, actions) =>
            actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  description: 'IncomeOnline Premium — 12mo access + Wealth Generator bundle',
                  amount: { currency_code: PREMIUM_CURRENCY, value: PREMIUM_AMOUNT },
                },
              ],
              application_context: {
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
              },
            })
          }
          onApprove={async (data, actions) => {
            setStatus('processing');
            setErrorMsg('');
            try {
              const details = await actions.order.capture();
              const orderID = data.orderID;
              if (!orderID) {
                throw new Error('PayPal did not return an order ID. Please contact support.');
              }

              const resp = await axios.post(`${API}/paypal/register-premium`, {
                order_id: orderID,
              });

              const verifiedEmail =
                resp?.data?.email ||
                details?.payer?.email_address?.toLowerCase() ||
                '';
              const dl = resp?.data?.download_url
                ? `${BACKEND_URL}${resp.data.download_url}`
                : '';

              setDonorEmail(verifiedEmail);
              setDownloadUrl(dl);
              setStatus('success');

              // Auto-trigger the download
              if (dl) {
                window.open(dl, '_blank');
              }
            } catch (err) {
              console.error('Premium purchase completion failed:', err);
              setErrorMsg(
                err?.response?.data?.detail ||
                  err?.response?.data?.message ||
                  err?.message ||
                  'We received your payment but could not unlock your pack. Please contact support with your PayPal transaction ID.'
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
          data-testid="premium-processing-message"
        >
          Confirming your payment and preparing your download…
        </p>
      )}

      {status === 'error' && errorMsg && (
        <div
          className="bg-red-50 border-2 border-red-300 rounded-xl p-3 flex items-start gap-2 text-left"
          data-testid="premium-error-message"
        >
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{errorMsg}</p>
        </div>
      )}
    </div>
  );
};

export default PayPalPremiumButton;
