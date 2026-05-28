import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;
const DONATION_AMOUNT = '12.99';
const DONATION_CURRENCY = 'USD';

/**
 * Drop-in replacement for the legacy PayPal Hosted Button.
 *
 * Why: Hosted Buttons give no JS callback, so we had no way to register the
 * donor on success — the server only learned about the payment via PayPal IPN,
 * which was unreliable. With the JS SDK + onApprove we capture the order
 * client-side, extract the payer email from PayPal's response, and call our
 * own /api/auth/add-donor endpoint to create the user with a 12-month
 * subscription. The donor then immediately gets the welcome email with the
 * verification link.
 */
const PayPalDonateButton = ({ amount = DONATION_AMOUNT, onSuccess }) => {
  const [status, setStatus] = useState('idle'); // idle | processing | success | error
  const [donorEmail, setDonorEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
      <PayPalScriptProvider
        options={{
          'client-id': PAYPAL_CLIENT_ID,
          currency: DONATION_CURRENCY,
          intent: 'capture',
          'disable-funding': 'venmo',
        }}
      >
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect', label: 'donate' }}
          disabled={status === 'processing'}
          forceReRender={[amount]}
          createOrder={(data, actions) =>
            actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  description: 'IncomeOnline — 12 months unlimited access',
                  amount: { currency_code: DONATION_CURRENCY, value: amount },
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

              // Register / renew the donor by sending only the order ID.
              // Backend re-fetches the order from PayPal server-side, verifies
              // status + amount, extracts payer email from PayPal's response.
              const resp = await axios.post(`${API}/paypal/register-donor`, {
                order_id: orderID,
              });

              const verifiedEmail =
                resp?.data?.email ||
                details?.payer?.email_address?.toLowerCase() ||
                '';

              setDonorEmail(verifiedEmail);
              setStatus('success');
              if (typeof onSuccess === 'function') {
                onSuccess({ email: verifiedEmail, orderId: orderID, details });
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
