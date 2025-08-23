class LizardGame extends Phaser.Scene {
  constructor() {
    super({ key: "LizardGame" });

    this.coins = 100;
    this.blobs = [];
    this.decorations = [];
    this.food = [];
    this.particles = null;
    this.coinDrops = [];

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
      { key: "pinkBlob", name: "Rose Blob", rarity: "rare", color: 0xffb6c1 },
      {
        key: "purpleBlob",
        name: "Violet Blob",
        rarity: "rare",
        color: 0xdda0dd,
      },
      {
        key: "orangeBlob",
        name: "Peach Blob",
        rarity: "epic",
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
      plant: { key: "plant", cost: 25, color: 0x4caf50 },
      rock: { key: "rock", cost: 15, color: 0x795548 },
      water: { key: "water", cost: 20, color: 0x2196f3 },
      mushroom: { key: "mushroom", cost: 30, color: 0xff5722 },
      stump: { key: "stump", cost: 35, color: 0x8d6e63 },
    };
  }

  preload() {
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

    this.createBlobSprites();
    this.createDecorationSprites();
    this.createFoodSprite();
    this.createCoinSprite();
  }

  create() {
    this.gameWidth = this.cameras.main.width;
    this.gameHeight = this.cameras.main.height;

    // Set the scene background color to dark green
    this.cameras.main.setBackgroundColor("#1c1d17");

    // Add the garden background PNG at world center
    const background = this.add.image(0, 0, "garden_background");
    background.setOrigin(0.5, 0.5);

    // Don't scale down - show the image at full size or larger
    const minScale = 1.2; // Show image larger than original for better detail
    background.setScale(minScale);

    // Store background info for camera bounds
    this.backgroundWidth = background.width * minScale;
    this.backgroundHeight = background.height * minScale;

    // Set up camera controls
    this.setupCameraControls();

    this.particles = this.add.particles(0, 0, "sparkle", {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 100 },
      lifespan: 800,
      emitting: false,
    });

    this.setupEventListeners();
    this.updateUI();

    this.time.delayedCall(2000, () => this.spawnBlob());

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
  }

  createBlobSprites() {
    // List of blob types that use PNG files instead of vector graphics
    const pngBlobTypes = [
      "lavenderBlob",
      "pinkBlob",
      "orangeBlob",
      "blueBlob",
      "purpleBlob",
      "rainbowBlob",
    ];

    this.blobTypes.forEach((type) => {
      // Skip creating vector graphics for PNG blob types
      if (!pngBlobTypes.includes(type.key)) {
        const graphics = this.add.graphics();

        graphics.fillStyle(type.color);
        graphics.fillEllipse(20, 20, 32, 24);

        const shadowColor = this.getDarkerColor(type.color);
        graphics.fillStyle(shadowColor);
        graphics.fillEllipse(22, 22, 30, 20);

        const highlightColor = this.getLighterColor(type.color);
        graphics.fillStyle(highlightColor);
        graphics.fillEllipse(18, 18, 24, 16);

        graphics.fillStyle(0x000000);
        graphics.fillCircle(16, 18, 2.5);
        graphics.fillCircle(24, 18, 2.5);

        if (type.key === "rainbowBlob") {
          graphics.fillStyle(0xff9800);
          graphics.fillRect(8, 20, 24, 2);
          graphics.fillStyle(0xffeb3b);
          graphics.fillRect(8, 23, 24, 2);
          graphics.fillStyle(0x4caf50);
          graphics.fillRect(8, 26, 24, 2);
        }

        graphics.generateTexture(type.key, 44, 40);
        graphics.destroy();
      }

      this.createUISprite(type);
    });

    const sparkle = this.add.graphics();
    sparkle.fillStyle(0xffd700);
    sparkle.fillCircle(6, 6, 4);
    sparkle.fillStyle(0xffffff);
    sparkle.fillCircle(6, 6, 2);
    sparkle.generateTexture("sparkle", 12, 12);
    sparkle.destroy();
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
    this.createPlantSprite();
    this.createRockSprite();
    this.createWaterSprite();
    this.createMushroomSprite();
    this.createStumpSprite();
  }

  createPlantSprite() {
    const plant = this.add.graphics();
    plant.fillStyle(0x8d6e63);
    plant.fillRect(20, 30, 6, 12);
    plant.fillStyle(0x6d4c41);
    plant.fillRect(26, 30, 3, 12);
    plant.fillStyle(0x4caf50);
    plant.fillEllipse(23, 22, 20, 12);
    plant.fillStyle(0x388e3c);
    plant.fillEllipse(25, 24, 20, 8);
    plant.fillStyle(0x66bb6a);
    plant.fillEllipse(20, 20, 8, 5);
    plant.fillStyle(0x2e7d32);
    plant.fillCircle(28, 22, 2);
    plant.fillCircle(18, 24, 1.5);
    plant.fillCircle(26, 26, 1.5);
    plant.generateTexture("plant", 50, 45);
    plant.destroy();
  }

  createRockSprite() {
    // Rock sprite is now loaded as PNG in preload()
    // No need to generate it here
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
    food.fillStyle(0x8d6e63);
    food.fillEllipse(6, 8, 8, 12);
    food.fillStyle(0x5d4037);
    food.fillCircle(6, 5, 2);
    food.generateTexture("bug", 12, 16);
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

  createBlobShadow() {
    const shadow = this.add.graphics();

    // Create a very obvious red shadow for debugging - if this doesn't show, there's a fundamental issue
    shadow.fillStyle(0xff0000, 1.0); // Bright red with full opacity for debugging

    // Draw a large, obvious shape
    shadow.fillRect(10, 10, 50, 50); // Simple rectangle that should definitely be visible

    shadow.generateTexture("blobShadow", 70, 70);
    shadow.destroy();
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

  drawIsometricCube(graphics, x, y, width, height, depth) {
    graphics.fillStyle(0x999999);
    graphics.beginPath();
    graphics.moveTo(x, y);
    graphics.lineTo(x + width / 2, y - height / 2);
    graphics.lineTo(x, y - height);
    graphics.lineTo(x - width / 2, y - height / 2);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(0x666666);
    graphics.beginPath();
    graphics.moveTo(x - width / 2, y - height / 2);
    graphics.lineTo(x, y - height);
    graphics.lineTo(x, y - height + depth);
    graphics.lineTo(x - width / 2, y - height / 2 + depth);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(0x777777);
    graphics.beginPath();
    graphics.moveTo(x + width / 2, y - height / 2);
    graphics.lineTo(x, y - height);
    graphics.lineTo(x, y - height + depth);
    graphics.lineTo(x + width / 2, y - height / 2 + depth);
    graphics.closePath();
    graphics.fillPath();
  }

  setupEventListeners() {
    const feedBtn = document.getElementById("feed-btn");
    const decorateBtn = document.getElementById("decorate-btn");
    const rockBtn = document.getElementById("rock-btn");
    const waterBtn = document.getElementById("water-btn");

    if (feedBtn) feedBtn.addEventListener("click", () => this.placeFeed());
    if (decorateBtn)
      decorateBtn.addEventListener("click", () =>
        this.placeDecoration("plant")
      );
    if (rockBtn)
      rockBtn.addEventListener("click", () => this.placeDecoration("rock"));
    if (waterBtn)
      waterBtn.addEventListener("click", () => this.placeDecoration("water"));

    // Click handling is now integrated into camera drag controls

    this.input.on("dragstart", (pointer, gameObject) => {
      this.isDraggingObject = true;
      this.isDraggingCamera = false;
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      // For rocks, position the center of the sprite at the mouse cursor
      // Convert pointer coordinates to world coordinates
      const worldX = pointer.x + this.cameras.main.scrollX;
      const worldY = pointer.y + this.cameras.main.scrollY;

      const validatedPosition = this.validatePositionInDiamond(worldX, worldY);
      gameObject.x = validatedPosition.x;
      gameObject.y = validatedPosition.y;

      const decoration = this.decorations.find((d) => d.sprite === gameObject);
      if (decoration) {
        decoration.x = validatedPosition.x;
        decoration.y = validatedPosition.y;
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

      if (type === "rock") {
        // Center the origin for rocks so they drag from the center
        decorSprite.setOrigin(0.5, 0.5);
        this.input.setDraggable(decorSprite);
      }

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
        this.time.delayedCall(Phaser.Math.Between(1000, 4000), () =>
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

    // Create the main blob sprite first
    const sprite = this.add.image(position.x, position.y, type.key);
    sprite.setScale(randomScale);
    sprite.setInteractive();
    sprite.setDepth(position.y + 1000);

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
      happiness: 50,
      speed: 0.8 + Math.random() * 0.4,
      lastFed: Date.now(),
      behavior: "wandering",
      moveTween: null,
      originalScale: randomScale,
    };

    this.blobs.push(blob);
    this.updateUI();
    this.particles.emitParticleAt(position.x, position.y, 10);

    this.setNewTarget(blob);
  }

  getBlobRarity() {
    const rand = Math.random();
    if (rand < 0.6) return "common";
    if (rand < 0.85) return "rare";
    if (rand < 0.97) return "epic";
    return "legendary";
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
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  getRandomGroundPosition() {
    // Centered coordinate system (background is at 0,0)
    const platformCenterX = 0;
    const platformCenterY = 0;
    const platformWidth = 500; // Matches the grass diamond width
    const platformHeight = 250; // Matches the grass diamond height

    let x, y;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      const randomX =
        platformCenterX + (Math.random() - 0.5) * platformWidth * 0.8;
      const randomY =
        platformCenterY + (Math.random() - 0.5) * platformHeight * 0.8;

      if (
        this.isPointInDiamond(
          randomX,
          randomY,
          platformCenterX,
          platformCenterY,
          platformWidth,
          platformHeight
        )
      ) {
        x = randomX;
        y = randomY;
        break;
      }
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      x = platformCenterX;
      y = platformCenterY;
    }

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
    // Expanded ground plane for rock dragging - larger than spawn area
    const platformCenterX = 0;
    const platformCenterY = 0;
    const platformWidth = 700; // Increased from 500
    const platformHeight = 350; // Increased from 250

    if (
      this.isPointInDiamond(
        x,
        y,
        platformCenterX,
        platformCenterY,
        platformWidth,
        platformHeight
      )
    ) {
      return { x, y };
    }

    const dx = x - platformCenterX;
    const dy = y - platformCenterY;
    const halfWidth = platformWidth / 2;
    const halfHeight = platformHeight / 2;
    const scale = Math.min(
      1,
      1 / (Math.abs(dx) / halfWidth + Math.abs(dy) / halfHeight)
    );

    return {
      x: platformCenterX + dx * scale * 0.8,
      y: platformCenterY + dy * scale * 0.8,
    };
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
            blob.happiness = Math.min(100, blob.happiness + 25);
            blob.lastFed = Date.now();
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
      blob.happiness = Math.max(0, blob.happiness - 0.5);
    });
    this.updateUI();
  }

  generatePassiveCoins() {
    this.blobs.forEach((blob) => {
      if (blob.happiness > 70) {
        this.coins += 1;
      }
    });
    this.updateUI();
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
    coinSprite.setDepth(position.y - 5);

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
    const delay = Phaser.Math.Between(20000, 40000);
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

    const lizardList = document.getElementById("lizard-list");
    lizardList.innerHTML = "";

    this.blobs.forEach((blob) => {
      const card = document.createElement("div");
      card.className = "lizard-card";

      // Create image element instead of emoji
      const blobImage = document.createElement("img");
      blobImage.className = "lizard-image";

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
      name.className = "lizard-name";
      name.textContent = blob.name;

      const happiness = document.createElement("div");
      happiness.className = "lizard-happiness";
      happiness.textContent = `Happiness: ${Math.round(blob.happiness)}%`;

      card.appendChild(blobImage);
      card.appendChild(name);
      card.appendChild(happiness);
      lizardList.appendChild(card);
    });
  }
}

// Initialize the game
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "phaser-game",
  scene: LizardGame,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);
