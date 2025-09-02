class BlobGame extends Phaser.Scene {
  constructor() {
    super({ key: "BlobGame" });

    this.coins = 100;
    this.blobs = [];
    this.decorations = [];
    this.food = [];
    this.particles = null;
    this.coinDrops = [];
    this.blobCollection = {};

    this.gameWidth = 800;
    this.gameHeight = 600;
    this.margin = 60;

    // Audio context for sound effects
    this.audioContext = null;
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.backgroundMusic = null;
    this.nightMusic = null;
    this.musicStarted = false;

    // Day/Night mode system
    this.isNightMode = false;
    this.backgroundSprite = null;

    this.blobTypes = [
      {
        key: "lavenderBlob",
        name: "Lavender Blob",
        rarity: "common",
        color: 0xc8a2c8,
      },
      { key: "blueBlob", name: "Sky Blob", rarity: "common", color: 0x87ceeb },
      {
        key: "pinkBlob",
        name: "Rose Blob",
        rarity: "uncommon",
        color: 0xffb6c1,
      },
      {
        key: "purpleBlob",
        name: "Violet Blob",
        rarity: "uncommon",
        color: 0xdda0dd,
      },
      {
        key: "orangeBlob",
        name: "Peach Blob",
        rarity: "rare",
        color: 0xffdab9,
      },
      {
        key: "rainbowBlob",
        name: "Rainbow Blob",
        rarity: "legendary",
        color: 0xffb6c1,
      },
    ];

    this.decorationTypes = {
      bouncePad: {
        key: "bouncepad",
        nightKey: "bouncepad_night",
        cost: 25,
        color: 0x4caf50,
      },
      rock: { key: "rock", nightKey: "rock_night", cost: 15, color: 0x795548 },
      water: {
        key: "water",
        nightKey: "water_night",
        cost: 20,
        color: 0x2196f3,
      },
      mushroom: {
        key: "mushroom",
        nightKey: "mushroom_night",
        cost: 30,
        color: 0xff5722,
      },
      stump: {
        key: "stump",
        nightKey: "stump_night",
        cost: 35,
        color: 0x8d6e63,
      },
    };
  }

  preload() {
    // Add error handling for file loading
    this.load.on("loaderror", (file) => {
      console.error("Failed to load file:", file.src);
    });

    // Load the garden background PNGs (day and night)
    this.load.image("garden_background", "garden_background.png");
    this.load.image("garden_background_night", "garden_background_night.png");

    // Load decoration PNGs (day and night versions)
    this.load.image("rock", "rock.png");
    this.load.image("rock_night", "rock_night.png");
    this.load.image("bouncepad", "bouncepad.png");
    this.load.image("bouncepad_night", "bouncepad_night.png");
    this.load.image("water", "water.png");
    this.load.image("water_night", "water_night.png");
    this.load.image("mushroom", "mushroom.png");
    this.load.image("mushroom_night", "mushroom_night.png");
    this.load.image("stump", "stump.png");
    this.load.image("stump_night", "stump_night.png");

    // Load the blob PNGs
    this.load.image("lavenderBlob", "lavenderblob.png");
    this.load.image("pinkBlob", "pinkblob.png");
    this.load.image("orangeBlob", "orangeblob.png");
    this.load.image("blueBlob", "blueblob.png");
    this.load.image("purpleBlob", "purpleblob.png");
    this.load.image("rainbowBlob", "rainbowblob.png");

    // Background music will be loaded using HTML5 Audio instead of Phaser
    // This is more reliable for longer audio files

    try {
      this.createBlobSprites();
      // Decoration sprites are now loaded as PNG assets, no need to generate
      this.createFoodSprite();
      this.createCoinSprite();
    } catch (error) {
      console.error("Error creating sprites:", error);
    }
  }

  create() {
    try {
      this.gameWidth = this.cameras.main.width;
      this.gameHeight = this.cameras.main.height;

      // Initialize audio context for sound effects
      this.initializeAudio();

      // Initialize background music
      this.initializeBackgroundMusic();

      // Set the scene background color to dark green
      this.cameras.main.setBackgroundColor("#1c1d17");

      // Add the garden background PNG at world center
      this.createBackground();

      // Set up camera controls
      this.setupCameraControls();

      this.particles = this.add.particles(0, 0, "sparkle", {
        scale: { start: 1.0, end: 0 },
        speed: { min: 50, max: 100 },
        lifespan: 800,
        emitting: false,
      });

      this.setupEventListeners();

      // Initialize day/night button appearance
      this.updateDayNightButton();

      // Load sound preference
      this.loadSoundPreference();

      try {
        this.loadBlobCollection();
      } catch (error) {
        console.error("Error loading blob collection:", error);
        this.blobCollection = {};
      }

      // Check for offline progress
      this.checkOfflineProgress();

      // Ensure all sprites are available
      this.ensureSpritesAvailable();

      this.updateUI();

      this.time.delayedCall(6000, () => this.spawnBlob());

      this.time.addEvent({
        delay: 1000,
        callback: this.updateHappiness,
        callbackScope: this,
        loop: true,
      });

      this.time.addEvent({
        delay: 5000,
        callback: this.generatePassiveCoins,
        callbackScope: this,
        loop: true,
      });

      // Save game state every 30 seconds
      this.time.addEvent({
        delay: 30000,
        callback: this.saveBlobCollection,
        callbackScope: this,
        loop: true,
      });

      this.scheduleNextCoinDrop();
      this.scheduleHabitatEvaluation();
    } catch (error) {
      console.error("Error in create function:", error);
    }
  }

  ensureSpritesAvailable() {
    this.blobTypes.forEach((type) => {
      const pngExists = this.textures.exists(type.key);
      const fallbackExists = this.textures.exists(type.fallbackKey);

      if (!pngExists && !fallbackExists) {
        console.warn(
          `⚠️ No sprites available for ${type.key}, creating emergency sprite...`
        );

        // Create emergency sprite
        const graphics = this.add.graphics();
        graphics.fillStyle(type.color);
        graphics.fillEllipse(22, 22, 36, 28);
        graphics.fillStyle(0x000000);
        graphics.fillCircle(18, 20, 3);
        graphics.fillCircle(26, 20, 3);
        graphics.fillStyle(0xff69b4);
        graphics.fillEllipse(22, 26, 8, 4);

        const emergencyKey = `emergency_${type.key}`;
        graphics.generateTexture(emergencyKey, 44, 40);
        graphics.destroy();

        type.emergencyKey = emergencyKey;
      }
    });
  }

  createBlobSprites() {
    this.blobTypes.forEach((type) => {
      // Create fallback sprites for ALL blob types (including PNG types)
      // This ensures sprites render even if PNG files fail to load
      const graphics = this.add.graphics();

      // Main blob body
      graphics.fillStyle(type.color);
      graphics.fillEllipse(20, 20, 32, 24);

      // Shadow
      const shadowColor = this.getDarkerColor(type.color);
      graphics.fillStyle(shadowColor);
      graphics.fillEllipse(22, 22, 30, 20);

      // Highlight
      const highlightColor = this.getLighterColor(type.color);
      graphics.fillStyle(highlightColor);
      graphics.fillEllipse(18, 18, 24, 16);

      // Eyes
      graphics.fillStyle(0x000000);
      graphics.fillCircle(16, 18, 2.5);
      graphics.fillCircle(24, 18, 2.5);

      // Eye highlights
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(15.5, 17.5, 1);
      graphics.fillCircle(23.5, 17.5, 1);

      // Mouth
      graphics.fillStyle(0xff69b4);
      graphics.fillEllipse(20, 24, 6, 3);

      // Special effects for rainbow blob
      if (type.key === "rainbowBlob") {
        graphics.fillStyle(0xff9800);
        graphics.fillRect(8, 20, 24, 2);
        graphics.fillStyle(0xffeb3b);
        graphics.fillRect(8, 23, 24, 2);
        graphics.fillStyle(0x4caf50);
        graphics.fillRect(8, 26, 24, 2);
      }

      // Generate fallback texture with a different key name
      const fallbackKey = `fallback_${type.key}`;
      graphics.generateTexture(fallbackKey, 44, 40);
      graphics.destroy();

      // Store the fallback key for later use
      type.fallbackKey = fallbackKey;

      this.createUISprite(type);
    });

    const sparkle = this.add.graphics();
    sparkle.fillStyle(0xffd700);
    sparkle.fillCircle(6, 6, 4);
    sparkle.fillStyle(0xffffff);
    sparkle.fillCircle(6, 6, 2);
    sparkle.generateTexture("sparkle", 12, 12);
    sparkle.destroy();

    // Create sad face icon for unhappy blobs
    const sadFace = this.add.graphics();
    sadFace.fillStyle(0xffffff, 0.9);
    sadFace.fillCircle(8, 8, 7); // White background circle
    sadFace.fillStyle(0x333333);
    sadFace.fillCircle(6, 6, 1); // Left eye
    sadFace.fillCircle(10, 6, 1); // Right eye
    // Sad mouth (downward arc - corrected)
    sadFace.lineStyle(1, 0x333333, 1);
    sadFace.beginPath();
    sadFace.arc(8, 12, 3, Math.PI + 0.2, 2 * Math.PI - 0.2, false);
    sadFace.strokePath();
    sadFace.generateTexture("sadFace", 16, 16);
    sadFace.destroy();
  }

  createUISprite(type) {
    const uiGraphics = this.add.graphics();
    uiGraphics.fillStyle(type.color);
    uiGraphics.fillCircle(15, 12, 12);
    uiGraphics.fillRect(3, 12, 24, 12);

    uiGraphics.fillTriangle(3, 24, 8, 21, 12, 24);
    uiGraphics.fillTriangle(12, 24, 16, 21, 20, 24);
    uiGraphics.fillTriangle(20, 24, 24, 21, 27, 24);

    uiGraphics.fillStyle(0x000000);
    uiGraphics.fillCircle(11, 12, 1.5);
    uiGraphics.fillCircle(19, 12, 1.5);

    if (type.key === "rainbowBlob") {
      uiGraphics.fillStyle(0xff9800);
      uiGraphics.fillRect(6, 15, 18, 1);
      uiGraphics.fillStyle(0xffeb3b);
      uiGraphics.fillRect(6, 17, 18, 1);
      uiGraphics.fillStyle(0x4caf50);
      uiGraphics.fillRect(6, 19, 18, 1);
    }

    uiGraphics.generateTexture(type.key + "_ui", 30, 27);
    uiGraphics.destroy();
  }

  getDarkerColor(color) {
    const colorMap = {
      0xc8a2c8: 0xb19cd9, // Lavender darker
      0x87ceeb: 0x6495ed, // Sky blue darker
      0xffb6c1: 0xff91a4, // Rose darker
      0xdda0dd: 0xda70d6, // Violet darker
      0xffdab9: 0xf4a460, // Peach darker
      0xff6b6b: 0xe53935, // Rainbow (keep existing)
    };
    return colorMap[color] || color;
  }

  getLighterColor(color) {
    const colorMap = {
      0xc8a2c8: 0xe6e6fa, // Lavender lighter
      0x87ceeb: 0xadd8e6, // Sky blue lighter
      0xffb6c1: 0xffcccb, // Rose lighter
      0xdda0dd: 0xeee8ff, // Violet lighter
      0xffdab9: 0xffe4e1, // Peach lighter
      0xff6b6b: 0xff8a80, // Rainbow (keep existing)
    };
    return colorMap[color] || color;
  }

  createDecorationSprites() {
    // Decoration sprites are now loaded as PNG assets
    // No need to generate them procedurally
  }

  createFoodSprite() {
    const food = this.add.graphics();

    // Main drumstick meat - rounded orange/brown body (like in the image)
    food.fillStyle(0xcd853f); // Peru orange-brown color
    food.fillCircle(10, 14, 9); // Round meat portion

    // White bone end (fluffy part at top)
    food.fillStyle(0xffffff); // Pure white
    food.fillEllipse(10, 6, 8, 6); // Bone end - wider and flatter

    // Bone end shading/texture
    food.fillStyle(0xf5f5f5); // Light gray for bone texture
    food.fillEllipse(11, 6, 6, 4); // Slight shading on bone

    // Dark spots on the meat (like in the image)
    food.fillStyle(0x8b4513); // Dark brown spots
    food.fillCircle(8, 12, 1.5); // Left spot
    food.fillCircle(12, 16, 1.2); // Right spot
    food.fillCircle(10, 18, 1); // Bottom spot

    food.generateTexture("bug", 20, 22);
    food.destroy();
  }

  createCoinSprite() {
    const coin = this.add.graphics();

    // Black stroke outline (make it twice as big: 32 radius instead of 16)
    coin.lineStyle(4, 0x000000, 1);
    coin.strokeCircle(40, 40, 32);

    // Gold outer circle
    coin.fillStyle(0xffd700);
    coin.fillCircle(40, 40, 32);

    // Orange inner circle
    coin.fillStyle(0xffa500);
    coin.fillCircle(40, 40, 22);

    // Gold center circle
    coin.fillStyle(0xffd700);
    coin.fillCircle(40, 40, 12);

    coin.generateTexture("coin", 80, 80);
    coin.destroy();
  }

  setupCameraControls() {
    // Set camera bounds to the background image size
    this.cameras.main.setBounds(
      -this.backgroundWidth / 2,
      -this.backgroundHeight / 2,
      this.backgroundWidth,
      this.backgroundHeight
    );

    // Enable camera drag controls
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.cameraStartX = 0;
    this.cameraStartY = 0;

    // Mouse/touch drag controls
    this.isDraggingCamera = false;
    this.isDraggingObject = false;

    // Initialize pinch-to-zoom variables
    this.pinchStartDistance = 0;
    this.pinchStartZoom = 1;
    this.isPinching = false;
    this.touchPointers = new Map();

    this.input.on("pointerdown", (pointer) => {
      // Track all touch points for pinch detection
      this.touchPointers.set(pointer.id, {
        x: pointer.x,
        y: pointer.y,
        worldX: pointer.x + this.cameras.main.scrollX,
        worldY: pointer.y + this.cameras.main.scrollY,
      });

      console.log(
        "👆 Touch detected, total touches:",
        this.touchPointers.size,
        "pointer type:",
        pointer.pointerType
      );

      // Check if we have two touches for pinch gesture
      if (this.touchPointers.size === 2) {
        const pointers = Array.from(this.touchPointers.values());
        this.pinchStartDistance = this.getDistance(pointers[0], pointers[1]);
        this.pinchStartZoom = this.cameras.main.zoom;
        this.isPinching = true;

        // Disable camera dragging when pinching
        this.isDraggingCamera = false;
        this.isDraggingObject = false;

        console.log(
          "🤏 Pinch gesture started, distance:",
          this.pinchStartDistance,
          "zoom:",
          this.pinchStartZoom
        );
        return; // Don't process single-touch logic
      }

      // Don't start camera drag if we're in the middle of a pinch gesture
      if (this.isPinching || this.touchPointers.size > 1) {
        return;
      }

      // Check if we're clicking on a draggable object
      const hitObjects = this.input.hitTestPointer(pointer);
      const draggableObject = hitObjects.find(
        (obj) => obj.input && obj.input.draggable
      );

      if (draggableObject) {
        this.isDraggingObject = true;
        this.isDraggingCamera = false;
      } else {
        this.isDraggingCamera = true;
        this.isDraggingObject = false;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.cameraStartX = this.cameras.main.scrollX;
        this.cameraStartY = this.cameras.main.scrollY;
        this.hasDragged = false;
      }
    });

    this.input.on("pointermove", (pointer) => {
      // Update touch pointer position if it exists
      if (this.touchPointers.has(pointer.id)) {
        this.touchPointers.set(pointer.id, {
          x: pointer.x,
          y: pointer.y,
          worldX: pointer.x + this.cameras.main.scrollX,
          worldY: pointer.y + this.cameras.main.scrollY,
        });

        // Handle pinch zoom if we have two touches
        if (this.isPinching && this.touchPointers.size === 2) {
          const pointers = Array.from(this.touchPointers.values());
          const currentDistance = this.getDistance(pointers[0], pointers[1]);

          if (this.pinchStartDistance > 0) {
            const zoomRatio = currentDistance / this.pinchStartDistance;
            const newZoom = Phaser.Math.Clamp(
              this.pinchStartZoom * zoomRatio,
              0.3, // Allow zooming out more on mobile
              3.0 // Allow zooming in more on mobile
            );

            // Set zoom
            this.cameras.main.setZoom(newZoom);

            console.log("🔍 Pinch zoom level:", newZoom.toFixed(2));
          }
          return; // Don't process camera drag during pinch
        }
      }

      // Don't handle camera drag during pinch gestures
      if (this.isPinching || this.touchPointers.size > 1) {
        return;
      }

      if (this.isDraggingCamera && !this.isDraggingObject) {
        const deltaX = this.dragStartX - pointer.x;
        const deltaY = this.dragStartY - pointer.y;

        // Only start dragging if moved more than a few pixels
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          this.hasDragged = true;
          this.cameras.main.setScroll(
            this.cameraStartX + deltaX,
            this.cameraStartY + deltaY
          );
        }
      }
    });

    this.input.on("pointerup", (pointer) => {
      // Remove touch pointer
      this.touchPointers.delete(pointer.id);

      // End pinch gesture when we have less than 2 touches
      if (this.touchPointers.size < 2) {
        if (this.isPinching) {
          console.log("🤏 Pinch gesture ended");
        }
        this.isPinching = false;
        this.pinchStartDistance = 0;
      }

      if (this.isDraggingCamera && !this.hasDragged && !this.isDraggingObject) {
        // Convert screen coordinates to world coordinates
        const worldX = pointer.x + this.cameras.main.scrollX;
        const worldY = pointer.y + this.cameras.main.scrollY;
        this.handleCanvasClick(worldX, worldY);
      }
      this.isDraggingCamera = false;
      this.isDraggingObject = false;
      this.hasDragged = false;
    });

    // Handle touch cancel (when user touches edge of screen, etc.)
    this.input.on("pointercancel", (pointer) => {
      this.touchPointers.delete(pointer.id);
      if (this.touchPointers.size < 2) {
        this.isPinching = false;
        this.pinchStartDistance = 0;
      }
      this.isDraggingCamera = false;
      this.isDraggingObject = false;
      this.hasDragged = false;
    });

    // Mouse wheel zoom (optional)
    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Phaser.Math.Clamp(
        this.cameras.main.zoom * zoomFactor,
        0.3, // Match mobile zoom limits
        3.0 // Match mobile zoom limits
      );
      this.cameras.main.setZoom(newZoom);
      console.log("🔍 Mouse wheel zoom level:", newZoom.toFixed(2));
    });

    // Pinch-to-zoom is now integrated into the main pointer event handlers above
  }

  // Helper function to calculate distance between two points
  getDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  setupEventListeners() {
    const feedBtn = document.getElementById("feed-btn");
    const decorateBtn = document.getElementById("decorate-btn");
    const rockBtn = document.getElementById("rock-btn");
    const waterBtn = document.getElementById("water-btn");
    const mushroomBtn = document.getElementById("mushroom-btn");
    const stumpBtn = document.getElementById("stump-btn");

    if (feedBtn)
      feedBtn.addEventListener("click", () => {
        this.playButtonClickSound();
        this.placeFeed();
      });
    if (decorateBtn)
      decorateBtn.addEventListener("click", () => {
        this.playButtonClickSound();
        this.placeDecoration("bouncePad");
      });
    if (rockBtn)
      rockBtn.addEventListener("click", () => {
        this.playButtonClickSound();
        this.placeDecoration("rock");
      });
    if (waterBtn)
      waterBtn.addEventListener("click", () => {
        this.playButtonClickSound();
        this.placeDecoration("water");
      });
    if (mushroomBtn)
      mushroomBtn.addEventListener("click", () => {
        this.playButtonClickSound();
        this.placeDecoration("mushroom");
      });
    if (stumpBtn)
      stumpBtn.addEventListener("click", () => {
        this.playButtonClickSound();
        this.placeDecoration("stump");
      });

    // Collection modal functionality
    const collectionBtn = document.getElementById("collection-btn");
    const resetCollectionBtn = document.getElementById("reset-collection-btn");
    const collectionModal = document.getElementById("collection-modal");
    const closeBtn = document.querySelector(".close");

    if (collectionBtn) {
      collectionBtn.addEventListener("click", () => {
        this.playButtonClickSound();
        this.showCollectionModal();
      });
    }

    // Test offline progress button (for development)
    const testOfflineBtn = document.getElementById("test-offline-btn");
    if (testOfflineBtn) {
      testOfflineBtn.addEventListener("click", () => {
        this.playButtonClickSound();
        this.testOfflineProgress();
      });
    }

    if (resetCollectionBtn) {
      resetCollectionBtn.addEventListener("click", () => {
        this.playButtonClickSound();
        if (
          confirm(
            "Are you sure you want to reset your blob collection? This will permanently delete all collected blobs and cannot be undone."
          )
        ) {
          this.resetBlobCollection();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.hideCollectionModal());
    }

    if (collectionModal) {
      collectionModal.addEventListener("click", (e) => {
        if (e.target === collectionModal) {
          this.hideCollectionModal();
        }
      });
    }

    // Audio control buttons
    const soundToggleBtn = document.getElementById("sound-toggle-btn");
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener("click", () => {
        this.toggleSound();
      });
    }

    const musicToggleBtn = document.getElementById("music-toggle-btn");
    if (musicToggleBtn) {
      musicToggleBtn.addEventListener("click", () => {
        this.toggleVolumeSlider();
      });
    }

    // Day/Night toggle button
    const dayNightToggleBtn = document.getElementById("day-night-toggle");
    if (dayNightToggleBtn) {
      dayNightToggleBtn.addEventListener("click", () => {
        this.playButtonClickSound();
        this.toggleDayNightMode();
      });
    }

    // Click handling is now integrated into camera drag controls

    this.input.on("dragstart", (pointer, gameObject) => {
      this.isDraggingObject = true;
      this.isDraggingCamera = false;
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      // For all draggable objects, position the center of the sprite at the mouse cursor
      // Convert pointer coordinates to world coordinates
      const worldX = pointer.x + this.cameras.main.scrollX;
      const worldY = pointer.y + this.cameras.main.scrollY;

      const validatedPosition = this.validatePositionInDiamond(worldX, worldY);

      // Store old position to calculate movement delta
      const oldX = gameObject.x;
      const oldY = gameObject.y;

      gameObject.x = validatedPosition.x;
      gameObject.y = validatedPosition.y;

      // Check if this is a decoration
      const decoration = this.decorations.find((d) => d.sprite === gameObject);
      if (decoration) {
        decoration.x = validatedPosition.x;
        decoration.y = validatedPosition.y;
        // Update depth for proper layering
        gameObject.setDepth(validatedPosition.y + 500);

        // If this is a rock, move any sleeping blobs with it
        if (decoration.type === "rock") {
          this.moveSleepingBlobsWithRock(
            decoration,
            oldX,
            oldY,
            validatedPosition.x,
            validatedPosition.y
          );
        }

        // If this is a stump, move any dancing blobs with it
        if (decoration.type === "stump") {
          this.moveDancingBlobsWithStump(
            decoration,
            oldX,
            oldY,
            validatedPosition.x,
            validatedPosition.y
          );
        }

        // If this is a bounce pad, move any bouncing blobs with it
        if (decoration.type === "bouncePad") {
          this.moveBouncingBlobsWithPad(
            decoration,
            oldX,
            oldY,
            validatedPosition.x,
            validatedPosition.y
          );
        }
      }

      // Check if this is a food item
      const food = this.food.find((f) => f.sprite === gameObject);
      if (food) {
        food.x = validatedPosition.x;
        food.y = validatedPosition.y;
        // Update depth for proper layering
        gameObject.setDepth(validatedPosition.y + 100);
      }
    });

    this.input.on("dragend", (pointer, gameObject) => {
      this.isDraggingObject = false;
    });
  }

  placeFeed() {
    if (this.coins >= 10) {
      this.coins -= 10;

      const position = this.getRandomGroundPosition();
      const foodSprite = this.add.image(position.x, position.y, "bug");
      foodSprite.setScale(1.0);
      foodSprite.setInteractive();
      foodSprite.setDepth(position.y + 100); // Set depth for proper layering

      // Make food draggable
      foodSprite.setOrigin(0.5, 0.5);
      this.input.setDraggable(foodSprite);

      this.tweens.add({
        targets: foodSprite,
        scaleX: 1.8,
        scaleY: 1.8,
        duration: 200,
        yoyo: true,
        ease: "Power2",
      });

      this.food.push({
        sprite: foodSprite,
        x: position.x,
        y: position.y,
        eaten: false,
      });

      this.updateUI();
    }
  }

  placeDecoration(type) {
    const decoration = this.decorationTypes[type];

    if (this.coins >= decoration.cost) {
      this.coins -= decoration.cost;

      const position = this.getRandomGroundPosition();

      // Choose the appropriate sprite key based on day/night mode
      const spriteKey = this.isNightMode ? decoration.nightKey : decoration.key;

      const decorSprite = this.add.image(position.x, position.y, spriteKey);
      decorSprite.setInteractive();
      decorSprite.setDepth(position.y + 500); // Higher depth to ensure visibility

      // Make all decorations draggable
      decorSprite.setOrigin(0.5, 0.5);
      this.input.setDraggable(decorSprite);

      decorSprite.setScale(0);

      // Decoration PNG assets use 100% scale (no variation)
      const targetScale = 1.0;

      this.tweens.add({
        targets: decorSprite,
        scaleX: targetScale,
        scaleY: targetScale,
        duration: 500,
        ease: "Back.easeOut",
      });

      this.decorations.push({
        sprite: decorSprite,
        x: position.x,
        y: position.y,
        type: type,
        dayKey: decoration.key,
        nightKey: decoration.nightKey,
      });

      this.updateUI();

      let attractionChance = 0.4;
      if (this.blobs.length < 3) attractionChance = 0.6;
      if (this.blobs.length === 0) attractionChance = 0.8;

      if (Math.random() < attractionChance) {
        this.time.delayedCall(Phaser.Math.Between(3000, 12000), () =>
          this.spawnBlob()
        );
      }
    }
  }

  spawnBlob() {
    const rarity = this.getBlobRarity();
    const availableTypes = this.blobTypes.filter((t) => t.rarity === rarity);
    const type =
      availableTypes[Math.floor(Math.random() * availableTypes.length)];

    const position = this.findSafePosition();

    // Different scaling for PNG vs generated sprites
    let randomScale;
    let isPngAsset = false;

    // Create the main blob sprite first - try PNG first, then fallback, then emergency
    let sprite;
    let spriteSource = "unknown";

    try {
      // Try to use PNG sprite first
      if (this.textures.exists(type.key)) {
        sprite = this.add.image(position.x, position.y, type.key);
        spriteSource = "PNG";
        isPngAsset = true;
        // PNG blob assets use varied scale for visual interest
        randomScale = 0.8 + Math.random() * 0.4; // 80% to 120%
      } else if (this.textures.exists(type.fallbackKey)) {
        // Use fallback sprite if PNG failed to load
        sprite = this.add.image(position.x, position.y, type.fallbackKey);
        spriteSource = "fallback";
        isPngAsset = true;
        randomScale = 0.8 + Math.random() * 0.4; // 80% to 120%
      } else if (this.textures.exists(type.emergencyKey)) {
        // Use emergency sprite
        sprite = this.add.image(position.x, position.y, type.emergencyKey);
        spriteSource = "emergency";
        isPngAsset = true;
        randomScale = 0.8 + Math.random() * 0.4; // 80% to 120%
      } else {
        // Last resort: create a simple colored circle directly
        sprite = this.add.graphics();
        sprite.fillStyle(type.color);
        sprite.fillCircle(0, 0, 20);
        sprite.fillStyle(0x000000);
        sprite.fillCircle(-5, -5, 3);
        sprite.fillCircle(5, -5, 3);
        sprite.fillStyle(0xff69b4);
        sprite.fillEllipse(0, 5, 8, 4);
        sprite.x = position.x;
        sprite.y = position.y;
        spriteSource = "direct graphics";
        isPngAsset = false;
        // Generated sprites use smaller scale
        randomScale = 0.25 + Math.random() * 0.25; // 25% to 50%
      }
    } catch (error) {
      console.error(`Error creating sprite for ${type.key}:`, error);
      // Final emergency fallback
      sprite = this.add.graphics();
      sprite.fillStyle(type.color || 0xff69b4);
      sprite.fillCircle(0, 0, 20);
      sprite.x = position.x;
      sprite.y = position.y;
      spriteSource = "error fallback";
      isPngAsset = false;
      randomScale = 0.25 + Math.random() * 0.25; // 25% to 50%
    }

    if (sprite.setScale) sprite.setScale(randomScale);
    if (sprite.setInteractive) sprite.setInteractive();
    if (sprite.setDepth) sprite.setDepth(position.y + 1000);

    // Create shadow using graphics directly, positioned relative to sprite
    const shadowSprite = this.add.graphics();
    shadowSprite.fillStyle(0x000000, 0.375); // Black with 37.5% opacity (increased by 20%)

    // Create a consistent shadow shape that matches sprite size
    // Base shadow size that will scale with the sprite
    const baseShadowWidth = 60; // Consistent base width
    const baseShadowHeight = 25; // Consistent base height
    shadowSprite.fillEllipse(0, 0, baseShadowWidth, baseShadowHeight);

    // Position shadow with scaled offset (bigger sprites need shadows further down)
    shadowSprite.x = sprite.x - 5; // Fixed offset slightly to the left
    shadowSprite.y = sprite.y + (9 + randomScale * 7); // Moved down 15% for better grounding
    shadowSprite.setScale(randomScale); // Shadow matches blob size exactly
    shadowSprite.setDepth(100); // Above background but below blobs

    // Generate personality and use existing rarity
    const personality = this.generateBlobPersonality();

    const blob = {
      id: Date.now() + Math.random(),
      sprite: sprite,
      shadowSprite: shadowSprite,
      x: position.x,
      y: position.y,
      targetX: position.x,
      targetY: position.y,
      name: this.generateBlobName(),
      type: type.name,
      rarity: type.rarity,
      personality: personality,
      happiness: Math.random() * 30 + 20, // Start with 20-50% happiness
      maxHappiness: 100,
      speed: 0.8 + Math.random() * 0.4,
      lastFed: Date.now(),
      firstVisit: Date.now(),
      totalVisits: 1,
      timeSpent: 0,
      coinsGenerated: 0,
      behavior: "wandering",
      moveTween: null,
      originalScale: randomScale,
      happinessBar: null,
      statusIcon: null,
      sparkleEffect: null,
      preferredItems: this.getPreferredItems(personality),
    };

    this.blobs.push(blob);
    this.checkForReturningFriend(blob);

    // Add visual indicator for returning friends
    if (blob.isReturningFriend) {
      this.addReturningFriendIndicator(blob);
    }

    this.updateUI();

    // Special spawn effects for rare and legendary blobs
    if (blob.rarity === "rare") {
      // Enhanced particle effect for rare blobs
      this.particles.emitParticleAt(position.x, position.y, 20);

      // Create a purple glow effect
      const glowEffect = this.add.graphics();
      glowEffect.fillStyle(0x9c27b0, 0.3);
      glowEffect.fillCircle(position.x, position.y, 60);
      glowEffect.setDepth(position.y + 999);

      // Fade out the glow
      this.tweens.add({
        targets: glowEffect,
        alpha: 0,
        duration: 2000,
        ease: "Power2.easeOut",
        onComplete: () => glowEffect.destroy(),
      });

      // Show special text
      this.showFloatingText(
        "Rare Blob!",
        position.x,
        position.y - 60,
        0x9c27b0
      );
    } else if (blob.rarity === "legendary") {
      // Spectacular particle effect for legendary blobs
      this.particles.emitParticleAt(position.x, position.y, 50);

      // Create multiple colored glow rings
      const colors = [0xff9800, 0xffd700, 0xfff59d];
      colors.forEach((color, index) => {
        const glowRing = this.add.graphics();
        glowRing.lineStyle(4, color, 0.8);
        glowRing.strokeCircle(position.x, position.y, 30 + index * 20);
        glowRing.setDepth(position.y + 998);

        // Animate the rings expanding and fading
        this.tweens.add({
          targets: glowRing,
          alpha: 0,
          scaleX: 2,
          scaleY: 2,
          duration: 3000,
          delay: index * 200,
          ease: "Power2.easeOut",
          onComplete: () => glowRing.destroy(),
        });
      });

      // Show legendary text with golden color
      this.showFloatingText(
        "LEGENDARY BLOB!",
        position.x,
        position.y - 80,
        0xffd700
      );

      // Add screen shake effect for legendary spawns
      this.cameras.main.shake(500, 0.01);
    } else {
      // Standard particle effect for common and uncommon blobs
      this.particles.emitParticleAt(position.x, position.y, 10);
    }

    this.setNewTarget(blob);
  }

  getBlobRarity() {
    const rand = Math.random();
    if (rand < 0.6) return "common"; // 60%
    if (rand < 0.85) return "uncommon"; // 25% (0.85 - 0.6 = 0.25)
    if (rand < 0.97) return "rare"; // 12% (0.97 - 0.85 = 0.12)
    return "legendary"; // 3% (1.0 - 0.97 = 0.03)
  }

  generateBlobName() {
    const names = [
      "Blobby",
      "Squish",
      "Gooey",
      "Bouncy",
      "Wiggly",
      "Squishy",
      "Jelly",
      "Pudding",
      "Sparkle",
      "Glimmer",
      "Wobble",
      "Bubble",
      "Shimmer",
      "Ripple",
      "Twinkle",
      "Giggle",
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  generateBlobPersonality() {
    const personalities = ["sleepy", "playful", "shy", "curious", "social"];
    return personalities[Math.floor(Math.random() * personalities.length)];
  }

  getPreferredItems(personality) {
    const preferences = {
      sleepy: ["rock", "stump"],
      playful: ["bouncePad", "water"],
      shy: ["mushroom", "bouncePad"],
      curious: ["water", "mushroom"],
      social: ["stump", "bouncePad"],
    };
    return preferences[personality] || ["rock"];
  }

  getRarityColor(rarity) {
    const colors = {
      common: "#4CAF50", // Green
      uncommon: "#2196F3", // Blue
      rare: "#9C27B0", // Purple
      legendary: "#FF9800", // Orange
    };
    return colors[rarity] || colors["common"];
  }

  getRarityMultiplier(rarity) {
    const multipliers = {
      common: 1.0, // Base rate
      uncommon: 1.2, // 20% bonus
      rare: 1.5, // 50% bonus
      legendary: 2.0, // 100% bonus
    };
    return multipliers[rarity] || multipliers["common"];
  }

  addLegendaryCollectionEffects(blob) {
    // Special celebration effects for legendary blobs at high happiness
    if (Math.random() < 0.3) {
      // 30% chance per coin generation cycle
      // Create rainbow sparkle burst
      this.particles.emitParticleAt(blob.x, blob.y, 15);

      // Create golden ring effect
      const goldRing = this.add.graphics();
      goldRing.lineStyle(3, 0xffd700, 0.8);
      goldRing.strokeCircle(blob.x, blob.y, 40);
      goldRing.setDepth(blob.sprite.depth + 1);

      // Animate the ring expanding and fading
      this.tweens.add({
        targets: goldRing,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 1500,
        ease: "Power2.easeOut",
        onComplete: () => goldRing.destroy(),
      });

      // Show celebration text occasionally
      if (Math.random() < 0.5) {
        this.showFloatingText("Legendary Joy!", blob.x, blob.y - 50, 0xffd700);
      }
    }
  }

  getRandomGroundPosition() {
    // Use a medium-sized area for blob wandering - between original small area and full draggable area
    const platformCenterX = 0;
    const platformCenterY = 0;

    // Original area was 500x250, current was 60% of background
    // Use about 40% of background size to keep blobs safely on visible grass
    const platformWidth = (this.backgroundWidth || 800) * 0.4;
    const platformHeight = (this.backgroundHeight || 600) * 0.4;

    // Generate random position within rectangular bounds with extra safety margin
    const x = platformCenterX + (Math.random() - 0.5) * platformWidth * 0.8;
    const y = platformCenterY + (Math.random() - 0.5) * platformHeight * 0.8;

    return { x, y };
  }

  isPointInDiamond(x, y, centerX, centerY, width, height) {
    const dx = Math.abs(x - centerX);
    const dy = Math.abs(y - centerY);
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return dx / halfWidth + dy / halfHeight <= 1;
  }

  validatePositionInDiamond(x, y) {
    // Use the full background dimensions for dragging area
    const platformCenterX = 0;
    const platformCenterY = 0;
    // Use 95% of background size to allow dragging across most of the visible area
    const platformWidth = (this.backgroundWidth || 800) * 0.95;
    const platformHeight = (this.backgroundHeight || 600) * 0.95;

    // Use a more permissive rectangular boundary instead of strict diamond
    const halfWidth = platformWidth / 2;
    const halfHeight = platformHeight / 2;

    // Simple rectangular bounds check
    if (
      x >= platformCenterX - halfWidth &&
      x <= platformCenterX + halfWidth &&
      y >= platformCenterY - halfHeight &&
      y <= platformCenterY + halfHeight
    ) {
      return { x, y };
    }

    // If outside bounds, clamp to the nearest edge
    const clampedX = Math.max(
      platformCenterX - halfWidth,
      Math.min(platformCenterX + halfWidth, x)
    );
    const clampedY = Math.max(
      platformCenterY - halfHeight,
      Math.min(platformCenterY + halfHeight, y)
    );

    return { x: clampedX, y: clampedY };
  }

  // Check if a position would collide with other blobs
  isPositionOccupied(x, y, excludeBlob = null, minDistance = 60) {
    return this.blobs.some((otherBlob) => {
      if (otherBlob === excludeBlob) return false;
      const distance = Phaser.Math.Distance.Between(
        x,
        y,
        otherBlob.x,
        otherBlob.y
      );
      return distance < minDistance;
    });
  }

  // Find a safe position that doesn't collide with other blobs
  findSafePosition(excludeBlob = null, maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
      const position = this.getRandomGroundPosition();
      if (!this.isPositionOccupied(position.x, position.y, excludeBlob)) {
        return position;
      }
    }
    // If no safe position found, return a position far from others
    return this.findFarthestPosition(excludeBlob);
  }

  // Get the blob that is colliding with the given blob
  getCollidingBlob(blob, minDistance = 45) {
    return this.blobs.find((otherBlob) => {
      if (otherBlob === blob) return false;
      const distance = Phaser.Math.Distance.Between(
        blob.x,
        blob.y,
        otherBlob.x,
        otherBlob.y
      );
      return distance < minDistance;
    });
  }

  // Separate two colliding blobs by pushing them apart
  separateBlobs(blob1, blob2) {
    // Calculate direction vector from blob2 to blob1
    const dx = blob1.x - blob2.x;
    const dy = blob1.y - blob2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Avoid division by zero
    if (distance === 0) {
      // If blobs are exactly on top of each other, push them in random directions
      const angle = Math.random() * Math.PI * 2;
      const separationDistance = 60;

      const newPos1 = this.validatePositionInDiamond(
        blob1.x + Math.cos(angle) * separationDistance,
        blob1.y + Math.sin(angle) * separationDistance
      );
      const newPos2 = this.validatePositionInDiamond(
        blob2.x + Math.cos(angle + Math.PI) * separationDistance,
        blob2.y + Math.sin(angle + Math.PI) * separationDistance
      );

      this.moveToPosition(blob1, newPos1.x, newPos1.y);
      this.moveToPosition(blob2, newPos2.x, newPos2.y);
      return;
    }

    // Normalize direction vector
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;

    // Calculate separation distance (minimum safe distance)
    const separationDistance = 55;
    const pushDistance = (separationDistance - distance) / 2;

    // Calculate new positions
    const newPos1 = this.validatePositionInDiamond(
      blob1.x + normalizedDx * pushDistance,
      blob1.y + normalizedDy * pushDistance
    );
    const newPos2 = this.validatePositionInDiamond(
      blob2.x - normalizedDx * pushDistance,
      blob2.y - normalizedDy * pushDistance
    );

    // Move both blobs to their new positions
    this.moveToPosition(blob1, newPos1.x, newPos1.y);
    this.moveToPosition(blob2, newPos2.x, newPos2.y);
  }

  // Move a blob to a specific position with animation
  moveToPosition(blob, targetX, targetY) {
    // Stop any existing movement
    if (blob.moveTween) {
      blob.moveTween.stop();
    }

    const distance = Phaser.Math.Distance.Between(
      blob.x,
      blob.y,
      targetX,
      targetY
    );
    const duration = Math.max(500, distance * 10); // Quick separation movement

    // Determine movement direction and flip sprite accordingly
    const isMovingLeft = targetX < blob.x;
    blob.sprite.setFlipX(isMovingLeft);

    blob.moveTween = this.tweens.add({
      targets: blob.sprite,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: "Power2.easeOut",
      onUpdate: () => {
        blob.x = blob.sprite.x;
        blob.y = blob.sprite.y;

        // Move shadow with the blob
        if (blob.shadowSprite) {
          blob.shadowSprite.x = blob.sprite.x - 5;
          blob.shadowSprite.y = blob.sprite.y + (9 + blob.originalScale * 7);
        }

        // Move happiness bar with the blob smoothly
        if (blob.happinessBar && blob.happinessBar.visible) {
          const barWidth = 30;
          const barHeight = 4;
          const x = blob.x - barWidth / 2;
          const y = blob.y - (35 + blob.originalScale * 15);
          blob.happinessBar.x = x + barWidth / 2; // Center the graphics object
          blob.happinessBar.y = y + barHeight / 2; // Center the graphics object
        }

        // Move returning friend indicator with the blob
        if (blob.returningFriendIcon && blob.returningFriendIcon.active) {
          blob.returningFriendIcon.x = blob.x;
          blob.returningFriendIcon.y = blob.y - 40;
        }

        // Status icon positioning is handled in updateBlobHappinessDisplay only

        // Move sparkle effect with the blob
        if (blob.sparkleEffect) {
          blob.sparkleEffect.setPosition(blob.x, blob.y - 10);
        }
      },
      onComplete: () => {
        // After separation, wait a bit then resume normal behavior
        this.time.delayedCall(1000, () => {
          if (blob.sprite && blob.sprite.active) {
            this.setNewTarget(blob);
          }
        });
      },
    });
  }

  // Find position farthest from other blobs
  findFarthestPosition(excludeBlob = null) {
    let bestPosition = this.getRandomGroundPosition();
    let maxMinDistance = 0;

    for (let attempt = 0; attempt < 10; attempt++) {
      const testPosition = this.getRandomGroundPosition();
      let minDistanceToOthers = Infinity;

      this.blobs.forEach((otherBlob) => {
        if (otherBlob === excludeBlob) return;
        const distance = Phaser.Math.Distance.Between(
          testPosition.x,
          testPosition.y,
          otherBlob.x,
          otherBlob.y
        );
        minDistanceToOthers = Math.min(minDistanceToOthers, distance);
      });

      if (minDistanceToOthers > maxMinDistance) {
        maxMinDistance = minDistanceToOthers;
        bestPosition = testPosition;
      }
    }

    return bestPosition;
  }

  // Find a nearby rock that the blob can sleep on
  findNearbyRock(blob, maxDistance = 150) {
    let closestRock = null;
    let closestDistance = maxDistance;

    this.decorations.forEach((decoration) => {
      if (decoration.type === "rock") {
        const distance = Phaser.Math.Distance.Between(
          blob.x,
          blob.y,
          decoration.x,
          decoration.y
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestRock = decoration;
        }
      }
    });

    return closestRock;
  }

  // Check if a rock is already occupied by another blob
  isRockOccupied(rock, tolerance = 40) {
    return this.blobs.some((blob) => {
      if (blob.behavior !== "sleeping") return false;
      const distance = Phaser.Math.Distance.Between(
        blob.x,
        blob.y,
        rock.x,
        rock.y
      );
      return distance < tolerance;
    });
  }

  // Make blob jump onto a rock and sleep
  jumpOntoRock(blob, rock) {
    if (blob.moveTween) {
      blob.moveTween.stop();
    }

    blob.behavior = "jumping_to_rock";
    blob.targetRock = rock;

    // Jump animation - first jump up, then to rock position
    const jumpHeight = -30; // Negative Y for upward movement
    const midX = (blob.x + rock.x) / 2;
    const midY = (blob.y + rock.y) / 2 + jumpHeight;

    // Determine movement direction and flip sprite accordingly
    const isMovingLeft = rock.x < blob.x;
    blob.sprite.setFlipX(isMovingLeft);

    // First part of jump - up and towards rock
    blob.moveTween = this.tweens.add({
      targets: blob.sprite,
      x: midX,
      y: midY,
      duration: 400,
      ease: "Power2.easeOut",
      onUpdate: () => {
        blob.x = blob.sprite.x;
        blob.y = blob.sprite.y;
        // Keep shadow on ground during jump
        if (blob.shadowSprite) {
          blob.shadowSprite.x = blob.sprite.x - 5;
          blob.shadowSprite.y = rock.y + (9 + blob.originalScale * 7);
        }
      },
      onComplete: () => {
        // Second part of jump - land on rock
        blob.moveTween = this.tweens.add({
          targets: blob.sprite,
          x: rock.x,
          y: rock.y - 15, // Slightly above rock surface
          duration: 400,
          ease: "Power2.easeIn",
          onUpdate: () => {
            blob.x = blob.sprite.x;
            blob.y = blob.sprite.y;
            // Keep shadow on ground
            if (blob.shadowSprite) {
              blob.shadowSprite.x = rock.x - 5;
              blob.shadowSprite.y = rock.y + (9 + blob.originalScale * 7);
            }
          },
          onComplete: () => {
            this.startRockSleep(blob, rock);
          },
        });
      },
    });
  }

  // Start the sleeping phase on the rock
  startRockSleep(blob, rock) {
    blob.behavior = "sleeping";
    blob.x = rock.x;
    blob.y = rock.y - 15;

    // Store reference to the rock the blob is sleeping on
    blob.sleepingOnRock = rock;

    // Make the blob non-interactive while sleeping so clicks pass through to the rock
    blob.sprite.disableInteractive();

    // Position shadow relative to the blob on the rock (slightly to the left)
    if (blob.shadowSprite) {
      blob.shadowSprite.x = blob.sprite.x - 5; // Slightly to the left for rock sleeping
      blob.shadowSprite.y = blob.sprite.y + (9 + blob.originalScale * 7); // Scaled vertical offset

      // Fix depth sorting: rock < shadow < blob
      blob.shadowSprite.setDepth(rock.y + 600); // Above rock (500) but below blob
      blob.sprite.setDepth(rock.y + 700); // Above shadow
    }

    // Add sleeping visual effect (gentle bobbing)
    this.tweens.add({
      targets: blob.sprite,
      scaleY: blob.originalScale * 0.9,
      duration: 2000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: 9, // 20 seconds total (2s * 10 cycles)
    });

    // Sleep for 20 seconds then jump off
    this.time.delayedCall(20000, () => {
      if (blob.sprite && blob.sprite.active && blob.behavior === "sleeping") {
        this.jumpOffRock(blob, rock);
      }
    });
  }

  // Make blob jump off the rock
  jumpOffRock(blob, rock) {
    blob.behavior = "jumping_off_rock";

    // Clear the rock reference since blob is no longer sleeping on it
    blob.sleepingOnRock = null;

    // Re-enable blob interactivity now that it's no longer sleeping
    blob.sprite.setInteractive();

    // Find a safe landing position near the rock
    let landingPosition = this.findSafePosition(blob);

    // Try to land on the opposite side of where they came from
    const angle = Math.random() * Math.PI * 2;
    const landingDistance = 80;
    const preferredX = rock.x + Math.cos(angle) * landingDistance;
    const preferredY = rock.y + Math.sin(angle) * landingDistance;

    const validatedLanding = this.validatePositionInDiamond(
      preferredX,
      preferredY
    );
    if (
      !this.isPositionOccupied(validatedLanding.x, validatedLanding.y, blob)
    ) {
      landingPosition = validatedLanding;
    }

    // Jump animation - up first, then down to landing
    const jumpHeight = -40;
    const midX = (rock.x + landingPosition.x) / 2;
    const midY = (rock.y + landingPosition.y) / 2 + jumpHeight;

    // Determine movement direction and flip sprite accordingly
    const isMovingLeft = landingPosition.x < rock.x;
    blob.sprite.setFlipX(isMovingLeft);

    // First part of jump - up and away from rock
    blob.moveTween = this.tweens.add({
      targets: blob.sprite,
      x: midX,
      y: midY,
      duration: 500,
      ease: "Power2.easeOut",
      onUpdate: () => {
        blob.x = blob.sprite.x;
        blob.y = blob.sprite.y;
        // Move shadow towards landing position
        if (blob.shadowSprite) {
          const progress = blob.moveTween.progress;
          blob.shadowSprite.x =
            rock.x + (landingPosition.x - rock.x) * progress - 5;
          blob.shadowSprite.y =
            rock.y +
            (9 + blob.originalScale * 7) +
            (landingPosition.y - rock.y) * progress;
        }
      },
      onComplete: () => {
        // Second part of jump - land on ground
        blob.moveTween = this.tweens.add({
          targets: blob.sprite,
          x: landingPosition.x,
          y: landingPosition.y,
          duration: 500,
          ease: "Power2.easeIn",
          onUpdate: () => {
            blob.x = blob.sprite.x;
            blob.y = blob.sprite.y;
            // Shadow follows to final position
            if (blob.shadowSprite) {
              blob.shadowSprite.x = blob.sprite.x - 5;
              blob.shadowSprite.y =
                blob.sprite.y + (9 + blob.originalScale * 7);
            }
          },
          onComplete: () => {
            // Reset blob to normal wandering behavior
            blob.behavior = "wandering";
            blob.targetRock = null;

            // Reset depth sorting to normal ground levels
            if (blob.shadowSprite) {
              blob.shadowSprite.setDepth(100); // Back to normal shadow depth
              blob.sprite.setDepth(blob.y + 1000); // Back to normal blob depth
            }

            // Resume normal movement after a short delay
            this.time.delayedCall(1000, () => {
              if (blob.sprite && blob.sprite.active) {
                this.setNewTarget(blob);
              }
            });
          },
        });
      },
    });
  }

  // Move sleeping blobs when their rock is dragged
  moveSleepingBlobsWithRock(rock, oldRockX, oldRockY, newRockX, newRockY) {
    // Find all blobs sleeping on this rock
    const sleepingBlobs = this.blobs.filter(
      (blob) => blob.behavior === "sleeping" && blob.sleepingOnRock === rock
    );

    sleepingBlobs.forEach((blob) => {
      // Move the blob with the rock
      blob.x = newRockX;
      blob.y = newRockY - 15; // Maintain the offset above the rock
      blob.sprite.x = blob.x;
      blob.sprite.y = blob.y;

      // Move the shadow with the blob
      if (blob.shadowSprite) {
        blob.shadowSprite.x = blob.sprite.x - 5;
        blob.shadowSprite.y = blob.sprite.y + (9 + blob.originalScale * 7);

        // Update shadow depth to match new rock position
        blob.shadowSprite.setDepth(newRockY + 600);
        blob.sprite.setDepth(newRockY + 700);
      }

      // Update any active tweens to use the new position
      if (blob.sprite.scene && blob.sprite.scene.tweens) {
        // Stop current bobbing tween and restart it at new position
        blob.sprite.scene.tweens.killTweensOf(blob.sprite);

        // Restart the sleeping animation at the new position
        this.tweens.add({
          targets: blob.sprite,
          scaleY: blob.originalScale * 0.9,
          duration: 2000,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: 9, // Continue the remaining sleep cycles
        });
      }
    });
  }

  // Move dancing blobs when their stump is dragged
  moveDancingBlobsWithStump(stump, oldStumpX, oldStumpY, newStumpX, newStumpY) {
    // Find all blobs dancing on this stump
    const dancingBlobs = this.blobs.filter(
      (blob) => blob.behavior === "dancing" && blob.dancingOnStump === stump
    );

    dancingBlobs.forEach((blob) => {
      // Calculate the offset from old stump position
      const offsetX = blob.x - oldStumpX;
      const offsetY = blob.y - oldStumpY;

      // Move blob to maintain relative position to stump
      blob.x = newStumpX + offsetX;
      blob.y = newStumpY + offsetY;
      blob.sprite.x = blob.x;
      blob.sprite.y = blob.y;

      // Move shadow with blob
      if (blob.shadowSprite) {
        blob.shadowSprite.x = blob.x - 5;
        blob.shadowSprite.y = blob.y + 5;

        // Update shadow depth to match new stump position
        blob.shadowSprite.setDepth(newStumpY + 600);
        blob.sprite.setDepth(newStumpY + 700);
      }

      // Update any active dancing tweens to use the new position
      if (blob.sprite.scene && blob.sprite.scene.tweens) {
        // Stop current dancing tween and restart it at new position
        blob.sprite.scene.tweens.killTweensOf(blob.sprite);

        // Restart the dancing animation at the new position
        const danceDistance = 15;
        this.tweens.add({
          targets: blob.sprite,
          x: newStumpX - danceDistance,
          duration: 500,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
          onYoyo: () => {
            this.tweens.add({
              targets: blob.sprite,
              scaleY: blob.originalScale * 1.1,
              duration: 100,
              yoyo: true,
              ease: "Power2.easeOut",
            });
          },
          onRepeat: () => {
            const currentTarget =
              blob.sprite.x < newStumpX
                ? newStumpX + danceDistance
                : newStumpX - danceDistance;
            this.tweens.add({
              targets: blob.sprite,
              x: currentTarget,
              duration: 500,
              ease: "Sine.easeInOut",
            });
          },
        });
      }
    });
  }

  // Move bouncing blobs when their bounce pad is dragged
  moveBouncingBlobsWithPad(bouncePad, oldPadX, oldPadY, newPadX, newPadY) {
    // Find all blobs bouncing on this bounce pad
    const bouncingBlobs = this.blobs.filter(
      (blob) => blob.behavior === "bouncing" && blob.bouncingOnPad === bouncePad
    );

    bouncingBlobs.forEach((blob) => {
      // Calculate the offset from old bounce pad position
      const offsetX = blob.x - oldPadX;
      const offsetY = blob.y - oldPadY;

      // Move blob to maintain relative position to bounce pad
      blob.x = newPadX + offsetX;
      blob.y = newPadY + offsetY;
      blob.sprite.x = blob.x;
      blob.sprite.y = blob.y;

      // Move shadow with blob
      if (blob.shadowSprite) {
        blob.shadowSprite.x = blob.x - 5;
        blob.shadowSprite.y = blob.y + 5;

        // Update shadow depth to match new bounce pad position
        blob.shadowSprite.setDepth(newPadY + 600);
        blob.sprite.setDepth(newPadY + 700);
      }

      // Update any active bouncing tweens to use the new position
      if (blob.sprite.scene && blob.sprite.scene.tweens) {
        // Stop current bouncing tween and restart it at new position
        blob.sprite.scene.tweens.killTweensOf(blob.sprite);

        // Restart the bouncing animation at the new position
        const bounceHeight = 30;
        this.tweens.add({
          targets: blob.sprite,
          y: newPadY - 10 - bounceHeight,
          scaleX: blob.originalScale * 0.9,
          scaleY: blob.originalScale * 1.2,
          duration: 400,
          ease: "Power2.easeOut",
          yoyo: true,
          repeat: -1,
          onYoyo: () => {
            this.tweens.add({
              targets: blob.sprite,
              scaleX: blob.originalScale * 1.1,
              scaleY: blob.originalScale * 0.8,
              duration: 100,
              yoyo: true,
              ease: "Power2.easeOut",
            });
          },
          onRepeat: () => {
            this.tweens.add({
              targets: blob.sprite,
              scaleX: blob.originalScale * 0.9,
              scaleY: blob.originalScale * 1.2,
              duration: 100,
              ease: "Power2.easeOut",
            });
          },
        });
      }
    });
  }

  // Stump dancing functions
  findNearbyStump(blob) {
    const stumps = this.decorations.filter((d) => d.type === "stump");
    let closestStump = null;
    let closestDistance = Infinity;

    stumps.forEach((stump) => {
      const distance = Phaser.Math.Distance.Between(
        blob.x,
        blob.y,
        stump.x,
        stump.y
      );
      if (distance < 150 && distance < closestDistance) {
        closestDistance = distance;
        closestStump = stump;
      }
    });

    return closestStump;
  }

  isStumpOccupied(stump, tolerance = 40) {
    return this.blobs.some((blob) => {
      if (blob.behavior !== "dancing") return false;
      const distance = Phaser.Math.Distance.Between(
        blob.x,
        blob.y,
        stump.x,
        stump.y
      );
      return distance < tolerance;
    });
  }

  jumpOntoStump(blob, stump) {
    if (blob.moveTween) {
      blob.moveTween.stop();
    }

    blob.behavior = "jumping_to_stump";
    blob.targetStump = stump;

    // Jump animation to the stump
    this.tweens.add({
      targets: blob.sprite,
      x: stump.x,
      y: stump.y - 20, // Position on top of stump
      scaleX: blob.originalScale * 1.2,
      scaleY: blob.originalScale * 0.8,
      duration: 800,
      ease: "Power2.easeOut",
      onComplete: () => {
        this.startStumpDance(blob, stump);
      },
    });

    // Move shadow to stump position
    if (blob.shadowSprite) {
      this.tweens.add({
        targets: blob.shadowSprite,
        x: stump.x - 5,
        y: stump.y + 5,
        duration: 800,
        ease: "Power2.easeOut",
      });
    }
  }

  startStumpDance(blob, stump) {
    blob.behavior = "dancing";
    blob.x = stump.x;
    blob.y = stump.y - 20;

    // Store reference to the stump the blob is dancing on
    blob.dancingOnStump = stump;

    // Make the blob non-interactive while dancing
    blob.sprite.disableInteractive();

    // Create dancing animation - side to side movement
    const danceDistance = 15;
    this.tweens.add({
      targets: blob.sprite,
      x: stump.x - danceDistance,
      duration: 500,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1, // Infinite repeat
      onYoyo: () => {
        // Add a little bounce on each direction change
        this.tweens.add({
          targets: blob.sprite,
          scaleY: blob.originalScale * 1.1,
          duration: 100,
          yoyo: true,
          ease: "Power2.easeOut",
        });
      },
      onRepeat: () => {
        // Alternate between left and right
        const currentTarget =
          blob.sprite.x < stump.x
            ? stump.x + danceDistance
            : stump.x - danceDistance;
        this.tweens.add({
          targets: blob.sprite,
          x: currentTarget,
          duration: 500,
          ease: "Sine.easeInOut",
        });
      },
    });

    // Add floating musical notes effect
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (blob.behavior === "dancing") {
          this.addMusicalNote(blob.x, blob.y - 30);
        }
      },
      repeat: 19, // 20 seconds of notes
      callbackScope: this,
    });

    // Dance for 20 seconds then jump off
    this.time.delayedCall(20000, () => {
      if (blob.sprite && blob.sprite.active && blob.behavior === "dancing") {
        this.jumpOffStump(blob, stump);
      }
    });
  }

  jumpOffStump(blob, stump) {
    blob.behavior = "jumping_off_stump";

    // Clear the stump reference
    blob.dancingOnStump = null;

    // Re-enable blob interactivity
    blob.sprite.setInteractive();

    // Stop all dancing tweens
    this.tweens.killTweensOf(blob.sprite);

    // Add 20% happiness for dancing
    const happinessGain = 20;
    blob.happiness = Math.min(
      blob.maxHappiness,
      blob.happiness + happinessGain
    );

    // Show happiness gain text
    this.showFloatingText(
      `+${happinessGain}% Happy!`,
      blob.x,
      blob.y - 40,
      0x4caf50
    );

    // Jump off animation
    const jumpTarget = this.findSafePosition(blob);
    this.tweens.add({
      targets: blob.sprite,
      x: jumpTarget.x,
      y: jumpTarget.y,
      scaleX: blob.originalScale * 1.3,
      scaleY: blob.originalScale * 0.7,
      duration: 600,
      ease: "Power2.easeOut",
      onUpdate: () => {
        // Update blob position for collision detection
        blob.x = blob.sprite.x;
        blob.y = blob.sprite.y;
      },
      onComplete: () => {
        // Reset blob to normal wandering behavior
        blob.behavior = "wandering";
        blob.targetStump = null;

        // Reset scale
        blob.sprite.scaleX = blob.originalScale;
        blob.sprite.scaleY = blob.originalScale;

        // Update depth based on new position
        blob.sprite.setDepth(blob.y + 1000);
      },
    });

    // Move shadow with jump
    if (blob.shadowSprite) {
      this.tweens.add({
        targets: blob.shadowSprite,
        x: jumpTarget.x - 5,
        y: jumpTarget.y + 9,
        duration: 600,
        ease: "Power2.easeOut",
        onComplete: () => {
          blob.shadowSprite.setDepth(100);
        },
      });
    }
  }

  addMusicalNote(x, y) {
    // Create a simple musical note graphic
    const note = this.add.graphics();
    note.fillStyle(0x4caf50, 0.8);
    note.fillCircle(0, 0, 3);
    note.fillRect(-1, -8, 2, 8);
    note.x = x + (Math.random() - 0.5) * 20;
    note.y = y;
    note.setDepth(2000);

    // Animate note floating up and fading
    this.tweens.add({
      targets: note,
      y: y - 40,
      alpha: 0,
      duration: 2000,
      ease: "Power2.easeOut",
      onComplete: () => note.destroy(),
    });
  }

  // Bounce pad bouncing functions
  findNearbyBouncePad(blob) {
    const bouncePads = this.decorations.filter((d) => d.type === "bouncePad");
    let closestBouncePad = null;
    let closestDistance = Infinity;

    bouncePads.forEach((bouncePad) => {
      const distance = Phaser.Math.Distance.Between(
        blob.x,
        blob.y,
        bouncePad.x,
        bouncePad.y
      );
      if (distance < 150 && distance < closestDistance) {
        closestDistance = distance;
        closestBouncePad = bouncePad;
      }
    });

    return closestBouncePad;
  }

  isBouncePadOccupied(bouncePad, tolerance = 40) {
    return this.blobs.some((blob) => {
      if (blob.behavior !== "bouncing") return false;
      const distance = Phaser.Math.Distance.Between(
        blob.x,
        blob.y,
        bouncePad.x,
        bouncePad.y
      );
      return distance < tolerance;
    });
  }

  jumpOntoBouncePad(blob, bouncePad) {
    if (blob.moveTween) {
      blob.moveTween.stop();
    }

    blob.behavior = "jumping_to_bouncepad";
    blob.targetBouncePad = bouncePad;

    // Jump animation to the bounce pad
    this.tweens.add({
      targets: blob.sprite,
      x: bouncePad.x,
      y: bouncePad.y - 10, // Position on top of bounce pad
      scaleX: blob.originalScale * 1.2,
      scaleY: blob.originalScale * 0.8,
      duration: 800,
      ease: "Power2.easeOut",
      onComplete: () => {
        this.startBouncePadBouncing(blob, bouncePad);
      },
    });

    // Move shadow to bounce pad position
    if (blob.shadowSprite) {
      this.tweens.add({
        targets: blob.shadowSprite,
        x: bouncePad.x - 5,
        y: bouncePad.y + 5,
        duration: 800,
        ease: "Power2.easeOut",
      });
    }
  }

  startBouncePadBouncing(blob, bouncePad) {
    blob.behavior = "bouncing";
    blob.x = bouncePad.x;
    blob.y = bouncePad.y - 10;

    // Store reference to the bounce pad the blob is bouncing on
    blob.bouncingOnPad = bouncePad;

    // Make the blob non-interactive while bouncing
    blob.sprite.disableInteractive();

    // Create bouncing animation - up and down movement
    const bounceHeight = 30;
    this.tweens.add({
      targets: blob.sprite,
      y: bouncePad.y - 10 - bounceHeight,
      scaleX: blob.originalScale * 0.9,
      scaleY: blob.originalScale * 1.2,
      duration: 400,
      ease: "Power2.easeOut",
      yoyo: true,
      repeat: -1, // Infinite repeat
      onYoyo: () => {
        // Squash effect when landing
        this.tweens.add({
          targets: blob.sprite,
          scaleX: blob.originalScale * 1.1,
          scaleY: blob.originalScale * 0.8,
          duration: 100,
          yoyo: true,
          ease: "Power2.easeOut",
        });
      },
      onRepeat: () => {
        // Stretch effect when bouncing up
        this.tweens.add({
          targets: blob.sprite,
          scaleX: blob.originalScale * 0.9,
          scaleY: blob.originalScale * 1.2,
          duration: 100,
          ease: "Power2.easeOut",
        });
      },
    });

    // Add bouncing sound effects periodically
    this.time.addEvent({
      delay: 800, // Match bounce timing
      callback: () => {
        if (blob.behavior === "bouncing") {
          this.playBounceSound();
        }
      },
      repeat: 24, // 20 seconds of bouncing
      callbackScope: this,
    });

    // Bounce for 20 seconds then jump off
    this.time.delayedCall(20000, () => {
      if (blob.sprite && blob.sprite.active && blob.behavior === "bouncing") {
        this.jumpOffBouncePad(blob, bouncePad);
      }
    });
  }

  jumpOffBouncePad(blob, bouncePad) {
    blob.behavior = "jumping_off_bouncepad";

    // Clear the bounce pad reference
    blob.bouncingOnPad = null;

    // Re-enable blob interactivity
    blob.sprite.setInteractive();

    // Stop all bouncing tweens
    this.tweens.killTweensOf(blob.sprite);

    // Add 20% happiness for bouncing
    const happinessGain = 20;
    blob.happiness = Math.min(
      blob.maxHappiness,
      blob.happiness + happinessGain
    );

    // Show happiness gain text
    this.showFloatingText(
      `+${happinessGain}% Happy!`,
      blob.x,
      blob.y - 40,
      0x4caf50
    );

    // Jump off animation with extra bounce
    const jumpTarget = this.findSafePosition(blob);
    this.tweens.add({
      targets: blob.sprite,
      x: jumpTarget.x,
      y: jumpTarget.y,
      scaleX: blob.originalScale * 1.4,
      scaleY: blob.originalScale * 0.6,
      duration: 600,
      ease: "Bounce.easeOut",
      onUpdate: () => {
        // Update blob position for collision detection
        blob.x = blob.sprite.x;
        blob.y = blob.sprite.y;
      },
      onComplete: () => {
        // Reset blob to normal wandering behavior
        blob.behavior = "wandering";
        blob.targetBouncePad = null;

        // Reset scale
        blob.sprite.scaleX = blob.originalScale;
        blob.sprite.scaleY = blob.originalScale;

        // Update depth based on new position
        blob.sprite.setDepth(blob.y + 1000);
      },
    });

    // Move shadow with jump
    if (blob.shadowSprite) {
      this.tweens.add({
        targets: blob.shadowSprite,
        x: jumpTarget.x - 5,
        y: jumpTarget.y + 9,
        duration: 600,
        ease: "Bounce.easeOut",
        onComplete: () => {
          blob.shadowSprite.setDepth(100);
        },
      });
    }
  }

  playBounceSound() {
    // Simple bounce sound effect using Web Audio API
    if (this.audioContext && this.soundEnabled) {
      try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          200,
          this.audioContext.currentTime + 0.1
        );

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + 0.1
        );

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
      } catch (error) {
        // Silently fail if audio context issues
      }
    }
  }

  setNewTarget(blob) {
    if (
      blob.behavior === "sleeping" ||
      blob.behavior === "dancing" ||
      blob.behavior === "bouncing"
    )
      return;

    // Check if blob should try to sleep on a rock (20% chance)
    if (Math.random() < 0.2) {
      const nearbyRock = this.findNearbyRock(blob);
      if (nearbyRock && !this.isRockOccupied(nearbyRock)) {
        this.jumpOntoRock(blob, nearbyRock);
        return;
      }
    }

    // Check if blob should try to dance on a stump (15% chance)
    if (Math.random() < 0.15) {
      const nearbyStump = this.findNearbyStump(blob);
      if (nearbyStump && !this.isStumpOccupied(nearbyStump)) {
        this.jumpOntoStump(blob, nearbyStump);
        return;
      }
    }

    // Check if blob should try to bounce on a bounce pad (18% chance)
    if (Math.random() < 0.18) {
      const nearbyBouncePad = this.findNearbyBouncePad(blob);
      if (nearbyBouncePad && !this.isBouncePadOccupied(nearbyBouncePad)) {
        this.jumpOntoBouncePad(blob, nearbyBouncePad);
        return;
      }
    }

    const position = this.findSafePosition(blob);
    blob.targetX = position.x;
    blob.targetY = position.y;
    blob.behavior = "wandering";

    if (blob.moveTween) {
      blob.moveTween.stop();
    }

    const validatedTarget = this.validatePositionInDiamond(
      blob.targetX,
      blob.targetY
    );
    blob.targetX = validatedTarget.x;
    blob.targetY = validatedTarget.y;

    const distance = Phaser.Math.Distance.Between(
      blob.x,
      blob.y,
      blob.targetX,
      blob.targetY
    );
    const duration = Math.max(2000, (distance / blob.speed) * 50);

    this.tweens.add({
      targets: blob.sprite,
      scaleX: blob.originalScale * 1.05,
      scaleY: blob.originalScale * 1.1,
      duration: 600,
      yoyo: true,
      repeat: Math.floor(duration / 1200),
      ease: "Bounce.easeOut",
    });

    // Animate shadow during movement
    if (blob.shadowSprite) {
      this.tweens.add({
        targets: blob.shadowSprite,
        scaleX: blob.originalScale * 1.02,
        scaleY: blob.originalScale * 1.05,
        duration: 600,
        yoyo: true,
        repeat: Math.floor(duration / 1200),
        ease: "Bounce.easeOut",
      });
    }

    // Determine movement direction and flip sprite accordingly
    const isMovingLeft = blob.targetX < blob.x;
    blob.sprite.setFlipX(isMovingLeft);

    blob.moveTween = this.tweens.add({
      targets: blob.sprite,
      x: blob.targetX,
      y: blob.targetY,
      duration: duration,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        blob.x = blob.sprite.x;
        blob.y = blob.sprite.y;

        // Check for collisions with other blobs during movement
        const collidingBlob = this.getCollidingBlob(blob, 45);
        if (collidingBlob) {
          // Stop current movement and separate the blobs
          blob.moveTween.stop();
          this.separateBlobs(blob, collidingBlob);
          return;
        }

        // Move shadow with the blob
        if (blob.shadowSprite) {
          blob.shadowSprite.x = blob.sprite.x - 5;
          blob.shadowSprite.y = blob.sprite.y + (9 + blob.originalScale * 7); // Scaled distance for natural grounding effect
        }

        // Move returning friend indicator with the blob
        if (blob.returningFriendIcon && blob.returningFriendIcon.active) {
          blob.returningFriendIcon.x = blob.x;
          blob.returningFriendIcon.y = blob.y - 40;
        }
      },
      onComplete: () => {
        this.time.delayedCall(Phaser.Math.Between(2000, 5000), () => {
          if (blob.sprite && blob.sprite.active) {
            this.setNewTarget(blob);
          }
        });
      },
    });
  }

  handleCanvasClick(x, y) {
    try {
      let coinCollected = false;

      for (let i = this.coinDrops.length - 1; i >= 0; i--) {
        const coinDrop = this.coinDrops[i];
        if (!coinDrop.collected) {
          // Use sprite's actual position instead of stored coordinates (for animated coins)
          const distance = Phaser.Math.Distance.Between(
            x,
            y,
            coinDrop.sprite.x,
            coinDrop.sprite.y
          );

          if (distance < 40) {
            // Increased click radius for easier clicking
            coinDrop.collected = true;
            coinCollected = true;

            this.coins += coinDrop.value;
            this.playCoinSound(); // Play coin collection sound
            this.particles.emitParticleAt(coinDrop.x, coinDrop.y, 8);
            this.showFloatingText(
              `+${coinDrop.value}`,
              coinDrop.x,
              coinDrop.y - 20,
              0xffd700
            );

            this.tweens.add({
              targets: coinDrop.sprite,
              scaleX: 2,
              scaleY: 2,
              alpha: 0,
              duration: 300,
              ease: "Power2",
              onComplete: () => {
                if (coinDrop.sprite) {
                  coinDrop.sprite.destroy();
                }
                const coinIndex = this.coinDrops.indexOf(coinDrop);
                if (coinIndex > -1) {
                  this.coinDrops.splice(coinIndex, 1);
                }
              },
            });

            this.updateUI();
            break;
          }
        }
      }

      if (!coinCollected) {
        this.blobs.forEach((blob) => {
          const distance = Phaser.Math.Distance.Between(x, y, blob.x, blob.y);

          if (distance < 30) {
            this.tweens.add({
              targets: blob.sprite,
              scaleX: blob.originalScale * 1.6,
              scaleY: blob.originalScale * 0.6,
              duration: 120,
              yoyo: true,
              ease: "Power2",
              onComplete: () => {
                blob.sprite.scaleX = blob.originalScale;
                blob.sprite.scaleY = blob.originalScale;
              },
            });

            // Animate shadow during blob interaction
            if (blob.shadowSprite) {
              this.tweens.add({
                targets: blob.shadowSprite,
                scaleX: blob.originalScale * 1.4,
                scaleY: blob.originalScale * 0.8,
                duration: 120,
                yoyo: true,
                ease: "Power2",
                onComplete: () => {
                  blob.shadowSprite.scaleX = blob.originalScale;
                  blob.shadowSprite.scaleY = blob.originalScale;
                },
              });
            }

            this.particles.emitParticleAt(blob.x, blob.y - 20, 2);
            this.playBlobInteractionSound(); // Play blob interaction sound
          }
        });
      }
    } catch (error) {
      console.error("Error in handleCanvasClick:", error);
    }
  }

  update() {
    this.blobs.forEach((blob) => {
      for (let i = this.food.length - 1; i >= 0; i--) {
        const food = this.food[i];
        if (!food.eaten) {
          const distance = Phaser.Math.Distance.Between(
            blob.x,
            blob.y,
            food.x,
            food.y
          );

          if (distance < 40) {
            food.eaten = true;
            const previousHappiness = blob.happiness;
            blob.happiness = Math.min(100, blob.happiness + 25);
            blob.lastFed = Date.now();
            this.playBlobFeedSound(); // Play feeding sound effect

            // Add to collection immediately when discovered
            this.addBlobToCollection(blob);
            this.coins += 3;
            this.playCoinSound(); // Play coin sound for discovery bonus

            this.tweens.add({
              targets: food.sprite,
              scaleX: 0,
              scaleY: 0,
              alpha: 0,
              duration: 300,
              onComplete: () => {
                if (food.sprite) {
                  food.sprite.destroy();
                }
                const foodIndex = this.food.indexOf(food);
                if (foodIndex > -1) {
                  this.food.splice(foodIndex, 1);
                }
              },
            });

            this.tweens.add({
              targets: blob.sprite,
              scaleX: blob.originalScale * 1.3,
              scaleY: blob.originalScale * 1.3,
              duration: 300,
              yoyo: true,
              repeat: 1,
              ease: "Bounce.easeOut",
              onComplete: () => {
                blob.sprite.scaleX = blob.originalScale;
                blob.sprite.scaleY = blob.originalScale;
              },
            });

            // Animate shadow during feeding
            if (blob.shadowSprite) {
              this.tweens.add({
                targets: blob.shadowSprite,
                scaleX: blob.originalScale * 1.2,
                scaleY: blob.originalScale * 1.2,
                duration: 300,
                yoyo: true,
                repeat: 1,
                ease: "Bounce.easeOut",
                onComplete: () => {
                  blob.shadowSprite.scaleX = blob.originalScale * 0.8;
                  blob.shadowSprite.scaleY = blob.originalScale * 0.8;
                },
              });
            }

            this.particles.emitParticleAt(blob.x, blob.y, 5);
            this.showFloatingText("Yum!", blob.x, blob.y - 40, 0xffd700);

            this.time.delayedCall(Phaser.Math.Between(8000, 15000), () => {
              if (blob.sprite && blob.sprite.active) {
                this.setNewTarget(blob);
              }
            });
          }
        }
      }
    });
  }

  updateHappiness() {
    this.blobs.forEach((blob) => {
      // Happiness decay rate based on time since last interaction
      const timeSinceLastFed = Date.now() - blob.lastFed;
      const hoursWithoutFood = timeSinceLastFed / (1000 * 60 * 60);

      // Base decay rate: 0.3% per second, increases if not fed for a while
      let decayRate = 0.3;
      if (hoursWithoutFood > 1) decayRate = 0.5; // Faster decay if hungry
      if (hoursWithoutFood > 3) decayRate = 0.8; // Even faster if very hungry

      // Store previous happiness to detect threshold crossing
      const previousHappiness = blob.happiness;

      // Apply happiness decay
      blob.happiness = Math.max(0, blob.happiness - decayRate);

      // Bonus happiness from preferred items nearby
      this.applyItemHappinessBonus(blob);

      // Add to collection immediately when interacted with
      this.addBlobToCollection(blob);

      // Update happiness display
      this.updateBlobHappinessDisplay(blob);
    });
    this.updateUI();
  }

  applyItemHappinessBonus(blob) {
    // Check for nearby preferred items and apply small happiness bonus
    const nearbyItems = this.decorations.filter((decoration) => {
      const distance = Phaser.Math.Distance.Between(
        blob.x,
        blob.y,
        decoration.x,
        decoration.y
      );
      return distance < 80; // Within interaction range
    });

    nearbyItems.forEach((item) => {
      // Store previous happiness to detect threshold crossing
      const previousHappiness = blob.happiness;

      // Different personalities prefer different items
      if (blob.personality === "sleepy" && item.type === "rock") {
        blob.happiness = Math.min(100, blob.happiness + 0.1); // Slow but steady
        // Play happy sound occasionally for preferred item interaction
        if (Math.random() < 0.1) this.playBlobHappySound();
      } else if (blob.personality === "playful" && item.type === "bouncePad") {
        blob.happiness = Math.min(100, blob.happiness + 0.15);
        if (Math.random() < 0.1) this.playBlobHappySound();
      } else if (blob.personality === "shy" && item.type === "mushroom") {
        blob.happiness = Math.min(100, blob.happiness + 0.12);
        if (Math.random() < 0.1) this.playBlobHappySound();
      } else if (blob.personality === "curious" && item.type === "water") {
        blob.happiness = Math.min(100, blob.happiness + 0.1);
        if (Math.random() < 0.1) this.playBlobHappySound();
      }

      // Add to collection when coin is generated
      this.addBlobToCollection(blob);
    });
  }

  updateBlobHappinessDisplay(blob) {
    // Create or update happiness bar above blob
    if (!blob.happinessBar) {
      blob.happinessBar = this.add.graphics();
      blob.happinessBar.setDepth(blob.sprite.depth + 1);
      blob.happinessBar.currentFillWidth = 0; // Track current fill width for smooth animation
    }

    blob.happinessBar.clear();

    // Only show happiness bar if blob is not at 100% or is low
    if (blob.happiness < 100 || blob.happiness < 30) {
      const barWidth = 30;
      const barHeight = 4;
      const x = blob.x - barWidth / 2;
      // Position the bar much higher above the blob (increased from -25 to -45)
      // Also account for blob scale to position it properly above larger/smaller blobs
      const y = blob.y - (35 + blob.originalScale * 15);

      // Position the happiness bar directly to match the blob's current position
      blob.happinessBar.x = x + barWidth / 2; // Center the graphics object
      blob.happinessBar.y = y + barHeight / 2; // Center the graphics object

      // Background (gray) - draw relative to graphics object center
      blob.happinessBar.fillStyle(0x333333, 0.7);
      blob.happinessBar.fillRect(
        -barWidth / 2,
        -barHeight / 2,
        barWidth,
        barHeight
      );

      // Happiness fill (color based on happiness level)
      let fillColor = 0x4caf50; // Green for high happiness
      if (blob.happiness < 70) fillColor = 0xffc107; // Yellow for medium
      if (blob.happiness < 30) fillColor = 0xf44336; // Red for low

      const targetFillWidth = (blob.happiness / 100) * barWidth;

      // Smooth animation for happiness bar changes
      if (blob.happinessBar.currentFillWidth === undefined) {
        blob.happinessBar.currentFillWidth = targetFillWidth;
      }

      // Animate towards target width
      const animationSpeed = 0.1;
      blob.happinessBar.currentFillWidth +=
        (targetFillWidth - blob.happinessBar.currentFillWidth) * animationSpeed;

      blob.happinessBar.fillStyle(fillColor, 0.9);
      blob.happinessBar.fillRect(
        -barWidth / 2,
        -barHeight / 2,
        blob.happinessBar.currentFillWidth,
        barHeight
      );

      blob.happinessBar.setVisible(true);
    } else {
      // Hide happiness bar when blob is at 100% happiness
      blob.happinessBar.setVisible(false);
    }

    // Handle sad face icon for blobs below 25% happiness
    if (blob.happiness < 25) {
      if (!blob.statusIcon) {
        blob.statusIcon = this.add.image(0, 0, "sadFace");
        blob.statusIcon.setDepth(blob.sprite.depth + 2);
        blob.statusIcon.setScale(1.0);
      }

      // Position sad face icon right next to the happiness bar (to the right)
      const barWidth = 30;
      const barHeight = 4;
      const barY = blob.y - (35 + blob.originalScale * 15);
      // Position to the right side of the happiness bar
      const iconX = blob.x + barWidth / 2 + 12; // 12 pixels to the right of bar
      const iconY = barY; // Same vertical level as happiness bar
      blob.statusIcon.setPosition(iconX, iconY);
      blob.statusIcon.setVisible(true);

      // No bobbing animation - keep position stable relative to happiness bar
    } else {
      // Hide sad face icon when happiness is above 25%
      if (blob.statusIcon) {
        blob.statusIcon.setVisible(false);
        if (blob.statusIcon.bobTween) {
          blob.statusIcon.bobTween.stop();
        }
      }
    }

    // Handle sparkle particle effects for blobs above 75% happiness
    if (blob.happiness > 75) {
      if (!blob.sparkleEffect) {
        try {
          blob.sparkleEffect = this.add.particles(blob.x, blob.y, "sparkle", {
            scale: { start: 0.2, end: 0 },
            speed: { min: 20, max: 40 },
            lifespan: 1200,
            frequency: 300,
            quantity: 1,
            emitZone: {
              type: "random",
              source: new Phaser.Geom.Circle(0, 0, 25),
            },
          });
          blob.sparkleEffect.setDepth(blob.sprite.depth + 1);
        } catch (error) {
          console.error("Error creating sparkle effect:", error);
        }
      }

      // Update sparkle effect position and start emitting
      if (blob.sparkleEffect) {
        blob.sparkleEffect.setPosition(blob.x, blob.y - 10);
        if (!blob.sparkleEffect.emitting) {
          blob.sparkleEffect.start();
        }
      }
    } else {
      // Stop sparkle effects when happiness drops below 75%
      if (blob.sparkleEffect && blob.sparkleEffect.emitting) {
        blob.sparkleEffect.stop();
      }
    }
  }

  generatePassiveCoins() {
    this.blobs.forEach((blob) => {
      // Get rarity multiplier for coin generation
      const rarityMultiplier = this.getRarityMultiplier(blob.rarity);

      // Improved coin generation based on happiness tiers with rarity multipliers
      let baseCoins = 0;
      if (blob.happiness > 90) {
        baseCoins = 3; // Very happy blobs give more coins
      } else if (blob.happiness > 70) {
        baseCoins = 2; // Happy blobs give good coins
      } else if (blob.happiness > 40) {
        baseCoins = 1; // Moderately happy blobs give some coins
      }
      // Unhappy blobs (< 40%) don't generate coins

      if (baseCoins > 0) {
        const finalCoins = Math.ceil(baseCoins * rarityMultiplier);
        this.coins += finalCoins;
        this.createFloatingCoin(blob.x, blob.y, `+${finalCoins}`);

        // Special celebration effects for legendary blob collection at high happiness
        if (blob.rarity === "legendary" && blob.happiness > 90) {
          this.addLegendaryCollectionEffects(blob);
        }
      }

      // Coin generation for happy blobs

      // Update collection stats
      const blobKey = `${blob.type}_${blob.name}`;
      if (this.blobCollection[blobKey]) {
        this.blobCollection[blobKey].totalTimeSpent += 5; // 5 seconds per tick
        if (baseCoins > 0) {
          const finalCoins = Math.ceil(baseCoins * rarityMultiplier);
          this.blobCollection[blobKey].totalCoinsGenerated += finalCoins;
        }
      }
    });
    this.saveBlobCollection();
    this.updateUI();
  }

  createFloatingCoin(x, y, text) {
    // Create floating coin text effect
    const coinText = this.add.text(x, y - 10, text, {
      fontSize: "12px",
      fill: "#FFD700",
      fontWeight: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    coinText.setDepth(2000);

    // Animate the floating text
    this.tweens.add({
      targets: coinText,
      y: y - 40,
      alpha: 0,
      duration: 1500,
      ease: "Power2.easeOut",
      onComplete: () => {
        coinText.destroy();
      },
    });
  }

  scheduleNextCoinDrop() {
    const delay = Phaser.Math.Between(15000, 30000);
    this.time.delayedCall(delay, () => {
      this.dropCoin();
      this.scheduleNextCoinDrop();
    });
  }

  dropCoin() {
    const position = this.getRandomGroundPosition();
    const value = Phaser.Math.Between(5, 15);
    const coinSprite = this.add.image(position.x, position.y, "coin");
    coinSprite.setScale(1.0); // Full scale
    coinSprite.setDepth(10000); // Always in front of everything else

    // Add idle sine wave animation
    this.tweens.add({
      targets: coinSprite,
      y: position.y - 8,
      duration: 2000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1, // Infinite repeat
    });

    this.coinDrops.push({
      x: position.x,
      y: position.y,
      value: value,
      sprite: coinSprite,
      collected: false,
    });
  }

  scheduleHabitatEvaluation() {
    const delay = Phaser.Math.Between(60000, 120000);
    this.time.delayedCall(delay, () => {
      if (this.blobs.length < 5 && this.decorations.length > 2) {
        this.spawnBlob();
      }
      this.scheduleHabitatEvaluation();
    });
  }

  showFloatingText(text, x, y, color) {
    const textObj = this.add.text(x, y, text, {
      fontSize: "16px",
      fill: `#${color.toString(16).padStart(6, "0")}`,
      fontWeight: "bold",
    });
    textObj.setDepth(9000); // High depth to ensure visibility

    this.tweens.add({
      targets: textObj,
      y: y - 50,
      alpha: 0,
      duration: 2000,
      ease: "Power2",
      onComplete: () => textObj.destroy(),
    });
  }

  updateUI() {
    document.getElementById("coins").textContent = this.coins;

    const blobList = document.getElementById("blob-list");
    blobList.innerHTML = "";

    this.blobs.forEach((blob) => {
      const card = document.createElement("div");
      card.className = "blob-card";

      // Create image element instead of emoji
      const blobImage = document.createElement("img");
      blobImage.className = "blob-image";

      // Map blob type to corresponding PNG file
      const blobTypeToFile = {
        "Lavender Blob": "lavenderblob.png",
        "Sky Blob": "blueblob.png",
        "Rose Blob": "pinkblob.png",
        "Violet Blob": "purpleblob.png",
        "Peach Blob": "orangeblob.png",
        "Rainbow Blob": "rainbowblob.png",
      };

      blobImage.src = blobTypeToFile[blob.type] || "lavenderblob.png";
      blobImage.alt = blob.type;

      const name = document.createElement("div");
      name.className = "blob-name";
      name.textContent = blob.name;

      const happiness = document.createElement("div");
      happiness.className = "blob-happiness";
      happiness.textContent = `Happiness: ${Math.round(blob.happiness)}%`;

      const rarity = document.createElement("div");
      rarity.className = "blob-rarity";
      rarity.textContent = blob.rarity || "common";
      rarity.style.color = this.getRarityColor(blob.rarity);
      rarity.style.fontWeight = "bold";
      rarity.style.fontSize = "0.8em";

      const personality = document.createElement("div");
      personality.className = "blob-personality";
      personality.textContent = `${blob.personality || "wandering"} 🌟`;
      personality.style.fontSize = "0.8em";
      personality.style.color = "#666";

      card.appendChild(blobImage);
      card.appendChild(name);
      card.appendChild(rarity);
      card.appendChild(personality);
      card.appendChild(happiness);
      blobList.appendChild(card);
    });
  }

  // Collection Management Functions
  loadBlobCollection() {
    try {
      const savedCollection = localStorage.getItem("blobGardenCollection");
      if (savedCollection) {
        this.blobCollection = JSON.parse(savedCollection);
      } else {
        this.blobCollection = {};
      }
    } catch (error) {
      console.log("Could not load blob collection:", error);
      this.blobCollection = {};
    }
  }

  saveBlobCollection() {
    try {
      const gameState = {
        collection: this.blobCollection,
        lastSaveTime: Date.now(),
        coins: this.coins,
        blobs: this.blobs.map((blob) => ({
          id: blob.id,
          name: blob.name,
          happiness: blob.happiness,
          personality: blob.personality,
          rarity: blob.rarity,
          lastFed: blob.lastFed,
          firstVisit: blob.firstVisit,
          totalVisits: blob.totalVisits,
        })),
      };

      localStorage.setItem(
        "blobGardenCollection",
        JSON.stringify(this.blobCollection)
      );

      localStorage.setItem("blobGardenGameState", JSON.stringify(gameState));
    } catch (error) {
      console.log("Could not save blob collection:", error);
    }
  }

  checkOfflineProgress() {
    try {
      const savedGameState = localStorage.getItem("blobGardenGameState");
      if (!savedGameState) {
        // First time playing, save current state
        this.saveBlobCollection();
        return;
      }

      const gameState = JSON.parse(savedGameState);
      const lastSaveTime = gameState.lastSaveTime || Date.now();
      const currentTime = Date.now();
      const offlineTime = currentTime - lastSaveTime;

      // Only show offline progress if away for more than 5 minutes
      if (offlineTime > 5 * 60 * 1000) {
        const offlineProgress = this.calculateOfflineProgress(
          gameState,
          offlineTime
        );
        if (
          offlineProgress.coinsEarned > 0 ||
          offlineProgress.events.length > 0
        ) {
          this.showOfflineProgressModal(offlineProgress, offlineTime);
        }
      }

      // Update current state
      this.saveBlobCollection();
    } catch (error) {
      console.log("Could not check offline progress:", error);
    }
  }

  calculateOfflineProgress(gameState, offlineTimeMs) {
    const offlineHours = offlineTimeMs / (1000 * 60 * 60);
    const maxOfflineHours = Math.min(offlineHours, 24); // Cap at 24 hours

    let totalCoinsEarned = 0;
    const events = [];
    const warnings = [];

    // Process each blob that was active when the game was last saved
    if (gameState.blobs && gameState.blobs.length > 0) {
      gameState.blobs.forEach((savedBlob) => {
        const blobName = savedBlob.name || "Unknown Blob";
        let currentHappiness = savedBlob.happiness || 50;
        let coinsFromThisBlob = 0;

        // Calculate happiness decay over time
        const decayRate = this.getDecayRateForPersonality(
          savedBlob.personality
        );
        const happinessDecay = decayRate * maxOfflineHours;
        currentHappiness = Math.max(0, currentHappiness - happinessDecay);

        // Calculate coins earned based on happiness levels during offline time
        if (savedBlob.happiness >= 40) {
          // Generate coins based on average happiness during offline period
          const avgHappiness = (savedBlob.happiness + currentHappiness) / 2;
          const coinRate = this.getCoinRateForHappiness(avgHappiness);
          coinsFromThisBlob = Math.floor(coinRate * maxOfflineHours);
          totalCoinsEarned += coinsFromThisBlob;

          // Add positive events based on personality and happiness
          if (savedBlob.happiness >= 70) {
            const event = this.generatePositiveEvent(savedBlob);
            if (event) events.push(event);
          }
        }

        // Add warnings for unhappy blobs
        if (currentHappiness < 25) {
          warnings.push(`${blobName} became unhappy and needs attention!`);
        }
      });
    }

    return {
      coinsEarned: totalCoinsEarned,
      events: events,
      warnings: warnings,
      offlineHours: Math.round(maxOfflineHours * 10) / 10,
    };
  }

  getDecayRateForPersonality(personality) {
    const decayRates = {
      sleepy: 2, // Slower decay
      playful: 4, // Faster decay
      shy: 3, // Medium decay
      curious: 3.5, // Medium-fast decay
      social: 4.5, // Fastest decay
    };
    return decayRates[personality] || 3;
  }

  getCoinRateForHappiness(happiness) {
    if (happiness >= 90) return 4; // 4 coins per hour
    if (happiness >= 70) return 2; // 2 coins per hour
    if (happiness >= 40) return 1; // 1 coin per hour
    return 0;
  }

  generatePositiveEvent(blob) {
    const events = {
      sleepy: [
        `${blob.name} slept peacefully on the rock!`,
        `${blob.name} had sweet dreams in the garden!`,
        `${blob.name} rested comfortably and feels refreshed!`,
      ],
      playful: [
        `${blob.name} bounced happily on the bounce pad!`,
        `${blob.name} played joyfully around the garden!`,
        `${blob.name} had fun exploring every corner!`,
      ],
      shy: [
        `${blob.name} found comfort near the glowing mushroom!`,
        `${blob.name} quietly enjoyed the peaceful garden!`,
        `${blob.name} felt safe and content in their favorite spot!`,
      ],
      curious: [
        `${blob.name} splashed playfully in the water!`,
        `${blob.name} discovered something interesting!`,
        `${blob.name} explored the garden with wonder!`,
      ],
      social: [
        `${blob.name} gathered with friends near the stump!`,
        `${blob.name} enjoyed socializing with other blobs!`,
        `${blob.name} made new friends in the garden!`,
      ],
    };

    const personalityEvents = events[blob.personality] || events.curious;
    return personalityEvents[
      Math.floor(Math.random() * personalityEvents.length)
    ];
  }

  resetBlobCollection() {
    // Clear the in-memory collection
    this.blobCollection = {};

    try {
      // Remove from localStorage with multiple possible keys
      localStorage.removeItem("blobGardenCollection");
      localStorage.removeItem("blobCollection");
      localStorage.removeItem("blob_collection");
      localStorage.removeItem("blobGardenGameState");

      // Clear any sessionStorage as well
      sessionStorage.removeItem("blobGardenCollection");
      sessionStorage.removeItem("blobCollection");

      // Force refresh the collection modal if it's open
      const modal = document.getElementById("collection-modal");
      if (modal && modal.style.display !== "none") {
        this.showCollectionModal(); // Refresh the modal content
      }

      // Update the blob list UI
      this.updateUI();

      // Clear collection tracking for current blobs

      // Show notification
      const notification = this.add.text(
        400,
        100,
        "Collection Reset Complete!\nBlobs will be collected when discovered 🌟",
        {
          fontSize: "16px",
          fill: "#FFD700",
          fontWeight: "bold",
          stroke: "#000000",
          strokeThickness: 2,
          align: "center",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: { x: 15, y: 8 },
        }
      );
      notification.setDepth(3000);
      notification.setOrigin(0.5);

      // Animate the notification
      this.tweens.add({
        targets: notification,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 300,
        yoyo: true,
        ease: "Sine.easeInOut",
      });

      // Remove after 4 seconds
      this.time.delayedCall(4000, () => {
        this.tweens.add({
          targets: notification,
          alpha: 0,
          duration: 500,
          onComplete: () => notification.destroy(),
        });
      });
    } catch (error) {
      console.error("Error resetting collection:", error);
    }
  }

  addBlobToCollection(blob) {
    const blobKey = `${blob.type}_${blob.name}`;

    // Collect blob immediately when discovered

    if (!this.blobCollection[blobKey]) {
      // First time collecting this blob
      this.blobCollection[blobKey] = {
        id: blob.id,
        name: blob.name,
        type: blob.type,
        rarity: blob.rarity,
        personality: blob.personality,
        firstCollected: Date.now(),
        totalVisits: blob.totalVisits || 1,
        maxHappiness: blob.happiness,
        totalTimeSpent: 0,
        totalCoinsGenerated: 0,
        isAdopted: false,
        adoptionDate: null,
        mementos: [],
      };

      // Show "Blob Collected!" notification
      this.showBlobCollectedNotification(blob);
    } else {
      // Update existing blob stats
      this.blobCollection[blobKey].maxHappiness = Math.max(
        this.blobCollection[blobKey].maxHappiness,
        blob.happiness
      );
    }

    this.saveBlobCollection();
  }

  checkForReturningFriend(blob) {
    const blobKey = `${blob.type}_${blob.name}`;

    if (this.blobCollection[blobKey]) {
      // This is a returning friend!
      blob.isReturningFriend = true;
      this.blobCollection[blobKey].totalVisits++;

      // Increase starting happiness for returning friends (requirement 8.5)
      const bonusHappiness = Math.min(
        20,
        this.blobCollection[blobKey].totalVisits * 2
      );
      blob.happiness = Math.min(100, blob.happiness + bonusHappiness);

      // Show returning friend notification
      this.showReturningFriendNotification(blob);

      this.saveBlobCollection();
    } else {
      blob.isReturningFriend = false;
    }
  }

  showNewBlobNotification(blob) {
    // Create floating notification
    const notification = this.add.text(
      400,
      100,
      `New Blob Discovered!\n${blob.name} the ${blob.type}`,
      {
        fontSize: "18px",
        fill: "#FFD700",
        fontWeight: "bold",
        stroke: "#000000",
        strokeThickness: 3,
        align: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: { x: 20, y: 10 },
      }
    );
    notification.setDepth(3000);
    notification.setOrigin(0.5);

    // Animate the notification
    this.tweens.add({
      targets: notification,
      y: 80,
      duration: 500,
      ease: "Back.easeOut",
    });

    // Remove after 3 seconds
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: notification,
        alpha: 0,
        y: 60,
        duration: 500,
        onComplete: () => notification.destroy(),
      });
    });
  }

  showReturningFriendNotification(blob) {
    // Create floating notification for returning friends
    const visitCount =
      this.blobCollection[`${blob.type}_${blob.name}`]?.totalVisits || 1;
    const notification = this.add.text(
      400,
      120,
      `Welcome back, ${blob.name}! 🌟\nVisit #${visitCount}`,
      {
        fontSize: "16px",
        fill: "#87CEEB",
        fontWeight: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
        backgroundColor: "rgba(135, 206, 235, 0.2)",
        padding: { x: 15, y: 8 },
      }
    );
    notification.setDepth(3000);
    notification.setOrigin(0.5);

    // Add sparkle effect for returning friends
    const sparkles = this.add.particles(400, 120, "sparkle", {
      scale: { start: 0.15, end: 0 },
      speed: { min: 20, max: 40 },
      lifespan: 1000,
      quantity: 3,
      tint: [0x87ceeb, 0xffd700, 0xffffff],
    });
    sparkles.setDepth(2999);

    // Animate the notification
    this.tweens.add({
      targets: notification,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      yoyo: true,
      ease: "Sine.easeInOut",
    });

    // Remove after 3 seconds
    this.time.delayedCall(3000, () => {
      sparkles.destroy();
      this.tweens.add({
        targets: notification,
        alpha: 0,
        y: 100,
        duration: 500,
        onComplete: () => notification.destroy(),
      });
    });
  }

  adoptBlob(blob) {
    const blobKey = `${blob.type}_${blob.name}`;
    if (
      this.blobCollection[blobKey] &&
      !this.blobCollection[blobKey].isAdopted
    ) {
      this.blobCollection[blobKey].isAdopted = true;
      this.blobCollection[blobKey].adoptionDate = Date.now();
      this.saveBlobCollection();

      // Show adoption notification
      this.showAdoptionNotification(blob);
      return true;
    }
    return false;
  }

  showAdoptionNotification(blob) {
    const notification = this.add.text(
      400,
      100,
      `${blob.name} has been adopted!\nThey'll stay in your garden forever! 💖`,
      {
        fontSize: "16px",
        fill: "#FF69B4",
        fontWeight: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
        backgroundColor: "rgba(255, 105, 180, 0.2)",
        padding: { x: 15, y: 8 },
      }
    );
    notification.setDepth(3000);
    notification.setOrigin(0.5);

    // Animate with hearts
    this.tweens.add({
      targets: notification,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
      repeat: 2,
    });

    // Remove after 4 seconds
    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: notification,
        alpha: 0,
        duration: 500,
        onComplete: () => notification.destroy(),
      });
    });
  }

  showBlobCollectedNotification(blob) {
    const notification = this.add.text(
      400,
      100,
      `🎉 ${blob.name} Collected! 🎉\nHappiness: ${Math.round(
        blob.happiness
      )}%`,
      {
        fontSize: "16px",
        fill: "#4CAF50",
        fontWeight: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        padding: { x: 12, y: 8 },
      }
    );
    notification.setDepth(3000);
    notification.setOrigin(0.5);

    // Animate the notification
    this.tweens.add({
      targets: notification,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
      repeat: 1,
    });

    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: notification,
        alpha: 0,
        y: 80,
        duration: 400,
        onComplete: () => notification.destroy(),
      });
    });
  }

  addReturningFriendIndicator(blob) {
    // Create a small star icon above the blob to indicate it's a returning friend
    const starIcon = this.add.text(blob.x, blob.y - 40, "⭐", {
      fontSize: "20px",
      fill: "#FFD700",
    });
    starIcon.setOrigin(0.5);
    starIcon.setDepth(blob.sprite.depth + 1);

    // Store reference to the star icon
    blob.returningFriendIcon = starIcon;

    // Animate the star with a gentle pulse
    this.tweens.add({
      targets: starIcon,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Remove the star after 10 seconds
    this.time.delayedCall(10000, () => {
      if (starIcon && starIcon.active) {
        this.tweens.add({
          targets: starIcon,
          alpha: 0,
          duration: 1000,
          onComplete: () => {
            starIcon.destroy();
            blob.returningFriendIcon = null;
          },
        });
      }
    });
  }

  showCollectionModal() {
    const modal = document.getElementById("collection-modal");
    const statsDiv = document.getElementById("collection-stats");
    const collectionDiv = document.getElementById("full-collection");

    // Calculate collection stats
    const totalBlobs = Object.keys(this.blobCollection).length;
    const adoptedBlobs = Object.values(this.blobCollection).filter(
      (blob) => blob.isAdopted
    ).length;
    const totalCoins = Object.values(this.blobCollection).reduce(
      (sum, blob) => sum + blob.totalCoinsGenerated,
      0
    );
    const totalTime = Object.values(this.blobCollection).reduce(
      (sum, blob) => sum + blob.totalTimeSpent,
      0
    );

    // Show stats
    statsDiv.innerHTML = `
      <div class="stat-item">
        <span class="stat-number">${totalBlobs}</span>
        <span>Blobs Discovered</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">${adoptedBlobs}</span>
        <span>Blobs Adopted</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">${totalCoins}</span>
        <span>Coins Generated</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">${Math.round(totalTime / 60)}</span>
        <span>Minutes Played</span>
      </div>
    `;

    // Show collection
    collectionDiv.innerHTML = "";
    Object.values(this.blobCollection).forEach((blob) => {
      const card = document.createElement("div");
      card.className = `collection-card ${blob.isAdopted ? "adopted" : ""}`;

      const rarityColor = this.getRarityColor(blob.rarity);

      card.innerHTML = `
        <div style="font-size: 2em; margin-bottom: 10px;">🟣</div>
        <h4 style="color: ${rarityColor}; margin: 5px 0;">${blob.name}</h4>
        <p style="font-size: 0.9em; color: #666;">${blob.type}</p>
        <p style="font-size: 0.8em; color: ${rarityColor}; font-weight: bold; text-transform: uppercase;">${
        blob.rarity
      }</p>
        <p style="font-size: 0.8em; color: #666; font-style: italic;">${
          blob.personality
        }</p>
        <div style="margin-top: 10px; font-size: 0.8em;">
          <div>Visits: ${blob.totalVisits}</div>
          <div>Max Happiness: ${Math.round(blob.maxHappiness)}%</div>
          <div>Coins Generated: ${blob.totalCoinsGenerated}</div>
          ${
            blob.isAdopted
              ? '<div style="color: #FF69B4; font-weight: bold;">💖 Adopted!</div>'
              : ""
          }
        </div>
      `;

      collectionDiv.appendChild(card);
    });

    modal.style.display = "block";
  }

  hideCollectionModal() {
    const modal = document.getElementById("collection-modal");
    modal.style.display = "none";
  }

  showOfflineProgressModal(offlineProgress, offlineTimeMs) {
    const modal = document.getElementById("offline-progress-modal");
    const contentDiv = document.getElementById("offline-progress-content");

    if (!modal || !contentDiv) {
      console.error("Offline progress modal elements not found");
      return;
    }

    // Apply coins earned
    this.coins += offlineProgress.coinsEarned;
    this.updateUI();

    // Create the modal content
    let content = `
      <div class="offline-summary">
        <div class="offline-time">You were away for ${offlineProgress.offlineHours} hours</div>
        <div class="coins-earned">+${offlineProgress.coinsEarned} coins earned! 💰</div>
      </div>
    `;

    // Add positive events
    if (offlineProgress.events.length > 0) {
      content += `
        <div class="events-section">
          <h3>🌟 What happened while you were away:</h3>
      `;
      offlineProgress.events.forEach((event) => {
        content += `<div class="event-item">${event}</div>`;
      });
      content += `</div>`;
    }

    // Add warnings
    if (offlineProgress.warnings.length > 0) {
      content += `
        <div class="events-section">
          <h3>⚠️ Blobs that need attention:</h3>
      `;
      offlineProgress.warnings.forEach((warning) => {
        content += `<div class="warning-item">${warning}</div>`;
      });
      content += `</div>`;
    }

    // If no events or warnings, show a generic message
    if (
      offlineProgress.events.length === 0 &&
      offlineProgress.warnings.length === 0
    ) {
      content += `
        <div class="events-section">
          <div class="event-item">Your garden was peaceful while you were away. 🌸</div>
        </div>
      `;
    }

    contentDiv.innerHTML = content;
    modal.style.display = "block";

    // Set up close button
    const closeBtn = document.getElementById("offline-progress-close");
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.style.display = "none";
      };
    }

    // Close modal when clicking outside
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    };
  }

  // Test function to simulate offline progress (for development)
  testOfflineProgress() {
    // Create mock offline progress data
    const mockProgress = {
      coinsEarned: 15,
      offlineHours: 2.5,
      events: [
        "Jelly slept peacefully on the rock!",
        "Bounce bounced happily on the bounce pad!",
        "Glow found comfort near the glowing mushroom!",
      ],
      warnings: ["Sky Blob became unhappy and needs attention!"],
    };

    // Show the modal with mock data
    this.showOfflineProgressModal(mockProgress, 2.5 * 60 * 60 * 1000);
  }

  // Audio System Methods
  initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (error) {
      console.log("Web Audio API not supported, sounds disabled");
      this.soundEnabled = false;
    }
  }

  // Resume audio context on user interaction (required by browsers)
  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  // Button click sound effect
  playButtonClickSound() {
    if (!this.soundEnabled || !this.audioContext) return;

    this.resumeAudioContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Quick click sound: high to low frequency
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      400,
      this.audioContext.currentTime + 0.1
    );

    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.1
    );

    oscillator.type = "square";
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Coin collection chime sound effect
  playCoinSound() {
    if (!this.soundEnabled || !this.audioContext) return;

    this.resumeAudioContext();

    // Create a pleasant chime with multiple tones
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 chord

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      oscillator.type = "sine";

      const startTime = this.audioContext.currentTime + index * 0.05;
      const duration = 0.4;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }

  // Blob interaction sound effects
  playBlobFeedSound() {
    if (!this.soundEnabled || !this.audioContext) return;

    this.resumeAudioContext();

    // Happy eating sound - bubbly and cheerful
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = "sawtooth";
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, this.audioContext.currentTime);

    // Bouncy feeding sound
    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(
      500,
      this.audioContext.currentTime + 0.1
    );
    oscillator.frequency.linearRampToValueAtTime(
      400,
      this.audioContext.currentTime + 0.2
    );
    oscillator.frequency.linearRampToValueAtTime(
      450,
      this.audioContext.currentTime + 0.3
    );

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      0.15,
      this.audioContext.currentTime + 0.05
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.3
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  playBlobHappySound() {
    if (!this.soundEnabled || !this.audioContext) return;

    this.resumeAudioContext();

    // Happy blob sound - like a gentle chirp
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(
      800,
      this.audioContext.currentTime + 0.1
    );
    oscillator.frequency.linearRampToValueAtTime(
      700,
      this.audioContext.currentTime + 0.2
    );

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      0.12,
      this.audioContext.currentTime + 0.05
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.2
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  playBlobInteractionSound() {
    if (!this.soundEnabled || !this.audioContext) return;

    this.resumeAudioContext();

    // Gentle interaction sound - like a soft boop
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(
      500,
      this.audioContext.currentTime + 0.05
    );
    oscillator.frequency.linearRampToValueAtTime(
      350,
      this.audioContext.currentTime + 0.15
    );

    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.15
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // Toggle sound on/off
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const soundBtn = document.getElementById("sound-toggle-btn");
    if (soundBtn) {
      if (this.soundEnabled) {
        soundBtn.textContent = "🔊";
        soundBtn.classList.remove("muted");
        soundBtn.title = "Mute Sound";
      } else {
        soundBtn.textContent = "🔇";
        soundBtn.classList.add("muted");
        soundBtn.title = "Enable Sound";
      }
    }

    // Save sound preference
    localStorage.setItem(
      "blobGardenSoundEnabled",
      this.soundEnabled.toString()
    );
  }

  // Load sound preference
  loadSoundPreference() {
    const savedPreference = localStorage.getItem("blobGardenSoundEnabled");
    if (savedPreference !== null) {
      this.soundEnabled = savedPreference === "true";
      const soundBtn = document.getElementById("sound-toggle-btn");
      if (soundBtn) {
        if (this.soundEnabled) {
          soundBtn.textContent = "🔊";
          soundBtn.classList.remove("muted");
          soundBtn.title = "Mute Sound Effects";
        } else {
          soundBtn.textContent = "🔇";
          soundBtn.classList.add("muted");
          soundBtn.title = "Enable Sound Effects";
        }
      }
    }
  }

  // Music System Methods
  initializeBackgroundMusic() {
    try {
      // Initialize both day and night music tracks
      this.dayMusic = new Audio("BlobGardenSoundtrack.mp3");
      this.nightMusic = new Audio("BlobGardenSoundtrack_night.mp3");

      // Set up both tracks
      [this.dayMusic, this.nightMusic].forEach((track, index) => {
        const trackName = index === 0 ? "day" : "night";
        track.loop = true;
        track.volume = 0.5;
        track.preload = "auto";
        track.crossOrigin = "anonymous";

        track.addEventListener("canplaythrough", () => {
          console.log(`✅ ${trackName} music loaded successfully`);
        });

        track.addEventListener("loadstart", () => {
          console.log(`🎵 ${trackName} music loading started`);
        });

        track.addEventListener("canplay", () => {
          console.log(`🎵 ${trackName} music can start playing`);
        });

        track.addEventListener("error", (e) => {
          console.error(`❌ Failed to load ${trackName} music:`, e);
          // If night music fails to load, fall back to day music
          if (trackName === "night") {
            console.log("🔄 Falling back to day music for nighttime");
            this.nightMusic = this.dayMusic;
          }
        });

        track.addEventListener("stalled", () => {
          console.warn(`⚠️ ${trackName} music loading stalled`);
        });

        track.addEventListener("suspend", () => {
          console.log(`⏸️ ${trackName} music loading suspended`);
        });
      });

      // Set current music based on night mode state
      this.backgroundMusic = this.isNightMode ? this.nightMusic : this.dayMusic;
      this.currentMusicMode = this.isNightMode ? "night" : "day";

      console.log(`🎵 Initialized ${this.currentMusicMode} music`);

      // Load music preference and volume
      this.loadMusicPreference();

      // Set up volume slider
      this.setupVolumeSlider();

      // Set up user interaction to start music (required by browsers)
      this.setupMusicUserInteraction();

      console.log(
        "🎵 Music system initialized with volume:",
        this.backgroundMusic.volume
      );
    } catch (error) {
      console.log("Background music could not be initialized:", error);
    }
  }

  // Set up user interaction to start music (required by modern browsers)
  setupMusicUserInteraction() {
    const startMusic = (event) => {
      console.log("🎵 User interaction detected:", event.type);

      if (this.backgroundMusic && !this.musicStarted) {
        // Force load the audio on mobile
        this.backgroundMusic.load();

        // Try to play if volume > 0
        if (this.backgroundMusic.volume > 0) {
          this.backgroundMusic
            .play()
            .then(() => {
              console.log("🎵 Background music started successfully");
              this.musicStarted = true;
            })
            .catch((error) => {
              console.error("❌ Could not start background music:", error);
              // Try again after a short delay (mobile sometimes needs this)
              setTimeout(() => {
                if (this.backgroundMusic && this.backgroundMusic.volume > 0) {
                  this.backgroundMusic.play().catch(console.error);
                }
              }, 100);
            });
        } else {
          // Mark as started even if volume is 0, so we can play later when volume changes
          this.musicStarted = true;
          console.log("🎵 Music system ready (volume is 0)");
        }
      }

      // Remove the event listeners after first interaction
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
      document.removeEventListener("touchstart", startMusic);
      document.removeEventListener("touchend", startMusic);
      document.removeEventListener("pointerdown", startMusic);
    };

    // Add event listeners for user interaction (more comprehensive for mobile)
    document.addEventListener("click", startMusic, { once: true });
    document.addEventListener("keydown", startMusic, { once: true });
    document.addEventListener("touchstart", startMusic, { once: true });
    document.addEventListener("touchend", startMusic, { once: true });
    document.addEventListener("pointerdown", startMusic, { once: true });

    console.log("🎵 Music user interaction listeners added");
  }

  // Setup volume slider functionality
  setupVolumeSlider() {
    const volumeSlider = document.getElementById("music-volume");
    const volumeSliderContainer = document.getElementById("volume-slider");

    console.log(
      "🎛️ Setting up volume slider, elements found:",
      !!volumeSlider,
      !!volumeSliderContainer
    );

    if (volumeSlider) {
      // Load saved volume or default to 50%
      const savedVolume = localStorage.getItem("blobGardenMusicVolume");
      const volume = savedVolume !== null ? parseInt(savedVolume) : 50;
      volumeSlider.value = volume;

      console.log("🔊 Setting initial volume to:", volume);

      if (this.backgroundMusic) {
        this.backgroundMusic.volume = volume / 100;
      }

      // Handle volume changes
      volumeSlider.addEventListener("input", (e) => {
        const volume = parseInt(e.target.value);
        console.log("🔊 Volume changed to:", volume);

        if (this.backgroundMusic) {
          this.backgroundMusic.volume = volume / 100;

          // Start music if volume > 0 and user has interacted
          if (volume > 0 && this.musicStarted) {
            if (this.backgroundMusic.paused) {
              this.backgroundMusic
                .play()
                .then(() => {
                  console.log("🎵 Music resumed at volume:", volume);
                })
                .catch((error) => {
                  console.error("❌ Failed to resume music:", error);
                  // Try loading and playing again (mobile fix)
                  this.backgroundMusic.load();
                  setTimeout(() => {
                    this.backgroundMusic.play().catch(console.error);
                  }, 100);
                });
            }
          }
          // Pause music if volume is 0
          else if (volume === 0 && !this.backgroundMusic.paused) {
            this.backgroundMusic.pause();
            console.log("🔇 Music paused (volume 0)");
          }
        }

        // Update button appearance
        this.updateMusicButtonAppearance(volume);

        // Save volume preference
        localStorage.setItem("blobGardenMusicVolume", volume.toString());
      });

      // Close slider when clicking outside
      document.addEventListener("click", (e) => {
        if (
          !volumeSliderContainer.contains(e.target) &&
          !document.getElementById("music-toggle-btn").contains(e.target)
        ) {
          volumeSliderContainer.classList.remove("show");
        }
      });
    }
  }

  // Toggle volume slider visibility
  toggleVolumeSlider() {
    console.log("🎵 Music button clicked - toggling volume slider");

    // If music hasn't started yet, try to start it now (mobile fallback)
    if (!this.musicStarted && this.backgroundMusic) {
      console.log("🎵 Attempting to start music from button click");
      this.backgroundMusic.load();
      if (this.backgroundMusic.volume > 0) {
        this.backgroundMusic
          .play()
          .then(() => {
            console.log("🎵 Music started from button click");
            this.musicStarted = true;
          })
          .catch((error) => {
            console.error("❌ Failed to start music from button:", error);
          });
      } else {
        this.musicStarted = true;
      }
    }

    const volumeSliderContainer = document.getElementById("volume-slider");
    if (volumeSliderContainer) {
      volumeSliderContainer.classList.toggle("show");
      console.log(
        "🎛️ Volume slider visibility:",
        volumeSliderContainer.classList.contains("show")
      );
    } else {
      console.error("❌ Volume slider container not found");
    }
  }

  // Update music button appearance based on volume
  updateMusicButtonAppearance(volume) {
    const musicBtn = document.getElementById("music-toggle-btn");
    if (musicBtn) {
      if (volume === 0) {
        musicBtn.textContent = "🎵";
        musicBtn.classList.add("muted");
        musicBtn.title = "Music Volume (Muted)";
      } else {
        musicBtn.textContent = "🎵";
        musicBtn.classList.remove("muted");
        musicBtn.title = "Music Volume";
      }
    }
  }

  // Load music preference and volume
  loadMusicPreference() {
    // Load volume preference
    const savedVolume = localStorage.getItem("blobGardenMusicVolume");
    const volume = savedVolume !== null ? parseInt(savedVolume) : 50;

    if (this.backgroundMusic) {
      this.backgroundMusic.volume = volume / 100;
    }

    // Update button appearance based on loaded volume
    this.updateMusicButtonAppearance(volume);
  }

  // Day/Night Mode Methods
  switchToNightMusic() {
    if (!this.nightMusic || this.currentMusicMode === "night") return;

    console.log("🌙 Switching to nighttime music");
    const currentVolume = this.backgroundMusic
      ? this.backgroundMusic.volume
      : 0.5;
    const wasPlaying = this.backgroundMusic && !this.backgroundMusic.paused;

    // Fade out current music
    if (this.backgroundMusic && wasPlaying) {
      this.fadeOutMusic(this.backgroundMusic, () => {
        // Switch to night music
        this.backgroundMusic = this.nightMusic;
        this.backgroundMusic.volume = currentVolume;
        this.currentMusicMode = "night";

        // Start night music if day music was playing
        if (this.musicStarted && currentVolume > 0) {
          this.backgroundMusic.play().catch(console.error);
        }
      });
    } else {
      // Just switch without fading if not playing
      this.backgroundMusic = this.nightMusic;
      this.backgroundMusic.volume = currentVolume;
      this.currentMusicMode = "night";
    }
  }

  switchToDayMusic() {
    if (!this.dayMusic || this.currentMusicMode === "day") return;

    console.log("☀️ Switching to daytime music");
    const currentVolume = this.backgroundMusic
      ? this.backgroundMusic.volume
      : 0.5;
    const wasPlaying = this.backgroundMusic && !this.backgroundMusic.paused;

    // Fade out current music
    if (this.backgroundMusic && wasPlaying) {
      this.fadeOutMusic(this.backgroundMusic, () => {
        // Switch to day music
        this.backgroundMusic = this.dayMusic;
        this.backgroundMusic.volume = currentVolume;
        this.currentMusicMode = "day";

        // Start day music if night music was playing
        if (this.musicStarted && currentVolume > 0) {
          this.backgroundMusic.play().catch(console.error);
        }
      });
    } else {
      // Just switch without fading if not playing
      this.backgroundMusic = this.dayMusic;
      this.backgroundMusic.volume = currentVolume;
      this.currentMusicMode = "day";
    }
  }

  fadeOutMusic(track, callback) {
    if (!track) {
      callback();
      return;
    }

    const originalVolume = track.volume;
    const fadeSteps = 20;
    const fadeInterval = 50; // ms
    let currentStep = 0;

    const fadeTimer = setInterval(() => {
      currentStep++;
      track.volume = originalVolume * (1 - currentStep / fadeSteps);

      if (currentStep >= fadeSteps) {
        clearInterval(fadeTimer);
        track.pause();
        track.volume = originalVolume;
        callback();
      }
    }, fadeInterval);
  }

  // Background switching methods
  switchToNightBackground() {
    console.log("🌙 Switching to nighttime background");

    // Hide day background, show night background
    if (this.dayBackground) {
      this.dayBackground.setVisible(false);
    }

    if (this.nightBackground) {
      this.nightBackground.setVisible(true);
    }
  }

  switchToDayBackground() {
    console.log("☀️ Switching to daytime background");

    // Show day background, hide night background
    if (this.dayBackground) {
      this.dayBackground.setVisible(true);
    }

    if (this.nightBackground) {
      this.nightBackground.setVisible(false);
    }
  }

  // Create both day and night backgrounds
  createBackground() {
    try {
      // Use 100% scale for the new larger background images
      // This ensures the backgrounds display at their full intended size
      const targetScale = 1.0; // Full scale for larger background images
      let targetWidth = 800;
      let targetHeight = 600;

      // Create day background first
      if (this.textures.exists("garden_background")) {
        this.dayBackground = this.add.image(0, 0, "garden_background");
        this.dayBackground.setOrigin(0.5, 0.5);
        this.dayBackground.setScale(targetScale);
        this.dayBackground.setDepth(-1);

        // Store the target dimensions
        targetWidth = this.dayBackground.width * targetScale;
        targetHeight = this.dayBackground.height * targetScale;

        console.log(`✅ Day background created with scale: ${targetScale}`);
      }

      // Create night background with the SAME scale
      if (this.textures.exists("garden_background_night")) {
        this.nightBackground = this.add.image(0, 0, "garden_background_night");
        this.nightBackground.setOrigin(0.5, 0.5);
        this.nightBackground.setScale(targetScale);
        this.nightBackground.setDepth(-1);
        this.nightBackground.setVisible(false); // Start hidden

        console.log(`✅ Night background created with scale: ${targetScale}`);
      }

      // Set the background dimensions for camera bounds
      this.backgroundWidth = targetWidth;
      this.backgroundHeight = targetHeight;

      // Show appropriate background based on current mode
      if (this.isNightMode) {
        if (this.dayBackground) this.dayBackground.setVisible(false);
        if (this.nightBackground) this.nightBackground.setVisible(true);
      } else {
        if (this.dayBackground) this.dayBackground.setVisible(true);
        if (this.nightBackground) this.nightBackground.setVisible(false);
      }
    } catch (error) {
      console.error("Error creating backgrounds:", error);
      // Create fallback background
      const fallbackBg = this.add.graphics();
      fallbackBg.fillStyle(0x2d5a27); // Dark green
      fallbackBg.fillRect(-400, -300, 800, 600);
      this.backgroundWidth = 800;
      this.backgroundHeight = 600;
    }
  }

  // Toggle day/night mode
  toggleDayNightMode() {
    this.isNightMode = !this.isNightMode;
    console.log(`🔄 Toggling to ${this.isNightMode ? "night" : "day"} mode`);

    if (this.isNightMode) {
      this.switchToNightMusic();
      this.switchToNightBackground();
    } else {
      this.switchToDayMusic();
      this.switchToDayBackground();
    }

    // Update existing decorations to use day/night textures
    this.updateDecorationTextures();

    // Update the toggle button appearance
    this.updateDayNightButton();
  }

  updateDecorationTextures() {
    // Update all existing decorations to use the appropriate day/night texture
    this.decorations.forEach((decoration) => {
      const spriteKey = this.isNightMode
        ? decoration.nightKey
        : decoration.dayKey;
      if (decoration.sprite && decoration.sprite.setTexture) {
        decoration.sprite.setTexture(spriteKey);
      }
    });
  }

  updateDayNightButton() {
    const button = document.getElementById("day-night-toggle");
    if (button) {
      button.textContent = this.isNightMode ? "☀️" : "🌙";
      button.title = this.isNightMode
        ? "Switch to Day Mode"
        : "Switch to Night Mode";
    }
  }
}

// Initialize the game
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "phaser-game",
  scene: BlobGame,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);
window.game = game; // Make game accessible for testing
