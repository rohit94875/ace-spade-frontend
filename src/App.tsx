import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import { useGameStore } from './store/gameStore';
import { useAuthStore } from './store/authStore';
import { restoreGameSession } from './services/sessionRestore';

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d2b1a',
      color: 'rgba(255,255,255,0.7)',
      fontSize: 15,
    }}>
      Loading Ace Spade…
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const initialized = useAuthStore((s) => s.initialized);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  if (!initialized) return <LoadingScreen />;
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const roomCode = useGameStore((s) => s.roomCode);
  const applyResume = useGameStore((s) => s.applyResume);
  const initAuth = useAuthStore((s) => s.init);
  const getAccessToken = useAuthStore((s) => s.getAccessToken);
  const authReady = useAuthStore((s) => s.initialized);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!authReady) return;
    if (!isLoggedIn()) {
      setReady(true);
      return;
    }
    if (roomCode) {
      setReady(true);
      return;
    }

    restoreGameSession(getAccessToken)
      .then((result) => {
        if (result.ok && result.resume && result.stored) {
          applyResume(result.resume, result.stored);
          if (location.pathname !== '/game') {
            navigate('/game', { replace: true });
          }
        }
      })
      .finally(() => setReady(true));
  }, [authReady, roomCode, applyResume, getAccessToken, navigate, location.pathname]);

  if (!authReady || !ready) return <LoadingScreen />;
  return <>{children}</>;
}

export default function App() {
  const roomCode = useGameStore((s) => s.roomCode);

  return (
    <SessionBootstrap>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route
          path="/profile"
          element={(
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          )}
        />
        <Route
          path="/"
          element={(
            <RequireAuth>
              <LobbyPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/game"
          element={(
            <RequireAuth>
              {roomCode ? <GamePage /> : <Navigate to="/" replace />}
            </RequireAuth>
          )}
        />
      </Routes>
    </SessionBootstrap>
  );
}
