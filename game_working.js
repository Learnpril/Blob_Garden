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
      bouncePad: { key: "bouncePad", cost: 25, color: 0x4caf50 },
      rock: { key: "rock", cost: 15, color: 0x795548 },
      water: { key: "water", cost: 20, color: 0x2196f3 },
      mushroom: { key: "mushroom", cost: 30, color: 0xff5722 },
      stump: { key: "stump", cost: 35, color: 0x8d6e63 },
    };
  }

  preload() {
    // Add error handling for file loading
    this.load.on("loaderror", (file) => {
      console.error("Failed to load file:", file.src);
    });

    // Load the garden background PNG
    this.load.image("garden_background", "garden_background.png");

    // Load the rock PNG
    this.load.image("rock", "rock.png");

    // Load the blob PNGs
    this.load.image("lavenderBlob", "lavenderblob.png");
    this.load.image("pinkBlob", "pinkblob.png");
    this.load.image("orangeBlob", "orangeblob.png");
    this.load.image("blueBlob", "blueblob.png");
    this.load.image("purpleBlob", "purpleblob.png");
    this.load.image("rainbowBlob", "rainbowblob.png");

    try {
      this.createBlobSprites();
      this.createDecorationSprites();
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

      // Set the scene background color to dark green
      this.cameras.main.setBackgroundColor("#1c1d17");

      // Add the garden background PNG at world center
      let background;
      try {
        if (this.textures.exists("garden_background")) {
          background = this.add.image(0, 0, "garden_background");
          background.setOrigin(0.5, 0.5);

          // Don't scale down - show the image at full size or larger
          const minScale = 1.2; // Show image larger than original for better detail
          background.setScale(minScale);

          // Store background info for camera bounds
          this.backgroundWidth = background.width * minScale;
          this.backgroundHeight = background.height * minScale;
        } else {
          console.warn("Garden background not found, using fallback");
          // Create a fallback background
          const fallbackBg = this.add.graphics();
          fallbackBg.fillStyle(0x2d5a27); // Dark green
          fallbackBg.fillRect(-400, -300, 800, 600);
          this.backgroundWidth = 800;
          this.backgroundHeight = 600;
        }
      } catch (error) {
        console.error("Error loading background:", error);
        // Create a simple colored background as fallback
        const fallbackBg = this.add.graphics();
        fallbackBg.fillStyle(0x2d5a27); // Dark green
        fallbackBg.fillRect(-400, -300, 800, 600);
        this.backgroundWidth = 800;
        this.backgroundHeight = 600;
      }

      // Set up camera controls
      this.setupCameraControls();

      this.particles = this.add.particles(0, 0, "sparkle", {
        scale: { start: 0.3, end: 0 },
        speed: { min: 50, max: 100 },
        lifespan: 800,
        emitting: false,
      });

      this.setupEventListeners();

      try {
        this.loadBlobCollection();
      } catch (error) {
        console.error("Error loading blob collection:", error);
        this.blobCollection = {};
      }

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
    this.createBouncePadSprite();
    this.createWaterSprite();
    this.createMushroomSprite();
    this.createStumpSprite();
  }

  createBouncePadSprite() {
    const bouncePad = this.add.graphics();

    // Base platform
    bouncePad.fillStyle(0x333333);
    bouncePad.fillEllipse(25, 35, 40, 20);

    // Bounce surface (springy material)
    bouncePad.fillStyle(0x4caf50);
    bouncePad.fillEllipse(25, 30, 35, 15);

    // Highlight on bounce surface
    bouncePad.fillStyle(0x66bb6a);
    bouncePad.fillEllipse(25, 28, 25, 10);

    // Spring coils underneath
    bouncePad.lineStyle(2, 0x666666, 1);
    bouncePad.beginPath();
    bouncePad.moveTo(15, 35);
    bouncePad.lineTo(18, 32);
    bouncePad.lineTo(22, 35);
    bouncePad.lineTo(25, 32);
    bouncePad.lineTo(28, 35);
    bouncePad.lineTo(32, 32);
    bouncePad.lineTo(35, 35);
    bouncePad.strokePath();

    bouncePad.generateTexture("bouncePad", 50, 45);
    bouncePad.destroy();
  }

  createWaterSprite() {
    const water = this.add.graphics();
    water.fillStyle(0x2196f3);
    water.beginPath();
    water.moveTo(25, 10);
    water.lineTo(40, 20);
    water.lineTo(25, 30);
    water.lineTo(10, 20);
    water.closePath();
    water.fillPath();
    water.fillStyle(0x1976d2);
    water.beginPath();
    water.moveTo(25, 30);
    water.lineTo(40, 20);
    water.lineTo(42, 22);
    water.lineTo(27, 32);
    water.closePath();
    water.fillPath();
    water.fillStyle(0x64b5f6);
    water.fillEllipse(25, 18, 12, 6);
    water.generateTexture("water", 50, 35);
    water.destroy();
  }

  createMushroomSprite() {
    const mushroom = this.add.graphics();

    // Mushroom stem
    mushroom.fillStyle(0xf5f5f5);
    mushroom.fillRect(22, 25, 6, 15);
    mushroom.fillStyle(0xe0e0e0);
    mushroom.fillRect(24, 25, 2, 15);

    // Mushroom cap
    mushroom.fillStyle(0xff5722);
    mushroom.fillEllipse(25, 20, 20, 12);

    // Mushroom cap shadow
    mushroom.fillStyle(0xd84315);
    mushroom.fillEllipse(27, 22, 18, 10);

    // Mushroom spots
    mushroom.fillStyle(0xffffff);
    mushroom.fillCircle(20, 18, 2);
    mushroom.fillCircle(28, 16, 1.5);
    mushroom.fillCircle(24, 22, 1);
    mushroom.fillCircle(30, 20, 1.5);

    mushroom.generateTexture("mushroom", 50, 45);
    mushroom.destroy();
  }

  createStumpSprite() {
    const stump = this.add.graphics();

    // Stump base (isometric cylinder)
    stump.fillStyle(0x8d6e63);
    stump.fillEllipse(25, 35, 30, 15);

    // Stump sides
    stump.fillStyle(0x5d4037);
    stump.fillRect(10, 20, 30, 15);

    // Stump top
    stump.fillStyle(0xa1887f);
    stump.fillEllipse(25, 20, 30, 15);

    // Tree rings
    stump.lineStyle(1, 0x6d4c41, 0.8);
    stump.strokeEllipse(25, 20, 24, 12);
    stump.strokeEllipse(25, 20, 18, 9);
    stump.strokeEllipse(25, 20, 12, 6);

    // Small mushroom growing on stump
    stump.fillStyle(0xff8a65);
    stump.fillEllipse(35, 18, 8, 5);
    stump.fillStyle(0xffffff);
    stump.fillCircle(35, 18, 1);

    stump.generateTexture("stump", 50, 45);
    stump.destroy();
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

    this.input.on("pointerdown", (pointer) => {
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

    // Mouse wheel zoom (optional)
    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Phaser.Math.Clamp(
        this.cameras.main.zoom * zoomFactor,
        0.5,
        2
      );
      this.cameras.main.setZoom(newZoom);
    });
  }

  setupEventListeners() {
    const feedBtn = document.getElementById("feed-btn");
    const decorateBtn = document.getElementById("decorate-btn");
    const rockBtn = document.getElementById("rock-btn");
    const waterBtn = document.getElementById("water-btn");
    const mushroomBtn = document.getElementById("mushroom-btn");
    const stumpBtn = document.getElementById("stump-btn");

    if (feedBtn) feedBtn.addEventListener("click", () => this.placeFeed());
    if (decorateBtn)
      decorateBtn.addEventListener("click", () =>
        this.placeDecoration("bouncePad")
      );
    if (rockBtn)
      rockBtn.addEventListener("click", () => this.placeDecoration("rock"));
    if (waterBtn)
      waterBtn.addEventListener("click", () => this.placeDecoration("water"));
    if (mushroomBtn)
      mushroomBtn.addEventListener("click", () =>
        this.placeDecoration("mushroom")
      );
    if (stumpBtn)
      stumpBtn.addEventListener("click", () => this.placeDecoration("stump"));

    // Collection modal functionality
    const collectionBtn = document.getElementById("collection-btn");
    const resetCollectionBtn = document.getElementById("reset-collection-btn");
    const collectionModal = document.getElementById("collection-modal");
    const closeBtn = document.querySelector(".close");

    if (collectionBtn) {
      collectionBtn.addEventListener("click", () => this.showCollectionModal());
    }

    if (resetCollectionBtn) {
      resetCollectionBtn.addEventListener("click", () => {
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
      foodSprite.setScale(1.5);
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
      const decorSprite = this.add.image(
        position.x,
        position.y,
        decoration.key
      );
      decorSprite.setInteractive();
      decorSprite.setDepth(position.y + 500); // Higher depth to ensure visibility

      // Make all decorations draggable
      decorSprite.setOrigin(0.5, 0.5);
      this.input.setDraggable(decorSprite);

      decorSprite.setScale(0);
      this.tweens.add({
        targets: decorSprite,
        scaleX: 1,
        scaleY: 1,
        duration: 500,
        ease: "Back.easeOut",
      });

      this.decorations.push({
        sprite: decorSprite,
        x: position.x,
        y: position.y,
        type: type,
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

    // Random size variation between 50% and 100%
    const randomScale = 0.5 + Math.random() * 0.5;

    // Create the main blob sprite first - try PNG first, then fallback, then emergency
    let sprite;
    let spriteSource = "unknown";

    try {
      // Try to use PNG sprite first
      if (this.textures.exists(type.key)) {
        sprite = this.add.image(position.x, position.y, type.key);
        spriteSource = "PNG";
      } else if (this.textures.exists(type.fallbackKey)) {
        // Use fallback sprite if PNG failed to load
        sprite = this.add.image(position.x, position.y, type.fallbackKey);
        spriteSource = "fallback";
      } else if (this.textures.exists(type.emergencyKey)) {
        // Use emergency sprite
        sprite = this.add.image(position.x, position.y, type.emergencyKey);
        spriteSource = "emergency";
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

  setNewTarget(blob) {
    if (blob.behavior === "sleeping") return;

    // Check if blob should try to sleep on a rock (20% chance)
    if (Math.random() < 0.2) {
      const nearbyRock = this.findNearbyRock(blob);
      if (nearbyRock && !this.isRockOccupied(nearbyRock)) {
        this.jumpOntoRock(blob, nearbyRock);
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

            // Add to collection immediately when discovered
            this.addBlobToCollection(blob);
            this.coins += 3;

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
      } else if (blob.personality === "playful" && item.type === "bouncePad") {
        blob.happiness = Math.min(100, blob.happiness + 0.15);
      } else if (blob.personality === "shy" && item.type === "mushroom") {
        blob.happiness = Math.min(100, blob.happiness + 0.12);
      } else if (blob.personality === "curious" && item.type === "water") {
        blob.happiness = Math.min(100, blob.happiness + 0.1);
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
        blob.statusIcon.setScale(0.8);
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
            scale: { start: 0.4, end: 0 },
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
    coinSprite.setScale(0.6); // Keep same visual size since coin texture is now twice as big
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
      localStorage.setItem(
        "blobGardenCollection",
        JSON.stringify(this.blobCollection)
      );
    } catch (error) {
      console.log("Could not save blob collection:", error);
    }
  }

  resetBlobCollection() {
    // Clear the in-memory collection
    this.blobCollection = {};

    try {
      // Remove from localStorage with multiple possible keys
      localStorage.removeItem("blobGardenCollection");
      localStorage.removeItem("blobCollection");
      localStorage.removeItem("blob_collection");

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
      scale: { start: 0.3, end: 0 },
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
