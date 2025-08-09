import React from 'react';
import { GameCard } from '../types/spotify';

interface CardProps {
  card: GameCard;
  onFlip: () => void;
  onPlay: () => void;
  isPlaying: boolean;
  canPlay: boolean;
  overlayTopLeft?: React.ReactNode;
  overlayTopRight?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ card, onFlip, onPlay, isPlaying, canPlay, overlayTopLeft, overlayTopRight }) => {
  const { track, isFlipped } = card;

  const formatArtists = (artists: { name: string }[]) => {
    return artists.map(artist => artist.name).join(', ');
  };

  const formatReleaseYear = (releaseDate: string) => {
    return new Date(releaseDate).getFullYear();
  };

  return (
    <div className="card-container" onClick={onFlip} style={{ position: 'relative' }}>
      {(overlayTopLeft || overlayTopRight) && (
        <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 2 }}>
          <div style={{ pointerEvents: 'auto' }}>
            {overlayTopLeft && (
              <div style={{
                padding: '6px 10px',
                borderRadius: 999,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.3)',
                fontWeight: 700,
                maxWidth: 180,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>{overlayTopLeft}</div>
            )}
          </div>
          <div style={{ pointerEvents: 'auto' }}>
            {overlayTopRight && (
              <div style={{
                padding: '6px 10px',
                borderRadius: 999,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.3)',
                fontWeight: 700
              }}>{overlayTopRight}</div>
            )}
          </div>
        </div>
      )}
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
          <div className="card-instructions" style={{ opacity: 0.85 }}>
            {canPlay ? 'Tap ▶ to play' : 'Loading...'}
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