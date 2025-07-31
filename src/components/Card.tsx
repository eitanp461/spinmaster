import React from 'react';
import { GameCard } from '../types/spotify';

interface CardProps {
  card: GameCard;
  onFlip: () => void;
  onPlay: () => void;
  isPlaying: boolean;
  canPlay: boolean;
}

const Card: React.FC<CardProps> = ({ card, onFlip, onPlay, isPlaying, canPlay }) => {
  const { track, isFlipped } = card;

  const formatArtists = (artists: { name: string }[]) => {
    return artists.map(artist => artist.name).join(', ');
  };

  const formatReleaseYear = (releaseDate: string) => {
    return new Date(releaseDate).getFullYear();
  };

  return (
    <div className="card-container" onClick={onFlip}>
      <div className={`card ${isFlipped ? 'flipped' : ''}`}>
        {/* Front Side */}
        <div className="card-face card-front">
          <button
            className="play-button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            disabled={!canPlay}
            aria-label={isPlaying ? "Pause song" : "Play song"}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <div className="card-instructions">
            {canPlay ? 'Click to play the song' : 'Loading...'}
          </div>
          <div className="card-instructions" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
            Click anywhere on the card to reveal the answer
          </div>
        </div>

        {/* Back Side */}
        <div className="card-face card-back">
          {track ? (
            <div className="card-info">
              <h2 className="track-name">{track.name}</h2>
              <p className="artist-name">{formatArtists(track.artists)}</p>
              <p className="release-year">{formatReleaseYear(track.album.release_date)}</p>
              {track.album.images.length > 0 && (
                <img
                  src={track.album.images[0].url}
                  alt={`${track.album.name} cover`}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '10px',
                    marginTop: '1rem',
                    objectFit: 'cover'
                  }}
                />
              )}
            </div>
          ) : (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading track info...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;