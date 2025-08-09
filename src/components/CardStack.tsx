import React from 'react';
import Card from './Card';
import { GameCard } from '../types/spotify';

interface CardStackProps {
  cards: GameCard[];
  currentCardIndex: number;
  onCardFlip: (cardId: string) => void;
  onCardPlay: (cardId: string) => void;
  isPlaying: boolean;
  canPlay: boolean;
  overlayTopLeft?: React.ReactNode;
  overlayTopRight?: React.ReactNode;
}

const CardStack: React.FC<CardStackProps> = ({
  cards,
  currentCardIndex,
  onCardFlip,
  onCardPlay,
  isPlaying,
  canPlay,
  overlayTopLeft,
  overlayTopRight
}) => {
  const currentCard = cards[currentCardIndex];

  if (!currentCard) {
    return (
      <div className="card-stack">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-stack">
      <Card
        card={currentCard}
        onFlip={() => onCardFlip(currentCard.id)}
        onPlay={() => onCardPlay(currentCard.id)}
        isPlaying={isPlaying}
        canPlay={canPlay}
        overlayTopLeft={overlayTopLeft}
        overlayTopRight={overlayTopRight}
      />
      

    </div>
  );
};

export default CardStack;