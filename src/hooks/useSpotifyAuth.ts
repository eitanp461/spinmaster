import { useState, useEffect } from 'react';
import { SpotifyAuthToken } from '../types/spotify';
import { SPOTIFY_CONFIG, generateRandomString, sha256, base64encode } from '../config/spotify';

export const useSpotifyAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingCallback, setIsProcessingCallback] = useState<boolean>(false);

  useEffect(() => {
    // Check for existing token in localStorage
    const savedToken = localStorage.getItem('spotify_access_token');
    const savedExpiry = localStorage.getItem('spotify_token_expiry');

    if (savedToken && savedExpiry) {
      const expiryTime = parseInt(savedExpiry);
      if (Date.now() < expiryTime) {
        setToken(savedToken);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      } else {
        // Token expired, remove it
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_expiry');
      }
    }

    // Check if returning from Spotify auth - only if we haven't already processed
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      const alreadyProcessed = localStorage.getItem('spotify_auth_completed');
      if (!alreadyProcessed) {
        handleAuthCallback();
      } else {
        console.log('Auth already completed, skipping callback processing');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleAuthCallback = async () => {
    // Check if we've already completed auth to prevent React Strict Mode issues
    const alreadyCompleted = localStorage.getItem('spotify_auth_completed');
    if (alreadyCompleted) {
      console.log('Auth already completed, skipping callback processing');
      return;
    }

    // Prevent multiple simultaneous callback processing
    if (isProcessingCallback) {
      console.log('Auth callback already in progress, skipping...');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const errorParam = urlParams.get('error');
    const savedState = localStorage.getItem('spotify_auth_state');

    console.log('Auth callback - Code:', !!code, 'State:', !!state, 'Error:', errorParam);

    if (errorParam) {
      setError(`Spotify authorization error: ${errorParam}`);
      setIsLoading(false);
      return;
    }

    if (code && state && state === savedState) {
      setIsProcessingCallback(true);
      try {
        console.log('Processing auth callback...');
        const codeVerifier = localStorage.getItem('spotify_code_verifier');
        if (!codeVerifier) {
          throw new Error('Code verifier not found');
        }

        const tokenData = await exchangeCodeForToken(code, codeVerifier);
        console.log('Token exchange successful');
        
        // Save token and expiry time
        const expiryTime = Date.now() + (tokenData.expires_in * 1000);
        localStorage.setItem('spotify_access_token', tokenData.access_token);
        localStorage.setItem('spotify_token_expiry', expiryTime.toString());
        
        // Mark auth as completed to prevent re-processing
        localStorage.setItem('spotify_auth_completed', 'true');

        // Clean up auth parameters
        localStorage.removeItem('spotify_auth_state');
        localStorage.removeItem('spotify_code_verifier');

        setToken(tokenData.access_token);
        setIsAuthenticated(true);

        // Clean URL
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log('Authentication completed successfully');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setIsProcessingCallback(false);
        setIsLoading(false);
      }
    } else if (code || state) {
      console.error('Auth callback - state mismatch or missing parameters');
      setError('Authentication state mismatch. Please try logging in again.');
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  const exchangeCodeForToken = async (code: string, codeVerifier: string): Promise<SpotifyAuthToken> => {
    const params = {
      client_id: SPOTIFY_CONFIG.CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
      code_verifier: codeVerifier,
    };

    console.log('Token exchange parameters:', {
      client_id: params.client_id,
      redirect_uri: params.redirect_uri,
      code_length: code.length,
      code_verifier_length: codeVerifier.length
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token exchange failed:', errorData);
      console.error('Response status:', response.status);
      
      let errorMessage = 'Token exchange failed';
      if (errorData.error_description) {
        errorMessage = errorData.error_description;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
      
      // Add helpful context for common errors
      if (errorMessage.includes('Invalid authorization code')) {
        errorMessage += '. This usually happens if the code was already used or expired. Please try logging in again.';
      } else if (errorMessage.includes('redirect_uri')) {
        errorMessage += `. Make sure your Spotify app redirect URI matches exactly: ${SPOTIFY_CONFIG.REDIRECT_URI}`;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  };

  const login = async () => {
    try {
      const codeVerifier = generateRandomString(64);
      const hashed = await sha256(codeVerifier);
      const codeChallenge = base64encode(hashed);
      const state = generateRandomString(16);

      // Save state and code verifier for later verification
      localStorage.setItem('spotify_auth_state', state);
      localStorage.setItem('spotify_code_verifier', codeVerifier);

      const authUrl = new URL('https://accounts.spotify.com/authorize');
      authUrl.searchParams.append('client_id', SPOTIFY_CONFIG.CLIENT_ID);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('redirect_uri', SPOTIFY_CONFIG.REDIRECT_URI);
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('scope', SPOTIFY_CONFIG.SCOPES);
      authUrl.searchParams.append('code_challenge_method', 'S256');
      authUrl.searchParams.append('code_challenge', codeChallenge);

      window.location.href = authUrl.toString();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiry');
    localStorage.removeItem('spotify_auth_completed');
    localStorage.removeItem('spotify_auth_state');
    localStorage.removeItem('spotify_code_verifier');
    setToken(null);
    setIsAuthenticated(false);
    setIsProcessingCallback(false);
  };

  return {
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout
  };
};