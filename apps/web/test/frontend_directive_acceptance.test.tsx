import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DailyQuestWidget } from '../src/components/DailyQuestWidget';
import { CreatePostModal } from '../src/components/CreatePostModal';
import { FeedCard } from '../src/components/FeedCard';
import { AvatarUploadModal } from '../src/components/AvatarUploadModal';
import { Sidebar } from '../src/components/Sidebar';
import { PulsePage } from '../src/pages/PulsePage';
import { useAuthStore } from '../src/stores/authStore';
import { api } from '../src/lib/api';

describe('Frontend Directive Acceptance & Component Verification Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  describe('Session Restoration & Auth Store', () => {
    it('initializes auth from localStorage token and fetches authenticated profile', async () => {
      localStorage.setItem('vynk_access_token', 'valid_test_access_token');
      const mockUser = {
        id: 'u-verified-1',
        email: 'student@citchennai.net',
        username: 'teststudent',
        displayName: 'Test Student',
        role: 'STUDENT',
        college: 'Chennai Institute of Technology',
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue({ user: mockUser as any });

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.id).toBe('u-verified-1');
      expect(state.user?.displayName).toBe('Test Student');
    });

    it('clears state gracefully when token validation returns 401', async () => {
      localStorage.setItem('vynk_access_token', 'expired_test_access_token');
      const err: any = new Error('Unauthorized');
      err.status = 401;
      vi.spyOn(api, 'getCurrentUser').mockRejectedValue(err);

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(localStorage.getItem('vynk_access_token')).toBeNull();
    });
  });

  describe('DailyQuestWidget Guest & Submission Handling', () => {
    const mockChallenge: any = {
      id: 'dc-1',
      title: 'Python Slicing Reference',
      category: 'PYTHON',
      difficulty: 'MEDIUM',
      xpAward: 20,
      question: 'What is the output of arr[:: -1] on [1, 2, 3]?',
      options: ['[3, 2, 1]', '[1, 2, 3]', 'TypeError', 'IndexError'],
      explanation: 'Negative step slices list in reverse order.',
    };

    it('renders quest with options and prompts unauthenticated guest on submit without crashing', async () => {
      render(
        <MemoryRouter>
          <DailyQuestWidget challenge={mockChallenge} />
        </MemoryRouter>
      );

      expect(screen.getByText("Today's Technical Quest")).toBeDefined();
      expect(screen.getByText('[3, 2, 1]')).toBeDefined();

      // Select option 0
      fireEvent.click(screen.getByText('[3, 2, 1]'));

      // Click submit as unauthenticated guest
      fireEvent.click(screen.getByText('Submit Quest'));

      // Verifies polite sign-in prompt is displayed
      await waitFor(() => {
        expect(screen.getByText('Please sign in to submit your solution and record XP.')).toBeDefined();
        expect(screen.getByText('Sign In')).toBeDefined();
      });
    });

    it('allows authenticated student to submit and display explanation with XP', async () => {
      useAuthStore.setState({
        user: { id: 'u-auth-1', username: 'student1' } as any,
        isAuthenticated: true,
      });

      vi.spyOn(api, 'submitDailyChallenge').mockResolvedValue({
        isCorrect: true,
        correctOptionIndex: 0,
        xpEarned: 20,
        explanation: 'Negative step slices list in reverse order.',
      });

      render(
        <MemoryRouter>
          <DailyQuestWidget challenge={mockChallenge} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('[3, 2, 1]'));
      fireEvent.click(screen.getByText('Submit Quest'));

      await waitFor(() => {
        expect(screen.getByText('Explanation & Insight:')).toBeDefined();
        expect(screen.getByText('Negative step slices list in reverse order.')).toBeDefined();
      });
    });
  });

  describe('CreatePostModal Unauthenticated & Authenticated States', () => {
    it('shows polite sign-in CTA modal when unauthenticated student opens CreatePostModal', () => {
      render(
        <MemoryRouter>
          <CreatePostModal isOpen={true} onClose={() => {}} />
        </MemoryRouter>
      );

      expect(screen.getByText('Join the VYNK Ecosystem')).toBeDefined();
      expect(screen.getByText('Sign in to Publish to the Campus Feed')).toBeDefined();
      expect(screen.getByText('Sign In / Register')).toBeDefined();
    });

    it('shows full publication form when authenticated', () => {
      useAuthStore.setState({
        user: { id: 'u-auth-1', username: 'student1' } as any,
        isAuthenticated: true,
      });

      render(
        <MemoryRouter>
          <CreatePostModal isOpen={true} onClose={() => {}} />
        </MemoryRouter>
      );

      expect(screen.getByText('Share with the VYNK Ecosystem')).toBeDefined();
      expect(screen.getByText('Post to Feed')).toBeDefined();
      expect(screen.getByPlaceholderText('What are you building, learning, or searching for teammates about?')).toBeDefined();
    });
  });

  describe('FeedCard Interactions', () => {
    const mockPost: any = {
      id: 'p-100',
      title: 'Voyage Launch: WebAssembly Engine',
      content: 'Shipped a sub-10ms neural runtime directly in browser! 🚀',
      type: 'VOYAGE_LAUNCH',
      author: {
        id: 'u-dev-1',
        username: 'dev_student',
        displayName: 'Dev Student',
        avatarUrl: null,
      },
      tags: ['WASM', 'NeuralNet'],
      likesCount: 5,
      isLikedByMe: false,
      comments: [],
      createdAt: new Date().toISOString(),
    };

    it('renders post card and allows sharing permalink to clipboard', async () => {
      const originalClipboard = navigator.clipboard;
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      render(
        <MemoryRouter>
          <FeedCard post={mockPost} />
        </MemoryRouter>
      );

      expect(screen.getByText('Voyage Launch: WebAssembly Engine')).toBeDefined();
      expect(screen.getByText(/Shipped a sub-10ms neural runtime/)).toBeDefined();

      // Find share button by aria-label
      const shareButton = screen.getByLabelText('Share post permalink');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('/posts/p-100'));
        expect(screen.getByText('Permalink copied to clipboard!')).toBeDefined();
      });

      Object.assign(navigator, { clipboard: originalClipboard });
    });

    it('shows friendly sign in message if unauthenticated user tries to like', async () => {
      render(
        <MemoryRouter>
          <FeedCard post={mockPost} />
        </MemoryRouter>
      );

      const likeButton = screen.getByLabelText('Like post');
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(screen.getByText('Please sign in to like this post.')).toBeDefined();
      });
    });
  });

  describe('AvatarUploadModal', () => {
    it('renders modal with upload and close actions', () => {
      render(
        <MemoryRouter>
          <AvatarUploadModal
            isOpen={true}
            onClose={() => {}}
            displayName="Test User"
            onAvatarUpdated={() => {}}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Profile Photo')).toBeDefined();
      expect(screen.getByText('Select Image from Device')).toBeDefined();
      expect(screen.getByText(/Supports JPEG, PNG, WebP or GIF/)).toBeDefined();
    });
  });

  describe('Comment Input Styling & Dark Scheme Legibility', () => {
    const mockPost: any = {
      id: 'p-styling-1',
      title: 'Styling Test Post',
      content: 'Testing dark background and visible text in comment input',
      publishedAt: new Date().toISOString(),
      author: {
        id: 'u-1',
        displayName: 'Author',
        username: 'author',
      },
      tags: [],
      reactionsCount: 0,
      commentsCount: 0,
      hasLiked: false,
      comments: [],
    };

    it('renders comment input with high-contrast text and dark background class', () => {
      useAuthStore.setState({
        user: { id: 'u-1', username: 'author', role: 'STUDENT' } as any,
        isAuthenticated: true,
      });

      render(
        <MemoryRouter>
          <FeedCard post={mockPost} />
        </MemoryRouter>
      );

      // Open comments section
      const commentToggleBtn = screen.getByLabelText('View comments');
      fireEvent.click(commentToggleBtn);

      const commentInput = screen.getByPlaceholderText(/Add a constructive thought/);
      expect(commentInput).toBeDefined();

      // Verify the element has high-contrast text and dark background class
      expect(commentInput.className).toContain('text-white');
      expect(commentInput.className).toContain('bg-[#0d121f]');
      expect(commentInput.className).toContain('placeholder:text-zinc-500');
    });
  });

  describe('Sidebar Role-Based Access Control', () => {
    it('does NOT display Administrator Operations or VYNK Pulse to regular students', () => {
      useAuthStore.setState({
        user: { id: 'u-student', username: 'stud1', role: 'STUDENT' } as any,
        isAuthenticated: true,
      });

      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      expect(screen.queryByText('Administrator Operations')).toBeNull();
      expect(screen.queryByText(/VYNK Pulse/)).toBeNull();
    });

    it('displays Administrator Operations and VYNK Pulse strictly to ADMIN users', () => {
      useAuthStore.setState({
        user: { id: 'u-admin', username: 'admin1', role: 'ADMIN' } as any,
        isAuthenticated: true,
      });

      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      expect(screen.getByText('Administrator Operations')).toBeDefined();
      expect(screen.getByText(/VYNK Pulse/)).toBeDefined();
    });
  });

  describe('PulsePage Role-Based Access Control & Clean Metrics', () => {
    it('displays Authentication Required when accessed without an active session', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      });

      render(
        <MemoryRouter>
          <PulsePage />
        </MemoryRouter>
      );

      expect(screen.getByText('Authentication Required')).toBeDefined();
      expect(screen.getByText(/Please sign in with an authorized administrator account/)).toBeDefined();
    });

    it('denies access with 403 Forbidden screen when accessed by regular student', () => {
      useAuthStore.setState({
        user: { id: 'u-student', email: 'student@citchennai.net', role: 'STUDENT' } as any,
        isAuthenticated: true,
      });

      render(
        <MemoryRouter>
          <PulsePage />
        </MemoryRouter>
      );

      expect(screen.getByText('403 Access Denied')).toBeDefined();
      expect(screen.getByText('Administrator Authorization Required')).toBeDefined();
      expect(screen.getByText('Return to Campus Feed')).toBeDefined();
      // Regular student must never see the telemetry cards
      expect(screen.queryByText('Registered Students')).toBeNull();
    });

    it('renders telemetry and genuine database cards when accessed by authorized admin', async () => {
      useAuthStore.setState({
        user: { id: 'u-admin', email: 'admin@citchennai.net', role: 'ADMIN' } as any,
        isAuthenticated: true,
      });

      vi.spyOn(api, 'getPulseSummary').mockResolvedValue({
        success: true,
        data: {
          kpis: {
            total_events: 12,
            registered_students: 32,
            active_students: 5,
            total_posts: 18,
            total_comments: 7,
            total_projects: 4,
            total_connections: 9,
            acceptance_rate_percent: 75.0,
            total_quizzes: 2,
            total_quiz_attempts: 6,
          },
          timeseries: [],
          departments: [],
          hourly: [],
          top_skills: [],
        },
      } as any);

      render(
        <MemoryRouter>
          <PulsePage />
        </MemoryRouter>
      );

      expect(screen.getByText('VYNK Pulse — Student Ecosystem Intelligence')).toBeDefined();
      expect(screen.getByText('Registered Students')).toBeDefined();
      expect(screen.getByText('Active Users')).toBeDefined();
      expect(screen.getByText('Posts Created')).toBeDefined();
      expect(screen.getByText('Live Database Telemetry')).toBeDefined();
      // Ensure synthetic indicators are absent
      expect(screen.queryByText('Synthetic Dataset')).toBeNull();
      expect(screen.queryByText('Start Stream Sim')).toBeNull();
    });
  });
});
