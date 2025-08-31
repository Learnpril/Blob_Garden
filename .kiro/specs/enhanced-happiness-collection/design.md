# Design Document

## Overview

The Enhanced Happiness and Collection System transforms the existing Blob Garden game into a comprehensive virtual pet experience. This design builds upon the current Phaser.js architecture while adding sophisticated happiness mechanics, persistent blob relationships, and a rewarding collection system. The implementation focuses on creating emotional connections between players and their blob pets through meaningful interactions and visible progress.

## Architecture

### Core System Components

The design extends the existing `BlobGame` class with new subsystems:

- **HappinessManager**: Centralized happiness calculation and decay system
- **CollectionManager**: Persistent blob data storage and relationship tracking
- **PersonalitySystem**: Blob behavior and preference management
- **RewardSystem**: Coin generation and offline progress calculation
- **UIManager**: Visual feedback and happiness indicators

### Data Flow

```
Blob Spawn → Personality Assignment → Happiness Initialization
     ↓
Item Interaction → Happiness Calculation → Visual Updates
     ↓
Happiness Threshold → Collection Addition → Persistent Storage
     ↓
Offline Time → Progress Calculation → Return Summary
```

## Components and Interfaces

### Enhanced Blob Data Structure

```javascript
const blob = {
  // Existing properties
  id: string,
  sprite: Phaser.GameObjects.Image,
  x: number,
  y: number,
  name: string,
  type: string,
  rarity: string,

  // New happiness properties
  happiness: number, // 0-100 scale
  maxHappiness: number, // Always 100
  happinessDecayRate: number, // Per-second decay
  lastHappinessUpdate: timestamp,

  // New personality properties
  personality: string, // sleepy, playful, shy, curious, social
  preferredItems: array, // Items that give bonus happiness
  happinessMultiplier: number, // Personality-based modifier

  // New collection properties
  isCollected: boolean,
  collectionDate: timestamp,
  totalVisits: number,
  relationshipLevel: number, // 0-5 scale
  favoriteActivity: string,

  // New visual properties
  happinessBar: Phaser.GameObjects.Graphics,
  sparkleEffect: Phaser.GameObjects.Particles,
  statusIcon: Phaser.GameObjects.Image,
};
```

### HappinessManager Class

```javascript
class HappinessManager {
  constructor(scene) {
    this.scene = scene;
    this.decayTimer = null;
    this.coinGenerationTimer = null;
  }

  updateHappiness(blob, deltaTime) {
    // Calculate happiness decay based on personality and time
    // Apply interaction bonuses
    // Trigger visual updates
    // Handle threshold events (collection, coin generation)
  }

  applyInteractionBonus(blob, itemType) {
    // Calculate bonus based on item preference
    // Apply personality multipliers
    // Trigger celebration effects
  }

  generateCoins(blob) {
    // Calculate coin generation based on happiness level
    // Create floating coin animations
    // Update player coin count
  }
}
```

### CollectionManager Class

```javascript
class CollectionManager {
  constructor(scene) {
    this.scene = scene;
    this.collectedBlobs = new Map();
    this.storageKey = "blobGarden_collection";
  }

  addToCollection(blob) {
    // Check if blob meets collection criteria (75% happiness)
    // Create collection entry with stats
    // Save to localStorage
    // Trigger collection celebration
  }

  updateBlobStats(blob) {
    // Track visit history, time spent, activities
    // Calculate relationship progression
    // Update persistent storage
  }

  getCollectionData() {
    // Return formatted data for UI display
    // Include completion percentages and achievements
  }
}
```

## Data Models

### Happiness System Model

The happiness system operates on a 0-100 scale with the following mechanics:

- **Initial Happiness**: 10-30% (random, based on rarity)
- **Decay Rate**: 1-2% every 30 seconds (personality dependent)
- **Interaction Bonus**: 5-15% per interaction (item preference dependent)
- **Maximum Happiness**: 100% (triggers special effects and maximum coin generation)

### Personality System Model

Each blob receives one of five personality types that affect behavior and preferences:

```javascript
const personalityTypes = {
  sleepy: {
    preferredItems: ["rock", "stump"],
    happinessMultiplier: 1.2,
    decayRate: 0.8, // Slower decay
    coinBonus: 1.0,
  },
  playful: {
    preferredItems: ["bouncePad", "water"],
    happinessMultiplier: 1.5,
    decayRate: 1.2, // Faster decay
    coinBonus: 1.3,
  },
  shy: {
    preferredItems: ["mushroom", "stump"],
    happinessMultiplier: 1.1,
    decayRate: 1.0,
    coinBonus: 0.9,
  },
  curious: {
    preferredItems: ["water", "mushroom"],
    happinessMultiplier: 1.3,
    decayRate: 1.1,
    coinBonus: 1.1,
  },
  social: {
    preferredItems: ["stump", "bouncePad"],
    happinessMultiplier: 1.4,
    decayRate: 0.9,
    coinBonus: 1.2,
  },
};
```

### Rarity System Model

Blob rarity affects spawn rates, coin generation, and collection value:

```javascript
const raritySystem = {
  common: {
    spawnRate: 0.6,
    coinMultiplier: 1.0,
    collectionPoints: 1,
    specialEffects: false,
  },
  uncommon: {
    spawnRate: 0.25,
    coinMultiplier: 1.2,
    collectionPoints: 2,
    specialEffects: false,
  },
  rare: {
    spawnRate: 0.12,
    coinMultiplier: 1.5,
    collectionPoints: 5,
    specialEffects: true,
  },
  legendary: {
    spawnRate: 0.03,
    coinMultiplier: 2.0,
    collectionPoints: 10,
    specialEffects: true,
  },
};
```

## Error Handling

### Happiness System Error Handling

- **Invalid Happiness Values**: Clamp all happiness values to 0-100 range
- **Missing Personality Data**: Default to 'curious' personality with standard preferences
- **Calculation Errors**: Fallback to base happiness mechanics without bonuses
- **Timer Failures**: Restart happiness update timers with error logging

### Collection System Error Handling

- **localStorage Failures**: Graceful degradation to session-only storage
- **Corrupted Save Data**: Reset collection with backup recovery attempt
- **Missing Blob Data**: Reconstruct basic blob information from available data
- **Sync Errors**: Queue operations for retry on next successful save

### Offline Progress Error Handling

- **Invalid Timestamps**: Use current time as fallback for calculations
- **Excessive Offline Time**: Cap calculations to prevent overflow (max 7 days)
- **Missing Progress Data**: Provide conservative estimates based on last known state

## Testing Strategy

### Unit Testing Approach

1. **Happiness Calculations**

   - Test happiness decay over time
   - Verify interaction bonuses with different item types
   - Validate personality multiplier effects
   - Test boundary conditions (0% and 100% happiness)

2. **Collection System**

   - Test blob addition to collection at 75% happiness threshold
   - Verify persistent storage and retrieval
   - Test collection statistics calculations
   - Validate duplicate blob handling

3. **Personality System**
   - Test personality assignment and preference matching
   - Verify preferred item bonus calculations
   - Test personality-based behavior modifications

### Integration Testing Approach

1. **End-to-End Happiness Flow**

   - Spawn blob → interact with items → reach collection threshold
   - Verify visual updates throughout the process
   - Test coin generation at different happiness levels

2. **Offline Progress Integration**

   - Simulate offline periods of varying lengths
   - Verify accurate progress calculations
   - Test return summary generation and display

3. **Collection Album Integration**
   - Test collection display with various blob combinations
   - Verify statistics accuracy across game sessions
   - Test collection achievements and milestones

### Performance Testing

1. **Multiple Blob Management**

   - Test happiness updates with 10+ active blobs
   - Verify smooth visual updates and animations
   - Monitor memory usage with persistent collection data

2. **Long-term Play Sessions**
   - Test system stability over extended play periods
   - Verify localStorage performance with large collections
   - Monitor for memory leaks in happiness update cycles

## Implementation Notes

### Phaser.js Integration

The design leverages existing Phaser.js systems:

- **Scene Management**: All new systems integrate with the existing `BlobGame` scene
- **Sprite Management**: Happiness bars and effects use Phaser's graphics and particle systems
- **Timer System**: Happiness decay and coin generation use Phaser's time events
- **Input Handling**: Collection modal and blob interactions extend existing input system

### Performance Considerations

- **Happiness Updates**: Batch process all blob happiness updates in single timer event
- **Visual Effects**: Pool particle systems and graphics objects for reuse
- **Storage Operations**: Debounce localStorage writes to prevent excessive I/O
- **Animation Management**: Use Phaser's tween pooling for smooth performance

### Backward Compatibility

The enhanced system maintains compatibility with existing game features:

- Current blob spawning and movement systems remain unchanged
- Existing item placement and interaction mechanics are extended, not replaced
- Current UI elements are enhanced with additional information displays
- Save data migration handles transition from basic to enhanced system
