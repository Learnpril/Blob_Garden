# Requirements Document

## Introduction

This feature enhances the Blob Garden game's core happiness and collection mechanics to create a more engaging virtual pet experience. The system will transform the basic blob interactions into a comprehensive happiness-driven progression loop where players care for individual blobs, track their well-being, and build a meaningful collection album. This addresses the gap between the current basic implementation and the full vision outlined in the Game Design Document.

## Requirements

### Requirement 1

**User Story:** As a player, I want each blob to have a detailed happiness system from 0-100%, so that I can see meaningful progress in caring for my virtual pets.

#### Acceptance Criteria

1. WHEN a blob spawns THEN the system SHALL initialize its happiness to a random value between 10-30%
2. WHEN a blob interacts with preferred items THEN the system SHALL increase happiness by 5-15% per interaction
3. WHEN time passes without interaction THEN the system SHALL decrease blob happiness by 1-2% every 30 seconds
4. WHEN blob happiness reaches 0% THEN the system SHALL make the blob leave the garden after 10 seconds
5. WHEN blob happiness reaches 100% THEN the system SHALL trigger special celebration animations and bonus coin generation

### Requirement 2

**User Story:** As a player, I want happy blobs to generate coins automatically, so that I'm rewarded for taking good care of them.

#### Acceptance Criteria

1. WHEN a blob's happiness is above 50% THEN the system SHALL generate 1 coin every 15 seconds
2. WHEN a blob's happiness is above 75% THEN the system SHALL generate 2 coins every 15 seconds
3. WHEN a blob's happiness reaches 100% THEN the system SHALL generate 5 coins every 15 seconds
4. WHEN coins are generated THEN the system SHALL display a floating coin animation above the blob
5. WHEN the player is offline THEN the system SHALL accumulate coins based on blob happiness levels and display a summary upon return

### Requirement 3

**User Story:** As a player, I want to see visual indicators of each blob's happiness level, so that I know which blobs need attention.

#### Acceptance Criteria

1. WHEN hovering over a blob THEN the system SHALL display a happiness bar showing current percentage
2. WHEN a blob's happiness is below 25% THEN the system SHALL display a sad face icon above the blob
3. WHEN a blob's happiness is above 75% THEN the system SHALL display sparkle effects around the blob
4. WHEN a blob's happiness changes THEN the system SHALL animate the happiness bar smoothly
5. WHEN multiple blobs are selected THEN the system SHALL show happiness indicators for all selected blobs

### Requirement 4

**User Story:** As a player, I want a persistent "Your Blobs" collection album that tracks all blobs I've cared for, so that I can see my progress and achievements.

#### Acceptance Criteria

1. WHEN a blob's happiness reaches 75% for the first time THEN the system SHALL add it to the player's collection album
2. WHEN viewing the collection album THEN the system SHALL display each collected blob with its name, rarity, and highest happiness achieved
3. WHEN a blob is in the collection THEN the system SHALL persist this data across game sessions using localStorage
4. WHEN a collected blob visits again THEN the system SHALL mark it as "returning friend" in the album
5. WHEN the collection album is opened THEN the system SHALL show total blobs collected and completion percentage

### Requirement 5

**User Story:** As a player, I want each blob to have unique personalities and preferences, so that caring for different blobs feels meaningful and strategic.

#### Acceptance Criteria

1. WHEN a blob spawns THEN the system SHALL assign it a personality type (Sleepy, Playful, Shy, Curious) and preferred item
2. WHEN a blob interacts with its preferred item THEN the system SHALL increase happiness by 15% instead of the standard 5%
3. WHEN a sleepy blob finds a rock THEN the system SHALL trigger sleeping animation and steady happiness gain over time
4. WHEN a playful blob finds a bounce pad THEN the system SHALL trigger bouncing animation and burst happiness gain
5. WHEN displaying blob information THEN the system SHALL show the blob's personality and preferred item type

### Requirement 6

**User Story:** As a player, I want a rarity system for blobs, so that discovering rare blobs feels special and rewarding.

#### Acceptance Criteria

1. WHEN blobs spawn THEN the system SHALL assign rarity levels: Common (60%), Uncommon (25%), Rare (12%), Legendary (3%)
2. WHEN a rare or legendary blob spawns THEN the system SHALL play special spawn effects and sounds
3. WHEN viewing a blob's information THEN the system SHALL display its rarity with appropriate color coding
4. WHEN rare blobs reach high happiness THEN the system SHALL generate more coins than common blobs
5. WHEN legendary blobs are collected THEN the system SHALL unlock special achievements and bonus rewards

### Requirement 7

**User Story:** As a player, I want to receive offline progress summaries, so that I'm motivated to return to the game regularly.

#### Acceptance Criteria

1. WHEN the player returns after being offline THEN the system SHALL calculate happiness changes and coin generation that occurred
2. WHEN displaying offline progress THEN the system SHALL show a summary popup with total coins earned and blob status changes
3. WHEN blobs were very happy offline THEN the system SHALL mention specific positive events (e.g., "Jelly slept peacefully on the rock!")
4. WHEN blobs became unhappy offline THEN the system SHALL warn about blobs that need attention
5. WHEN the offline period exceeds 24 hours THEN the system SHALL cap negative happiness decay to prevent complete blob loss

### Requirement 8

**User Story:** As a player, I want individual blob names and persistent relationships, so that I can form emotional connections with my virtual pets.

#### Acceptance Criteria

1. WHEN a blob spawns THEN the system SHALL assign it a unique single-word name from a predefined list
2. WHEN a blob is collected THEN the system SHALL track its visit history and relationship level with the player
3. WHEN a collected blob returns THEN the system SHALL display a welcome message with its name
4. WHEN viewing blob details THEN the system SHALL show visit count, total time spent, and favorite activities
5. WHEN a blob has visited multiple times THEN the system SHALL increase its starting happiness on subsequent visits
