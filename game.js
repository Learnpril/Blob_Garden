class LizardGame extends Phaser.Scene {
    constructor() {
        super({ key: 'LizardGame' });
        
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
            { key: 'greenBlob', name: 'Green Blob', rarity: 'common', color: 0x4CAF50 },
            { key: 'blueBlob', name: 'Blue Blob', rarity: 'common', color: 0x2196F3 },
            { key: 'pinkBlob', name: 'Pink Blob', rarity: 'rare', color: 0xE91E63 },
            { key: 'purpleBlob', name: 'Purple Blob', rarity: 'rare', color: 0x9C27B0 },
            { key: 'orangeBlob', name: 'Orange Blob', rarity: 'epic', color: 0xFF9800 },
            { key: 'rainbowBlob', name: 'Rainbow Blob', rarity: 'legendary', color: 0xFF6B6B }
        ];
        
        this.decorationTypes = {
            plant: { key: 'plant', cost: 25, color: 0x4CAF50 },
            rock: { key: 'rock', cost: 15, color: 0x795548 },
            water: { key: 'water', cost: 20, color: 0x2196F3 },
            mushroom: { key: 'mushroom', cost: 30, color: 0xFF5722 },
            stump: { key: 'stump', cost: 35, color: 0x8D6E63 }
        };
    }
    
    preload() {
        this.createBlobSprites();
        this.createDecorationSprites();
        this.createFoodSprite();
        this.createCoinSprite();
        this.createBackgroundTexture();
    }
    
    create() {
        this.gameWidth = this.cameras.main.width;
        this.gameHeight = this.cameras.main.height;
        
        this.add.image(this.gameWidth / 2, this.gameHeight / 2, 'background');
        
        this.particles = this.add.particles(0, 0, 'sparkle', {
            scale: { start: 0.3, end: 0 },
            speed: { min: 50, max: 100 },
            lifespan: 800,
            emitting: false
        });
        
        this.setupEventListeners();
        this.updateUI();
        
        this.time.delayedCall(2000, () => this.spawnBlob());
        
        this.time.addEvent({
            delay: 1000,
            callback: this.updateHappiness,
            callbackScope: this,
            loop: true
        });
        
        this.time.addEvent({
            delay: 5000,
            callback: this.generatePassiveCoins,
            callbackScope: this,
            loop: true
        });
        
        this.scheduleNextCoinDrop();
        this.scheduleHabitatEvaluation();
    }
    
    createBlobSprites() {
        this.blobTypes.forEach(type => {
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
            
            if (type.key === 'rainbowBlob') {
                graphics.fillStyle(0xFF9800);
                graphics.fillRect(8, 20, 24, 2);
                graphics.fillStyle(0xFFEB3B);
                graphics.fillRect(8, 23, 24, 2);
                graphics.fillStyle(0x4CAF50);
                graphics.fillRect(8, 26, 24, 2);
            }
            
            graphics.generateTexture(type.key, 44, 40);
            graphics.destroy();
            
            this.createUISprite(type);
        });
        
        const sparkle = this.add.graphics();
        sparkle.fillStyle(0xFFD700);
        sparkle.fillCircle(6, 6, 4);
        sparkle.fillStyle(0xFFFFFF);
        sparkle.fillCircle(6, 6, 2);
        sparkle.generateTexture('sparkle', 12, 12);
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
        
        if (type.key === 'rainbowBlob') {
            uiGraphics.fillStyle(0xFF9800);
            uiGraphics.fillRect(6, 15, 18, 1);
            uiGraphics.fillStyle(0xFFEB3B);
            uiGraphics.fillRect(6, 17, 18, 1);
            uiGraphics.fillStyle(0x4CAF50);
            uiGraphics.fillRect(6, 19, 18, 1);
        }
        
        uiGraphics.generateTexture(type.key + '_ui', 30, 27);
        uiGraphics.destroy();
    }
    
    getDarkerColor(color) {
        const colorMap = {
            0x4CAF50: 0x388E3C, 0x2196F3: 0x1976D2, 0xE91E63: 0xC2185B,
            0x9C27B0: 0x7B1FA2, 0xFF9800: 0xF57C00, 0xFF6B6B: 0xE53935
        };
        return colorMap[color] || color;
    }
    
    getLighterColor(color) {
        const colorMap = {
            0x4CAF50: 0x66BB6A, 0x2196F3: 0x42A5F5, 0xE91E63: 0xEC407A,
            0x9C27B0: 0xAB47BC, 0xFF9800: 0xFFA726, 0xFF6B6B: 0xFF8A80
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
        
        // Plant pot/base
        plant.fillStyle(0x8D6E63);
        plant.fillEllipse(25, 38, 20, 10);
        plant.fillStyle(0x6D4C41);
        plant.fillRect(15, 33, 20, 8);
        
        // Main plant stem
        plant.fillStyle(0x4CAF50);
        plant.fillRect(23, 20, 4, 18);
        
        // Large leaves
        plant.fillStyle(0x66BB6A);
        plant.fillEllipse(18, 22, 12, 8);
        plant.fillEllipse(32, 20, 12, 8);
        plant.fillEllipse(25, 15, 14, 9);
        
        // Leaf details
        plant.fillStyle(0x4CAF50);
        plant.fillEllipse(18, 22, 8, 5);
        plant.fillEllipse(32, 20, 8, 5);
        plant.fillEllipse(25, 15, 10, 6);
        
        // Small flowers
        plant.fillStyle(0xFF6B9D);
        plant.fillCircle(20, 18, 2);
        plant.fillCircle(30, 16, 2);
        plant.fillCircle(25, 12, 2);
        
        // Flower centers
        plant.fillStyle(0xFFEB3B);
        plant.fillCircle(20, 18, 1);
        plant.fillCircle(30, 16, 1);
        plant.fillCircle(25, 12, 1);
        
        plant.generateTexture('plant', 50, 45);
        plant.destroy();
    }
    
    createRockSprite() {
        const rock = this.add.graphics();
        this.drawIsometricCube(rock, 25, 20, 35, 15, 20);
        rock.fillStyle(0x5D4037);
        rock.fillEllipse(20, 15, 8, 4);
        rock.fillEllipse(30, 18, 6, 3);
        rock.lineStyle(1, 0x3E2723, 0.8);
        rock.beginPath();
        rock.moveTo(15, 18);
        rock.lineTo(35, 22);
        rock.strokePath();
        rock.generateTexture('rock', 50, 40);
        rock.destroy();
    }
    
    createWaterSprite() {
        const water = this.add.graphics();
        water.fillStyle(0x2196F3);
        water.beginPath();
        water.moveTo(25, 10);
        water.lineTo(40, 20);
        water.lineTo(25, 30);
        water.lineTo(10, 20);
        water.closePath();
        water.fillPath();
        water.fillStyle(0x1976D2);
        water.beginPath();
        water.moveTo(25, 30);
        water.lineTo(40, 20);
        water.lineTo(42, 22);
        water.lineTo(27, 32);
        water.closePath();
        water.fillPath();
        water.fillStyle(0x64B5F6);
        water.fillEllipse(25, 18, 12, 6);
        water.generateTexture('water', 50, 35);
        water.destroy();
    }
    
    createMushroomSprite() {
        const mushroom = this.add.graphics();
        
        // Mushroom stem
        mushroom.fillStyle(0xF5F5F5);
        mushroom.fillRect(22, 25, 6, 15);
        mushroom.fillStyle(0xE0E0E0);
        mushroom.fillRect(24, 25, 2, 15);
        
        // Mushroom cap
        mushroom.fillStyle(0xFF5722);
        mushroom.fillEllipse(25, 20, 20, 12);
        
        // Mushroom cap shadow
        mushroom.fillStyle(0xD84315);
        mushroom.fillEllipse(27, 22, 18, 10);
        
        // Mushroom spots
        mushroom.fillStyle(0xFFFFFF);
        mushroom.fillCircle(20, 18, 2);
        mushroom.fillCircle(28, 16, 1.5);
        mushroom.fillCircle(24, 22, 1);
        mushroom.fillCircle(30, 20, 1.5);
        
        mushroom.generateTexture('mushroom', 50, 45);
        mushroom.destroy();
    }
    
    createStumpSprite() {
        const stump = this.add.graphics();
        
        // Stump base (isometric cylinder)
        stump.fillStyle(0x8D6E63);
        stump.fillEllipse(25, 35, 30, 15);
        
        // Stump sides
        stump.fillStyle(0x5D4037);
        stump.fillRect(10, 20, 30, 15);
        
        // Stump top
        stump.fillStyle(0xA1887F);
        stump.fillEllipse(25, 20, 30, 15);
        
        // Tree rings
        stump.fillStyle(0x8D6E63);
        stump.strokeStyle(0x6D4C41, 1);
        stump.strokeEllipse(25, 20, 24, 12);
        stump.strokeEllipse(25, 20, 18, 9);
        stump.strokeEllipse(25, 20, 12, 6);
        
        // Small mushroom growing on stump
        stump.fillStyle(0xFF8A65);
        stump.fillEllipse(35, 18, 8, 5);
        stump.fillStyle(0xFFFFFF);
        stump.fillCircle(35, 18, 1);
        
        stump.generateTexture('stump', 50, 45);
        stump.destroy();
    }
    
    createFoodSprite() {
        const food = this.add.graphics();
        food.fillStyle(0x8D6E63);
        food.fillEllipse(6, 8, 8, 12);
        food.fillStyle(0x5D4037);
        food.fillCircle(6, 5, 2);
        food.generateTexture('bug', 12, 16);
        food.destroy();
    }
    
    createCoinSprite() {
        const coin = this.add.graphics();
        coin.fillStyle(0xFFD700);
        coin.fillCircle(20, 20, 16);
        coin.fillStyle(0xFFA500);
        coin.fillCircle(20, 20, 11);
        coin.fillStyle(0xFFD700);
        coin.fillCircle(20, 20, 6);
        coin.generateTexture('coin', 40, 40);
        coin.destroy();
    }    

    createBackgroundTexture() {
        const bg = this.add.graphics();
        
        // Sky gradient background
        bg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x98FB98, 0x98FB98, 1);
        bg.fillRect(0, 0, 800, 600);
        
        const platformCenterX = 400;
        const platformCenterY = 350;
        const platformWidth = 750;
        const platformHeight = 400;
        
        // Main grass platform (isometric diamond)
        bg.fillStyle(0x7CB342);
        bg.beginPath();
        bg.moveTo(platformCenterX, platformCenterY - platformHeight / 2);
        bg.lineTo(platformCenterX + platformWidth / 2, platformCenterY);
        bg.lineTo(platformCenterX, platformCenterY + platformHeight / 2);
        bg.lineTo(platformCenterX - platformWidth / 2, platformCenterY);
        bg.closePath();
        bg.fillPath();
        
        // Platform depth/shadow
        bg.fillStyle(0x689F38);
        bg.beginPath();
        bg.moveTo(platformCenterX + platformWidth / 2, platformCenterY);
        bg.lineTo(platformCenterX, platformCenterY + platformHeight / 2);
        bg.lineTo(platformCenterX + 20, platformCenterY + platformHeight / 2 + 20);
        bg.lineTo(platformCenterX + platformWidth / 2 + 20, platformCenterY + 20);
        bg.closePath();
        bg.fillPath();
        
        // Wooden fence posts
        bg.fillStyle(0x8D6E63);
        for (let i = 0; i < 20; i++) {
            const progress = i / 19;
            const x = platformCenterX - platformWidth/2 + progress * platformWidth;
            const y = platformCenterY - platformHeight/2 + Math.abs(progress - 0.5) * 20;
            
            if (i % 3 === 0) {
                bg.fillRect(x - 2, y - 15, 4, 20);
            }
        }
        
        // Stone path
        const stones = [
            { x: platformCenterX - 60, y: platformCenterY - 40 },
            { x: platformCenterX - 20, y: platformCenterY - 20 },
            { x: platformCenterX + 20, y: platformCenterY },
            { x: platformCenterX + 60, y: platformCenterY + 20 },
            { x: platformCenterX + 100, y: platformCenterY + 40 }
        ];
        
        bg.fillStyle(0xE0E0E0);
        stones.forEach(stone => {
            bg.fillEllipse(stone.x, stone.y, 35, 25);
        });
        
        // Large tree
        const treeX = platformCenterX - 100;
        const treeY = platformCenterY - 120;
        
        // Tree trunk
        bg.fillStyle(0x8D6E63);
        bg.fillRect(treeX - 8, treeY + 20, 16, 40);
        
        // Tree canopy
        bg.fillStyle(0x4CAF50);
        bg.fillCircle(treeX, treeY, 45);
        bg.fillStyle(0x66BB6A);
        bg.fillCircle(treeX - 10, treeY - 5, 35);
        
        // Bushes
        bg.fillStyle(0x4CAF50);
        bg.fillEllipse(platformCenterX + 200, platformCenterY - 80, 40, 25);
        bg.fillEllipse(platformCenterX - 220, platformCenterY + 60, 40, 25);
        
        // Small tree
        bg.fillStyle(0x8D6E63);
        bg.fillRect(platformCenterX + 180 - 4, platformCenterY + 100 + 10, 8, 20);
        bg.fillStyle(0x4CAF50);
        bg.fillCircle(platformCenterX + 180, platformCenterY + 100, 20);
        
        // Flower patches
        bg.fillStyle(0xFF6B9D);
        bg.fillEllipse(platformCenterX - 80, platformCenterY - 60, 30, 20);
        bg.fillStyle(0xFFEB3B);
        bg.fillEllipse(platformCenterX + 120, platformCenterY - 20, 30, 20);
        
        // Grass details
        bg.fillStyle(0x8BC34A);
        for (let i = 0; i < 50; i++) {
            const x = platformCenterX + (Math.random() - 0.5) * 600;
            const y = platformCenterY + (Math.random() - 0.5) * 300;
            bg.fillEllipse(x, y, 6, 3);
        }
        
        bg.generateTexture('background', 800, 600);
        bg.destroy();
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
        const feedBtn = document.getElementById('feed-btn');
        const decorateBtn = document.getElementById('decorate-btn');
        const rockBtn = document.getElementById('rock-btn');
        const waterBtn = document.getElementById('water-btn');
        const mushroomBtn = document.getElementById('mushroom-btn');
        const stumpBtn = document.getElementById('stump-btn');
        
        if (feedBtn) feedBtn.addEventListener('click', () => this.placeFeed());
        if (decorateBtn) decorateBtn.addEventListener('click', () => this.placeDecoration('plant'));
        if (rockBtn) rockBtn.addEventListener('click', () => this.placeDecoration('rock'));
        if (waterBtn) waterBtn.addEventListener('click', () => this.placeDecoration('water'));
        if (mushroomBtn) mushroomBtn.addEventListener('click', () => this.placeDecoration('mushroom'));
        if (stumpBtn) stumpBtn.addEventListener('click', () => this.placeDecoration('stump'));
        
        this.input.on('pointerdown', (pointer) => {
            this.handleCanvasClick(pointer.x, pointer.y);
        });
        
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            const validatedPosition = this.validatePositionInDiamond(dragX, dragY);
            gameObject.x = validatedPosition.x;
            gameObject.y = validatedPosition.y;
            
            const decoration = this.decorations.find(d => d.sprite === gameObject);
            if (decoration) {
                decoration.x = validatedPosition.x;
                decoration.y = validatedPosition.y;
            }
        });
    }
    
    placeFeed() {
        if (this.coins >= 10) {
            this.coins -= 10;
            
            const position = this.getRandomGroundPosition();
            const foodSprite = this.add.image(position.x, position.y, 'bug');
            foodSprite.setScale(1.5);
            foodSprite.setInteractive();
            
            this.tweens.add({
                targets: foodSprite,
                scaleX: 1.8,
                scaleY: 1.8,
                duration: 200,
                yoyo: true,
                ease: 'Power2'
            });
            
            this.food.push({
                sprite: foodSprite,
                x: position.x,
                y: position.y,
                eaten: false
            });
            
            this.updateUI();
        }
    }
    
    placeDecoration(type) {
        const decoration = this.decorationTypes[type];
        
        if (this.coins >= decoration.cost) {
            this.coins -= decoration.cost;
            
            const position = this.getRandomGroundPosition();
            const decorSprite = this.add.image(position.x, position.y, decoration.key);
            decorSprite.setInteractive();
            decorSprite.setDepth(position.y);
            
            if (type === 'rock') {
                this.input.setDraggable(decorSprite);
            }
            
            decorSprite.setScale(0);
            this.tweens.add({
                targets: decorSprite,
                scaleX: 1,
                scaleY: 1,
                duration: 500,
                ease: 'Back.easeOut'
            });
            
            this.decorations.push({
                sprite: decorSprite,
                x: position.x,
                y: position.y,
                type: type
            });
            
            this.updateUI();
            
            let attractionChance = 0.4;
            if (this.blobs.length < 3) attractionChance = 0.6;
            if (this.blobs.length === 0) attractionChance = 0.8;
            
            if (Math.random() < attractionChance) {
                this.time.delayedCall(Phaser.Math.Between(1000, 4000), () => this.spawnBlob());
            }
        }
    }
    
    spawnBlob() {
        const rarity = this.getBlobRarity();
        const availableTypes = this.blobTypes.filter(t => t.rarity === rarity);
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        
        const position = this.getRandomGroundPosition();
        const sprite = this.add.image(position.x, position.y, type.key);
        sprite.setScale(1);
        sprite.setInteractive();
        sprite.setDepth(position.y + 1000);
        
        const blob = {
            id: Date.now() + Math.random(),
            sprite: sprite,
            x: position.x,
            y: position.y,
            targetX: position.x,
            targetY: position.y,
            name: this.generateBlobName(),
            type: type.name,
            happiness: 50,
            speed: 0.8 + Math.random() * 0.4,
            lastFed: Date.now(),
            behavior: 'wandering',
            moveTween: null,
            originalScale: 1
        };
        
        this.blobs.push(blob);
        this.updateUI();
        this.particles.emitParticleAt(position.x, position.y, 10);
        
        this.setNewTarget(blob);
    }
    
    getBlobRarity() {
        const rand = Math.random();
        if (rand < 0.6) return 'common';
        if (rand < 0.85) return 'rare';
        if (rand < 0.97) return 'epic';
        return 'legendary';
    }
    
    generateBlobName() {
        const names = ['Blobby', 'Squish', 'Gooey', 'Bouncy', 'Wiggly', 'Squishy', 'Jelly', 'Pudding'];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    getRandomGroundPosition() {
        const platformCenterX = 400;
        const platformCenterY = 350;
        const platformWidth = 750;
        const platformHeight = 400;
        
        let x, y;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            const randomX = platformCenterX + (Math.random() - 0.5) * platformWidth * 0.9;
            const randomY = platformCenterY + (Math.random() - 0.5) * platformHeight * 0.9;
            
            if (this.isPointInDiamond(randomX, randomY, platformCenterX, platformCenterY, platformWidth, platformHeight)) {
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
        
        return (dx / halfWidth + dy / halfHeight) <= 1;
    }
    
    validatePositionInDiamond(x, y) {
        const platformCenterX = 400;
        const platformCenterY = 350;
        const platformWidth = 750;
        const platformHeight = 400;
        
        if (this.isPointInDiamond(x, y, platformCenterX, platformCenterY, platformWidth, platformHeight)) {
            return { x, y };
        }
        
        const dx = x - platformCenterX;
        const dy = y - platformCenterY;
        const halfWidth = platformWidth / 2;
        const halfHeight = platformHeight / 2;
        const scale = Math.min(1, 1 / (Math.abs(dx) / halfWidth + Math.abs(dy) / halfHeight));
        
        return {
            x: platformCenterX + dx * scale * 0.9,
            y: platformCenterY + dy * scale * 0.9
        };
    }
    
    setNewTarget(blob) {
        if (blob.behavior === 'sleeping') return;
        
        const position = this.getRandomGroundPosition();
        blob.targetX = position.x;
        blob.targetY = position.y;
        blob.behavior = 'wandering';
        
        if (blob.moveTween) {
            blob.moveTween.stop();
        }
        
        const validatedTarget = this.validatePositionInDiamond(blob.targetX, blob.targetY);
        blob.targetX = validatedTarget.x;
        blob.targetY = validatedTarget.y;
        
        const distance = Phaser.Math.Distance.Between(blob.x, blob.y, blob.targetX, blob.targetY);
        const duration = Math.max(2000, (distance / blob.speed) * 50);
        
        this.tweens.add({
            targets: blob.sprite,
            scaleX: blob.originalScale * 1.05,
            scaleY: blob.originalScale * 1.1,
            duration: 600,
            yoyo: true,
            repeat: Math.floor(duration / 1200),
            ease: 'Bounce.easeOut'
        });
        
        blob.moveTween = this.tweens.add({
            targets: blob.sprite,
            x: blob.targetX,
            y: blob.targetY,
            duration: duration,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                blob.x = blob.sprite.x;
                blob.y = blob.sprite.y;
            },
            onComplete: () => {
                this.time.delayedCall(Phaser.Math.Between(2000, 5000), () => {
                    if (blob.sprite && blob.sprite.active) {
                        this.setNewTarget(blob);
                    }
                });
            }
        });
    }
    
    handleCanvasClick(x, y) {
        try {
            let coinCollected = false;
            
            for (let i = this.coinDrops.length - 1; i >= 0; i--) {
                const coinDrop = this.coinDrops[i];
                if (!coinDrop.collected) {
                    const distance = Phaser.Math.Distance.Between(x, y, coinDrop.x, coinDrop.y);
                    
                    if (distance < 25) {
                        coinDrop.collected = true;
                        coinCollected = true;
                        
                        this.coins += coinDrop.value;
                        this.particles.emitParticleAt(coinDrop.x, coinDrop.y, 8);
                        this.showFloatingText(`+${coinDrop.value}`, coinDrop.x, coinDrop.y - 20, 0xFFD700);
                        
                        this.tweens.add({
                            targets: coinDrop.sprite,
                            scaleX: 2,
                            scaleY: 2,
                            alpha: 0,
                            duration: 300,
                            ease: 'Power2',
                            onComplete: () => {
                                if (coinDrop.sprite) {
                                    coinDrop.sprite.destroy();
                                }
                                const coinIndex = this.coinDrops.indexOf(coinDrop);
                                if (coinIndex > -1) {
                                    this.coinDrops.splice(coinIndex, 1);
                                }
                            }
                        });
                        
                        this.updateUI();
                        break;
                    }
                }
            }
            
            if (!coinCollected) {
                this.blobs.forEach(blob => {
                    const distance = Phaser.Math.Distance.Between(x, y, blob.x, blob.y);
                    
                    if (distance < 30) {
                        this.tweens.add({
                            targets: blob.sprite,
                            scaleX: blob.originalScale * 1.6,
                            scaleY: blob.originalScale * 0.6,
                            duration: 120,
                            yoyo: true,
                            ease: 'Power2',
                            onComplete: () => {
                                blob.sprite.scaleX = blob.originalScale;
                                blob.sprite.scaleY = blob.originalScale;
                            }
                        });
                        
                        this.particles.emitParticleAt(blob.x, blob.y - 20, 2);
                    }
                });
            }
        } catch (error) {
            console.error('Error in handleCanvasClick:', error);
        }
    }
    
    update() {
        this.blobs.forEach(blob => {
            for (let i = this.food.length - 1; i >= 0; i--) {
                const food = this.food[i];
                if (!food.eaten) {
                    const distance = Phaser.Math.Distance.Between(blob.x, blob.y, food.x, food.y);
                    
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
                            }
                        });
                        
                        this.tweens.add({
                            targets: blob.sprite,
                            scaleX: blob.originalScale * 1.3,
                            scaleY: blob.originalScale * 1.3,
                            duration: 300,
                            yoyo: true,
                            repeat: 1,
                            ease: 'Bounce.easeOut',
                            onComplete: () => {
                                blob.sprite.scaleX = blob.originalScale;
                                blob.sprite.scaleY = blob.originalScale;
                            }
                        });
                        
                        this.particles.emitParticleAt(blob.x, blob.y, 5);
                        this.showFloatingText('Yum!', blob.x, blob.y - 40, 0xFFD700);
                        
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
        this.blobs.forEach(blob => {
            blob.happiness = Math.max(0, blob.happiness - 0.5);
        });
        this.updateUI();
    }
    
    generatePassiveCoins() {
        this.blobs.forEach(blob => {
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
        const coinSprite = this.add.image(position.x, position.y, 'coin');
        coinSprite.setScale(0.6);
        coinSprite.setDepth(position.y - 5);
        
        this.coinDrops.push({
            x: position.x,
            y: position.y,
            value: value,
            sprite: coinSprite,
            collected: false
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
            fontSize: '16px',
            fill: `#${color.toString(16).padStart(6, '0')}`,
            fontWeight: 'bold'
        });
        
        this.tweens.add({
            targets: textObj,
            y: y - 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => textObj.destroy()
        });
    }
    
    updateUI() {
        document.getElementById('coins').textContent = this.coins;
        document.getElementById('lizard-count').textContent = this.blobs.length;
        
        const lizardList = document.getElementById('lizard-list');
        lizardList.innerHTML = '';
        
        this.blobs.forEach(blob => {
            const card = document.createElement('div');
            card.className = 'lizard-card';
            
            const emoji = document.createElement('div');
            emoji.className = 'lizard-emoji';
            emoji.textContent = '🟢';
            
            const name = document.createElement('div');
            name.className = 'lizard-name';
            name.textContent = blob.name;
            
            const happiness = document.createElement('div');
            happiness.className = 'lizard-happiness';
            happiness.textContent = `Happiness: ${Math.round(blob.happiness)}%`;
            
            card.appendChild(emoji);
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
    parent: 'phaser-game',
    scene: LizardGame,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

const game = new Phaser.Game(config);