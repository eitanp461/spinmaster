import React, { useState, useEffect } from 'react';
import SpotifyAuth from './components/SpotifyAuth';
import Game from './components/Game';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import ModeSelect from './components/ModeSelect';
import PlayerSetup from './components/PlayerSetup';
import CompetitiveGame from './components/CompetitiveGame';
import PlaylistInput from './components/PlaylistInput';

const App: React.FC = () => {
  const { isAuthenticated, isLoading, token } = useSpotifyAuth();
  const [gameReady, setGameReady] = useState<boolean>(false);
  const [mode, setMode] = useState<'casual' | 'competitive' | null>(null);
  const [players, setPlayers] = useState<{ id: string; name: string }[] | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);

  console.log('App state:', { isAuthenticated, isLoading, gameReady, hasToken: !!token });

  const handleAuthenticated = () => {
    console.log('handleAuthenticated called');
    setGameReady(true);
  };

  // Reset gameReady when user logs out (isAuthenticated becomes false)
  useEffect(() => {
    if (!isAuthenticated) {
      setGameReady(false);
      setMode(null);
      setPlayers(null);
      setPlaylistUrl(null);
    }
  }, [isAuthenticated]);

  // Force playlist selection after choosing a mode
  useEffect(() => {
    if (mode) {
      setPlaylistUrl(null);
    }
  }, [mode]);

  if (isLoading) {
    console.log('App: showing loading state');
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !gameReady) {
    console.log('App: showing auth screen', { isAuthenticated, gameReady });
    return (
      <div className="container">
        <SpotifyAuth onAuthenticated={handleAuthenticated} />
      </div>
    );
  }

  // After login, show mode select
  if (!mode) {
    return <ModeSelect onSelect={setMode} />;
  }

  // After selecting a mode, require a playlist selection (reuse same screen)
  if (!playlistUrl || playlistUrl.trim().length === 0) {
    const handlePlaylistSubmit = (url: string) => {
      localStorage.setItem('spinmaster_playlist_url', url);
      setPlaylistUrl(url);
    };
    return (
      <div className="container">
        <PlaylistInput onSubmit={handlePlaylistSubmit} error={null} />
      </div>
    );
  }

  if (mode === 'casual') {
    console.log('App: rendering Game component (casual mode)');
    return (
      <Game
        controlsExtras={
          <button
            className="control-button"
            onClick={() => {
              setMode(null);
              setPlaylistUrl(null);
            }}
            style={{ background: 'rgba(255, 87, 34, 0.3)' }}
          >
            Exit
          </button>
        }
      />
    );
  }

  // Competitive mode: ensure players setup
  if (mode === 'competitive' && !players) {
    return (
      <PlayerSetup
        onStart={p => setPlayers(p)}
        onBack={() => setMode(null)}
      />
    );
  }

  if (mode === 'competitive' && players) {
    return (
      <CompetitiveGame
        players={players}
        authToken={token}
        initialPlaylistUrl={playlistUrl}
        onRequestLogout={() => {
          setPlayers(null);
          setMode(null);
          setPlaylistUrl(null);
        }}
        onExit={() => {
          setPlayers(null);
          setMode(null);
          setPlaylistUrl(null);
        }}
      />
    );
  }

  return null;
};

export default App;