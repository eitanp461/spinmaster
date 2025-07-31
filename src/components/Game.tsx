import React, { useState, useEffect, useCallback } from 'react';
import CardStack from './CardStack';
import { GameCard, SpotifyTrack } from '../types/spotify';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { useSpotifyAPI } from '../hooks/useSpotifyAPI';
import { SAMPLE_TRACKS } from '../config/spotify';

const Game: React.FC = () => {
  const { token, logout } = useSpotifyAuth();
  const { isReady, isPlaying, playTrack, togglePlayback, error: playerError } = useSpotifyPlayer(token);
  const { getTracks, searchTracks, loading: apiLoading, error: apiError } = useSpotifyAPI(token);
  
  console.log('Game component rendered - Token:', !!token, 'API Loading:', apiLoading, 'Player Ready:', isReady);
  
  const [cards, setCards] = useState<GameCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false); // Start with false, set to true during initialization
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize game cards
  const initializeGame = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (loading || isInitialized) {
      console.log('Game initialization already in progress or completed');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsInitialized(true);
      console.log('Initializing game...');

      // Check if we have a valid token
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Extract track IDs from Spotify URIs
      const trackIds = SAMPLE_TRACKS.map(uri => uri.split(':')[2]);
      console.log('Track IDs to fetch:', trackIds);
      
      // Fetch track metadata from Spotify API
      const tracks = await getTracks(trackIds);
      console.log('Fetched tracks:', tracks);
      
      // Filter out null tracks and create game cards
      const validTracks = tracks.filter((track): track is SpotifyTrack => track !== null);
      
      if (validTracks.length === 0) {
        throw new Error('No valid tracks found. Please check your track URIs.');
      }

      console.log('Creating game cards from tracks:');
      console.log('🔍 TRACK ID VERIFICATION:');
      const gameCards: GameCard[] = validTracks.map((track, index) => {
        const originalIndex = trackIds.indexOf(track.id);
        const spotifyUri = SAMPLE_TRACKS[originalIndex];
        const expectedSong = [
          'Never Gonna Give You Up - Rick Astley',
          'Shape of You - Ed Sheeran', 
          'Uptown Funk - Mark Ronson ft. Bruno Mars',
          'Blinding Lights - The Weeknd',
          'Don\'t Stop Believin\' - Journey',
          'Billie Jean - Michael Jackson',
          'Sweet Child O\' Mine - Guns N\' Roses',
          'Someone Like You - Adele',
          'Gangnam Style - PSY',
          'Rolling in the Deep - Adele'
        ][originalIndex];
        
        const actualSong = `${track.name} by ${track.artists[0]?.name}`;
        const isMatch = actualSong.toLowerCase().includes(expectedSong.split(' - ')[0].toLowerCase());
        
        console.log(`❌ MISMATCH at index ${originalIndex}:`, {
          expected: expectedSong,
          actual: actualSong,
          trackId: track.id,
          spotifyUri: spotifyUri,
          match: isMatch ? '✅' : '❌'
        });
        
        return {
          id: `card-${index}`,
          spotifyUri: spotifyUri, // Match with original URI
          track,
          isFlipped: false,
          isActive: index === 0
        };
      });

      // Shuffle the cards for random order
      const shuffledCards = gameCards.sort(() => Math.random() - 0.5);
      
      setCards(shuffledCards);
      setCurrentCardIndex(0);
      setGameStarted(true);
      console.log('Game initialized successfully with', shuffledCards.length, 'cards');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize game';
      setError(errorMessage);
      setIsInitialized(false); // Reset on error so user can retry
      console.error('Game initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, [token, getTracks]); // Now safe since getTracks is memoized

  // Initialize game when component mounts - only once per token
  useEffect(() => {
    console.log('Game useEffect - conditions:', { 
      hasToken: !!token, 
      isInitialized, 
      loading, 
      gameStarted,
      apiLoading
    });
    
    if (token && !isInitialized && !gameStarted) {
      console.log('All conditions met - initializing game...');
      initializeGame();
    } else {
      console.log('Conditions not met for game initialization');
    }
  }, [token, isInitialized, gameStarted, initializeGame]); // Removed loading dependency

  const handleCardFlip = async (cardId: string) => {
    // Pause playback when card is flipped (revealing the answer)
    if (isPlaying) {
      try {
        await togglePlayback();
      } catch (err) {
        console.error('Error pausing playback on card flip:', err);
      }
    }

    setCards(prevCards =>
      prevCards.map(card =>
        card.id === cardId
          ? { ...card, isFlipped: !card.isFlipped }
          : card
      )
    );
  };

  const handleCardPlay = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || !card.track) return;

    try {
      if (isPlaying) {
        console.log('Pausing playback...');
        await togglePlayback();
      } else {
        console.log('Playing track:', card.spotifyUri);
        await playTrack(card.spotifyUri);
      }
    } catch (err) {
      console.error('Play error:', err);
    }
  };

  const handleNextCard = async () => {
    // Pause playback when switching cards
    if (isPlaying) {
      try {
        await togglePlayback();
      } catch (err) {
        console.error('Error pausing playback on card switch:', err);
      }
    }

    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handlePreviousCard = async () => {
    // Pause playback when switching cards
    if (isPlaying) {
      try {
        await togglePlayback();
      } catch (err) {
        console.error('Error pausing playback on card switch:', err);
      }
    }

    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setCards(prevCards =>
      prevCards.map(card => ({ ...card, isFlipped: false }))
    );
  };

  const handleFullRestart = () => {
    setIsInitialized(false);
    setGameStarted(false);
    setCards([]);
    setCurrentCardIndex(0);
    setError(null);
    // initializeGame will be called by useEffect due to state changes
  };

  // Helper function to search for correct track IDs
  const searchForCorrectTracks = async () => {
    const expectedSongs = [
      'Never Gonna Give You Up Rick Astley',
      'Shape of You Ed Sheeran', 
      'Uptown Funk Mark Ronson Bruno Mars',
      'Blinding Lights The Weeknd',
      'Don\'t Stop Believin\' Journey',
      'Billie Jean Michael Jackson',
      'Sweet Child O\' Mine Guns N\' Roses',
      'Someone Like You Adele',
      'Gangnam Style PSY',
      'Rolling in the Deep Adele'
    ];

    console.log('🔍 SEARCHING FOR CORRECT TRACK IDs:');
    
    for (let i = 0; i < expectedSongs.length; i++) {
      try {
        const results = await searchTracks(expectedSongs[i], 1);
        if (results.length > 0) {
          const track = results[0];
          console.log(`✅ ${expectedSongs[i]}:`);
          console.log(`   Correct ID: ${track.id}`);
          console.log(`   Correct URI: spotify:track:${track.id}`);
          console.log(`   Track: ${track.name} by ${track.artists[0]?.name}`);
        } else {
          console.log(`❌ No results for: ${expectedSongs[i]}`);
        }
      } catch (err) {
        console.error(`Error searching for ${expectedSongs[i]}:`, err);
      }
    }
  };

  const displayError = error || playerError || apiError;

  if (loading || apiLoading) {
    return (
      <div className="game-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading game...</p>
          <div style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.7 }}>
            <p>If this takes too long, check the browser console for errors</p>
            <button 
              className="control-button" 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{ marginTop: '1rem', fontSize: '0.8rem', padding: '8px 16px' }}
            >
              Clear Storage & Restart
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="game-container">
        <div className="error">
          <h3>Game Error</h3>
          <p>{displayError}</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="control-button" onClick={handleFullRestart}>
              Retry
            </button>
            <button className="control-button" onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}>
              Clear & Restart
            </button>
            <button className="control-button" onClick={logout}>
              Logout
            </button>
          </div>
          <details style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
            <summary>Debug Info</summary>
            <div style={{ marginTop: '0.5rem', textAlign: 'left' }}>
              <p>Token available: {token ? 'Yes' : 'No'}</p>
              <p>Cards loaded: {cards.length}</p>
              <p>Game started: {gameStarted ? 'Yes' : 'No'}</p>
              <p>Player ready: {isReady ? 'Yes' : 'No'}</p>
            </div>
          </details>
        </div>
      </div>
    );
  }

  if (!gameStarted || cards.length === 0) {
    return (
      <div className="game-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Preparing your music cards...</p>
        </div>
      </div>
    );
  }

  const isGameComplete = currentCardIndex >= cards.length - 1;

  return (
    <div className="container">
      <div className="game-container">
        {/* Header */}
        <div className="game-header">
          <h1 className="game-title">🎵 Hitster Clone</h1>
          <p className="game-subtitle">
            Listen to the song, guess the details, then flip to see the answer!
          </p>
          {!isReady && (
            <div style={{ color: '#ffeb3b', fontSize: '0.9rem', marginTop: '1rem' }}>
              ⚠️ Spotify player is not ready. Make sure you have Spotify Premium and try refreshing the page.
            </div>
          )}
        </div>

        {/* Card Stack */}
        <CardStack
          cards={cards}
          currentCardIndex={currentCardIndex}
          onCardFlip={handleCardFlip}
          onCardPlay={handleCardPlay}
          isPlaying={isPlaying}
          canPlay={isReady}
        />

        {/* Game Controls */}
        <div className="game-controls">
          <button
            className="control-button"
            onClick={handlePreviousCard}
            disabled={currentCardIndex === 0}
          >
            ← Previous
          </button>
          
          <button
            className="control-button"
            onClick={handleRestart}
          >
            🔄 Restart
          </button>
          
          {isGameComplete ? (
                      <button
            className="control-button"
            onClick={handleFullRestart}
            style={{ background: 'rgba(76, 175, 80, 0.3)' }}
          >
            🎉 Play Again
          </button>
          ) : (
            <button
              className="control-button"
              onClick={handleNextCard}
              disabled={currentCardIndex >= cards.length - 1}
            >
              Next →
            </button>
          )}
          
          <button
            className="control-button"
            onClick={searchForCorrectTracks}
            style={{ background: 'rgba(255, 193, 7, 0.3)' }}
          >
            🔍 Find Correct IDs
          </button>
          
          <button
            className="control-button"
            onClick={logout}
            style={{ background: 'rgba(244, 67, 54, 0.3)' }}
          >
            Logout
          </button>
        </div>

        {/* Game Complete Message */}
        {isGameComplete && (
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(76, 175, 80, 0.2)',
            borderRadius: '10px',
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }}>
            <h3>🎉 Congratulations!</h3>
            <p>You've completed all the cards! Ready for another round?</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;