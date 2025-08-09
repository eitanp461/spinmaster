import React, { useState } from 'react';

interface PlayerSetupProps {
  onStart: (players: { id: string; name: string }[]) => void;
  onBack?: () => void;
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStart, onBack }) => {
  const [names, setNames] = useState<string[]>(['', '']);

  const updateName = (index: number, value: string) => {
    setNames(prev => prev.map((n, i) => (i === index ? value : n)));
  };

  const addPlayer = () => {
    setNames(prev => [...prev, '']);
  };

  const removePlayer = (index: number) => {
    setNames(prev => prev.filter((_, i) => i !== index));
  };

  const canStart = names.filter(n => n.trim().length > 0).length >= 2;

  const handleStart = () => {
    const players = names
      .map(n => n.trim())
      .filter(n => n.length > 0)
      .map((name, idx) => ({ id: `p-${idx}-${name}-${Date.now()}`, name }));
    if (players.length >= 2) onStart(players);
  };

  return (
    <div className="container">
      <div className="auth-container" style={{ paddingTop: '2rem' }}>
        <h2 className="game-title" style={{ marginBottom: '0.5rem' }}>Competitive Setup</h2>
        <p className="game-subtitle" style={{ marginBottom: '1.25rem' }}>Enter player names (minimum 2):</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: 420 }}>
          {names.map((name, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={name}
                onChange={e => updateName(idx, e.target.value)}
                placeholder={`Player ${idx + 1} name`}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: 'white' }}
              />
              <button
                className="control-button"
                onClick={() => removePlayer(idx)}
                disabled={names.length <= 2}
                title={names.length <= 2 ? 'Need at least 2 players' : 'Remove player'}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="control-button" onClick={addPlayer}>➕ Add Player</button>
          {onBack && (
            <button className="control-button" onClick={onBack} style={{ background: 'rgba(255, 193, 7, 0.3)' }}>
              ← Back
            </button>
          )}
          <button className="control-button" onClick={handleStart} disabled={!canStart} style={{ background: 'rgba(76, 175, 80, 0.3)' }}>
            Start Game →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSetup;


