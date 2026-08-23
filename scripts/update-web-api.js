const fs = require('fs');
const path = require('path');

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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('vynk_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };

  if (token) {
    headers['Authorization'] = \`Bearer \${token}\`;
  }

  const res = await fetch(\`\${API_BASE}\${endpoint}\`, {
    ...options,
    headers,
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    const errorMsg = json.message || \`API request to \${endpoint} failed with status \${res.status}\`;
    throw new Error(errorMsg);
  }

  return json.data !== undefined ? json.data : json;
}

export const api = {
  // -------------------------------------------------------------
  // AUTHENTICATION & ONBOARDING
  // -------------------------------------------------------------
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getCurrentUser: () => request<User>('/auth/me'),
  updateProfile: (data: any) => request<User>('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  getUserProfile: (username: string) => request<any>(\`/users/\${username}\`),
  searchUsers: (query: string) => request<User[]>(\`/users/search?q=\${encodeURIComponent(query)}\`),
  addSkill: (data: any) => request<any>('/users/skills', { method: 'POST', body: JSON.stringify(data) }),

  // -------------------------------------------------------------
  // VYNKS & SOCIAL GRAPH
  // -------------------------------------------------------------
  getConnections: () => request<User[]>('/vynks/connections'),
  getPendingRequests: () => request<any[]>('/vynks/requests/pending'),
  sendVynkRequest: (targetUserId: string) => request<any>(\`/vynks/request/\${targetUserId}\`, { method: 'POST' }),
  acceptVynkRequest: (connectionId: string) => request<any>(\`/vynks/requests/\${connectionId}/accept\`, { method: 'POST' }),
  rejectVynkRequest: (connectionId: string) => request<any>(\`/vynks/requests/\${connectionId}/reject\`, { method: 'POST' }),

  // -------------------------------------------------------------
  // FEED & POSTS
  // -------------------------------------------------------------
  getFeed: () => request<Post[]>('/posts/feed'),
  createPost: (data: any) => request<Post>('/posts', { method: 'POST', body: JSON.stringify(data) }),
  reactToPost: (postId: string, emoji = '🔥') => request<any>(\`/posts/\${postId}/react\`, { method: 'POST', body: JSON.stringify({ emoji }) }),
  commentOnPost: (postId: string, content: string) => request<any>(\`/posts/\${postId}/comments\`, { method: 'POST', body: JSON.stringify({ content }) }),

  // -------------------------------------------------------------
  // VOYAGES (PROJECT SHOWCASES)
  // -------------------------------------------------------------
  getVoyages: (category?: string) => request<Voyage[]>(\`/voyages\${category && category !== 'ALL' ? \`?category=\${category}\` : ''}\`),
  getVoyage: (id: string) => request<Voyage>(\`/voyages/\${id}\`),
  createVoyage: (data: any) => request<Voyage>('/voyages', { method: 'POST', body: JSON.stringify(data) }),
  likeVoyage: (voyageId: string) => request<any>(\`/voyages/\${voyageId}/like\`, { method: 'POST' }),

  // -------------------------------------------------------------
  // CREWS & AI MATCHMAKING
  // -------------------------------------------------------------
  getCrews: (category?: string) => request<Crew[]>(\`/crews\${category && category !== 'ALL' ? \`?category=\${category}\` : ''}\`),
  getCrew: (id: string) => request<Crew>(\`/crews/\${id}\`),
  createCrew: (data: any) => request<Crew>('/crews', { method: 'POST', body: JSON.stringify(data) }),
  joinCrew: (crewId: string) => request<any>(\`/crews/\${crewId}/join\`, { method: 'POST' }),
  getCrewRecommendations: (crewId: string) => request<any[]>(\`/matching/crew/\${crewId}\`),

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
  getMentors: (category?: string) => request<MentorProfile[]>(\`/mentors\${category && category !== 'ALL' ? \`?category=\${category}\` : ''}\`),
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
  getBadges: () => request<BountyBadge[]>('/gamification/badges'),

  // -------------------------------------------------------------
  // EVENTS & COMMUNITIES
  // -------------------------------------------------------------
  getEvents: () => request<EventItem[]>('/events'),
  registerForEvent: (eventId: string) => request<any>(\`/events/\${eventId}/register\`, { method: 'POST' }),

  // -------------------------------------------------------------
  // ANALYTICS & REPORTS
  // -------------------------------------------------------------
  trackEvent: (eventName: string, metadata?: any) => request<any>('/analytics/track', {
    method: 'POST',
    body: JSON.stringify({ eventName, metadata }),
  }).catch(() => {}),
  getPlatformMetrics: () => request<PlatformAnalytics>('/analytics/metrics'),
  createReport: (data: any) => request<any>('/admin/reports', { method: 'POST', body: JSON.stringify(data) }),
};
`;

fs.writeFileSync(apiPath, apiContent.trim() + '\n', 'utf8');
console.log('Updated apps/web/src/lib/api.ts with real production endpoints');
