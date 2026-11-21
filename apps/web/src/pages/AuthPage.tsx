import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { Component as SignInCard, Input } from '../components/ui/sign-in-card-2';
import { KeyRound, CheckCircle2, AlertCircle, X, ArrowRight, ShieldCheck } from 'lucide-react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [college, setCollege] = useState('CIT');
  const [department, setDepartment] = useState('Computer Science');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password Recovery State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'EMAIL' | 'RESET' | 'DONE'>('EMAIL');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const { login } = useAuthStore();
  const navigate = useNavigate();

  // Password Strength Computation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: 'None', color: 'bg-zinc-700' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-indigo-400' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-400' };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (!isLogin) {
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your entries.');
        setIsLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const res = await api.login({ email: email.trim().toLowerCase(), password });
        if (res?.user && res?.accessToken) {
          login(res.user, res.accessToken, res.refreshToken);
          navigate('/');
        }
      } else {
        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (cleanUsername.length < 3) {
          setErrorMessage('Username must be at least 3 characters (letters, numbers, underscores).');
          setIsLoading(false);
          return;
        }

        const res = await api.register({
          email: email.trim().toLowerCase(),
          password,
          username: cleanUsername,
          displayName: displayName.trim() || cleanUsername,
          college: college.trim(),
          department: department.trim(),
          graduationYear: Number(graduationYear) || 2026,
        });

        if (res?.user && res?.accessToken) {
          login(res.user, res.accessToken, res.refreshToken);
          navigate('/');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      if (forgotStep === 'EMAIL') {
        const res = await api.forgotPassword(forgotEmail.trim().toLowerCase());
        setForgotSuccess(res.message || 'Instructions generated.');
        if (res.resetToken) {
          setResetToken(res.resetToken);
        }
        setForgotStep('RESET');
      } else if (forgotStep === 'RESET') {
        if (newPassword.length < 8) {
          setForgotError('New password must be at least 8 characters.');
          setForgotLoading(false);
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setForgotError('Passwords do not match.');
          setForgotLoading(false);
          return;
        }

        const res = await api.resetPassword(resetToken.trim(), newPassword);
        setForgotSuccess(res.message || 'Password updated successfully!');
        setForgotStep('DONE');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Request failed. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const extraRegistrationFields = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-white/70">Username</label>
          <Input
            type="text"
            placeholder="alexchen"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-xs px-3 rounded-xl focus:border-indigo-400"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-white/70">Display Name</label>
          <Input
            type="text"
            placeholder="Alex Chen"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-xs px-3 rounded-xl focus:border-indigo-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-white/70">College / Univ</label>
          <Input
            type="text"
            placeholder="CIT"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            required
            className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-xs px-3 rounded-xl focus:border-indigo-400"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-white/70">Department</label>
          <Input
            type="text"
            placeholder="Computer Science"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
            className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-xs px-3 rounded-xl focus:border-indigo-400"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-white/70">Graduation Year</label>
        <Input
          type="number"
          placeholder="2026"
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
          required
          className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-xs px-3 rounded-xl focus:border-indigo-400"
        />
      </div>

      {/* Confirm Password & Strength Meter */}
      <div className="space-y-2 pt-1">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-white/70">Confirm Password</label>
          <Input
            type="password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-xs px-3 rounded-xl focus:border-indigo-400"
          />
        </div>

        {password && (
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/60">Strength</span>
              <span className="font-semibold text-white">{passwordStrength.label}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 h-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`rounded-full transition-all duration-300 ${
                    passwordStrength.score >= step ? passwordStrength.color : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <SignInCard
        isLogin={isLogin}
        onToggleMode={() => {
          setIsLogin(!isLogin);
          setErrorMessage('');
        }}
        onSubmit={handleSubmit}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isLoading={isLoading}
        errorMessage={errorMessage}
        extraFields={extraRegistrationFields}
        onForgotPassword={() => {
          setForgotEmail(email);
          setForgotStep('EMAIL');
          setForgotError('');
          setForgotSuccess('');
          setShowForgotModal(true);
        }}
      />

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0d1117] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Password Recovery</h3>
                <p className="text-xs text-white/60">Regain secure access to your account</p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 'EMAIL' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-white/70 leading-relaxed">
                  Enter your registered campus or personal email address. We will generate a secure reset authorization token.
                </p>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/70">Account Email</label>
                  <Input
                    type="email"
                    placeholder="student@mit.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 text-xs px-3 rounded-xl focus:border-indigo-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  {forgotLoading ? 'Processing...' : 'Send Recovery Token'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {forgotStep === 'RESET' && (
              <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/70">Reset Authorization Token</label>
                  <Input
                    type="text"
                    placeholder="Paste or enter reset token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-xs px-3 rounded-xl font-mono focus:border-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/70">New Password (min 8 chars)</label>
                  <Input
                    type="password"
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-xs px-3 rounded-xl focus:border-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/70">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 text-xs px-3 rounded-xl focus:border-indigo-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30 mt-2"
                >
                  {forgotLoading ? 'Updating Password...' : 'Set New Password'}
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </form>
            )}

            {forgotStep === 'DONE' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Password Successfully Reset</h4>
                  <p className="text-xs text-white/60">
                    All prior active sessions have been terminated. You can now sign in with your new password.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setIsLogin(true);
                    setPassword('');
                  }}
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AuthPage;
