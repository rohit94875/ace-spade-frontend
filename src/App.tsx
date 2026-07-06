import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import { useGameStore } from './store/gameStore';
import { loadSession } from './services/sessionStorage';
import { resumeSession } from './services/api';

function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const roomCode = useGameStore((s) => s.roomCode);
  const applyResume = useGameStore((s) => s.applyResume);
  const reset = useGameStore((s) => s.reset);

  useEffect(() => {
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
  }, []);

  if (!ready) {
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
        Restoring your game session…
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
        <Route
          path="/game"
          element={roomCode ? <GamePage /> : <Navigate to="/" replace />}
        />
      </Routes>
    </SessionBootstrap>
  );
}
