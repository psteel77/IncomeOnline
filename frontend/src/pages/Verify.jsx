import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Verify = () => {
  const [searchParams] = useSearchParams();
  const { token: pathToken } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Try path param first, then query param
    const token = pathToken || searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyToken(token);
  }, [searchParams, pathToken]);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/verify/${token}`);
      console.log('Verification response:', response.data);

      if (response.data.success && response.data.token) {
        setStatus('success');
        setMessage(response.data.message);
        
        // Save token to localStorage IMMEDIATELY
        localStorage.setItem('auth_token', response.data.token);
        console.log('Token saved to localStorage:', response.data.token.substring(0, 50));
        
        // Call login to update context
        login(response.data.token);
        console.log('Login function called');
        
        // Redirect to homepage after 2 seconds
        setTimeout(() => {
          console.log('Navigating to homepage...');
          navigate('/', { replace: true });
        }, 2000);
      } else if (response.data.expired) {
        // Subscription expired
        setStatus('error');
        setMessage('Your 12-month subscription has expired. Please make a new donation to renew your access.');
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred during verification');
      console.error('Verification error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-teal-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full shadow-xl border-2 border-teal-300">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'verifying' && (
              <Loader2 className="h-16 w-16 text-teal-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Verifying...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-slate-700 mb-6">{message}</p>
          
          {status === 'success' && (
            <p className="text-sm text-slate-600">Redirecting you to the homepage...</p>
          )}
          
          {status === 'error' && (
            <Button
              onClick={() => navigate('/')}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Go to Homepage
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Verify;
