import { Routes, Route, Navigate } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import { useGameStore } from './store/gameStore';

export default function App() {
  const roomCode = useGameStore((s) => s.roomCode);

  return (
    <Routes>
      <Route path="/" element={<LobbyPage />} />
      <Route
        path="/game"
        element={roomCode ? <GamePage /> : <Navigate to="/" replace />}
      />
    </Routes>
  );
}
