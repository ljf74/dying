export class Vector2 {
    constructor(x = 0, y = 0) {
        this.scalarMultiply = (s) => new Vector2(this.x * s, this.y * s);
        this.clone = () => new Vector2(this.x, this.y);
        this.x = x;
        this.y = y;
    }
}
Vector2.interpolate = (a, b, t) => new Vector2(a.x * (1 - t) + b.x * t, a.y * (1 - t) + b.y * t);
export class RGBA {
    constructor(r = 255, g = r, b = g, a = 1.0) {
        this.clone = () => new RGBA(this.r, this.g, this.b, this.a);
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}
