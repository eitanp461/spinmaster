// Spotify Web API Types
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    release_date: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  uri: string;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface SpotifyError {
  error: {
    status: number;
    message: string;
  };
}

// Spotify Web Playback SDK Types
export interface SpotifyPlayer {
  addListener: (event: string, callback: (data: any) => void) => void;
  removeListener: (event: string, callback?: (data: any) => void) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
  setName: (name: string) => Promise<void>;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
}

export interface SpotifyPlaybackState {
  context: {
    uri: string;
    metadata: any;
  };
  disallows: {
    pausing: boolean;
    peeking_next: boolean;
    peeking_prev: boolean;
    resuming: boolean;
    seeking: boolean;
    skipping_next: boolean;
    skipping_prev: boolean;
  };
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: SpotifyTrack;
    next_tracks: SpotifyTrack[];
    previous_tracks: SpotifyTrack[];
  };
}

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

// App Types
export interface GameCard {
  id: string;
  spotifyUri: string;
  track?: SpotifyTrack;
  isFlipped: boolean;
  isActive: boolean;
}

export interface GameState {
  cards: GameCard[];
  currentCardIndex: number;
  score: number;
  gameStarted: boolean;
  gameEnded: boolean;
}

// Global Spotify object
declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (callback: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}