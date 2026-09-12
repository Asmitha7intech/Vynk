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
  PlatformAnalytics,
  CrewMatchRecommendation
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
    headers['Authorization'] = 'Bearer ' + token;
  }

  let res: Response;
  try {
    res = await fetch(API_BASE + endpoint, {
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
      throw new ApiError(
        res.ok
          ? 'Invalid server response'
          : 'Server error (status ' + res.status + '): ' + responseText.slice(0, 100),
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
      errorMsg = 'HTTP ' + res.status + ' ' + res.statusText;
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
  getUserProfile: (username: string) => request<any>('/users/' + username),
  searchUsers: (query: string) => request<User[]>('/users/search?q=' + encodeURIComponent(query)),
  getCrossDepartmentMatches: () => request<any[]>('/users/cross-department'),
  addSkill: (data: any) => request<any>('/users/skills', { method: 'POST', body: JSON.stringify(data) }),

  // -------------------------------------------------------------
  // VYNKS & SOCIAL GRAPH
  // -------------------------------------------------------------
  getConnections: () => request<User[]>('/vynks/connections'),
  getPendingRequests: () => request<any[]>('/vynks/requests/pending'),
  sendVynkRequest: (targetUserId: string) => request<any>('/vynks/request/' + targetUserId, { method: 'POST' }),
  acceptVynkRequest: (connectionId: string) => request<any>('/vynks/accept/' + connectionId, { method: 'POST' }),
  rejectVynkRequest: (connectionId: string) => request<any>('/vynks/reject/' + connectionId, { method: 'POST' }),

  // -------------------------------------------------------------
  // CAMPUS FEED & POSTS
  // -------------------------------------------------------------
  getFeed: (limit = 20, cursor?: string) => request<any>('/posts/feed?limit=' + limit + (cursor ? '&cursor=' + cursor : '')),
  getPost: (id: string) => request<Post>('/posts/' + id),
  createPost: (data: any) => request<Post>('/posts', { method: 'POST', body: JSON.stringify(data) }),
  addComment: (postId: string, data: any) => request<any>('/posts/' + postId + '/comments', { method: 'POST', body: JSON.stringify(data) }),
  toggleReaction: (postId: string, emoji = '🔥') => request<any>('/posts/' + postId + '/react', { method: 'POST', body: JSON.stringify({ emoji }) }),
  reactToPost: (postId: string, emoji = '🔥') => request<any>('/posts/' + postId + '/react', { method: 'POST', body: JSON.stringify({ emoji }) }),

  // -------------------------------------------------------------
  // VOYAGES (PROJECT PORTFOLIOS)
  // -------------------------------------------------------------
  getVoyages: (category?: string) => request<Voyage[]>('/voyages' + (category && category !== 'ALL' ? '?category=' + encodeURIComponent(category) : '')),
  getVoyage: (id: string) => request<Voyage>('/voyages/' + id),
  createVoyage: (data: any) => request<Voyage>('/voyages', { method: 'POST', body: JSON.stringify(data) }),
  toggleVoyageLike: (id: string) => request<any>('/voyages/' + id + '/like', { method: 'POST' }),

  // -------------------------------------------------------------
  // CREWS (HACKATHON SQUADS)
  // -------------------------------------------------------------
  getCrews: (category?: string) => request<Crew[]>('/crews' + (category && category !== 'ALL' ? '?category=' + encodeURIComponent(category) : '')),
  getCrew: (id: string) => request<Crew>('/crews/' + id),
  createCrew: (data: any) => request<Crew>('/crews', { method: 'POST', body: JSON.stringify(data) }),
  joinCrew: (crewId: string, roleName: string) => request<any>('/crews/' + crewId + '/join', { method: 'POST', body: JSON.stringify({ roleName }) }),
  signTeamAgreement: (crewId: string) => request<any>('/crews/' + crewId + '/sign-agreement', { method: 'POST' }),

  // -------------------------------------------------------------
  // AI MATCHMAKING
  // -------------------------------------------------------------
  getRecommendedTeammates: (crewId: string) => request<any[]>('/matching/crews/' + crewId + '/recommendations'),
  getCrewRecommendations: (crewId: string) => request<CrewMatchRecommendation[]>('/matching/crews/' + crewId + '/recommendations'),

  // -------------------------------------------------------------
  // QUESTS & QUIZZES
  // -------------------------------------------------------------
  getDailyChallenge: () => request<{ challenge: DailyChallenge; isCompleted: boolean }>('/quests/daily-challenge'),
  submitDailyChallenge: (challengeId: string, selectedOptionIndex: number) => request<any>('/quests/daily-challenge/submit', {
    method: 'POST',
    body: JSON.stringify({ challengeId, selectedOptionIndex }),
  }),
  getQuizzes: () => request<Quiz[]>('/quests/quizzes'),
  getQuiz: (id: string) => request<Quiz>('/quests/quizzes/' + id),
  submitQuiz: (quizId: string, timeSpentSeconds: number, answers: any[]) => request<any>('/quests/quizzes/submit', {
    method: 'POST',
    body: JSON.stringify({ quizId, timeSpentSeconds, answers }),
  }),

  // -------------------------------------------------------------
  // MENTORSHIP
  // -------------------------------------------------------------
  getMentors: (category?: string) => request<MentorProfile[]>('/mentors' + (category && category !== 'ALL' ? '?category=' + encodeURIComponent(category) : '')),
  createMentorProfile: (data: any) => request<any>('/mentors/profile', { method: 'POST', body: JSON.stringify(data) }),
  requestMentorship: (data: any) => request<any>('/mentors/request', { method: 'POST', body: JSON.stringify(data) }),

  // -------------------------------------------------------------
  // MESSAGING & REALTIME
  // -------------------------------------------------------------
  getConversations: () => request<Conversation[]>('/messages/conversations'),
  getMessages: (conversationId: string) => request<any[]>('/messages/conversations/' + conversationId + '/messages'),
  sendMessage: (data: any) => request<any>('/messages/send', { method: 'POST', body: JSON.stringify(data) }),
  getDirectConversation: (targetUserId: string) => request<Conversation>('/messages/direct/' + targetUserId),

  // -------------------------------------------------------------
  // GAMIFICATION & LEADERBOARD
  // -------------------------------------------------------------
  getLeaderboard: (scope = 'GLOBAL') => request<LeaderboardEntry[]>('/gamification/leaderboard?scope=' + scope),
  getRankExplanation: (userId: string, scope = 'GLOBAL') => request<any>('/gamification/rank-explanation/' + userId + '?scope=' + scope),
  getBadges: () => request<BountyBadge[]>('/gamification/badges'),

  // -------------------------------------------------------------
  // EVENTS & COMMUNITIES
  // -------------------------------------------------------------
  getEvents: () => request<EventItem[]>('/events'),
  registerForEvent: (eventId: string) => request<any>('/events/' + eventId + '/register', { method: 'POST' }),

  // -------------------------------------------------------------
  // ANALYTICS & BIG DATA
  // -------------------------------------------------------------
  trackEvent: (eventName: string, metadata?: any) => request<any>('/analytics/track', {
    method: 'POST',
    body: JSON.stringify({ eventName, metadata }),
  }).catch(() => {}),
  getPlatformMetrics: () => request<PlatformAnalytics>('/analytics/metrics'),
  getCampusSkillHeatmap: (college?: string) => request<any>('/analytics/bigdata/campus-heatmap' + (college ? '?college=' + encodeURIComponent(college) : '')),
  getDepartmentCollaboration: () => request<any>('/analytics/bigdata/dept-collaboration'),
  createReport: (data: any) => request<any>('/admin/reports', { method: 'POST', body: JSON.stringify(data) }),
};
