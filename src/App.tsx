import React, { useState, useEffect } from 'react';
import SpotifyAuth from './components/SpotifyAuth';
import Game from './components/Game';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';

const App: React.FC = () => {
  const { isAuthenticated, isLoading, token } = useSpotifyAuth();
  const [gameReady, setGameReady] = useState<boolean>(false);

  console.log('App state:', { isAuthenticated, isLoading, gameReady, hasToken: !!token });

  const handleAuthenticated = () => {
    console.log('handleAuthenticated called');
    setGameReady(true);
  };

  // Reset gameReady when user logs out (isAuthenticated becomes false)
  useEffect(() => {
    if (!isAuthenticated) {
      setGameReady(false);
    }
  }, [isAuthenticated]);

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

  console.log('App: rendering Game component');
  return <Game />;
};

export default App;