import React, { useEffect, useRef, useState } from 'react';
import Game from './Game';
import ScoreboardModal, { PlayerScore } from './ScoreboardModal';
import confetti from 'canvas-confetti';

interface CompetitiveGameProps {
  players: { id: string; name: string }[];
  onExit?: () => void;
  authToken?: string | null;
  onRequestLogout?: () => void;
  initialPlaylistUrl?: string | null;
}

const WIN_POINTS = 20;

const CompetitiveGame: React.FC<CompetitiveGameProps> = ({ players: initialPlayers, onExit, authToken, onRequestLogout, initialPlaylistUrl }) => {
  const [players, setPlayers] = useState<PlayerScore[]>(() => initialPlayers.map(p => ({ ...p, score: 0 })));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scoreInputText, setScoreInputText] = useState<string>('');
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const nextHandlerRef = useRef<() => void>();

  const currentPlayer = players[currentIdx];

  // scoring hint removed per UX request

  const awardPoints = () => {
    if (scoreInputText.trim() === '') return;
    const parsed = Number(scoreInputText);
    if (!Number.isFinite(parsed)) return;
    const points = Math.max(0, Math.floor(parsed));
    if (points === 0) return;
    setPlayers(prev => prev.map((p, i) => (i === currentIdx ? { ...p, score: p.score + points } : p)));
    setScoreInputText('');
  };

  // Rotate player each time the Game goes next
  const handleNextFromGame = () => {
    setCurrentIdx(prev => (prev + 1) % players.length);
  };

  // Check winner each time players change
  useEffect(() => {
    const winner = players.find(p => p.score >= WIN_POINTS) || null;
    if (winner && winner.id !== winnerId) {
      setWinnerId(winner.id);
      // celebrate with confetti dependency
      confetti({ spread: 70, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 150, spread: 90, startVelocity: 45 }), 200);
    }
  }, [players]);

  const headerExtras = (
    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={scoreInputText}
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={e => {
            const v = e.target.value;
            if (v === '' || /^\d+$/.test(v)) {
              setScoreInputText(v);
            }
          }}
          placeholder="Points"
          style={{ width: 84, padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700 }}
          aria-label="Points to award"
        />
        <button className="control-button" onClick={awardPoints} style={{ background: 'rgba(33, 150, 243, 0.35)' }}>
          ➕ Award
        </button>
        <button className="control-button" onClick={() => setScoreboardOpen(true)} style={{ background: 'rgba(33, 150, 243, 0.3)' }}>
          🏆 Scoreboard
        </button>
      </div>
    </div>
  );

  const controlsExtras = (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {onExit && (
        <button className="control-button" onClick={onExit} style={{ background: 'rgba(255, 87, 34, 0.3)' }}>
          Exit
        </button>
      )}
    </div>
  );

  return (
    <>
      <Game
        authToken={authToken}
        onRequestLogout={onRequestLogout}
        initialPlaylistUrl={initialPlaylistUrl ?? null}
        headerExtras={headerExtras}
        controlsExtras={controlsExtras}
        overlayTopLeftContent={<span title={currentPlayer?.name}>👤 {currentPlayer?.name}</span>}
        overlayTopRightContent={undefined}
        provideNextHandler={handler => {
          nextHandlerRef.current = handler;
        }}
        onNextCard={handleNextFromGame}
      />

      <ScoreboardModal open={scoreboardOpen} onClose={() => setScoreboardOpen(false)} players={players} />

      {winnerId && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
          <div style={{ background: 'rgba(76,175,80,0.2)', border: '1px solid rgba(76,175,80,0.4)', padding: '1.25rem', borderRadius: 12, maxWidth: 520, width: '90%', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>🎉 {players.find(p => p.id === winnerId)?.name} wins!</h3>
            <p style={{ opacity: 0.9 }}>Reached {WIN_POINTS} points</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '0.75rem' }}>
              <button className="control-button" onClick={() => setScoreboardOpen(true)}>
                View Scoreboard
              </button>
              {onExit && (
                <button className="control-button" onClick={onExit} style={{ background: 'rgba(255, 87, 34, 0.3)' }}>
                  Exit to Mode Select
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompetitiveGame;


