import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { Button } from '../components/Button';
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2, Lock, ArrowRight, LogOut } from 'lucide-react';

export function ChangePasswordPage() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength calculation
  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'None', color: 'bg-zinc-700' };
    let score = 0;
    if (newPassword.length >= 10) score += 1;
    if (newPassword.length >= 14) score += 1;
    if (/[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-indigo-400' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-400' };
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword.length < 10) {
      setErrorMessage('New password must be at least 10 characters long.');
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setErrorMessage('Password must contain uppercase letters, lowercase letters, numbers, and symbols.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.changePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
      });

      if (res?.success) {
        updateUser({ mustChangePassword: false });
        setSuccessMessage('Password updated successfully! Navigating to campus hub...');
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setErrorMessage(res?.message || 'Failed to update password. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#131318] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-sans tracking-normal text-white">
            Set Your Permanent Password
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Welcome to VYNK, {user?.displayName || 'Builder'}. Please choose a strong, secure password for your account to complete setup.
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold">Security Requirement</p>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold">Password Changed</p>
              <p className="mt-0.5 leading-relaxed">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!user?.mustChangePassword && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                Current Password
              </label>
              <div className="relative flex items-center rounded-xl bg-white/5 border border-white/10 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <Lock className="absolute left-3.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-muted-foreground/50 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
              New Password (min 10 characters)
            </label>
            <div className="relative flex items-center rounded-xl bg-white/5 border border-white/10 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Lock className="absolute left-3.5 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                placeholder="Choose a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </div>

            {/* Strength meter */}
            {newPassword && (
              <div className="space-y-1 pt-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Strength:</span>
                  <span className={`font-semibold ${strength.score >= 3 ? 'text-emerald-400' : strength.score === 2 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-all ${
                        step <= strength.score ? strength.color : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Must include upper and lower case letters, numbers, and symbols.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
              Confirm New Password
            </label>
            <div className="relative flex items-center rounded-xl bg-white/5 border border-white/10 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Lock className="absolute left-3.5 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !newPassword || newPassword !== confirmPassword}
            className="w-full py-2.5 text-xs font-semibold gap-2"
          >
            {isLoading ? (
              'Securing Account...'
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Save Permanent Password
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>Signed in as <strong className="text-white">{user?.email}</strong></span>
          <button
            type="button"
            onClick={() => logout().then(() => navigate('/auth'))}
            className="hover:text-rose-400 flex items-center gap-1 text-[11px] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
