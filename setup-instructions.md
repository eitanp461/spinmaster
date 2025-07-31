# 🚀 Quick Setup Instructions

Follow these steps to get your Spinmaster app up and running:

## 1. Create Spotify App (Most Important!)

1. Go to https://developer.spotify.com/dashboard
2. Click "Create app"
3. Fill in the form:
   - **App name**: "Spinmaster" (or any name you prefer)
   - **App description**: "A music guessing game"
   - **Website**: http://localhost:3000
   - **Redirect URI**: http://localhost:3000
   - **Which API/SDKs are you planning to use?**: Select "Web API" and "Web Playback SDK"
4. Click "Save"
5. In your new app, click "Settings"
6. Copy your **Client ID** (you'll need this next)

## 2. Configure the App

1. Open `src/config/spotify.ts`
2. Replace `'YOUR_SPOTIFY_CLIENT_ID'` with your actual Client ID:

```typescript
export const SPOTIFY_CONFIG = {
  CLIENT_ID: 'paste_your_client_id_here', // Replace this line
  // ... rest stays the same
};
```

## 3. Install and Run

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## 4. Play the Game!

1. Open http://localhost:3000 in your browser
2. Click "Connect with Spotify"
3. Sign in with your Spotify account (Premium required for playback)
4. Enjoy the game!

## ⚠️ Important Notes

- **Spotify Premium is required** for the Web Playback SDK to work
- Make sure your redirect URI in Spotify settings matches exactly: `http://localhost:3000`
- If you get authentication errors, double-check your Client ID and redirect URI

## 🎵 Customizing Songs

To add your own songs, edit the `SAMPLE_TRACKS` array in `src/config/spotify.ts`. Get Spotify URIs by:

1. Right-clicking any song in Spotify
2. Share → Copy Song Link
3. Convert the link to URI format: `spotify:track:TRACK_ID`

Example:
```typescript
export const SAMPLE_TRACKS = [
  'spotify:track:4iV5W9uYEdYUVa79Axb7Rh', // Your song here
  // Add more songs...
];
```

## 🎮 How to Play

1. **Listen**: Click the play button to hear a song snippet
2. **Guess**: Try to identify the song, artist, and release year
3. **Reveal**: Click anywhere on the card to flip and see the answer
4. **Navigate**: Use Previous/Next buttons to move through cards

Have fun! 🎉