import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mail, LogIn } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginBox = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post(`${API}/auth/request-access`, {
        email: email.toLowerCase()
      });

      if (response.data.success) {
        setMessage(response.data.message);
        setEmail('');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto bg-gradient-to-br from-white to-purple-50 border-2 border-purple-300 shadow-lg">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-purple-600" />
        </div>
        <CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-500">
          Access All Platforms
        </CardTitle>
        <CardDescription className="text-base text-slate-700 leading-relaxed">
          Enter your email to receive a verification link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-base py-6"
              disabled={loading}
            />
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base py-6"
            disabled={loading}
          >
            {loading ? (
              'Sending...'
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Request Access
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Don't have access? <a href="#support" className="text-purple-600 hover:text-purple-700 font-semibold">Donate to get access</a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginBox;
