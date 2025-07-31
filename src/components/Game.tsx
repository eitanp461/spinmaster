import React, { useState, useEffect, useCallback } from 'react';
import CardStack from './CardStack';
import PlaylistInput from './PlaylistInput';
import { GameCard, SpotifyTrack } from '../types/spotify';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { useSpotifyAPI } from '../hooks/useSpotifyAPI';
import { SAMPLE_TRACKS } from '../config/spotify';

const Game: React.FC = () => {
  const { token, logout } = useSpotifyAuth();
  const { isReady, isPlaying, playTrack, togglePlayback, error: playerError } = useSpotifyPlayer(token);
  const { getTracks, getPlaylistDetails, getPlaylistTracks, loading: apiLoading, error: apiError } = useSpotifyAPI(token);
  
  console.log('Game component rendered - Token:', !!token, 'API Loading:', apiLoading, 'Player Ready:', isReady);
  
  const [cards, setCards] = useState<GameCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false); // Start with false, set to true during initialization
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [playlistUrl, setPlaylistUrl] = useState<string>('');
  const [showPlaylistInput, setShowPlaylistInput] = useState<boolean>(false);
  const [playlistInfo, setPlaylistInfo] = useState<{
    name: string;
    owner: string;
    totalTracks: number;
  } | null>(null);

  // Check for saved playlist URL on component mount
  useEffect(() => {
    const savedPlaylistUrl = localStorage.getItem('spinmaster_playlist_url');
    if (savedPlaylistUrl) {
      setPlaylistUrl(savedPlaylistUrl);
    } else {
      setShowPlaylistInput(true); // Show input if no playlist is saved
    }
  }, []);

  // Utility function to extract playlist ID from Spotify URL
  const extractPlaylistId = (url: string): string | null => {
    const regex = /(?:https?:\/\/)?(?:open\.)?spotify\.com\/playlist\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

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

      let tracks: SpotifyTrack[] = [];

      // Check if we have a playlist URL
      if (playlistUrl) {
        const playlistId = extractPlaylistId(playlistUrl);
        if (!playlistId) {
          throw new Error('Invalid Spotify playlist URL. Please check the URL format.');
        }

        console.log('Loading tracks from playlist:', playlistId);
        
        // Fetch playlist details first
        const playlistDetails = await getPlaylistDetails(playlistId);
        setPlaylistInfo({
          name: playlistDetails.name,
          owner: playlistDetails.owner.display_name,
          totalTracks: playlistDetails.tracks.total
        });
        
        tracks = await getPlaylistTracks(playlistId);
        
        if (tracks.length === 0) {
          throw new Error('No tracks found in the playlist or playlist is private.');
        }
      } else {
        // Fallback to hardcoded tracks if no playlist URL
        console.log('No playlist URL provided, using fallback tracks');
        const trackIds = SAMPLE_TRACKS.map(uri => uri.split(':')[2]);
        console.log('Track IDs to fetch:', trackIds);
        
        const fetchedTracks = await getTracks(trackIds);
        tracks = fetchedTracks.filter((track): track is SpotifyTrack => track !== null);
      }

      console.log('Fetched tracks:', tracks);
      const validTracks = tracks;
      
      if (validTracks.length === 0) {
        throw new Error('No valid tracks found. Please check your track URIs.');
      }

      console.log('Creating game cards from tracks:');
      
      const gameCards: GameCard[] = validTracks.map((track, index) => {
        console.log(`Card ${index}: ${track.name} by ${track.artists[0]?.name}`);
        
        return {
          id: `card-${index}`,
          spotifyUri: track.uri, // Use the track's actual URI
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
  }, [token, getTracks, getPlaylistDetails, getPlaylistTracks, playlistUrl]); // Include playlist dependencies

  // Initialize game when component mounts - only once per token
  useEffect(() => {
    console.log('Game useEffect - conditions:', { 
      hasToken: !!token, 
      isInitialized, 
      loading, 
      gameStarted,
      apiLoading,
      hasPlaylistUrl: !!playlistUrl,
      showPlaylistInput
    });
    
    if (token && !isInitialized && !gameStarted && !showPlaylistInput) {
      console.log('All conditions met - initializing game...');
      initializeGame();
    } else {
      console.log('Conditions not met for game initialization');
    }
  }, [token, isInitialized, gameStarted, playlistUrl, showPlaylistInput, initializeGame]); // Added playlist dependencies

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

  // Handle playlist URL submission
  const handlePlaylistSubmit = (url: string) => {
    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      setError('Invalid Spotify playlist URL. Please make sure you copy the full URL from Spotify.');
      return;
    }

    console.log('Setting playlist URL:', url);
    setPlaylistUrl(url);
    localStorage.setItem('spinmaster_playlist_url', url);
    setShowPlaylistInput(false);
    
    // Reset game state to trigger re-initialization with new playlist
    setIsInitialized(false);
    setGameStarted(false);
    setCards([]);
    setCurrentCardIndex(0);
    setError(null);
    setPlaylistInfo(null);
  };

  // Clear saved playlist and show input again
  const handleChangePlaylist = () => {
    localStorage.removeItem('spinmaster_playlist_url');
    setPlaylistUrl('');
    setShowPlaylistInput(true);
    setIsInitialized(false);
    setGameStarted(false);
    setCards([]);
    setCurrentCardIndex(0);
    setPlaylistInfo(null);
  };

  const displayError = error || playerError || apiError;

  // Show playlist input if needed
  if (showPlaylistInput) {
    return <PlaylistInput onSubmit={handlePlaylistSubmit} error={displayError} />;
  }

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
          <h1 className="game-title">🎵 Spinmaster</h1>
          <p className="game-subtitle">
            Listen to the song, guess the details, then flip to see the answer!
          </p>
          {playlistInfo && (
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '0.9rem', 
              marginTop: '1rem',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '12px 20px',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                🎵 {playlistInfo.name}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                by {playlistInfo.owner} • {cards.length} songs loaded
              </div>
            </div>
          )}
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

        {/* Card Counter - Separate row */}
        <div className="card-counter-row">
          <div className="card-counter-display">
            Card {currentCardIndex + 1} of {cards.length}
          </div>
        </div>

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
            onClick={handleChangePlaylist}
            style={{ background: 'rgba(255, 193, 7, 0.3)' }}
          >
            🎵 Change Playlist
          </button>
          
          <button
            className="control-button"
            onClick={logout}
            style={{ background: 'rgba(244, 67, 54, 0.3)' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Game Complete Message - Outside main grid to avoid conflicts */}
      {isGameComplete && (
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'rgba(76, 175, 80, 0.2)',
          borderRadius: '15px',
          border: '1px solid rgba(76, 175, 80, 0.4)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎉 Congratulations!</h3>
          <p style={{ opacity: 0.9 }}>You've completed all the cards! Ready for another round?</p>
        </div>
      )}
    </div>
  );
};

export default Game;