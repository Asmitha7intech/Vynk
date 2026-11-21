import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 transition-all duration-200 outline-none focus:border-indigo-500/70 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export interface SignInCardProps {
  isLogin?: boolean;
  onToggleMode?: () => void;
  onSubmit?: (e: React.FormEvent) => Promise<void> | void;
  email?: string;
  setEmail?: (val: string) => void;
  password?: string;
  setPassword?: (val: string) => void;
  isLoading?: boolean;
  errorMessage?: string;
  extraFields?: React.ReactNode;
  onForgotPassword?: () => void;
  className?: string;
}

export function SignInCard({
  isLogin = true,
  onToggleMode,
  onSubmit,
  email: controlledEmail,
  setEmail: setControlledEmail,
  password: controlledPassword,
  setPassword: setControlledPassword,
  isLoading = false,
  errorMessage = '',
  extraFields,
  onForgotPassword,
  className = '',
}: SignInCardProps) {
  const [internalEmail, setInternalEmail] = useState('');
  const [internalPassword, setInternalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const email = controlledEmail !== undefined ? controlledEmail : internalEmail;
  const setEmail = setControlledEmail || setInternalEmail;
  const password = controlledPassword !== undefined ? controlledPassword : internalPassword;
  const setPassword = setControlledPassword || setInternalPassword;

  // 3D card tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <div className={cn('min-h-[85vh] w-full flex items-center justify-center py-10 px-4 relative overflow-hidden', className)}>
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-[#07090e] to-[#07090e] -z-20" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
        style={{ perspective: 1400 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative group">
            {/* Outer card glow */}
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-indigo-500/25 via-purple-500/30 to-indigo-500/25 blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Traveling Light Beams */}
            <div className="absolute -inset-[1px] rounded-3xl overflow-hidden pointer-events-none">
              {/* Top beam */}
              <motion.div
                className="absolute top-0 left-0 h-[2.5px] w-[50%] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-80"
                animate={{ left: ['-50%', '100%'], opacity: [0.3, 0.8, 0.3] }}
                transition={{ left: { duration: 3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5 }, opacity: { duration: 1.5, repeat: Infinity, repeatType: 'mirror' } }}
              />
              {/* Right beam */}
              <motion.div
                className="absolute top-0 right-0 h-[50%] w-[2.5px] bg-gradient-to-b from-transparent via-purple-400 to-transparent opacity-80"
                animate={{ top: ['-50%', '100%'], opacity: [0.3, 0.8, 0.3] }}
                transition={{ top: { duration: 3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5, delay: 0.75 }, opacity: { duration: 1.5, repeat: Infinity, repeatType: 'mirror', delay: 0.75 } }}
              />
              {/* Bottom beam */}
              <motion.div
                className="absolute bottom-0 right-0 h-[2.5px] w-[50%] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-80"
                animate={{ right: ['-50%', '100%'], opacity: [0.3, 0.8, 0.3] }}
                transition={{ right: { duration: 3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5, delay: 1.5 }, opacity: { duration: 1.5, repeat: Infinity, repeatType: 'mirror', delay: 1.5 } }}
              />
              {/* Left beam */}
              <motion.div
                className="absolute bottom-0 left-0 h-[50%] w-[2.5px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-80"
                animate={{ bottom: ['-50%', '100%'], opacity: [0.3, 0.8, 0.3] }}
                transition={{ bottom: { duration: 3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5, delay: 2.25 }, opacity: { duration: 1.5, repeat: Infinity, repeatType: 'mirror', delay: 2.25 } }}
              />
            </div>

            {/* Main Glass Card Body */}
            <div className="relative bg-[#0d111a]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl space-y-5 overflow-hidden">
              {/* Grid pattern overlay */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Brand Header */}
              <div className="text-center space-y-2 relative z-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.7 }}
                  className="mx-auto w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/25 ring-1 ring-indigo-500/40 p-1 bg-gradient-to-br from-indigo-500/20 to-purple-600/30 flex items-center justify-center"
                >
                  <img
                    src="/vynk-logo.png"
                    alt="VYNK Logo"
                    className="w-full h-full object-contain rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent) {
                        parent.innerHTML = '<span class="text-xl font-black text-white font-mono">V</span>';
                      }
                    }}
                  />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xl sm:text-2xl font-black tracking-tight text-white"
                >
                  {isLogin ? 'Welcome Back to VYNK' : 'Join the Student Network'}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-xs text-muted-foreground"
                >
                  Find your people. Learn. Build. Rise.
                </motion.p>
              </div>

              {/* Error Notice Banner */}
              <AnimatePresence mode="wait">
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5 relative z-10"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold">Authentication Notice</p>
                      <p className="leading-relaxed break-words">{errorMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Real Form */}
              <form onSubmit={handleFormSubmit} className="space-y-3.5 relative z-10">
                {/* Email Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                    Campus or Personal Email
                  </label>
                  <div
                    className={cn(
                      'relative flex items-center rounded-xl bg-white/5 border border-white/10 transition-all duration-200 overflow-hidden',
                      focusedInput === 'email' && 'border-indigo-500/70 ring-2 ring-indigo-500/30 bg-white/10'
                    )}
                  >
                    <Mail
                      className={cn(
                        'absolute left-3.5 w-4 h-4 transition-colors',
                        focusedInput === 'email' ? 'text-indigo-400' : 'text-muted-foreground'
                      )}
                    />
                    <input
                      type="email"
                      required
                      placeholder="you@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-muted-foreground/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                      Password
                    </label>
                    {isLogin && onForgotPassword && (
                      <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div
                    className={cn(
                      'relative flex items-center rounded-xl bg-white/5 border border-white/10 transition-all duration-200 overflow-hidden',
                      focusedInput === 'password' && 'border-indigo-500/70 ring-2 ring-indigo-500/30 bg-white/10'
                    )}
                  >
                    <Lock
                      className={cn(
                        'absolute left-3.5 w-4 h-4 transition-colors',
                        focusedInput === 'password' ? 'text-indigo-400' : 'text-muted-foreground'
                      )}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-transparent pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-muted-foreground/50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Extra Registration Fields (Username, Name, College, Dept, Grad Year, Confirm Password) */}
                {!isLogin && extraFields}

                {/* Remember Me (Login mode) */}
                {isLogin && (
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500/50"
                      />
                      <span className="text-xs text-muted-foreground">Keep me signed in</span>
                    </label>
                  </div>
                )}

                {/* Submit Action */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 relative py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs tracking-tight transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer overflow-hidden border border-indigo-400/20"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign In to VYNK' : 'Create Student Account'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Mode Toggle Link */}
              {onToggleMode && (
                <div className="pt-3 border-t border-white/5 text-center relative z-10">
                  <button
                    type="button"
                    onClick={onToggleMode}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold cursor-pointer"
                  >
                    {isLogin
                      ? "Don't have an account yet? Sign up"
                      : 'Already have an account? Sign in'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Export both default and aliases for flexibility
export const Component = SignInCard;
export default SignInCard;
