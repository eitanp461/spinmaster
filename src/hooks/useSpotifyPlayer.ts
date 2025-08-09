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
  const isRecoveringRef = useRef<boolean>(false);

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
        // Attempt a best-effort reconnection in the background
        (async () => {
          try {
            await connectWithRetry(3);
          } catch {
            // swallow
          }
        })();
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

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getAuthToken = () => tokenRef.current || token;

  const transferToThisDevice = async (play: boolean) => {
    const authToken = getAuthToken();
    if (!authToken || !deviceId) return;
    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_ids: [deviceId], play }),
    });
  };

  const ensureActiveDevice = async (attemptTransfer = true): Promise<boolean> => {
    const authToken = getAuthToken();
    if (!authToken || !deviceId) return false;

    try {
      const devicesResp = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!devicesResp.ok) return false;
      const devicesData = await devicesResp.json();
      const ours = (devicesData.devices || []).find((d: any) => d.id === deviceId);
      if (!ours) {
        try { await playerRef.current?.connect(); } catch {}
        await sleep(500);
        return false;
      }
      if (ours.is_active) return true;
      if (attemptTransfer) {
        await transferToThisDevice(false);
        await sleep(300);
      }
      return true;
    } catch {
      return false;
    }
  };

  const playTrack = async (uri: string) => {
    const authToken = tokenRef.current || token;
    if (!authToken || !deviceId) {
      console.warn('Player not ready; attempting background recovery');
      try { await playerRef.current?.connect(); } catch {}
      return;
    }

    try {
      isRecoveringRef.current = true;
      await ensureActiveDevice(true);
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
        let status = response.status;
        let message = 'Failed to play track';
        try {
          const errorData = await response.json();
          message = errorData.error?.message || message;
        } catch {}

        const lower = message.toLowerCase();
        if (status === 404 || (lower.includes('device') && lower.includes('not'))) {
          console.warn('Device not found/active; transferring to this device and retrying');
          await transferToThisDevice(true);
          await sleep(400);
          const retryResp = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({ uris: [uri] }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
          });
          if (!retryResp.ok) {
            let retryMsg = 'Failed to play track';
            try { const d = await retryResp.json(); retryMsg = d.error?.message || retryMsg; } catch {}
            if (/restriction/i.test(retryMsg)) {
              console.warn('Restriction violation when playing track; skipping without surfacing fatal error');
              setError(null);
              return;
            }
            throw new Error(retryMsg);
          }
        } else if (/restriction/i.test(lower)) {
          console.warn('Restriction violation when playing track; skipping without surfacing fatal error');
          setError(null);
          return;
        } else {
          throw new Error(message);
        }
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play track';
      if (!/restriction/i.test(errorMessage) && !/device/i.test(errorMessage)) {
        setError(errorMessage);
      } else {
        setError(null);
      }
      console.error('Play error:', err);
    } finally {
      isRecoveringRef.current = false;
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
      await ensureActiveDevice(true);
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          await transferToThisDevice(true);
          await sleep(300);
          const retryResp = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (!retryResp.ok) throw new Error('Failed to resume playback');
        } else {
          throw new Error('Failed to resume playback');
        }
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