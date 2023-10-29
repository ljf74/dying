import { Bat, nextParticle, RubbleParticle, StarParticle } from "./particle.js";
import { PuzzleState } from "./puzzlestate.js";
import { Snowfall } from "./snowfall.js";
import { COLUMN_COUNT, createTerrainMap } from "./terrainmap.js";
import { RGBA } from "./vector.js";
const SOLID_TILES = [1, 3, 8, 9, 13];
const DYNAMIC_TILES = [4, 10];
const STATE_BUFFER_MAX = 64;
const CLEAR_WAIT_TIME = 120;
const START_TIME = 30;
export class Stage {
    constructor(initialMap, index) {
        this.moveTimer = 0.0;
        this.moving = false;
        this.falling = false;
        this.climbing = false;
        this.rubbleSpawned = false;
        this.boulderMoved = false;
        this.boulderFalling = false;
        this.staticAnimationTimer = 0.0;
        this.startTimer = START_TIME;
        this.cleared = false;
        this.clearTimer = 0.0;
        this.width = 10;
        this.height = 9;
        this.canBeInterrupted = () => !this.cleared && this.startTimer <= 0;
        this.baseTilemap = Array.from(initialMap);
        this.states = new Array();
        this.activeState = new PuzzleState(this.baseTilemap, this.baseTilemap.map(v => Number(DYNAMIC_TILES.includes(v)) * v), this.width, this.height, 0 /* Flip.None */);
        this.states.push(this.activeState.clone());
        this.oldState = this.activeState.clone();
        this.moveData = (new Array(this.width * this.height)).fill(0 /* Direction.None */);
        this.terrainMap = createTerrainMap(this.baseTilemap, this.width, this.height);
        this.stageIndex = index;
        this.stars = new Array();
        this.rubble = new Array();
        this.bats = new Array();
        this.snowfall = new Snowfall();
    }
    isReserved(x, y) {
        let bottom = this.activeState.getTile(0, x, y);
        let top = this.activeState.getTile(1, x, y);
        return SOLID_TILES.includes(bottom) ||
            top == 4 || top == 10;
    }
    checkLadder(x, y, direction, falling = false) {
        // TODO: Simplify (make more "compact")
        if (direction == 3 /* Direction.Left */ || direction == 1 /* Direction.Right */)
            return true;
        let tid = this.activeState.getTile(0, x, y);
        let ret = tid == 2;
        if (!ret) {
            if (direction == 4 /* Direction.Down */) {
                return this.activeState.getTile(0, x, y + 1) == 2 ||
                    (!falling && y < this.height - 1 && this.activeState.getTile(1, x, y + 2) == 4);
            }
            else if (tid == 0) {
                for (let dy = y + 1; dy < this.height; ++dy) {
                    // Need to use the old state here...
                    // TODO: Does this cause problems?
                    if (this.oldState.getTile(1, x, dy) != 4)
                        break;
                    if (this.oldState.getTile(0, x, dy) == 2)
                        return true;
                }
            }
        }
        return ret;
    }
    spawnRubble(x, y) {
        const INITIAL_SPEEDS = [0.5, 1.5, 2.5, 3.5];
        for (let dy = 0; dy < 2; ++dy) {
            for (let dx = 0; dx < 2; ++dx) {
                nextParticle(this.rubble, RubbleParticle)
                    .spawn(x + dx * 8 + 4, y + dy * 8 + 4, 0, INITIAL_SPEEDS[dy * 2 + dx], dy * 2 + dx);
            }
        }
        this.rubbleSpawned = true;
    }
    controlPlayer(x, y, dx, dy, direction, fallCheck = false) {
        if (this.moveData[y * this.width + x] != 0 /* Direction.None */ ||
            this.activeState.getTile(0, x, y) == 13 ||
            this.isReserved(x + dx, y + dy) ||
            this.checkLadder(x, y, direction, fallCheck) == fallCheck) {
            return false;
        }
        this.activeState.setTile(1, x, y, 0);
        this.activeState.setTile(1, x + dx, y + dy, 4);
        if (!fallCheck && y < this.height - 1 && this.activeState.getTile(0, x, y + 1) == 9) {
            this.activeState.setTile(0, x, y + 1, 0);
            this.spawnRubble(x * 16, (y + 1) * 16);
        }
        this.moveData[(y + dy) * this.width + (x + dx)] = direction;
        if (direction == 3 /* Direction.Left */) {
            this.activeState.setFlip(1 /* Flip.Horizontal */);
        }
        else if (direction == 1 /* Direction.Right */) {
            this.activeState.setFlip(0 /* Flip.None */);
        }
        return true;
    }
    controlBoulder(x, y, dx, dy, direction, fallCheck = false) {
        if (!fallCheck &&
            (direction == 2 /* Direction.Up */ || direction == 4 /* Direction.Down */)) {
            return false;
        }
        if (this.moveData[y * this.width + x] != 0 /* Direction.None */ ||
            this.isReserved(x + dx, y + dy)) {
            return false;
        }
        let move = fallCheck;
        let near;
        if (!move) {
            // Check if a player in the correct direction
            for (let ty = y; ty < this.height; ++ty) {
                near = this.oldState.getTile(1, x - dx, ty);
                if (this.oldState.getTile(1, x, ty) != 10 ||
                    (near != 4 && SOLID_TILES.includes(this.oldState.getTile(0, x + dx, ty))))
                    return false;
                if (near == 4) {
                    move = true;
                    break;
                }
            }
            if (!move)
                return false;
        }
        this.activeState.setTile(1, x, y, 0);
        this.activeState.setTile(1, x + dx, y + dy, 10);
        this.moveData[(y + dy) * this.width + (x + dx)] = direction;
        return true;
    }
    handleAction(direction, event, fallCheck = false) {
        const DX = [1, 0, -1, 0];
        const DY = [0, -1, 0, 1];
        if (direction == 0 /* Direction.None */)
            return false;
        let dx = DX[Number(direction) - 1];
        let dy = DY[Number(direction) - 1];
        let moved = false;
        let changed = false;
        if (!fallCheck) {
            this.oldState = this.activeState.clone();
        }
        do {
            changed = false;
            this.activeState.iterate(1, (x, y, v) => {
                switch (v) {
                    // Player
                    case 4:
                        if (this.controlPlayer(x, y, dx, dy, direction, fallCheck)) {
                            moved = true;
                            changed = true;
                        }
                        break;
                    // Boulder
                    case 10:
                        if (this.controlBoulder(x, y, dx, dy, direction, fallCheck)) {
                            moved = true;
                            changed = true;
                            this.boulderMoved = true;
                            if (fallCheck) {
                                this.boulderFalling = true;
                            }
                        }
                        break;
                    default:
                        break;
                }
            });
        } while (changed);
        return moved;
    }
    control(assets, event) {
        if (this.moving)
            return;
        let dir = 0 /* Direction.None */;
        if ((event.keyboard.getActionState("right") & 1 /* KeyState.DownOrPressed */) == 1) {
            dir = 1 /* Direction.Right */;
        }
        else if ((event.keyboard.getActionState("up") & 1 /* KeyState.DownOrPressed */) == 1) {
            dir = 2 /* Direction.Up */;
        }
        else if ((event.keyboard.getActionState("left") & 1 /* KeyState.DownOrPressed */) == 1) {
            dir = 3 /* Direction.Left */;
        }
        else if ((event.keyboard.getActionState("down") & 1 /* KeyState.DownOrPressed */) == 1) {
            dir = 4 /* Direction.Down */;
        }
        this.rubbleSpawned = false;
        this.boulderMoved = false;
        if (this.handleAction(dir, event)) {
            this.moving = true;
            this.moveTimer = 0.0;
            this.falling = false;
            if (dir == 2 /* Direction.Up */ || dir == 4 /* Direction.Down */) {
                this.climbing = true;
            }
            if (this.rubbleSpawned) {
                event.audio.playSample(assets.getSample("rumble"), 0.60);
            }
            if (this.boulderMoved) {
                event.audio.playSample(assets.getSample("boulder"), 1.20);
            }
        }
    }
    spawnStarParticles(x, y, count, angleStart, color, spawnBat = false) {
        const BAT_SPEED_X_RANGE = 1.0;
        const BAT_SPEED_Y = 0.5;
        const BASE_SPEED = 2.0;
        const VERTICAL_JUMP = -1.0;
        let angle;
        for (let i = 0; i < count; ++i) {
            angle = angleStart + Math.PI * 2 / count * i;
            nextParticle(this.stars, StarParticle)
                .spawn(x, y, Math.cos(angle) * BASE_SPEED, Math.sin(angle) * BASE_SPEED + VERTICAL_JUMP, color);
        }
        if (spawnBat) {
            nextParticle(this.bats, Bat)
                .spawn(x, y, (Math.random() * 2 - 1.0) * BAT_SPEED_X_RANGE, BAT_SPEED_Y);
        }
    }
    toggleBlocks() {
        let tid;
        for (let i = 0; i < this.width * this.height; ++i) {
            tid = this.activeState.getIndexedTile(0, i);
            if (tid == 12 || tid == 13)
                this.activeState.setIndexedTile(0, i, tid == 12 ? 13 : 12);
        }
    }
    checkStaticTileEvents(assets, event) {
        const HURTING_TILES = [5, 6, 7];
        const COLORS = [
            new RGBA(255, 255, 255),
            new RGBA(255, 255, 85),
            new RGBA(170, 255, 255)
        ];
        let somethingHappened = false;
        let hasUnpressedButtons = false;
        let hasButtons = false;
        let bottom;
        let top;
        let color;
        this.cleared = true;
        this.activeState.iterate(0, (x, y, v) => {
            bottom = this.activeState.getTile(0, x, y);
            top = this.activeState.getTile(1, x, y);
            // Check buttons
            if (bottom == 11) {
                hasButtons = true;
                if (top == 0 && !hasUnpressedButtons)
                    hasUnpressedButtons = true;
            }
            // Kill players and/or boulders
            if ((top == 4 &&
                HURTING_TILES.includes(bottom)) ||
                (top == 10 && bottom == 5)) {
                color = COLORS[0];
                if (top != 10)
                    this.activeState.setTile(1, x, y, 0);
                if (bottom == 5) {
                    this.activeState.setTile(0, x, y, 0);
                    color = COLORS[1];
                }
                else if (bottom == 7) {
                    this.activeState.setTile(0, x, y, 8);
                    color = COLORS[2];
                }
                this.spawnStarParticles(x * 16 + 8, y * 16 + 8, 4, Math.PI / 4, color, top == 4);
                event.audio.playSample(assets.getSample("die"), 0.60);
                somethingHappened = true;
            }
            else if (top == 4) {
                this.cleared = false;
            }
        });
        // Toggle buttons
        if (hasButtons &&
            this.activeState.getToggleableWallState() != hasUnpressedButtons) {
            this.toggleBlocks();
            this.activeState.setToggleableWallState(hasUnpressedButtons);
            event.audio.playSample(assets.getSample("toggle" + (hasUnpressedButtons ? "2" : "1")), 0.60);
        }
        if (this.cleared) {
            this.clearTimer = CLEAR_WAIT_TIME;
            event.audio.playSample(assets.getSample("victory"), 0.80);
        }
        return somethingHappened;
    }
    pushState() {
        this.states.push(this.oldState.clone());
        if (this.states.length >= STATE_BUFFER_MAX) {
            this.states.shift();
        }
    }
    move(assets, event) {
        const MOVE_SPEED_BASE = 1.0 / 16.0;
        const MOVE_SPEED_FALL = 1.0 / 8.0;
        if (!this.moving)
            return;
        let moveSpeed = this.falling ? MOVE_SPEED_FALL : MOVE_SPEED_BASE;
        let oldMoveTime = this.moveTimer;
        this.moveTimer += moveSpeed * event.step;
        if (this.climbing &&
            oldMoveTime <= 0.5 && this.moveTimer > 0.5) {
            event.audio.playSample(assets.getSample("climb"), 0.60);
        }
        if (this.moveTimer >= 1.0) {
            this.moveTimer = 0;
            this.moving = false;
            this.climbing = false;
            this.falling = false;
            this.moveData.fill(0 /* Direction.None */);
            this.checkStaticTileEvents(assets, event);
            if (this.handleAction(4 /* Direction.Down */, event, true)) {
                this.moving = true;
                this.moveTimer = 0.0;
                this.falling = true;
            }
            else {
                if (!this.falling && this.boulderFalling) {
                    event.audio.playSample(assets.getSample("boulder"), 1.20);
                    this.boulderFalling = false;
                }
                this.pushState();
            }
        }
    }
    drawTerrain(canvas, bmp) {
        let sx;
        let sy;
        let tid;
        for (let y = 0; y < this.height * 2; ++y) {
            for (let x = 0; x < this.width * 2; ++x) {
                tid = this.terrainMap[y * this.width * 2 + x];
                if (tid < 0)
                    continue;
                if (tid == 0) {
                    canvas.setFillColor(255, 170, 85)
                        .fillRect(x * 8, y * 8, 8, 8);
                }
                else {
                    --tid;
                    sx = tid % COLUMN_COUNT;
                    sy = (tid / COLUMN_COUNT) | 0;
                    canvas.drawBitmapRegion(bmp, sx * 8, sy * 8, 8, 8, x * 8, y * 8);
                }
                // Tile correction
                if (y > 0) {
                    tid = this.terrainMap[(y - 1) * this.width * 2 + x];
                    if (tid >= 1 && tid <= 3) {
                        canvas.setFillColor(170, 85, 85)
                            .fillRect(x * 8 + 2, y * 8, 4, 1);
                    }
                }
            }
        }
    }
    drawWater(canvas, dx, dy) {
        const AMPLITUDE = 2;
        const YOFF = 6;
        let baseWave = this.staticAnimationTimer * Math.PI * 2;
        let wave;
        dy += YOFF;
        canvas.setFillColor(170, 255, 255);
        for (let x = 0; x < 16; ++x) {
            wave = Math.round(Math.sin(baseWave + (Math.PI * 2) / 16 * x) * AMPLITUDE * Math.sin(Math.PI / 16 * x));
            canvas.fillRect(dx + x, dy + wave, 1, 16 - (wave + YOFF));
        }
    }
    drawNonTerrainStaticTiles(canvas, bmp) {
        const BRIDGE_OFF = -2;
        let dx;
        let dy;
        this.activeState.iterate(0, (x, y, v) => {
            dx = x * 16;
            dy = y * 16;
            switch (v) {
                // Ladder
                case 2:
                    for (let j = 0; j < 2; ++j) {
                        canvas.drawBitmapRegion(bmp, 56, 0, 8, 8, dx, dy + j * 8)
                            .drawBitmapRegion(bmp, 56, 0, 8, 8, dx + 8, dy + j * 8, 1 /* Flip.Horizontal */);
                    }
                    if (y > 0 && this.baseTilemap[(y - 1) * this.width + x] != 2) {
                        dy -= 8;
                        canvas.drawBitmapRegion(bmp, 56, 8, 8, 8, dx, dy)
                            .drawBitmapRegion(bmp, 56, 8, 8, 8, dx + 8, dy, 1 /* Flip.Horizontal */);
                    }
                    break;
                // Bridge
                case 3:
                    for (let i = 0; i < 2; ++i) {
                        canvas.drawBitmapRegion(bmp, 64, 0, 8, 16, dx + i * 8, dy + BRIDGE_OFF);
                    }
                    break;
                // Flame
                case 5:
                    canvas.drawHorizontallyWavingBitmapRegion(bmp, 64, 32, 16, 16, dx, dy, this.staticAnimationTimer * Math.PI * 2, Math.PI * 4 / 16, 1);
                    break;
                // Spikes
                case 6:
                    for (let i = 0; i < 2; ++i)
                        canvas.drawBitmapRegion(bmp, 72, 0, 8, 8, dx + i * 8, dy + 8);
                    break;
                // Lava
                case 7:
                    this.drawWater(canvas, dx, dy);
                    break;
                // Ice block
                case 8:
                    canvas.drawBitmapRegion(bmp, 80, 32, 16, 16, dx, dy);
                    break;
                // Breaking block
                case 9:
                    canvas.drawBitmapRegion(bmp, 80, 0, 16, 16, dx, dy);
                    break;
                // Button
                case 11:
                    if (this.activeState.getTile(1, x, y) == 0 ||
                        (this.moving && this.moveTimer < 0.5)) {
                        canvas.drawBitmapRegion(bmp, 48, 24, 16, 8, dx, dy + 8);
                    }
                    canvas.drawBitmapRegion(bmp, 48, 40, 16, 8, dx, dy + 8);
                    break;
                // Toggleable blocks
                case 12:
                case 13:
                    canvas.drawBitmapRegion(bmp, 96, 16 - (v - 12) * 16, 16, 16, dx, dy);
                    break;
                default:
                    break;
            }
        });
    }
    drawAnimatedFigure(canvas, bmp, x, y, dx, dy, direction) {
        const LEG_X = [0, 16, 16, 32, 32, 48];
        const LEG_Y = [8, 0, 8, 0, 8, 0];
        let frame = 0;
        let climbing = false;
        let horizontal = direction == 3 /* Direction.Left */ || direction == 1 /* Direction.Right */;
        // Check if climbing
        if (!horizontal &&
            (this.activeState.getTile(0, x, y) == 2 &&
                (this.activeState.getTile(0, x, y + 1) != 1 || direction == 4 /* Direction.Down */)) ||
            (direction == 2 /* Direction.Up */ && this.activeState.getTile(0, x, y + 1) == 2)) {
            climbing = true;
            frame = 0;
            if (direction != 0 /* Direction.None */) {
                frame += Math.floor(this.moveTimer * 2);
            }
        }
        // Or falling
        else if (direction == 4 /* Direction.Down */ &&
            this.activeState.getTile(0, x, y) != 2 &&
            this.activeState.getTile(1, x, y + 1) != 4) {
            frame = 5;
        }
        // Or not being carried, so can be animated
        else if (direction != 0 /* Direction.None */ &&
            (this.activeState.getTile(1, x, y + 1) != 4 ||
                (y < this.height - 1 && this.moveData[(y + 1) * this.width + x] == 0 /* Direction.None */))) {
            frame = 1 + Math.floor(4 * this.moveTimer);
        }
        let sy = 16;
        if (this.activeState.getTile(1, x, y - 1) == 4)
            sy = 32;
        if (climbing) {
            canvas.drawBitmapRegion(bmp, 64, 16, 16, 16, dx, dy + 1, frame == 0 ? 0 /* Flip.None */ : 1 /* Flip.Horizontal */);
            return;
        }
        canvas.drawBitmapRegion(bmp, 0, sy, 16, 8, dx, dy + 1, this.activeState.getFlip())
            .drawBitmapRegion(bmp, LEG_X[frame], sy + LEG_Y[frame], 16, 8, dx, dy + 9, this.activeState.getFlip());
    }
    drawDynamicObjects(canvas, bmp) {
        const DX = [0, 1, 0, -1, 0];
        const DY = [0, 0, -1, 0, 1];
        let dx = 0;
        let dy = 0;
        let direction;
        this.activeState.iterate(1, (x, y, value) => {
            direction = this.moveData[y * this.width + x];
            dx = x * 16;
            dy = y * 16;
            if (direction != 0 /* Direction.None */) {
                dx -= DX[Number(direction)] * (1.0 - this.moveTimer) * 16;
                dy -= DY[Number(direction)] * (1.0 - this.moveTimer) * 16;
            }
            switch (value) {
                // Human
                case 4:
                    this.drawAnimatedFigure(canvas, bmp, x, y, dx, dy, direction);
                    break;
                // Boulder
                case 10:
                    canvas.drawBitmapRegion(bmp, 80, 16, 16, 16, dx, dy + 1);
                    break;
                default:
                    break;
            }
        });
    }
    drawStageClearText(canvas, bmpFont) {
        const WAIT_TIME = 60;
        const OFFSET = -14;
        const MESSAGES = ["STAGE", "CLEAR"];
        let px = canvas.width / 2 - (32 + OFFSET) * 6 / 2.0;
        let t = Math.min(1.0, (1.0 - (this.clearTimer - WAIT_TIME) / (CLEAR_WAIT_TIME - WAIT_TIME))) * 5;
        let dx;
        let dy;
        let end = Math.floor(t);
        for (let j = 0; j < Math.min(5, end + 1); ++j) {
            dx = px + j * (32 + OFFSET);
            dy = 0;
            if (j == end) {
                dy = canvas.height / 2 * (1.0 - (t % 1.0));
            }
            for (let i = 1; i >= 0; --i) {
                canvas.drawText(bmpFont, MESSAGES[0].charAt(j), dx + i, canvas.height / 2 - 24 - dy + i)
                    .drawText(bmpFont, MESSAGES[1].charAt(j), dx + i, canvas.height / 2 - 2 + dy + i);
            }
        }
    }
    drawStageStart(canvas, bmpFont) {
        canvas.setFillColor(0, 0, 0, 0.33)
            .fillRect();
        for (let i = 1; i >= 0; --i) {
            canvas.drawText(bmpFont, "STAGE " + Number(this.stageIndex | 0), canvas.width / 2 + i, canvas.height / 2 - 16 + i, -14, 0, 1 /* TextAlign.Center */);
        }
    }
    restart() {
        // There is a bug that requires this...
        if (!this.moving)
            this.oldState = this.activeState.clone();
        this.pushState();
        this.activeState = new PuzzleState(this.baseTilemap, this.baseTilemap.map(v => Number(DYNAMIC_TILES.includes(v)) * v), this.width, this.height, 0 /* Flip.None */);
        this.moveData = (new Array(this.width * this.height)).fill(0 /* Direction.None */);
        this.activeState.setFlip(0 /* Flip.None */);
    }
    undo() {
        let s = this.moving ? this.oldState : this.states.pop();
        if (s == null)
            return;
        this.activeState = s.clone();
        this.moving = false;
        this.moveTimer = 0;
        this.moveData.fill(0 /* Direction.None */);
    }
    update(event, assets) {
        this.move(assets, event);
        if (!this.cleared) {
            if (this.startTimer > 0) {
                this.startTimer -= event.step;
            }
            else {
                this.control(assets, event);
                if (event.keyboard.getActionState("undo") == 3 /* KeyState.Pressed */) {
                    event.audio.playSample(assets.getSample("choose"), 0.60);
                    this.undo();
                }
                else if (event.keyboard.getActionState("restart") == 3 /* KeyState.Pressed */) {
                    event.audio.playSample(assets.getSample("choose"), 0.60);
                    this.restart();
                }
            }
        }
        else {
            if ((this.clearTimer -= event.step) <= 0) {
                return true;
            }
        }
        return false;
    }
    updateBackground(event) {
        const STATIC_ANIMATION_SPEED = 0.025;
        this.staticAnimationTimer = (this.staticAnimationTimer + STATIC_ANIMATION_SPEED * event.step) % 1.0;
        for (let r of this.rubble) {
            r.update(event);
        }
        for (let s of this.stars) {
            s.update(event);
        }
        for (let b of this.bats) {
            b.update(event);
        }
        this.snowfall.update(event);
    }
    draw(canvas) {
        let bmpBase = canvas.getBitmap("base");
        let bmpFontBig = canvas.getBitmap("fontBig");
        if (bmpBase == null || bmpFontBig == null)
            return;
        this.drawNonTerrainStaticTiles(canvas, bmpBase);
        this.drawTerrain(canvas, bmpBase);
        for (let r of this.rubble) {
            r.draw(canvas, bmpBase);
        }
        this.drawDynamicObjects(canvas, bmpBase);
        for (let s of this.stars) {
            s.draw(canvas);
        }
        for (let b of this.bats) {
            b.draw(canvas, bmpBase);
        }
        this.snowfall.draw(canvas);
        if (this.cleared) {
            canvas.setFillColor(0, 0, 0, 0.33)
                .fillRect();
            this.drawStageClearText(canvas, bmpFontBig);
        }
        if (this.startTimer > 0) {
            this.drawStageStart(canvas, bmpFontBig);
        }
    }
    changeStage(index, newMapdata) {
        this.baseTilemap = Array.from(newMapdata);
        this.states.length = 0;
        this.activeState = new PuzzleState(this.baseTilemap, this.baseTilemap.map(v => Number(DYNAMIC_TILES.includes(v)) * v), this.width, this.height, 0 /* Flip.None */);
        this.states.push(this.activeState.clone());
        this.oldState = this.activeState.clone();
        this.moveData.fill(0 /* Direction.None */);
        this.terrainMap = createTerrainMap(this.baseTilemap, this.width, this.height);
        this.cleared = false;
        this.clearTimer = 0;
        this.startTimer = START_TIME;
        this.stageIndex = index;
        for (let r of this.rubble) {
            r.kill();
        }
        for (let s of this.stars) {
            s.kill();
        }
        for (let b of this.bats) {
            b.kill();
        }
        this.snowfall.shuffle();
    }
}
