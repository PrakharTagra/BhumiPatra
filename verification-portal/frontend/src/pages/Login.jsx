import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authApi from '../api/authApi';
import Logo from '../components/common/Logo';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isExpired = new URLSearchParams(location.search).get('expired') === '1';

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Official officer email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({ email: email.trim(), password });
      
      const token = response?.token || response?.accessToken;
      const user = response?.user || response?.data?.user;

      if (!token) {
        throw new Error('Authentication succeeded but no authorization token was returned.');
      }

      // Check VERIFICATION_OFFICER role
      if (user && user.role && user.role !== 'VERIFICATION_OFFICER') {
        setErrorMessage('Access Denied: Only accounts with the VERIFICATION_OFFICER role can access this workstation.');
        showError('Forbidden: Account is not authorized for land record verification.');
        setLoading(false);
        return;
      }

      login(token, user || { email, role: 'VERIFICATION_OFFICER' });
      showSuccess('Officer authentication verified.');
      
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.customMessage || err.response?.data?.message || 'Login failed. Please verify officer credentials.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex justify-center mb-3">
          <Logo variant="full" size="xl" className="max-h-28" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">
          BhumiPatra
        </h1>
        <div className="mt-2.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200">
          Verification Officer Portal
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {isExpired && (
            <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>Officer session has expired. Please sign in again to continue verification.</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Official Email Address"
                type="email"
                name="email"
                placeholder="officer@bhumipatra.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: null }));
                }}
                error={validationErrors.email}
                icon={Mail}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <Input
                label="Secure Password"
                type="password"
                name="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: null }));
                }}
                error={validationErrors.password}
                icon={Lock}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full justify-center bg-navy-950 hover:bg-navy-900 text-white shadow-md font-semibold text-sm py-2.5"
                icon={ArrowRight}
              >
                Sign In
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
