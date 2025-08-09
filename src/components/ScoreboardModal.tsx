import React from 'react';

export interface PlayerScore {
  id: string;
  name: string;
  score: number;
}

interface ScoreboardModalProps {
  open: boolean;
  onClose: () => void;
  players: PlayerScore[];
}

const ScoreboardModal: React.FC<ScoreboardModalProps> = ({ open, onClose, players }) => {
  if (!open) return null;

  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'rgba(33,33,33,0.95)', padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', width: '90%', maxWidth: 520 }}>
        <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>🏆 Scoreboard</h3>
        <p style={{ opacity: 0.8, marginTop: 0 }}>First to 20 points wins.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginTop: '0.75rem' }}>
          {sorted.map((p, idx) => (
            <React.Fragment key={p.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ opacity: 0.8, width: 18, display: 'inline-block' }}>{idx + 1}.</span>
                <span>{p.name}</span>
              </div>
              <div style={{ fontWeight: 700 }}>{p.score}</div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="control-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ScoreboardModal;


