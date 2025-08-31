# Implementation Plan

- [x] 1. Enhance blob data structure and happiness foundation

  - Extend existing blob object with happiness properties (happiness, maxHappiness, happinessDecayRate, lastHappinessUpdate)
  - Add personality properties (personality, preferredItems, happinessMultiplier)
  - Add collection properties (isCollected, collectionDate, totalVisits, relationshipLevel)
  - Create personality type definitions with preferences and multipliers
  - _Requirements: 1.1, 5.1, 5.2_

- [x] 2. Implement core happiness calculation system

  - Create happiness update method that calculates decay based on time elapsed
  - Implement interaction bonus calculation with item preference matching
  - Add personality-based happiness multipliers to interaction bonuses
  - Create happiness boundary validation (0-100% clamping)
  - _Requirements: 1.2, 1.3, 5.3, 5.4_

- [x] 3. Create visual happiness indicators

  - Implement happiness bar graphics that display above blobs
  - Create visual feedback for happiness changes during interactions
  - _Requirements: 3.1, 3.4_

- [x] 4. Build automatic coin generation system

  - Implement coin generation timer based on blob happiness levels
  - Create floating coin animation that appears above happy blobs
  - Add coin generation rates for different happiness thresholds (40%, 70%, 90%)
  - Integrate coin generation with existing coin counter UI
  - Add visual feedback when coins are generated
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. Implement blob personality and preference system

  - Create personality assignment method for new blob spawns
  - Implement preferred item detection during blob-item interactions
  - Add personality-specific interaction bonuses for preferred items
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. Create persistent collection system with localStorage

  - Implement collection tracking for all discovered blobs
  - Create localStorage save/load methods for collection data
  - Implement collection entry with blob stats (name, rarity, highest happiness, visit count)
  - Add error handling for localStorage failures
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 7. Enhance collection album UI with detailed blob information

  - Update existing collection modal to display enhanced blob statistics
  - Add rarity color coding and visual indicators for collected blobs
  - Implement collection completion percentage calculation and display
  - Create detailed blob information panel showing personality and preferences
  - _Requirements: 4.2, 4.4, 6.3, 8.2, 8.4_

- [x] 8. Enhance visual happiness indicators

  - Add sad face icon for blobs below 25% happiness
  - Add sparkle particle effects for blobs above 75% happiness
  - Implement smooth happiness bar animation transitions
  - _Requirements: 3.2, 3.3_

- [x] 9. Update rarity system with proper percentages and effects

  - Update blob spawning to use new rarity percentages (Common 60%, Uncommon 25%, Rare 12%, Legendary 3%)
  - Add special spawn effects and sounds for rare and legendary blobs
  - Implement rarity-based coin generation multipliers
  - Add special celebration effects for legendary blob collection
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 10. Implement collection threshold system

  - Add blob to collection when happiness reaches 75% threshold instead of immediate discovery
  - Create "adoption" system for blobs that reach 95% happiness
  - Add "returning friend" indicators for previously collected blobs
  - _Requirements: 4.1, 8.2_

- [x] 11. Create offline progress calculation system

  - Implement offline time detection using timestamps
  - Calculate happiness changes that occurred during offline period
  - Compute coin generation based on blob happiness levels while offline
  - Create offline progress summary with specific blob activities
  - Add happiness decay capping to prevent complete blob loss after 24+ hours
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 12. Build offline progress summary UI

  - Create offline progress modal that displays upon game return
  - Show total coins earned and happiness changes during offline time
  - Display specific positive events (e.g., "Jelly slept peacefully on the rock!")
  - Add warnings for blobs that became unhappy and need attention
  - Implement summary dismissal and return to normal gameplay
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 13. Add enhanced blob interaction behaviors

  - Implement sleeping animation and steady happiness gain for sleepy blobs on rocks
  - Create bouncing animation and burst happiness gain for playful blobs on bounce pads
  - Add special interaction effects for shy blobs with mushrooms
  - Implement social gathering behavior for multiple blobs near stumps
  - Create water splashing effects for curious blobs
  - _Requirements: 5.4, 5.5_

- [x] 14. Enhance happiness decay and departure system

  - Update happiness decay timer to run every 30 seconds instead of every second
  - Implement personality-based decay rate variations
  - Add blob departure logic when happiness reaches 0%
  - Create visual warnings when blobs are becoming unhappy
  - _Requirements: 1.3, 1.4_

- [x] 15. Improve interaction bonus system

  - Increase interaction bonuses to 15% for preferred items vs 5% standard
  - Add direct feeding interaction that gives immediate happiness boost
  - Implement item-specific interaction animations and effects
  - _Requirements: 1.2, 5.3_

- [x] 16. Add relationship and naming enhancements
  - Implement relationship level progression based on interactions and time spent
  - Create welcome messages for returning collected blobs using their names
  - Add favorite activity tracking based on most frequent interactions
  - Increase starting happiness for blobs that have visited multiple times
  - _Requirements: 8.1, 8.3, 8.4, 8.5_
