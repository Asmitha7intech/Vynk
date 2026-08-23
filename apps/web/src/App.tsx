import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { AuthPage } from './pages/AuthPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/crews" element={<CrewsPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/voyages" element={<VoyagesPage />} />
          <Route path="/mentors" element={<MentorsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* Full-width Layout without RightPanel for Messages */}
        <Route element={<Layout showRightPanel={false} />}>
          <Route path="/messages" element={<MessagesPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
