import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BhumiPatraLogo from '../components/common/BhumiPatraLogo';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import AlertBanner from '../components/common/AlertBanner';
import { Lock, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your operator email address or username.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    try {
      setIsLoading(true);
      await login({ email: email.trim(), password });
      success('Authentication successful. Welcome to BhumiPatra Operator Portal.', 'Login Verified');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top BhumiPatra Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex justify-center mb-3">
          <BhumiPatraLogo variant="full" size="xl" className="max-h-28" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">
          BhumiPatra
        </h1>
        <div className="mt-2.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-navy-800 border border-sky-200">
          Digitization Operator Portal
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-xl border border-slate-200 sm:px-10">
          {/* Operator Notice Tag */}
          <div className="mb-6 p-3 rounded-md bg-navy-50 border border-navy-100 text-xs text-navy-900 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-navy-700 shrink-0" />
            <div>
              Access restricted to authorized personnel.
            </div>
          </div>

          {errorMsg && (
            <AlertBanner
              type="error"
              title="Authentication Error"
              message={errorMsg}
              onClose={() => setErrorMsg(null)}
              className="mb-5"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Input
                label="Operator Email / Username"
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@bhumipatra.in"
                icon={Mail}
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  icon={Lock}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[29px] text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full text-sm font-semibold py-2.5 bg-navy-800 hover:bg-navy-900"
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

export default LoginPage;
