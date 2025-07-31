import React from 'react';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';

interface SpotifyAuthProps {
  onAuthenticated: () => void;
}

const SpotifyAuth: React.FC<SpotifyAuthProps> = ({ onAuthenticated }) => {
  const { isAuthenticated, isLoading, error, login } = useSpotifyAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      onAuthenticated();
    }
  }, [isAuthenticated, onAuthenticated]);

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Connecting to Spotify...</p>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
            <p>Processing authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="error">
          <h3>Authentication Error</h3>
          <p>{error}</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="control-button" onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}>
              Clear & Try Again
            </button>
            <button className="control-button" onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
            <p>If this keeps happening, make sure:</p>
            <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
              <li>Your Spotify Client ID is correct</li>
              <li>Redirect URI matches exactly: {window.location.origin}</li>
              <li>You have a Spotify account (Premium required for playback)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Component will be unmounted when authenticated
  }

  return (
    <div className="auth-container">
              <h1 className="auth-title">🎵 Spinmaster</h1>
      <p className="auth-description">
        Connect to Spotify to play the ultimate music guessing game! 
        Test your knowledge of songs from different eras and genres.
      </p>
      <button className="spotify-login-button" onClick={login}>
        <span>🎧</span>
        Connect with Spotify
      </button>
      <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.7 }}>
        <p>Note: You need a Spotify Premium account to play music through the web player.</p>
      </div>
    </div>
  );
};

export default SpotifyAuth;