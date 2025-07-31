import React, { useState } from 'react';

interface PlaylistInputProps {
  onSubmit: (url: string) => void;
  error: string | null;
}

const PlaylistInput: React.FC<PlaylistInputProps> = ({ onSubmit, error }) => {
  const [inputUrl, setInputUrl] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onSubmit(inputUrl.trim());
    }
  };

  const handleExampleClick = () => {
    const exampleUrl = 'https://open.spotify.com/playlist/7aB6UPU4A6Lkri1fDNtXhS';
    setInputUrl(exampleUrl);
  };

  return (
    <div className="auth-container">
      <div style={{ marginBottom: '1rem' }}>
        <img 
          src="./SpinMaster.png" 
          alt="SpinMaster Logo" 
          style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }} 
        />
      </div>
      <h1 className="auth-title">Choose Your Playlist</h1>
      <p className="auth-description">
        Paste a Spotify playlist URL to play with your favorite songs!
      </p>
      
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '1rem',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '25px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              outline: 'none',
              backdropFilter: 'blur(10px)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          />
        </div>
        
        <button
          type="submit"
          className="spotify-login-button"
          disabled={!inputUrl.trim()}
          style={{ 
            opacity: inputUrl.trim() ? 1 : 0.5,
            cursor: inputUrl.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          <span>🎮</span>
          Start Game
        </button>
      </form>

      {error && (
        <div className="error" style={{ marginTop: '1rem' }}>
          <p>{error}</p>
        </div>
      )}

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
        <h3 style={{ marginBottom: '1rem' }}>How to get your playlist URL:</h3>
        <ol style={{ 
          textAlign: 'left', 
          lineHeight: '1.6',
          padding: '0 1rem',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <li style={{ marginBottom: '0.5rem' }}><strong>Open Spotify</strong> (desktop, web, or mobile)</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Find your playlist</strong> or create a new one</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Click/tap the 3 dots (⋯)</strong> on the playlist</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Select "Share"</strong> → <strong>"Copy playlist link"</strong></li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Paste the link above</strong> and click "Start Game"</li>
        </ol>
        
        <div style={{ marginTop: '1.5rem' }}>
          <button 
            onClick={handleExampleClick}
            className="control-button"
            style={{ fontSize: '0.8rem', padding: '8px 16px' }}
          >
            Try Example Playlist
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaylistInput;