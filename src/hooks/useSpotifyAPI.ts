import { useState, useCallback } from 'react';
import { SpotifyTrack, SpotifyError } from '../types/spotify';
import { SPOTIFY_CONFIG } from '../config/spotify';

export const useSpotifyAPI = (token: string | null) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async <T>(endpoint: string): Promise<T> => {
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${SPOTIFY_CONFIG.API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: SpotifyError = await response.json();
      throw new Error(errorData.error.message || `API call failed: ${response.status}`);
    }

    return response.json();
  }, [token]);

  const getTrack = async (trackId: string): Promise<SpotifyTrack> => {
    setLoading(true);
    setError(null);

    try {
      const track = await apiCall<SpotifyTrack>(`/tracks/${trackId}`);
      return track;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch track';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTracks = useCallback(async (trackIds: string[]): Promise<SpotifyTrack[]> => {
    setLoading(true);
    setError(null);

    try {
      const idsString = trackIds.join(',');
      const response = await apiCall<{ tracks: SpotifyTrack[] }>(`/tracks?ids=${idsString}`);
      return response.tracks;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tracks';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const searchTracks = async (query: string, limit: number = 20): Promise<SpotifyTrack[]> => {
    setLoading(true);
    setError(null);

    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await apiCall<{ tracks: { items: SpotifyTrack[] } }>(
        `/search?q=${encodedQuery}&type=track&limit=${limit}`
      );
      return response.tracks.items;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search tracks';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async (seedTracks?: string[], seedArtists?: string[], seedGenres?: string[]): Promise<SpotifyTrack[]> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (seedTracks?.length) params.append('seed_tracks', seedTracks.join(','));
      if (seedArtists?.length) params.append('seed_artists', seedArtists.join(','));
      if (seedGenres?.length) params.append('seed_genres', seedGenres.join(','));
      params.append('limit', '20');

      const response = await apiCall<{ tracks: SpotifyTrack[] }>(
        `/recommendations?${params.toString()}`
      );
      return response.tracks;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const profile = await apiCall<any>('/me');
      return profile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPlaylistDetails = useCallback(async (playlistId: string): Promise<{
    id: string;
    name: string;
    description: string;
    owner: { display_name: string };
    tracks: { total: number };
  }> => {
    setLoading(true);
    setError(null);

    try {
      const playlist = await apiCall<{
        id: string;
        name: string;
        description: string;
        owner: { display_name: string };
        tracks: { total: number };
      }>(`/playlists/${playlistId}`);

      console.log(`Fetched playlist details: ${playlist.name} by ${playlist.owner.display_name}`);
      return playlist;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch playlist details';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const getPlaylistTracks = useCallback(async (playlistId: string): Promise<SpotifyTrack[]> => {
    setLoading(true);
    setError(null);

    try {
      let allTracks: SpotifyTrack[] = [];
      let offset = 0;
      const limit = 50; // Spotify API limit per request

      while (true) {
        const response = await apiCall<{
          items: Array<{
            track: SpotifyTrack | null;
          }>;
          next: string | null;
          total: number;
        }>(`/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`);

        // Filter out null tracks and extract track objects
        const validTracks = response.items
          .map(item => item.track)
          .filter((track): track is SpotifyTrack => track !== null);

        allTracks = allTracks.concat(validTracks);

        // Check if there are more tracks to fetch
        if (!response.next) {
          break;
        }

        offset += limit;
      }

      console.log(`Fetched ${allTracks.length} tracks from playlist ${playlistId}`);
      return allTracks;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch playlist tracks';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  return {
    loading,
    error,
    getTrack,
    getTracks,
    searchTracks,
    getRecommendations,
    getUserProfile,
    getPlaylistDetails,
    getPlaylistTracks
  };
};