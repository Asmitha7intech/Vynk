import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VoyagesPage } from '../src/pages/VoyagesPage';
import { NetworkPage } from '../src/pages/NetworkPage';
import { api } from '../src/lib/api';

describe('Reproduce Blank-Page Failures', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('tests VoyagesPage when backend returns project without technologies/milestones/creator', async () => {
    // Mock getVoyages returning a real database record that has missing optional fields
    vi.spyOn(api, 'getVoyages').mockResolvedValue([
      {
        id: 'prj_collab_test_1791950115251',
        title: 'Collaboration Test Project',
        tagline: 'Automated testing project workspace',
        description: 'Testing team join requests',
        status: 'IN_PROGRESS',
        // technologies is undefined!
        // milestones is undefined!
        // likesCount is undefined!
        // creator is undefined!
      } as any,
    ]);
    vi.spyOn(api, 'trackEvent').mockResolvedValue({} as any);

    render(
      <MemoryRouter>
        <VoyagesPage />
      </MemoryRouter>
    );

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText('Collaboration Test Project')).toBeDefined();
    });
  });

  it('tests NetworkPage when rendering with real-world users list', async () => {
    vi.spyOn(api, 'getConnections').mockResolvedValue([]);
    vi.spyOn(api, 'getPendingRequests').mockResolvedValue([]);
    vi.spyOn(api, 'getOutgoingRequests').mockResolvedValue([]);
    vi.spyOn(api, 'searchUsers').mockResolvedValue([
      {
        id: 'usr-1',
        username: 'student1',
        displayName: 'Student One',
        xp: 100,
        level: 2,
        skills: [],
      } as any,
    ]);
    vi.spyOn(api, 'trackEvent').mockResolvedValue({} as any);

    render(
      <MemoryRouter>
        <NetworkPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('People & Collaborative Network')).toBeDefined();
    });
  });
});
