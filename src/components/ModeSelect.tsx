import React, { useState } from 'react';

interface ModeSelectProps {
  onSelect: (mode: 'casual' | 'competitive') => void;
}

const ModeSelect: React.FC<ModeSelectProps> = ({ onSelect }) => {
  const [hovered, setHovered] = useState<'casual' | 'competitive' | null>(null);

  const baseCardStyle: React.CSSProperties = {
    borderRadius: 12,
    padding: '12px 14px',
    cursor: 'pointer',
    transition: 'box-shadow 160ms ease, transform 160ms ease, background 160ms ease, border-color 160ms ease',
    outline: 'none',
  };

  const hoverShadow = '0 8px 24px rgba(0,0,0,0.35)';

  return (
    <div className="container">
      <div className="auth-container" style={{ paddingTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <img
            src="./SpinMaster.png"
            alt="SpinMaster Logo"
            style={{ width: '100px', height: '100px', borderRadius: '50%', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
          />
        </div>
        <h2 className="game-title" style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Choose Game Mode</h2>
        <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
          <p className="game-subtitle" style={{ marginBottom: '1rem', textAlign: 'center' }}>
            Pick how you want to play:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            <div
              role="button"
              tabIndex={0}
              aria-label="Select casual mode"
              onClick={() => onSelect('casual')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect('casual');
                }
              }}
              onMouseEnter={() => setHovered('casual')}
              onMouseLeave={() => setHovered(prev => (prev === 'casual' ? null : prev))}
              style={{
                ...baseCardStyle,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: hovered === 'casual' ? hoverShadow : 'none',
                transform: hovered === 'casual' ? 'translateY(-2px)' : 'none',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>🎧 Casual</div>
              <div style={{ opacity: 0.9, fontSize: '0.95rem' }}>
                Solo or group play without tracking players. Listen, guess, flip, and move to the next song.
              </div>
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-label="Select competitive mode"
              onClick={() => onSelect('competitive')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect('competitive');
                }
              }}
              onMouseEnter={() => setHovered('competitive')}
              onMouseLeave={() => setHovered(prev => (prev === 'competitive' ? null : prev))}
              style={{
                ...baseCardStyle,
                background: 'rgba(156, 39, 176, 0.15)',
                border: '1px solid rgba(156, 39, 176, 0.35)',
                boxShadow: hovered === 'competitive' ? hoverShadow : 'none',
                transform: hovered === 'competitive' ? 'translateY(-2px)' : 'none',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>🏆 Competitive</div>
              <div style={{ opacity: 0.9, fontSize: '0.95rem' }}>
                Add players and keep score each turn. <span style={{ fontWeight: 800 }}>First to 20 points wins.</span>
                <div>Suggested scoring: 1 for artist, 1 for title, 1 for year within ±2, 2 for exact year.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelect;


