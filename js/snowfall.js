import { Particle } from "./particle.js";
import { Vector2 } from "./vector.js";
class Snowflake extends Particle {
    constructor(x, y, size) {
        super();
        const MIN_SPEED_X = 0.20;
        const MAX_SPEED_X = 1.25;
        const MIN_SPEED_Y = 0.20;
        const MAX_SPEED_Y = 1.5;
        this.pos.x = x;
        this.pos.y = y;
        this.friction.x = 0.1;
        this.friction.y = 0.1;
        this.speedFactor = new Vector2(MIN_SPEED_X + Math.random() * (MAX_SPEED_X - MIN_SPEED_X), MIN_SPEED_Y + Math.random() * (MAX_SPEED_Y - MIN_SPEED_Y));
        this.loop = true;
        this.exist = true;
        this.size = size;
        this.speedAngle = Math.random() * Math.PI * 2;
    }
    updateLogic(event) {
        const ANGLE_SPEED = 0.05;
        this.speedAngle = (this.speedAngle + ANGLE_SPEED * event.step) % (Math.PI * 4);
        this.target.x = Math.sin(this.speedAngle * 0.5) * this.speedFactor.x;
        this.target.y = this.speedFactor.y * 0.5 * ((Math.sin(this.speedAngle) + 1.0));
    }
    drawBase(canvas, dx = 0, dy = 0) {
        const ALPHA = 0.67;
        let px = Math.round(this.pos.x - this.size / 2) + dx;
        let py = Math.round(this.pos.y - this.size / 2) + dy;
        canvas.setFillColor(255, 255, 255, ALPHA)
            .fillRect(px, py, this.size, this.size);
    }
    draw(canvas) {
        this.drawBase(canvas);
        if (this.pos.x < 0)
            this.drawBase(canvas, canvas.width);
        else if (this.pos.x >= canvas.width)
            this.drawBase(canvas, -canvas.width);
        if (this.pos.y < 0)
            this.drawBase(canvas, 0, canvas.height);
        else if (this.pos.y >= canvas.height)
            this.drawBase(canvas, 0, -canvas.height);
    }
}
export class Snowfall {
    constructor() {
        this.snowflakes = new Array();
        this.shuffle();
    }
    shuffle() {
        const GRID_WIDTH = 32;
        const GRID_HEIGHT = 24;
        const BIG_FLAKE_PROB = 0.25;
        let dx;
        let dy;
        this.snowflakes = new Array();
        for (let y = 0; y < 144 / GRID_HEIGHT; ++y) {
            for (let x = 0; x < 160 / GRID_WIDTH; ++x) {
                dx = x * GRID_WIDTH + (Math.random() * 2 - 1) * GRID_WIDTH / 2;
                dy = y * GRID_HEIGHT + (Math.random() * 2 - 1) * GRID_WIDTH / 2;
                this.snowflakes.push(new Snowflake(dx, dy, Math.random() < BIG_FLAKE_PROB ? 2 : 1));
            }
        }
    }
    update(event) {
        for (let s of this.snowflakes) {
            s.update(event);
        }
    }
    draw(canvas) {
        for (let s of this.snowflakes) {
            s.draw(canvas);
        }
    }
}
