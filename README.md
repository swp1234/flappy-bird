# Sky Flap - Casual Arcade Game

A fun and addictive HTML5 Canvas-based flappy bird game with Progressive Web App (PWA) support and 12-language internationalization.

## Features

- **Classic Flappy Bird Gameplay**
  - Tap or click to make the bird fly
  - Navigate through obstacles (pipes)
  - Score by passing through gaps
  - Progressive difficulty increase

- **Progressive Web App (PWA)**
  - Installable on mobile devices and desktops
  - Offline support via Service Worker
  - App-like experience with standalone display mode

- **12-Language Support**
  - Korean (한국어)
  - English
  - Japanese (日本語)
  - Simplified Chinese (中文)
  - Spanish (Español)
  - Portuguese (Português)
  - Indonesian (Bahasa Indonesia)
  - Turkish (Türkçe)
  - German (Deutsch)
  - French (Français)
  - Hindi (हिन्दी)
  - Russian (Русский)

- **Modern Design**
  - Neon/retro visual style
  - Dark mode by default
  - Smooth animations and transitions
  - Responsive design (mobile & desktop)
  - Glassmorphism UI elements

- **Game Features**
  - Real-time score tracking
  - Level progression based on score
  - Progressive difficulty increase
  - Sound effects (Web Audio API)
  - Best score saved in localStorage
  - Share functionality

- **Monetization Ready**
  - AdSense integration
  - Top banner ad slot
  - Game over interstitial ad slot
  - Automatic ad triggers

- **Analytics**
  - Google Analytics 4 integration
  - Game events tracking

- **Accessibility**
  - 44px+ touch targets
  - Keyboard navigation support
  - Color contrast compliance
  - Reduced motion support

## Project Structure

```
flappy-bird/
├── index.html           # Main HTML with ad slots
├── manifest.json        # PWA manifest
├── sw.js               # Service Worker for offline support
├── icon-192.svg        # App icon (192x192)
├── icon-512.svg        # App icon (512x512)
├── css/
│   └── style.css       # All styles (responsive, dark mode)
├── js/
│   ├── i18n.js         # Internationalization loader
│   ├── app.js          # Main game logic
│   └── locales/        # Translation files
│       ├── ko.json     # Korean
│       ├── en.json     # English
│       ├── ja.json     # Japanese
│       ├── zh.json     # Chinese
│       ├── es.json     # Spanish
│       ├── pt.json     # Portuguese
│       ├── id.json     # Indonesian
│       ├── tr.json     # Turkish
│       ├── de.json     # German
│       ├── fr.json     # French
│       ├── hi.json     # Hindi
│       └── ru.json     # Russian
└── README.md           # This file
```

## How to Play

1. **Start Game**: Click the "Start Game" button
2. **Control the Bird**:
   - **Mobile**: Tap anywhere on the screen
   - **Desktop**: Click the canvas or press Spacebar
3. **Objective**: Navigate the bird through the pipes without hitting them
4. **Score**: You score 1 point for each pipe you pass through
5. **Difficulty**: The game gets harder as your score increases
   - Pipes move faster
   - Pipe gaps become narrower
   - Pipe spacing decreases

## Controls

| Input | Action |
|-------|--------|
| Tap / Click | Make bird fly |
| Spacebar / Enter | Make bird fly |
| P | Pause/Resume game |

## Installation & Setup

### Local Development

1. **Open in browser**:
   ```bash
   # Open the file directly
   open index.html
   # or
   start index.html
   ```

2. **Using a local server** (recommended for testing PWA):
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js
   npx http-server

   # PHP
   php -S localhost:8000
   ```

   Then visit `http://localhost:8000`

### PWA Installation

1. **Mobile (iOS/Android)**:
   - Open the game in your mobile browser
   - Tap the share/menu button
   - Select "Add to Home Screen" or "Install"

2. **Desktop (Chrome/Edge)**:
   - Open the game in your browser
   - Click the install icon in the address bar
   - Or use the menu: Settings → Install app

## Technical Details

### Canvas-Based Rendering
- HTML5 Canvas 2D context
- 60 FPS game loop with requestAnimationFrame
- Custom bird and pipe drawing with gradient fills
- Neon glow effects using canvas filters

### Physics Engine
- Gravity simulation (0.6 pixels/frame²)
- Velocity clamping for realistic movement
- Collision detection with axis-aligned bounding boxes

### State Management
- Three game states: `start`, `playing`, `gameover`
- localStorage for persistent best score
- Event-driven architecture

### Internationalization (i18n)
- Dynamic language loading from JSON files
- Browser language detection with fallback
- localStorage persistence for user preference
- Dot-notation translation keys
- Support for Intl API for number/date formatting

### Service Worker
- Cache-first strategy for assets
- Network fallback for dynamic content
- Automatic cache updates
- Offline support with fallback page

### Performance Optimizations
- CSS containment for rendering
- Minimal DOM manipulations
- Efficient canvas drawing
- Lazy loading of localization files

## Monetization

### Ad Placements
1. **Top Banner**: Persistent banner ad above the game
2. **Game Over Interstitial**: Full-page ad on game over screen

### AdSense Integration
- Publisher ID: `ca-pub-3600813755953882`
- Responsive ad slots for different screen sizes
- Automatic ad refresh handling

### Revenue Model
- CPM/RPM based on game plays
- Higher engagement = longer sessions = more ad impressions
- Difficulty progression keeps players engaged

## Analytics

### Google Analytics 4
- Property ID: `G-J8GSWM40TV`
- Tracks game plays, scores, and user interactions
- Custom events for game milestones

### Key Metrics
- Session duration
- Game completion rate
- Average score
- User retention
- Device breakdown

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Android)

### Required APIs
- Canvas 2D
- Web Audio API (for sound effects)
- localStorage
- Service Workers
- Fetch API

## Accessibility

### WCAG 2.1 Level AA Compliance
- **Color Contrast**: 7:1+ for text and UI elements
- **Touch Targets**: 44x44px minimum
- **Keyboard Navigation**: Full support for keyboard input
- **Motion**: Respects `prefers-reduced-motion`
- **Focus Indicators**: Clear focus states for all interactive elements
- **Semantic HTML**: Proper heading hierarchy and ARIA labels

### Keyboard Navigation
- Click/Tap to start game
- Spacebar/Enter to make bird fly
- Tab for menu navigation
- Escape to pause (future enhancement)

## Performance Metrics

### Load Time
- Initial load: < 2 seconds (optimized assets)
- Game ready: < 500ms

### Frame Rate
- Target: 60 FPS on 60Hz displays
- Adaptive rendering on lower-end devices

### Memory Usage
- Game state: < 1MB
- Canvas buffer: depends on viewport size
- Cache: < 5MB (PWA assets)

## Troubleshooting

### Service Worker Issues
- **Not caching**: Check console for errors, clear browser cache
- **Offline not working**: Ensure all assets are cached correctly
- **Update not applying**: Clear site data and reload

### Language Not Changing
- Check localStorage: `preferred-language`
- Verify JSON files are in `js/locales/` directory
- Check console for 404 errors

### Game Not Responsive
- Check browser console for JavaScript errors
- Verify canvas is rendering (press F12)
- Try refreshing the page
- Check browser support (see Browser Support section)

### Sound Not Playing
- Check browser permissions for audio
- Verify Web Audio API is available
- Check browser console for audio context errors

## Future Enhancements

- [ ] Multiplayer mode (score comparison)
- [ ] Power-ups and special items
- [ ] Different bird skins
- [ ] Custom difficulty presets
- [ ] Leaderboard integration
- [ ] Social sharing improvements
- [ ] Additional languages
- [ ] Dark/Light theme toggle UI

## License

Created for dopabrain.com - Casual Gaming Platform

## Support

For issues or suggestions:
- Check the troubleshooting section above
- Review console logs (F12)
- Clear browser cache and try again

---

**Enjoy Sky Flap!** 🎮✈️
