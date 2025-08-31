# Blob Garden - Virtual Pet Game

Blob Garden is a relaxing, idle virtual pet simulation game built with Phaser.js where players care for colorful blob creatures in an interactive garden environment.where players create a cozy isometric garden to attract and care for adorable, blob-like creatures. The core gameplay involves placing interactive items like food, water, rocks, and bounce pads to lure different blobs, observing their behaviors (such as sleeping on rocks), increasing their happiness, and collecting them in a "Your Blobs" album. The game focuses on low-pressure interaction, cuteness, and progression through happiness and collection, with no fail states or strict timers. Blobs are simple, rounded beings with unique names, colors, and animations, emphasizing care and interaction over mere visitation.

### 1.3 Genre

Casual Simulation / Collection / Idle Game / Pet Care.

### 1.4 Target Audience

- Casual gamers aged 10+ seeking relaxing, feel-good experiences.
- Fans of Neko Atsume, Tamagotchi, or garden sims like Viridi.
- Mobile and web players for quick, intermittent sessions.
- Broad appeal with cute, whimsical vibes.

### 1.5 Platforms

- Primary: HTML5 web-based, developed in Kiro.
- Cross-Platform: Playable on desktop browsers and mobile devices (iOS/Android) via web or PWA.
- Touch-optimized UI for mobile.

### 1.6 Unique Selling Points

- Isometric garden view for immersive, 3D-like placement without complexity.
- Blobs with happiness mechanics: Attract, interact, and boost happiness for rewards.
- Interactive items inspired by nature (e.g., bounce pads as bounce pads or cozy spots).
- Simple progression: Blobs generate coins when happy, funding more items.
- HTML5 accessibility for instant play.

### 1.7 Inspirations

- Neko Atsume: Attraction and idle collection loop.
- Slime Rancher: Blob aesthetics and behaviors.
- Tamagotchi: Happiness and care elements.

## 2. Gameplay Mechanics

### 2.1 Core Loop

1. **Setup Garden**: Place items (food, water, rocks, bounce pads, etc.) in the isometric garden using coins.
2. **Attract Blobs**: Blobs visit based on items, random chance, or time. Game progresses idly, even offline.
3. **Interact & Care**: Observe blobs interacting (e.g., sleeping on rocks, playing on bounce pads). Feed or add items to boost happiness.
4. **Collect & Progress**: Increase blob happiness to unlock mementos, coins, or permanent "adoption" in the "Your Blobs" section. Use coins to buy more items.
5. **Repeat**: Experiment with combinations to attract rares, max happiness, and expand the garden.

Passive elements: Blobs' happiness ticks up over time with good items; notifications for milestones on mobile.

### 2.2 Key Features

- **Blob Collection**:

  - 50+ unique blobs at launch, with single-word names (e.g., Jelly, Squish, Glow).
  - Rarity levels: Common, Uncommon, Rare, Legendary.
  - Attributes:
    - Personality (e.g., sleepy, playful) influencing behaviors.
    - Happiness %: Starts low (e.g., 0%); increases via interactions/items.
    - Preferred items (e.g., rocks for sleeping blobs).
    - Mementos: Gifts left when happy (e.g., shiny droplets for coins).
  - Behaviors: Animations like wobbling, sleeping on rocks, bouncing on bounce pad-based toys.

- **Item Placement**:

  - Shop uses coins (earned from happy blobs or visits).
  - Categories: Basics (Feed, Water), Decor/Interactive (Rock, Bounce Pad, Mushroom, Stump).
  - Costs and effects based on snapshot, with functionalities integrated from the Sample Item List for enhanced blob interactions:
    - Feed (10 coins): Attracts and feeds blobs, quick happiness boost. Functionality: Blobs gather around it to eat, similar to "Jelly Bites" – attracts basic blobs quickly and provides immediate happiness increases through feeding animations.
    - Add Bounce Pad (25 coins): Increases playful interactions, allowing blobs to bounce and play, boosting happiness for playful personalities and triggering fun behaviors like mid-air wobbles.
    - Add Rock (15 coins): Blobs can sleep here, slow but steady happiness gain. Functionality: Serves as a rest spot, akin to a simple "Cozy Nook" – prolongs visits by letting sleepy blobs nap, gradually increasing happiness over time with sleep animations (e.g., Zzz bubbles).
    - Add Water (20 coins): Hydrates blobs, attracts watery types. Functionality: Provides hydration and splash play, similar to a water-based attractant – lures wet or aquatic blobs, enables splashing interactions that refresh happiness and may leave watery mementos.
    - Add Mushroom (30 coins): Glows, lures nocturnal blobs. Functionality: Emits a soft glow, functioning like a "Glow Orb" – lures glowing/night blobs, enhances nighttime visits with luminescent interactions, and boosts happiness for shy or rare blobs through hiding/glowing behaviors.
    - Add Stump (35 coins): Cozy spot for grouping/multiple blobs. Functionality: Acts as a social hub, extending "Cozy Nook" concepts – encourages group interactions, prolongs visits for multiple blobs, and increases collective happiness through shared animations like stacking or chatting bubbles.
  - Limited garden slots (e.g., grid-based in isometric view) for strategy.
  - Bounce Pads evolve into Sample Item List style: e.g., "Bounce Pad" as a springy bounce pad, "Cozy Nook" as a leafy hideout.

- **Garden Customization**:

  - Isometric view: Top-down angled for depth, with pan/zoom.
  - Expandable: Unlock larger areas or biomes (e.g., watery pond).
  - Effects: Weather or day/night influencing blob visits.

- **Your Blobs Album & Happiness**:

  - Tracks collected blobs with stats (happiness %, visits, favorites).
  - Happiness mechanic: 0-100%; higher = more coins/mementos. Decreases if neglected.
  - Photos: Snap blobs sleeping or playing; save to gallery.

- **Progression System**:

  - Coins: Start with 100; earned from happy blobs (e.g., 5-20 per tick).
  - Levels: Garden levels up via total happiness, unlocking items.
  - Achievements: "Max Jelly's Happiness" or "Attract 10 Blobs".
  - Daily logins for bonus coins.
  - No energy; idle-friendly.

- **Offline Progression**:

  - Happiness accumulates; summary on return (e.g., "Jelly slept on the rock! +10% happiness").

- **Controls**:
  - Touch/drag for placement on mobile.
  - Click for web.
  - UI: Bottom buttons for items, top for coins/garden view.

### 2.3 Game Modes

- Main: Garden management.
- Events: Seasonal (e.g., "Bloom Fest" with Bounce Pad-focused blobs).

### 2.4 Difficulty & Balance

- Easy, relaxing pace.
- Rarity: Commons easy, rares need specific combos (e.g., mushroom + water).
- Economy: Items 10-35 coins; earnings scale with happiness (e.g., 1 coin per 10% per hour).
- Sessions: 5-10 minutes, frequent checks.

## 3. Art & Audio Design

### 3.1 Visual Style

- 2D isometric with cute, soft aesthetics (greens, pastels).
- Blobs: Small, round (e.g., white Jelly with dot eyes).
- Garden: Grassy platforms, items like bounce pads, rocky stumps.
- Animations: Squishy physics, sleep bubbles on rocks.

### 3.2 Audio

- Chill BGM: Nature sounds with soft melodies.
- SFX: Squishes, happy giggles, item plops.
- Mute option.

## 4. Technical Specifications

### 4.1 Engine & Tools

- Kiro for HTML5; Canvas for isometric rendering.
- Storage: Local for saves.
- Optimize: Low-end mobile friendly.

### 4.2 Monetization

- F2P: Rewarded ads for coins.
- IAP: Cosmetics or ad removal.

### 4.3 Development Roadmap

- Integrate snapshot features: Isometric, current items.
- Add bounce pad interactions.
- Beta: Happiness balancing.

### 4.4 Challenges

- Isometric placement logic.
- Happiness simulation offline.

## 5. Appendices

### 5.1 Sample Blob List

| Blob Name | Rarity    | Personality | Preferred Item | Behavior                                    |
| --------- | --------- | ----------- | -------------- | ------------------------------------------- |
| Jelly     | Common    | Sleepy      | Rock           | Falls asleep on rocks, slow happiness gain. |
| Bounce    | Uncommon  | Playful     | Bounce Pad     | Jumps on bounce pads.                       |
| Glow      | Rare      | Shy         | Mushroom       | Glows near mushrooms.                       |
| Splash    | Legendary | Curious     | Water          | Splashes in water, merges temporarily.      |

### 5.2 Sample Item List

| Item Name  | Cost (Coins) | Effect                                      |
| ---------- | ------------ | ------------------------------------------- |
| Feed       | 10           | Attracts and boosts happiness quickly.      |
| Bounce Pad | 25           | Interactive toy for jumping, fun behaviors. |
| Rock       | 15           | Sleep spot, steady happiness.               |
| Water      | 20           | Hydration, attracts wet blobs.              |
| Mushroom   | 30           | Lures rares, glowing interactions.          |
| Stump      | 35           | Group spot, social happiness.               |
