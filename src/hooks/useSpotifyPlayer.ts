import { useState, useEffect, useRef } from 'react';
import { SpotifyPlayer, SpotifyPlaybackState } from '../types/spotify';

export const useSpotifyPlayer = (token: string | null) => {
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const tokenRef = useRef<string | null>(token);
  const hasInitializedRef = useRef<boolean>(false);

  // Check if user has Spotify Premium
  const checkPremiumStatus = async () => {
    const authToken = tokenRef.current || token;
    if (!authToken) return false;
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User product type:', userData.product);
        return userData.product === 'premium';
      }
    } catch (err) {
      console.error('Failed to check premium status:', err);
    }
    return false;
  };

  // Update token ref when token changes
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    if (!token || hasInitializedRef.current) return;

    // Initialize Spotify Web Playback SDK
    const initializePlayer = async () => {
      if (!window.Spotify) {
        setError('Spotify SDK not loaded');
        return;
      }

      // Ensure the latest token is available to the SDK callback
      tokenRef.current = token;

      // Check premium status before initializing player
      const hasPremium = await checkPremiumStatus();
      if (!hasPremium) {
        console.warn('User does not have Spotify Premium - Web Playback SDK may not work');
        setError('Spotify Premium is required for music playback in this app. Please upgrade your account or use the Spotify app directly.');
        return;
      }

      const spotifyPlayer = new window.Spotify.Player({
        name: 'Spinmaster Player',
        getOAuthToken: async (callback: (token: string) => void) => {
          // Keep it simple: use in-memory token managed by auth hook
          const currentToken = tokenRef.current || token;
          if (!currentToken) {
            setError('No authentication token available');
            return;
          }
          callback(currentToken);
        },
        volume: 0.5
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
        setError(`Initialization error: ${message}`);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
        setError(`Authentication error: ${message}`);
      });

      spotifyPlayer.addListener('account_error', ({ message }: { message: string }) => {
        setError(`Account error: ${message}. Spotify Premium is required.`);
      });

      spotifyPlayer.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('Failed to perform playback:', message);
        setError(`Playback error: ${message}`);
      });

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', (state: SpotifyPlaybackState | null) => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);
        setError(null);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });

      // Connect to the player with retry logic
      const connectWithRetry = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const success = await spotifyPlayer.connect();
            if (success) {
              setError(null);
              return;
            } else {
              if (i === retries - 1) {
                setError('Failed to connect to Spotify after multiple attempts. Please check your internet connection and try refreshing the page.');
              }
            }
          } catch (err) {
            if (i === retries - 1) {
              setError('Failed to connect to Spotify. Please ensure you have Spotify Premium and try refreshing the page.');
            }
          }
          
          // Wait before retry (exponential backoff)
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          }
        }
      };

      connectWithRetry();

      setPlayer(spotifyPlayer);
      playerRef.current = spotifyPlayer;
    };

    // Wait for Spotify SDK to be ready
    if (window.Spotify) {
      initializePlayer();
    } else {
      // Always set the SDK ready callback to our initializer (overrides any no-op)
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
    }

    hasInitializedRef.current = true;

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [token]);

  const playTrack = async (uri: string) => {
    const authToken = tokenRef.current || token;
    if (!authToken || !deviceId) {
      setError('Player not ready');
      return;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: [uri]
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to play track');
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play track';
      setError(errorMessage);
      console.error('Play error:', err);
    }
  };

  const pausePlayback = async () => {
    const authToken = tokenRef.current || token;
    console.log('pausePlayback called - token:', !!authToken, 'deviceId:', deviceId);
    if (!authToken || !deviceId) {
      console.error('Missing token or deviceId for pause');
      return;
    }

    try {
      console.log('Sending pause request to Spotify API...');
      const response = await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
      });

      console.log('Pause response status:', response.status);
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Pause API error:', errorData);
        throw new Error('Failed to pause playback');
      }
      console.log('Pause successful');
    } catch (err) {
      console.error('Pause error:', err);
    }
  };

  const resumePlayback = async () => {
    const authToken = tokenRef.current || token;
    if (!authToken || !deviceId) return;

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to resume playback');
      }
    } catch (err) {
      console.error('Resume error:', err);
    }
  };

  const togglePlayback = async () => {
    console.log('togglePlayback called - current isPlaying:', isPlaying);
    if (isPlaying) {
      console.log('Calling pausePlayback...');
      await pausePlayback();
    } else {
      console.log('Calling resumePlayback...');
      await resumePlayback();
    }
  };

  return {
    player,
    deviceId,
    isReady,
    isPlaying,
    currentTrack,
    error,
    playTrack,
    pausePlayback,
    resumePlayback,
    togglePlayback
  };
};