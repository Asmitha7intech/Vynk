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

let activeRefreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (activeRefreshPromise) return activeRefreshPromise;

  activeRefreshPromise = (async () => {
    const refreshToken = localStorage.getItem('vynk_refresh_token');
    if (!refreshToken) return null;

    try {
      const res = await fetch(API_BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data?.accessToken) {
        const newAccessToken = json.data.accessToken;
        const newRefreshToken = json.data.refreshToken || refreshToken;
        localStorage.setItem('vynk_access_token', newAccessToken);
        localStorage.setItem('vynk_refresh_token', newRefreshToken);

        try {
          const { useAuthStore } = await import('../stores/authStore');
          useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
        } catch {}

        return newAccessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

async function request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const rawToken = localStorage.getItem('vynk_access_token');
  const token = rawToken?.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

  // Intercept 401 Unauthorized for automatic transparent refresh
  if (res.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/refresh')) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return request<T>(endpoint, options, true);
    }
    // Session renewal failed; clean up state gracefully
    try {
      const { useAuthStore } = await import('../stores/authStore');
      useAuthStore.getState().logout();
    } catch {}
    throw new ApiError('Please sign in to continue.', 401, 'UNAUTHORIZED');
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
  refresh: (refreshToken: string) => request<any>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    request<any>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email: string) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  getSessions: () => request<any>('/auth/sessions'),
  getCurrentUser: () => request<{ user: User }>('/auth/me'),
  getProfileMe: () => request<{ user: User }>('/profile/me'),
  updateProfileMe: (data: any) => request<User>('/profile/me', { method: 'PATCH', body: JSON.stringify(data) }),
  uploadAvatar: async (data: File | string) => {
    if (typeof data !== 'string') {
      const formData = new FormData();
      formData.append('file', data);
      return request<{ avatarUrl: string; user: User }>('/profile/me/avatar', {
        method: 'POST',
        body: formData,
      });
    }
    return request<{ avatarUrl: string; user: User }>('/profile/me/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatarData: data }),
    });
  },
  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ url: string; filename: string; contentType: string; size: number }>('/storage/upload-media', {
      method: 'POST',
      body: formData,
    });
  },
  deleteAvatar: () => request<{ user: User }>('/profile/me/avatar', { method: 'DELETE' }),
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
  getOutgoingRequests: () => request<any[]>('/vynks/requests/sent'),
  sendVynkRequest: (targetUserId: string) => request<any>('/vynks/request/' + targetUserId, { method: 'POST' }),
  acceptVynkRequest: (connectionId: string) => request<any>('/vynks/accept/' + connectionId, { method: 'POST' }),
  rejectVynkRequest: (connectionId: string) => request<any>('/vynks/reject/' + connectionId, { method: 'POST' }),
  cancelVynkRequest: (connectionId: string) => request<any>('/vynks/requests/' + connectionId, { method: 'DELETE' }),

  // -------------------------------------------------------------
  // CAMPUS FEED & POSTS
  // -------------------------------------------------------------
  getFeed: (limit = 20, cursor?: string) => request<any>('/posts/feed?limit=' + limit + (cursor ? '&cursor=' + cursor : '')),
  getPost: (id: string) => request<Post>('/posts/' + id),
  createPost: (data: any) => request<Post>('/posts', { method: 'POST', body: JSON.stringify(data) }),
  addComment: (postId: string, data: any) => request<any>('/posts/' + postId + '/comments', { method: 'POST', body: JSON.stringify(data) }),
  reactToPost: (postId: string, emoji = '🔥') => request<any>('/posts/' + postId + '/react', { method: 'POST', body: JSON.stringify({ emoji }) }),
  getComments: (postId: string) => request<any[]>('/posts/' + postId + '/comments'),
  deleteComment: (postId: string, commentId: string) => request<any>('/posts/' + postId + '/comments/' + commentId, { method: 'DELETE' }),

  // -------------------------------------------------------------
  // VOYAGES (PROJECT PORTFOLIOS & WORKSPACES)
  // -------------------------------------------------------------
  getVoyages: (category?: string) => request<Voyage[]>('/voyages' + (category && category !== 'ALL' ? '?category=' + encodeURIComponent(category) : '')),
  getVoyage: (id: string) => request<Voyage>('/voyages/' + id),
  createVoyage: (data: any) => request<Voyage>('/voyages', { method: 'POST', body: JSON.stringify(data) }),
  toggleVoyageLike: (id: string) => request<any>('/voyages/' + id + '/like', { method: 'POST' }),
  createJoinRequest: (voyageId: string, data: { roleName: string; message: string; skills?: string[] }) =>
    request<any>('/voyages/' + voyageId + '/join-request', { method: 'POST', body: JSON.stringify(data) }),
  getJoinRequests: (voyageId: string) => request<any[]>('/voyages/' + voyageId + '/join-requests'),
  respondToJoinRequest: (voyageId: string, requestId: string, status: 'ACCEPTED' | 'REJECTED') =>
    request<any>('/voyages/' + voyageId + '/join-requests/' + requestId, { method: 'PATCH', body: JSON.stringify({ status }) }),
  createVoyageTask: (voyageId: string, data: any) =>
    request<any>('/voyages/' + voyageId + '/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateVoyageTask: (voyageId: string, taskId: string, data: any) =>
    request<any>('/voyages/' + voyageId + '/tasks/' + taskId, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteVoyageTask: (voyageId: string, taskId: string) =>
    request<any>('/voyages/' + voyageId + '/tasks/' + taskId, { method: 'DELETE' }),
  createVoyageDiscussion: (voyageId: string, content: string) =>
    request<any>('/voyages/' + voyageId + '/discussions', { method: 'POST', body: JSON.stringify({ content }) }),
  createVoyageMilestone: (voyageId: string, data: any) =>
    request<any>('/voyages/' + voyageId + '/milestones', { method: 'POST', body: JSON.stringify(data) }),
  updateVoyageMilestone: (voyageId: string, milestoneId: string, data: any) =>
    request<any>('/voyages/' + voyageId + '/milestones/' + milestoneId, { method: 'PATCH', body: JSON.stringify(data) }),

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
  markConversationRead: (conversationId: string) => request<any>('/messages/conversations/' + conversationId + '/read', { method: 'POST' }),

  // -------------------------------------------------------------
  // NOTIFICATIONS & PRESENCE
  // -------------------------------------------------------------
  getNotifications: () => request<any[]>('/notifications'),
  markNotificationRead: (id: string) => request<any>('/notifications/' + id + '/read', { method: 'PATCH' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),
  getPresence: () => request<{ onlineUserIds: string[] }>('/users/presence'),

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

  getCommunities: (params?: { search?: string; category?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.category && params.category !== 'ALL') qs.set('category', params.category);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return request<{ items: any[]; total: number; page: number; limit: number }>('/communities?' + qs.toString());
  },
  getCommunity: (slugOrId: string) => request<any>(`/communities/${slugOrId}`),
  createCommunity: (data: { name: string; description: string; category: string; tags?: string[]; isPrivate?: boolean; avatarUrl?: string; bannerUrl?: string }) =>
    request<any>('/communities', { method: 'POST', body: JSON.stringify(data) }),
  updateCommunity: (id: string, data: any) =>
    request<any>(`/communities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  joinCommunity: (id: string) =>
    request<any>(`/communities/${id}/join`, { method: 'POST' }),
  leaveCommunity: (id: string) =>
    request<any>(`/communities/${id}/leave`, { method: 'POST' }),
  getCommunityMembers: (id: string) =>
    request<any[]>(`/communities/${id}/members`),
  reviewCommunityMember: (communityId: string, memberId: string, action: 'APPROVED' | 'REJECTED') =>
    request<any>(`/communities/${communityId}/members/${memberId}/review`, { method: 'POST', body: JSON.stringify({ action }) }),
  getCommunityPosts: (id: string) =>
    request<any[]>(`/communities/${id}/posts`),

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
  getRealtimePulse: () => request<any>('/analytics/bigdata/realtime-pulse'),
  getEventDistribution: () => request<any>('/analytics/bigdata/event-distribution'),
  getTrending: (department?: string) => request<any>('/analytics/bigdata/trending' + (department ? '?department=' + encodeURIComponent(department) : '')),
  getOutboxStats: () => request<any>('/analytics/outbox/stats'),
  getDependencyHealth: () => request<any>('/health/dependencies').catch(() => null),
  createReport: (data: any) => request<any>('/reports', { method: 'POST', body: JSON.stringify(data) }),
  getReports: (status?: string) => request<any>('/reports' + (status ? `?status=${status}` : '')),
  resolveReport: (id: string, action: 'RESOLVED' | 'DISMISSED' = 'RESOLVED') =>
    request<any>(`/reports/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ action }) }),

  // Safety & Blocking
  getBlockedUsers: () => request<any>('/blocks'),
  blockUser: (targetUserId: string) => request<any>(`/blocks/${targetUserId}`, { method: 'POST' }),
  unblockUser: (targetUserId: string) => request<any>(`/blocks/${targetUserId}`, { method: 'DELETE' }),

  // Multi-Device Sessions
  listSessions: () => request<any>('/auth/sessions'),
  revokeSession: (sessionId: string) => request<any>(`/auth/sessions/${sessionId}`, { method: 'DELETE' }),
  revokeAllSessions: () => request<any>('/auth/sessions/revoke-all', { method: 'POST' }),

  // Email Verification
  verifyEmail: (token: string) => request<any>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  resendVerification: () => request<any>('/auth/resend-verification', { method: 'POST' }),

  // -------------------------------------------------------------
  // VYNK PULSE — DUCKDB & BIG DATA INTELLIGENCE
  // -------------------------------------------------------------
  getPulseSummary: () => request<any>('/pulse/summary'),
  getPulseTimeseries: (days = 30) => request<any>('/pulse/timeseries?days=' + days),
  getPulseTopSkills: () => request<any>('/pulse/top-skills'),
  getPulseAnomalies: () => request<any>('/pulse/anomalies'),
  getPulseEvents: (params?: { page?: number; limit?: number; eventType?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.eventType) qs.set('eventType', params.eventType);
    if (params?.search) qs.set('search', params.search);
    return request<any>('/pulse/events?' + qs.toString());
  },
  getPulseExportUrl: () => '/api/v1/pulse/export.csv',
  getPulseRuns: () => request<any>('/pulse/runs'),
  getPulseQuality: () => request<any>('/pulse/quality'),
  getPulseBenchmarks: () => request<any>('/pulse/benchmarks'),

  // -------------------------------------------------------------
  // SMART MATCHING v2
  // -------------------------------------------------------------
  getCollaboratorsV2: (limit = 10) => request<any>('/matching/collaborators?limit=' + limit),
  recordMatchFeedback: (data: { targetId: string; action: string; recommendationType?: string }) =>
    request<any>('/matching/feedback', { method: 'POST', body: JSON.stringify(data) }),

  // -------------------------------------------------------------
  // CLASSROOM DIRECTORY
  // -------------------------------------------------------------
  getDirectory: (params?: {
    search?: string;
    page?: number;
    limit?: number;
    status?: 'all' | 'claimed' | 'unclaimed';
    department?: string;
    sortBy?: 'name_asc' | 'name_desc' | 'studentId_asc' | 'studentId_desc';
  }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    if (params?.department) qs.set('department', params.department);
    if (params?.sortBy) qs.set('sortBy', params.sortBy);
    return request<any>('/directory?' + qs.toString());
  },
  getDirectoryRecord: (id: string) => request<any>(`/directory/${id}`),
  claimDirectoryRecord: (data: { directoryId: string; studentId: string }) =>
    request<any>('/directory/claim', { method: 'POST', body: JSON.stringify(data) }),
  updateDirectoryRecord: (id: string, data: { originalDisplayName?: string; department?: string; notes?: string; reason: string }) =>
    request<any>(`/directory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // -------------------------------------------------------------
  // BIG DATA LAB (6 SYLLABUS CONCEPTS)
  // -------------------------------------------------------------
  getBigDataHealth: () => request<any>('/bigdata-lab/health'),
  getBigDataDatasets: () => request<any>('/bigdata-lab/datasets'),
  getBigDataConcepts: () => request<any>('/bigdata-lab/concepts'),
  getBigDataJobs: () => request<any>('/bigdata-lab/jobs'),
  getBigDataJob: (id: string) => request<any>(`/bigdata-lab/jobs/${id}`),
  runBigDataJob: (data: {
    conceptId: string;
    jobId: string;
    datasetName?: string;
    parameters?: Record<string, any>;
  }) => request<any>('/bigdata-lab/jobs/run', { method: 'POST', body: JSON.stringify(data) }),
};

