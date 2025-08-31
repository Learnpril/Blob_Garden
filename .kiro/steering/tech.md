# Technology Stack

## Core Framework

- **Phaser.js 3.70.0** - Main game engine loaded via CDN
- **Vanilla JavaScript** - ES6+ class-based architecture
- **HTML5 Canvas** - Rendering target for Phaser
- **CSS3** - UI styling with gradients and modern layout

## Architecture Patterns

- **Scene-based architecture** - Single main game scene (`BlobGame`)
- **Entity-component pattern** - Blobs, decorations, and food as data objects with sprite references
- **Event-driven interactions** - DOM event listeners for UI, Phaser input for game interactions
- **Procedural sprite generation** - Graphics API used to create textures at runtime

## Asset Management

- **PNG assets** - Blob sprites and some decorations loaded as images
- **Procedural graphics** - Most game objects generated via Phaser Graphics API
- **No build system** - Direct file serving, no compilation or bundling required

## Development Workflow

```bash
# Serve files locally (any static server)
python -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000
```

## File Structure

- `index.html` - Main game entry point
- `game_working.js` - Main game implementation
- `styles.css` - All UI styling
- `*.png` - Image assets for blobs and decorations
- `test.html`, `debug.html` - Development testing files

## Browser Compatibility

- Modern browsers with Canvas and ES6 support
- No external dependencies beyond Phaser CDN
- Responsive design for different screen sizes
