# Project Structure & Organization

## File Organization

```
/
├── index.html              # Main game entry point
├── game_working.js         # Active development version
├── game.js                 # Stable backup version
├── game_clean.js           # Clean reference implementation
├── styles.css              # All UI and layout styles
├── test.html               # Development testing page
├── debug.html              # Debug testing page
├── test_game.js            # Simple test scene
├── blobgardenlogo.png      # Game logo asset
├── garden_background.png   # Main background image
├── rock.png                # Rock decoration asset
├── *blob.png               # Individual blob sprite files
└── .kiro/                  # Kiro configuration
    └── steering/           # Project guidance documents
```

## Code Architecture

### Main Game Class (`BlobGame`)

- Extends `Phaser.Scene`
- Manages all game state and entities
- Handles asset loading and sprite generation
- Coordinates game systems (spawning, movement, interactions)

### Entity Systems

- **Blobs**: Core game entities with AI, happiness, and collection tracking
- **Decorations**: Placeable environment objects (bounce pads, rocks, water, etc.)
- **Food**: Consumable items that affect blob happiness
- **Coins**: Currency system for purchasing items

### Key Methods Organization

- `preload()` - Asset loading and sprite generation
- `create()` - Scene initialization and setup
- `update()` - Game loop (minimal, mostly event-driven)
- `setup*()` - Initialization helpers
- `create*Sprite()` - Procedural asset generation
- `place*()` - Item placement systems
- `spawn*()` - Entity creation
- `handle*()` - Event processing

## Naming Conventions

- **Classes**: PascalCase (`BlobGame`)
- **Methods**: camelCase (`spawnBlob`, `placeFeed`)
- **Properties**: camelCase (`blobTypes`, `gameWidth`)
- **Constants**: camelCase for config objects
- **Files**: snake_case for variants (`game_working.js`)

## Development Patterns

- Keep game logic in single scene class
- Use data objects with sprite references for entities
- Generate textures procedurally when possible
- Separate UI interactions (DOM) from game interactions (Phaser)
- Maintain multiple file versions for stability during development
