import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VoyagesPage } from '../src/pages/VoyagesPage';
import { NetworkPage } from '../src/pages/NetworkPage';
import { CommunitiesPage } from '../src/pages/CommunitiesPage';
import { CrewsPage } from '../src/pages/CrewsPage';
import { QuestsPage } from '../src/pages/QuestsPage';
import { PulsePage } from '../src/pages/PulsePage';
import { MentorsPage } from '../src/pages/MentorsPage';
import { EventsPage } from '../src/pages/EventsPage';
import { LeaderboardPage } from '../src/pages/LeaderboardPage';
import { VynkErrorBoundary } from '../src/components/vynk/VynkErrorBoundary';
import { api } from '../src/lib/api';

// Component that intentionally throws to test ErrorBoundary
const CrashComponent = () => {
  throw new Error('Test intentional crash for ErrorBoundary');
};

describe('VynkErrorBoundary Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children normally when there is no error', () => {
    render(
      <MemoryRouter>
        <VynkErrorBoundary>
          <div data-testid="normal-child">Safe Content</div>
        </VynkErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByTestId('normal-child')).toBeDefined();
    expect(screen.getByText('Safe Content')).toBeDefined();
  });

  it('catches runtime crash and renders dark neon error recovery UI instead of blanking', () => {
    render(
      <MemoryRouter>
        <VynkErrorBoundary>
          <CrashComponent />
        </VynkErrorBoundary>
      </MemoryRouter>
    );

    // Verify error UI is displayed
    expect(screen.getByText('Encountered an Unexpected Anomaly')).toBeDefined();
    expect(screen.getByText('Reload Section')).toBeDefined();
    expect(screen.getByText('Return to Campus Feed')).toBeDefined();
    expect(screen.getAllByText(/Test intentional crash for ErrorBoundary/).length).toBeGreaterThan(0);
  });
});

describe('VoyagesPage Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'trackEvent').mockResolvedValue({} as any);
  });

  it('renders header and category filters', async () => {
    vi.spyOn(api, 'getVoyages').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <VoyagesPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Voyages Portfolio Gallery')).toBeDefined();
    expect(screen.getByText('Showcase Voyage (+250 XP)')).toBeDefined();
    expect(screen.getByText('Healthcare')).toBeDefined();
    expect(screen.getByText('Web3')).toBeDefined();
  });

  it('renders populated projects and survives incomplete properties without crashing', async () => {
    vi.spyOn(api, 'getVoyages').mockResolvedValue([
      {
        id: 'p-1',
        title: 'Quantum Neural Network',
        tagline: 'Simulating qubits with WebGL',
        description: 'Comprehensive quantum engine built on top of WebGL and WASM.',
        status: 'IN_PROGRESS',
        category: 'AI_ML',
        creator: {
          id: 'u-1',
          username: 'alice',
          displayName: 'Alice Developer',
          avatarUrl: null,
        },
        members: [],
        likesCount: 42,
        technologies: ['TypeScript', 'WebGL', 'Rust'],
        milestones: [
          { id: 'm-1', title: 'Phase 1 MVP', completed: true },
          { id: 'm-2', title: 'WASM bridge', completed: false },
        ],
      } as any,
      {
        id: 'p-2',
        title: 'Minimal Project With Missing Fields',
        tagline: 'Project with all optional properties omitted',
      } as any,
    ]);

    render(
      <MemoryRouter>
        <VoyagesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quantum Neural Network')).toBeDefined();
      expect(screen.getByText('Minimal Project With Missing Fields')).toBeDefined();
      expect(screen.getByText('Alice Developer')).toBeDefined();
      expect(screen.getByText('TypeScript')).toBeDefined();
    });
  });

  it('renders empty state when no projects match', async () => {
    vi.spyOn(api, 'getVoyages').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <VoyagesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No voyages showcased in this category yet')).toBeDefined();
    });
  });

  it('renders error state and recovers upon clicking retry', async () => {
    const getVoyagesMock = vi.spyOn(api, 'getVoyages')
      .mockRejectedValueOnce(new Error('Network gateway timeout'))
      .mockResolvedValueOnce([
        {
          id: 'p-recovered',
          title: 'Recovered Autonomous Rover',
          tagline: 'Hardware robotics platform',
          technologies: ['C++', 'ROS'],
        } as any,
      ]);

    render(
      <MemoryRouter>
        <VoyagesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Voyages')).toBeDefined();
      expect(screen.getByText('Retry Connection')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Retry Connection'));

    await waitFor(() => {
      expect(screen.getByText('Recovered Autonomous Rover')).toBeDefined();
    });
    expect(getVoyagesMock).toHaveBeenCalledTimes(2);
  });
});

describe('NetworkPage Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'trackEvent').mockResolvedValue({} as any);
    vi.spyOn(api, 'getConnections').mockResolvedValue([]);
    vi.spyOn(api, 'getPendingRequests').mockResolvedValue([]);
    vi.spyOn(api, 'getOutgoingRequests').mockResolvedValue([]);
    vi.spyOn(api, 'getCrews').mockResolvedValue([]);
    vi.spyOn(api, 'getVoyages').mockResolvedValue([]);
  });

  it('renders student list in Discover tab with safe normalization', async () => {
    vi.spyOn(api, 'searchUsers').mockResolvedValue([
      {
        id: 'usr-1',
        username: 'dev_sarah',
        displayName: 'Sarah Connor',
        xp: 1450,
        level: 5,
        skills: [{ name: 'Cybersecurity' }],
        bio: 'Securing networks and exploring AI systems.',
        department: 'Cybernetics',
      } as any,
    ]);

    render(
      <MemoryRouter>
        <NetworkPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Constellation 3D Sphere')).toBeDefined();
    });

    // Switch to Cards Grid
    const gridBtn = screen.getByLabelText('Grid Cards View');
    fireEvent.click(gridBtn);

    await waitFor(() => {
      expect(screen.getByText('Sarah Connor')).toBeDefined();
      expect(screen.getByText('@dev_sarah')).toBeDefined();
      expect(screen.getByText('Cybernetics')).toBeDefined();
      expect(screen.getByText('Cybersecurity')).toBeDefined();
    });
  });

  it('switches between 3D Sphere, Visual Graph, and Grid views smoothly', async () => {
    vi.spyOn(api, 'searchUsers').mockResolvedValue([
      {
        id: 'usr-1',
        username: 'alex',
        displayName: 'Alex Rivers',
        skills: [{ name: 'React' }],
      } as any,
    ]);

    render(
      <MemoryRouter>
        <NetworkPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Constellation 3D Sphere')).toBeDefined();
    });

    // Switch to Cards Grid view
    const gridBtn = screen.getByLabelText('Grid Cards View');
    fireEvent.click(gridBtn);
    expect(screen.getByText('Alex Rivers')).toBeDefined();

    // Switch back to 3D Sphere
    const sphereBtn = screen.getByLabelText('3D Constellation Sphere View');
    fireEvent.click(sphereBtn);
    expect(screen.getByText('Constellation 3D Sphere')).toBeDefined();

    // Switch to 3D Graph Tab
    const graphTabBtn = screen.getByText('🌐 3D Graph');
    fireEvent.click(graphTabBtn);
    expect(screen.getByText('VYNK Network • 3D Ecosystem Graph')).toBeDefined();
  });

  it('handles API error with recovery retry in NetworkPage', async () => {
    const searchUsersMock = vi.spyOn(api, 'searchUsers')
      .mockRejectedValueOnce(new Error('Connection dropped'))
      .mockResolvedValueOnce([
        {
          id: 'usr-recovered',
          username: 'rebound_user',
          displayName: 'Rebound Student',
          skills: [],
        } as any,
      ]);

    render(
      <MemoryRouter>
        <NetworkPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Network Directory Offline')).toBeDefined();
      expect(screen.getByText('Retry Loading')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Retry Loading'));

    await waitFor(() => {
      expect(screen.getByText('Constellation 3D Sphere')).toBeDefined();
    });
    expect(searchUsersMock).toHaveBeenCalledTimes(2);
  });
});

describe('Full Application Regression Audit Suite (Sidebar Routes)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'trackEvent').mockResolvedValue({} as any);
  });

  it('renders Campus Communities (/communities) without crashing', async () => {
    vi.spyOn(api, 'getCommunities').mockResolvedValue({
      items: [
        {
          id: 'comm-1',
          name: 'AI Builders Guild',
          slug: 'ai-builders-guild',
          description: 'Autonomous agents and machine learning collaborative research',
          category: 'AI & Machine Learning',
          tags: ['ai', 'agents', 'pytorch'],
          isPrivate: false,
          _count: { members: 5, posts: 12 },
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    render(
      <MemoryRouter>
        <CommunitiesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Campus Communities')).toBeDefined();
      expect(screen.getByText('AI Builders Guild')).toBeDefined();
    });
  });

  it('renders Hackathon Crews (/crews) without crashing', async () => {
    vi.spyOn(api, 'getCrews').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <CrewsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hackathon Crews & Startup Squads')).toBeDefined();
    });
  });

  it('renders Quests & Challenges (/quests) without crashing', async () => {
    vi.spyOn(api, 'getDailyChallenge').mockResolvedValue({ challenge: null } as any);
    vi.spyOn(api, 'getQuizzes').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Technical Arena & Career Quests')).toBeDefined();
    });
  });

  it('renders VYNK Pulse (/pulse) without crashing', async () => {
    vi.spyOn(api, 'getPulseSummary').mockResolvedValue({
      success: true,
      data: {
        kpis: {
          total_events: 50000,
          active_students: 1200,
          total_connections: 3400,
          acceptance_rate_percent: 75.0,
          total_projects: 300,
          total_anomalies: 12,
          anomaly_rate_percent: 0.1,
          avg_latency_ms: 25.4,
        },
        timeseries: [],
        hourly: [],
        top_skills: [],
        departments: [],
        recent_anomalies: [],
      },
    });
    vi.spyOn(api, 'getPulseEvents').mockResolvedValue({
      success: true,
      data: { events: [], total: 0 },
    });
    vi.spyOn(api, 'getPulseRuns').mockResolvedValue({ success: true, data: [] });
    vi.spyOn(api, 'getPulseQuality').mockResolvedValue({ success: true, data: null });
    vi.spyOn(api, 'getPulseBenchmarks').mockResolvedValue({ success: true, data: null });

    render(
      <MemoryRouter>
        <PulsePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/VYNK Pulse/)).toBeDefined();
    });
  });

  it('renders Mentors Directory (/mentors) without crashing', async () => {
    vi.spyOn(api, 'getMentors').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <MentorsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Verified Technical Mentors')).toBeDefined();
    });
  });

  it('renders Events & Hacks (/events) without crashing', async () => {
    vi.spyOn(api, 'getEvents').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Campus Opportunities & Hackathons')).toBeDefined();
    });
  });

  it('renders Campus Leaderboard (/leaderboard) without crashing', async () => {
    vi.spyOn(api, 'getLeaderboard').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Campus Builder Rankings & Podium')).toBeDefined();
    });
  });
});
