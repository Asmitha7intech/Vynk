import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProfilePage } from '../src/pages/ProfilePage';
import { api } from '../src/lib/api';
import { useAuthStore } from '../src/stores/authStore';

vi.mock('../src/lib/api', () => ({
  api: {
    getUserProfile: vi.fn(),
    listSessions: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllSessions: vi.fn(),
    getBlockedUsers: vi.fn(),
    unblockUser: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    trackEvent: vi.fn(),
  },
}));

describe('ProfilePage Security & Multi-Device Sessions Suite', () => {
  const mockUser = {
    id: 'usr-asmitha',
    username: 'asmitha',
    displayName: 'Asmitha SuperAdmin',
    email: 'asmitha7intech@gmail.com',
    role: 'SUPER_ADMIN',
    emailVerified: false,
    isVerified: false,
    level: 5,
    xp: 1250,
    streakDays: 7,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: mockUser as any,
      token: 'mock-jwt-token',
      isAuthenticated: true,
    });

    vi.mocked(api.getUserProfile).mockResolvedValue({
      user: mockUser,
      stats: {
        vynksCount: 12,
        voyagesCount: 3,
        crewsCount: 2,
        questsCompleted: 15,
      },
      skills: [],
      voyages: [],
      bounties: [],
    } as any);

    vi.mocked(api.listSessions).mockResolvedValue({
      sessions: [
        {
          id: 'sess-1',
          userAgent: 'Chrome on Windows 11',
          ipAddress: '127.0.0.1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sess-2',
          userAgent: 'Safari on iPhone 15',
          ipAddress: '192.168.1.10',
          createdAt: new Date().toISOString(),
        },
      ],
    } as any);

    vi.mocked(api.getBlockedUsers).mockResolvedValue([] as any);
  });

  it('renders Security & Sessions tab for authenticated user on own profile', async () => {
    render(
      <MemoryRouter initialEntries={['/profile/asmitha']}>
        <Routes>
          <Route path="/profile/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Asmitha SuperAdmin')).toBeDefined();
    });

    const securityTab = screen.getByText('Security & Sessions');
    expect(securityTab).toBeDefined();
  });

  it('loads active device sessions when Security tab is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/profile/asmitha']}>
        <Routes>
          <Route path="/profile/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Security & Sessions')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Security & Sessions'));

    await waitFor(() => {
      expect(api.listSessions).toHaveBeenCalled();
      expect(screen.getByText('Active Sessions & Authorized Devices')).toBeDefined();
      expect(screen.getByText('Chrome on Windows 11')).toBeDefined();
      expect(screen.getByText('Safari on iPhone 15')).toBeDefined();
    });
  });

  it('calls api.revokeSession when revoking a device session', async () => {
    vi.mocked(api.revokeSession).mockResolvedValue({ success: true } as any);

    render(
      <MemoryRouter initialEntries={['/profile/asmitha']}>
        <Routes>
          <Route path="/profile/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Security & Sessions')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Security & Sessions'));

    await waitFor(() => {
      expect(screen.getByText('Safari on iPhone 15')).toBeDefined();
    });

    const revokeButtons = screen.getAllByText('Revoke');
    expect(revokeButtons.length).toBeGreaterThan(0);

    fireEvent.click(revokeButtons[1]); // Revoke second session

    await waitFor(() => {
      expect(api.revokeSession).toHaveBeenCalledWith('sess-2');
    });
  });

  it('allows resending and verifying academic email code', async () => {
    vi.mocked(api.resendVerification).mockResolvedValue({
      success: true,
      message: 'Verification code sent.',
    } as any);
    vi.mocked(api.verifyEmail).mockResolvedValue({
      success: true,
      message: 'Email verified.',
    } as any);

    render(
      <MemoryRouter initialEntries={['/profile/asmitha']}>
        <Routes>
          <Route path="/profile/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Security & Sessions')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Security & Sessions'));

    await waitFor(() => {
      expect(screen.getByText('Campus Academic Email Verification')).toBeDefined();
      expect(screen.getByText('Send Verification Code')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Send Verification Code'));

    await waitFor(() => {
      expect(api.resendVerification).toHaveBeenCalled();
    });

    const input = screen.getByPlaceholderText('Enter verification code...');
    fireEvent.change(input, { target: { value: 'test-token-12345' } });

    const confirmBtn = screen.getByText('Confirm Code');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.verifyEmail).toHaveBeenCalledWith('test-token-12345');
    });
  });
});
