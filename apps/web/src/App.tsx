import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Layout } from './components/Layout';

const HomePage = React.lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ExplorePage = React.lazy(() => import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage })));
const NetworkPage = React.lazy(() => import('./pages/NetworkPage').then((m) => ({ default: m.NetworkPage })));
const CrewsPage = React.lazy(() => import('./pages/CrewsPage').then((m) => ({ default: m.CrewsPage })));
const QuestsPage = React.lazy(() => import('./pages/QuestsPage').then((m) => ({ default: m.QuestsPage })));
const VoyagesPage = React.lazy(() => import('./pages/VoyagesPage').then((m) => ({ default: m.VoyagesPage })));
const MentorsPage = React.lazy(() => import('./pages/MentorsPage').then((m) => ({ default: m.MentorsPage })));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })));
const EventsPage = React.lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const PulsePage = React.lazy(() => import('./pages/PulsePage').then((m) => ({ default: m.PulsePage })));
const AuthPage = React.lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const VoyageDetailsPage = React.lazy(() => import('./pages/VoyageDetailsPage').then((m) => ({ default: m.VoyageDetailsPage })));
const CommunitiesPage = React.lazy(() => import('./pages/CommunitiesPage').then((m) => ({ default: m.CommunitiesPage })));
const PostDetailsPage = React.lazy(() => import('./pages/PostDetailsPage').then((m) => ({ default: m.PostDetailsPage })));
const ChangePasswordPage = React.lazy(() => import('./pages/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage })));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function PageFallback() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-3">
      <div className="w-9 h-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      <span className="text-xs font-mono text-muted-foreground animate-pulse">Loading VYNK...</span>
    </div>
  );
}

/**
 * Strict Route Guard:
 * 1. Shows loading splash while checking credentials (never flash protected content).
 * 2. Unauthenticated visitors are redirected to /auth.
 * 3. Authenticated accounts with mustChangePassword=true are forced to /change-password.
 */
function ProtectedRoute() {
  const { isAuthenticated, user, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return <PageFallback />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/auth?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}

/**
 * Public Only Guard:
 * Prevents authenticated users from seeing the sign-in page again unless logging out.
 */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isInitializing } = useAuthStore();

  if (isInitializing) {
    return <PageFallback />;
  }

  if (isAuthenticated && user) {
    if (user.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public Authentication Gate */}
          <Route
            path="/auth"
            element={
              <PublicOnlyRoute>
                <AuthPage />
              </PublicOnlyRoute>
            }
          />

          {/* Forced Password Reset for New Provisioned Accounts */}
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
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
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
