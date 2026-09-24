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
          <Logo size="lg" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-950">
          Officer Verification Desk
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Land Records AI Validation & Decision Workstation
        </p>
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
                placeholder="officer@bhumipatra.gov"
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
                Sign In to Verification Desk
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Restricted to Authorized Verification Officers</span>
            </div>
            <p className="mt-2 text-[10px] text-slate-400 leading-normal">
              Official decisions on land titles are cryptographically signed and logged for audit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
