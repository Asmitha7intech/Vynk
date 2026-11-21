import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { NetworkPage } from './pages/NetworkPage';
import { CrewsPage } from './pages/CrewsPage';
import { QuestsPage } from './pages/QuestsPage';
import { VoyagesPage } from './pages/VoyagesPage';
import { MentorsPage } from './pages/MentorsPage';
import { MessagesPage } from './pages/MessagesPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { EventsPage } from './pages/EventsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { PulsePage } from './pages/PulsePage';
import { AuthPage } from './pages/AuthPage';
import { VoyageDetailsPage } from './pages/VoyageDetailsPage';
import { CommunitiesPage } from './pages/CommunitiesPage';
import { PostDetailsPage } from './pages/PostDetailsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/posts/:id" element={<PostDetailsPage />} />
          <Route path="/p/:id" element={<PostDetailsPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/directory" element={<Navigate to="/communities" replace />} />
          <Route path="/crews" element={<CrewsPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/voyages" element={<VoyagesPage />} />
          <Route path="/pulse" element={<PulsePage />} />
          <Route path="/bigdata-lab" element={<Navigate to="/pulse" replace />} />
          <Route path="/bigdata-lab/*" element={<Navigate to="/pulse" replace />} />
          <Route path="/mentors" element={<MentorsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* Full-width Layout without RightPanel for Messages and Voyage Workspaces */}
        <Route element={<Layout showRightPanel={false} />}>
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/voyages/:id" element={<VoyageDetailsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
