# 🎵 Hitster Clone

A responsive web application that replicates the core gameplay loop of Hitster using React, TypeScript, and the Spotify Web API.

## Features

- **Card-based gameplay**: Each card represents a song with a front (play button) and back (track details)
- **Spotify integration**: OAuth authentication and Web Playback SDK for music streaming
- **Responsive design**: Works on both desktop and mobile browsers using CSS Grid
- **Interactive cards**: Click to flip cards and reveal song information
- **Stack navigation**: Navigate through cards one at a time

## Prerequisites

- **Spotify Premium account** (required for Web Playback SDK)
- **Spotify Developer Account** to create an app and get credentials

## Setup

### 1. Spotify App Configuration

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app and select "Web API"
3. Add `http://localhost:3000` to your app's Redirect URIs
4. Copy your Client ID

### 2. Environment Configuration

1. Open `src/config/spotify.ts`
2. Replace `'YOUR_SPOTIFY_CLIENT_ID'` with your actual Spotify Client ID:

```typescript
export const SPOTIFY_CONFIG = {
  CLIENT_ID: 'your_actual_client_id_here', // Replace this
  // ... rest of config
};
```

### 3. Installation and Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app will be available at `http://localhost:3000`

## How to Play

1. **Connect to Spotify**: Click "Connect with Spotify" and authorize the app
2. **Start playing**: Click the play button on a card to hear the song
3. **Make your guess**: Try to guess the song name, artist, and year
4. **Reveal answer**: Click anywhere on the card to flip it and see the details
5. **Navigate**: Use the Previous/Next buttons to move through cards
6. **Restart**: Click the Restart button to play again

## Technical Architecture

### Components

- **`SpotifyAuth`**: Handles OAuth authentication with Spotify
- **`Card`**: Individual game card with flip animation
- **`CardStack`**: Manages the stack of cards and current card state
- **`Game`**: Main game logic and state management
- **`App`**: Root component that orchestrates authentication and game flow

### Hooks

- **`useSpotifyAuth`**: Manages Spotify OAuth flow and token storage
- **`useSpotifyPlayer`**: Integrates with Spotify Web Playback SDK
- **`useSpotifyAPI`**: Provides methods for Spotify Web API calls

### Key Technologies

- **React 18** with TypeScript for the UI
- **Spotify Web API** for track metadata
- **Spotify Web Playback SDK** for music streaming
- **CSS Grid** for responsive layout
- **Vite** for build tooling

## Customization

### Adding Your Own Songs

Edit the `SAMPLE_TRACKS` array in `src/config/spotify.ts`:

```typescript
export const SAMPLE_TRACKS = [
  'spotify:track:your_track_id_1',
  'spotify:track:your_track_id_2',
  // Add more Spotify track URIs
];
```

To get Spotify track URIs:
1. Open Spotify and find a song
2. Right-click → Share → Copy Song Link
3. The URI format is: `spotify:track:TRACK_ID`

### Styling

The main styles are in `src/index.css`. The design uses:
- CSS Grid for responsive layout
- CSS transforms for card flip animations
- CSS gradients for modern visual effects
- Media queries for mobile responsiveness

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile browsers**: Responsive design works on all major mobile browsers

## Troubleshooting

### "Player not ready" error
- Ensure you have Spotify Premium
- Try refreshing the page
- Check browser console for detailed errors

### Authentication issues
- Verify your Client ID is correct
- Check that redirect URI matches exactly (including port)
- Clear browser localStorage and try again

### No sound playing
- Make sure Spotify isn't playing on another device
- Check browser allows audio playback
- Verify you have Spotify Premium

## License

This project is for educational purposes. Spotify trademarks and content belong to Spotify Technology S.A.

## Contributing

Feel free to submit issues and pull requests to improve the game!