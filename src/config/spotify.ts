// Spotify API Configuration
export const SPOTIFY_CONFIG = {
  CLIENT_ID: 'cd63ccc791a74dcabe3003a0369affef',
  REDIRECT_URI: window.location.origin,
  SCOPES: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing'
  ].join(' '),
  API_BASE_URL: 'https://api.spotify.com/v1'
};

// Sample song URIs for the game
// Replace these with actual Spotify track URIs
export const SAMPLE_TRACKS = [
  'spotify:track:4iV5W9uYEdYUVa79Axb7Rh', // Never Gonna Give You Up - Rick Astley
  'spotify:track:7qiZfU4dY1lWllzX7mPBI3', // Shape of You - Ed Sheeran
  'spotify:track:4VqPOruhp5EdPBeR92t6lQ', // Uptown Funk - Mark Ronson ft. Bruno Mars
  'spotify:track:0VjIjW4GlULA8N0L9jZJ5u', // Blinding Lights - The Weeknd
  'spotify:track:4uLU6hMCjMI75M1A2tKUQC', // Don't Stop Believin' - Journey
  'spotify:track:1TfqLAPs4K3s2rJMoCokcS', // Billie Jean - Michael Jackson
  'spotify:track:2WfaOiMkCvy7F5fcp2zZ8L', // Sweet Child O' Mine - Guns N' Roses
  'spotify:track:0u2P5u6lvoDfwTYjAADbn4', // Someone Like You - Adele
  'spotify:track:4iJyoBOLtHqaGxP12qzhQI', // Gangnam Style - PSY
  'spotify:track:2plbrEY59IikOBgBGLjaoe', // Rolling in the Deep - Adele
];

// Utility functions for Spotify OAuth
export const generateRandomString = (length: number): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

export const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

export const base64encode = (input: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};