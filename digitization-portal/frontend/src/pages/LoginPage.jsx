import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BhumiPatraLogo from '../components/common/BhumiPatraLogo';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import AlertBanner from '../components/common/AlertBanner';
import { Lock, Mail, ShieldCheck, Eye, EyeOff, FileText, Cpu, CheckCircle } from 'lucide-react';

export const LoginPage = () => {
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
      {/* Top Government-Portal-Style Header Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex justify-center mb-3">
          <BhumiPatraLogo size="lg" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Land Record Digitization Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Autonomous AI Preprocessing, OCR &amp; Parcel Validation System
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-xl border border-slate-200 sm:px-10">
          {/* Operator Notice Tag */}
          <div className="mb-6 p-3 rounded-md bg-navy-50 border border-navy-100 text-xs text-navy-900 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-navy-700 shrink-0" />
            <div>
              <span className="font-bold">Operator Access:</span> Portal restricted to authorized{' '}
              <strong className="font-semibold text-navy-800">DIGITIZATION_OPERATOR</strong> personnel.
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
                placeholder="operator@bhumipatra.gov"
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
                Sign In to Operator Console
              </Button>
            </div>
          </form>

          {/* System Guidelines Checklist */}
          <div className="mt-8 pt-5 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
            <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
              Security &amp; Compliance SOP:
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Ensure scanned documents are in PDF, JPG, PNG or TIFF format</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Never manually fabricate or alter land parcel records</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>All operator activities are timestamped and cryptographically audited</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-500">
          BhumiPatra Land Record Digitization Portal &bull; Node.js/MongoDB Backend Integration Ready
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
