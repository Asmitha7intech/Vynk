const fs = require('fs');
const path = require('path');

// 1. Fix apps/web/src/lib/api.ts with bulletproof response parsing
const apiPath = path.resolve(__dirname, '../apps/web/src/lib/api.ts');
const apiContent = `
import {
  Post,
  Voyage,
  Crew,
  DailyChallenge,
  Quiz,
  LeaderboardEntry,
  MentorProfile,
  Conversation,
  User,
  BountyBadge,
  EventItem,
  PlatformAnalytics
} from '@vynk/types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, code?: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('vynk_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };

  if (token) {
    headers['Authorization'] = `Bearer \${token}`;
  }

  let res: Response;
  try {
    res = await fetch(\`\${API_BASE}\${endpoint}\`, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    throw new ApiError(
      'Unable to connect to the VYNK API server. Please verify the backend is running on port 4000.',
      0,
      'NETWORK_ERROR'
    );
  }

  // Safely read response text first
  const responseText = await res.text();
  let json: any = null;

  if (responseText) {
    try {
      json = JSON.parse(responseText);
    } catch {
      // Non-JSON response (e.g. Vite proxy 504 / HTML error)
      throw new ApiError(
        res.ok
          ? 'Invalid server response'
          : \`Server returned status \${res.status}: \${responseText.slice(0, 100)}\`,
        res.status,
        'INVALID_RESPONSE'
      );
    }
  }

  if (!res.ok || (json && json.success === false)) {
    let errorMsg = 'Request failed';
    let code = 'API_ERROR';
    let errors = undefined;

    if (json) {
      if (json.errors) {
        // Collect Zod validation errors
        const firstField = Object.keys(json.errors)[0];
        if (firstField && json.errors[firstField]?.length > 0) {
          errorMsg = json.errors[firstField][0];
        } else {
          errorMsg = json.message || 'Validation error';
        }
        errors = json.errors;
      } else if (json.message) {
        errorMsg = json.message;
      } else if (json.error?.message) {
        errorMsg = json.error.message;
        code = json.error.code || code;
      }
    } else {
      errorMsg = \`HTTP \${res.status} \${res.statusText}\`;
    }

    throw new ApiError(errorMsg, res.status, code, errors);
  }

  if (!json) {
    return {} as T;
  }

  return json.data !== undefined ? json.data : json;
}

export const api = {
  // -------------------------------------------------------------
  // AUTHENTICATION & ONBOARDING
  // -------------------------------------------------------------
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getCurrentUser: () => request<{ user: User }>('/auth/me'),
  updateProfile: (data: any) => request<User>('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  getUserProfile: (username: string) => request<any>(\`/users/\${username}\`),
  searchUsers: (query: string) => request<User[]>(\`/users/search?q=\${encodeURIComponent(query)}\`),
  getCrossDepartmentMatches: () => request<any[]>('/users/cross-department'),
  addSkill: (data: any) => request<any>('/users/skills', { method: 'POST', body: JSON.stringify(data) }),

  // -------------------------------------------------------------
  // VYNKS & SOCIAL GRAPH
  // -------------------------------------------------------------
  getConnections: () => request<User[]>('/vynks/connections'),
  getPendingRequests: () => request<any[]>('/vynks/requests/pending'),
  sendVynkRequest: (targetUserId: string) => request<any>(\`/vynks/request/\${targetUserId}\`, { method: 'POST' }),
  acceptVynkRequest: (connectionId: string) => request<any>(\`/vynks/accept/\${connectionId}\`, { method: 'POST' }),
  rejectVynkRequest: (connectionId: string) => request<any>(\`/vynks/reject/\${connectionId}\`, { method: 'POST' }),

  // -------------------------------------------------------------
  // CAMPUS FEED & POSTS
  // -------------------------------------------------------------
  getFeed: (limit = 20, cursor?: string) => request<any>(\`/posts/feed?limit=\${limit}\${cursor ? \`&cursor=\${cursor}\` : ''}\`),
  getPost: (id: string) => request<Post>(\`/posts/\${id}\`),
  createPost: (data: any) => request<Post>('/posts', { method: 'POST', body: JSON.stringify(data) }),
  addComment: (postId: string, data: any) => request<any>(\`/posts/\${postId}/comments\`, { method: 'POST', body: JSON.stringify(data) }),
  toggleReaction: (postId: string, emoji = '🔥') => request<any>(\`/posts/\${postId}/react\`, { method: 'POST', body: JSON.stringify({ emoji }) }),

  // -------------------------------------------------------------
  // VOYAGES (PROJECT PORTFOLIOS)
  // -------------------------------------------------------------
  getVoyages: (category?: string) => request<Voyage[]>(\`/voyages\${category && category !== 'ALL' ? \`?category=\${encodeURIComponent(category)}\` : ''}\`),
  getVoyage: (id: string) => request<Voyage>(\`/voyages/\${id}\`),
  createVoyage: (data: any) => request<Voyage>('/voyages', { method: 'POST', body: JSON.stringify(data) }),
  toggleVoyageLike: (id: string) => request<any>(\`/voyages/\${id}/like\`, { method: 'POST' }),

  // -------------------------------------------------------------
  // CREWS (HACKATHON SQUADS)
  // -------------------------------------------------------------
  getCrews: (category?: string) => request<Crew[]>(\`/crews\${category && category !== 'ALL' ? \`?category=\${encodeURIComponent(category)}\` : ''}\`),
  getCrew: (id: string) => request<Crew>(\`/crews/\${id}\`),
  createCrew: (data: any) => request<Crew>('/crews', { method: 'POST', body: JSON.stringify(data) }),
  joinCrew: (crewId: string, roleName: string) => request<any>(\`/crews/\${crewId}/join\`, { method: 'POST', body: JSON.stringify({ roleName }) }),
  signTeamAgreement: (crewId: string) => request<any>(\`/crews/\${crewId}/sign-agreement\`, { method: 'POST' }),

  // -------------------------------------------------------------
  // AI MATCHMAKING
  // -------------------------------------------------------------
  getRecommendedTeammates: (crewId: string) => request<any[]>(\`/matching/crews/\${crewId}/recommendations\`),

  // -------------------------------------------------------------
  // QUESTS & QUIZZES
  // -------------------------------------------------------------
  getDailyChallenge: () => request<{ challenge: DailyChallenge; isCompleted: boolean }>('/quests/daily-challenge'),
  submitDailyChallenge: (challengeId: string, selectedOptionIndex: number) => request<any>('/quests/daily-challenge/submit', {
    method: 'POST',
    body: JSON.stringify({ challengeId, selectedOptionIndex }),
  }),
  getQuizzes: () => request<Quiz[]>('/quests/quizzes'),
  getQuiz: (id: string) => request<Quiz>(\`/quests/quizzes/\${id}\`),
  submitQuiz: (quizId: string, timeSpentSeconds: number, answers: any[]) => request<any>('/quests/quizzes/submit', {
    method: 'POST',
    body: JSON.stringify({ quizId, timeSpentSeconds, answers }),
  }),

  // -------------------------------------------------------------
  // MENTORSHIP
  // -------------------------------------------------------------
  getMentors: (category?: string) => request<MentorProfile[]>(\`/mentors\${category && category !== 'ALL' ? \`?category=\${encodeURIComponent(category)}\` : ''}\`),
  createMentorProfile: (data: any) => request<any>('/mentors/profile', { method: 'POST', body: JSON.stringify(data) }),
  requestMentorship: (data: any) => request<any>('/mentors/request', { method: 'POST', body: JSON.stringify(data) }),

  // -------------------------------------------------------------
  // MESSAGING & REALTIME
  // -------------------------------------------------------------
  getConversations: () => request<Conversation[]>('/messages/conversations'),
  getMessages: (conversationId: string) => request<any[]>(\`/messages/conversations/\${conversationId}/messages\`),
  sendMessage: (data: any) => request<any>('/messages/send', { method: 'POST', body: JSON.stringify(data) }),
  getDirectConversation: (targetUserId: string) => request<Conversation>(\`/messages/direct/\${targetUserId}\`),

  // -------------------------------------------------------------
  // GAMIFICATION & LEADERBOARD
  // -------------------------------------------------------------
  getLeaderboard: (scope = 'GLOBAL') => request<LeaderboardEntry[]>(\`/gamification/leaderboard?scope=\${scope}\`),
  getRankExplanation: (userId: string, scope = 'GLOBAL') => request<any>(\`/gamification/rank-explanation/\${userId}?scope=\${scope}\`),
  getBadges: () => request<BountyBadge[]>('/gamification/badges'),

  // -------------------------------------------------------------
  // EVENTS & COMMUNITIES
  // -------------------------------------------------------------
  getEvents: () => request<EventItem[]>('/events'),
  registerForEvent: (eventId: string) => request<any>(\`/events/\${eventId}/register\`, { method: 'POST' }),

  // -------------------------------------------------------------
  // ANALYTICS & BIG DATA
  // -------------------------------------------------------------
  trackEvent: (eventName: string, metadata?: any) => request<any>('/analytics/track', {
    method: 'POST',
    body: JSON.stringify({ eventName, metadata }),
  }).catch(() => {}),
  getPlatformMetrics: () => request<PlatformAnalytics>('/analytics/metrics'),
  getCampusSkillHeatmap: (college?: string) => request<any>(\`/analytics/bigdata/campus-heatmap\${college ? \`?college=\${encodeURIComponent(college)}\` : ''}\`),
  getDepartmentCollaboration: () => request<any>('/analytics/bigdata/dept-collaboration'),
  createReport: (data: any) => request<any>('/admin/reports', { method: 'POST', body: JSON.stringify(data) }),
};
`;

// 2. Fix AuthPage.tsx with clear validation hints and better password feedback
const authPagePath = path.resolve(__dirname, '../apps/web/src/pages/AuthPage.tsx');
const authPageContent = `
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../lib/api';
import { Sparkles, Shield, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

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
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-xl shadow-indigo-500/20">
            V
          </div>
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
`;

// 3. Fix apps/api/src/controllers/auth.controller.ts (GET /me)
const authCtrlPath = path.resolve(__dirname, '../apps/api/src/controllers/auth.controller.ts');
let authCtrl = fs.readFileSync(authCtrlPath, 'utf8');

authCtrl = authCtrl.replace(
  "const user = await authService.login(request.userPayload!.email, 'vynkPass123!').catch(() => null);",
  "const user = await userRepository.findById(userId);"
);

if (!authCtrl.includes("import { userRepository } from '../repositories/user.repository';")) {
  authCtrl = "import { userRepository } from '../repositories/user.repository';\n" + authCtrl;
}

fs.writeFileSync(apiPath, apiContent.trim() + '\n', 'utf8');
fs.writeFileSync(authPagePath, authPageContent.trim() + '\n', 'utf8');
fs.writeFileSync(authCtrlPath, authCtrl.trim() + '\n', 'utf8');
console.log('Fixed api.ts response handling, AuthPage validation, and auth.controller.ts GET /me');
