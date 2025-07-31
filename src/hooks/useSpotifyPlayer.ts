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

  useEffect(() => {
    if (!token) return;

    // Initialize Spotify Web Playback SDK
    const initializePlayer = () => {
      if (!window.Spotify) {
        setError('Spotify Web Playback SDK not loaded');
        return;
      }

      const spotifyPlayer = new window.Spotify.Player({
        name: 'Spinmaster Player',
        getOAuthToken: (callback: (token: string) => void) => {
          callback(token);
        },
        volume: 0.5
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Failed to initialize:', message);
        setError(`Initialization error: ${message}`);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Failed to authenticate:', message);
        setError(`Authentication error: ${message}`);
      });

      spotifyPlayer.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Failed to validate Spotify account:', message);
        setError(`Account error: ${message}. You need Spotify Premium to use the Web Playback SDK.`);
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

      // Connect to the player
      spotifyPlayer.connect().then((success: boolean) => {
        if (success) {
          console.log('Successfully connected to Spotify!');
        } else {
          setError('Failed to connect to Spotify');
        }
      });

      setPlayer(spotifyPlayer);
      playerRef.current = spotifyPlayer;
    };

    // Wait for Spotify SDK to be ready
    if (window.Spotify) {
      initializePlayer();
    } else {
      // Ensure the callback is defined globally
      if (typeof window.onSpotifyWebPlaybackSDKReady === 'undefined') {
        window.onSpotifyWebPlaybackSDKReady = initializePlayer;
      }
    }

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [token]);

  const playTrack = async (uri: string) => {
    if (!token || !deviceId) {
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
          'Authorization': `Bearer ${token}`
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
    console.log('pausePlayback called - token:', !!token, 'deviceId:', deviceId);
    if (!token || !deviceId) {
      console.error('Missing token or deviceId for pause');
      return;
    }

    try {
      console.log('Sending pause request to Spotify API...');
      const response = await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
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
    if (!token || !deviceId) return;

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
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