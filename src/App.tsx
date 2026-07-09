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
import { loadSession } from './services/sessionStorage';
import { resumeSession } from './services/api';

function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const roomCode = useGameStore((s) => s.roomCode);
  const applyResume = useGameStore((s) => s.applyResume);
  const reset = useGameStore((s) => s.reset);
  const initAuth = useAuthStore((s) => s.init);
  const authReady = useAuthStore((s) => s.initialized);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!authReady) return;
    const stored = loadSession();
    if (!stored) {
      setReady(true);
      return;
    }
    if (roomCode) {
      setReady(true);
      return;
    }

    resumeSession(stored.sessionToken)
      .then((res) => {
        if (res.valid && res.room) {
          applyResume(res, stored);
          if (location.pathname !== '/game') {
            navigate('/game', { replace: true });
          }
        } else {
          reset();
        }
      })
      .catch(() => reset())
      .finally(() => setReady(true));
  }, [authReady]);

  if (!authReady || !ready) {
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

  return <>{children}</>;
}

export default function App() {
  const roomCode = useGameStore((s) => s.roomCode);

  return (
    <SessionBootstrap>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route
          path="/game"
          element={roomCode ? <GamePage /> : <Navigate to="/" replace />}
        />
      </Routes>
    </SessionBootstrap>
  );
}
