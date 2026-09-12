import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../lib/api';
import { Sparkles, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [college, setCollege] = useState('MIT');
  const [department, setDepartment] = useState('Computer Science');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (!isLogin && password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const res = await api.login({ email: email.trim().toLowerCase(), password });
        if (res?.user && res?.accessToken) {
          login(res.user, res.accessToken);
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
          displayName: displayName.trim(),
          college: college.trim(),
          department: department.trim(),
          graduationYear: Number(graduationYear) || 2026,
        });

        if (res?.user && res?.accessToken) {
          login(res.user, res.accessToken);
          navigate('/');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <img
            src="/vynk-logo.png"
            alt="VYNK Logo"
            className="w-16 h-16 object-contain rounded-2xl mx-auto shadow-xl shadow-indigo-500/25 ring-1 ring-indigo-500/30"
          />
          <h1 className="text-2xl font-black tracking-tight">
            {isLogin ? 'Welcome Back to VYNK' : 'Join the Student Network'}
          </h1>
          <p className="text-xs text-muted-foreground">
            Find your people. Learn. Build. Rise.
          </p>
        </div>

        <Card className="p-6 border-indigo-500/20">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Authentication Notice</p>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Campus or Personal Email"
              type="email"
              placeholder="alex.chen@mit.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {!isLogin && (
                <p className="text-[10px] text-muted-foreground">
                  Must be at least 8 characters.
                </p>
              )}
            </div>

            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Username"
                    placeholder="alexchen"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <Input
                    label="Display Name"
                    placeholder="Alex Chen"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="College / Univ"
                    placeholder="MIT"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    required
                  />
                  <Input
                    label="Department"
                    placeholder="Computer Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Graduation Year"
                  type="number"
                  placeholder="2026"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  required
                />
              </>
            )}

            <Button type="submit" className="w-full mt-2 shadow-lg shadow-indigo-500/20" isLoading={isLoading}>
              <span>{isLogin ? 'Sign In' : 'Create Student Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMessage('');
              }}
              className="text-xs text-indigo-400 hover:underline cursor-pointer font-semibold"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already registered? Sign in'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
