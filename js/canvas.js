import { clamp } from "./math.js";
;
;
const createCanvasElement = (width, height, embedToDiv = true) => {
    let div = null;
    if (embedToDiv) {
        div = document.createElement("div");
        div.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;");
    }
    let canvas = document.createElement("canvas");
    canvas.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;" +
        "image-rendering: optimizeSpeed;" +
        "image-rendering: pixelated;" +
        "image-rendering: -moz-crisp-edges;");
    canvas.width = width;
    canvas.height = height;
    if (div != null) {
        div.appendChild(canvas);
        document.body.appendChild(div);
    }
    let ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    return [canvas, ctx];
};
export const getColorString = (r, g, b, a = 1.0) => "rgba(" +
    String(r | 0) + "," +
    String(g | 0) + "," +
    String(b | 0) + "," +
    String(clamp(a, 0.0, 1.0)) +
    ")";
export class Canvas {
    get width() {
        return this.canvas.width;
    }
    get height() {
        return this.canvas.height;
    }
    constructor(width, height, isMainCanvas, assets) {
        this.clear = (r = 255, g = r, b = g) => this.setFillColor(r, g, b).fillRect();
        // Looks silly, but it is here for abstraction
        this.convertToBitmap = () => this.canvas;
        this.getBitmap = (name) => this.assets.getBitmap(name);
        [this.canvas, this.ctx] = createCanvasElement(width, height, isMainCanvas);
        if (isMainCanvas) {
            window.addEventListener("resize", () => this.resizeEvent(window.innerWidth, window.innerHeight));
            this.resizeEvent(window.innerWidth, window.innerHeight);
        }
        this.assets = assets;
    }
    resizeEvent(width, height) {
        let m = Math.min(width / this.width, height / this.height);
        if (m >= 1.0) {
            m = Math.floor(m);
        }
        let style = this.canvas.style;
        style.width = String((m * this.width) | 0) + "px";
        style.height = String((m * this.height) | 0) + "px";
        style.left = String((width / 2 - m * this.width / 2) | 0) + "px";
        style.top = String((height / 2 - m * this.height / 2) | 0) + "px";
    }
    setFillColor(r = 255, g = r, b = g, a = 1.0) {
        this.ctx.fillStyle = getColorString(r, g, b, a);
        return this;
    }
    setAlpha(a = 1.0) {
        this.ctx.globalAlpha = clamp(a, 0.0, 1.0);
        return this;
    }
    fillRect(x = 0, y = 0, w = this.width, h = this.height) {
        this.ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
        return this;
    }
    drawBitmapRegion(bmp, sx, sy, sw, sh, dx, dy, flip = 0 /* Flip.None */) {
        if (bmp == undefined || sw <= 0 || sh <= 0)
            return this;
        let c = this.ctx;
        sx |= 0;
        sy |= 0;
        sw |= 0;
        sh |= 0;
        dx |= 0;
        dy |= 0;
        flip = flip | 0 /* Flip.None */;
        if (flip != 0 /* Flip.None */) {
            c.save();
        }
        if ((flip & 1 /* Flip.Horizontal */) != 0) {
            c.translate(sw, 0);
            c.scale(-1, 1);
            dx *= -1;
        }
        if ((flip & 2 /* Flip.Vertical */) != 0) {
            c.translate(0, sh);
            c.scale(1, -1);
            dy *= -1;
        }
        c.drawImage(bmp, sx, sy, sw, sh, dx, dy, sw, sh);
        if (flip != 0 /* Flip.None */) {
            c.restore();
        }
        return this;
    }
    drawBitmap(bmp, dx = 0.0, dy = 0.0, flip = 0 /* Flip.None */) {
        if (bmp == undefined)
            return this;
        return this.drawBitmapRegion(bmp, 0, 0, bmp.width, bmp.height, dx, dy, flip);
    }
    // Note: this method does not support flipping (reason: laziness, also 
    // don't need it here)
    drawHorizontallyWavingBitmapRegion(bmp, sx, sy, sw, sh, dx, dy, wave, period, amplitude) {
        if (bmp == undefined)
            return this;
        sx |= 0;
        sy |= 0;
        sw |= 0;
        sh |= 0;
        dx |= 0;
        dy |= 0;
        let w = 0.0;
        let tx;
        for (let y = 0; y < sh; ++y) {
            w = wave + period * y;
            tx = dx + Math.round(Math.sin(w) * amplitude);
            this.ctx.drawImage(bmp, sx, sy + y, sw, 1, tx, dy + y, sw, 1);
        }
        return this;
    }
    drawText(font, str, dx, dy, xoff = 0.0, yoff = 0.0, align = 0 /* TextAlign.Left */) {
        if (font == undefined)
            return this;
        let cw = (font.width / 16) | 0;
        let ch = cw;
        let x = dx;
        let y = dy;
        let chr;
        if (align == 1 /* TextAlign.Center */) {
            dx -= (str.length * (cw + xoff)) / 2.0;
            x = dx;
        }
        else if (align == 2 /* TextAlign.Right */) {
            dx -= ((str.length) * (cw + xoff));
            x = dx;
        }
        for (let i = 0; i < str.length; ++i) {
            chr = str.charCodeAt(i);
            if (chr == '\n'.charCodeAt(0)) {
                x = dx;
                y += (ch + yoff);
                continue;
            }
            this.drawBitmapRegion(font, (chr % 16) * cw, ((chr / 16) | 0) * ch, cw, ch, x, y);
            x += cw + xoff;
        }
        return this;
    }
    fillEllipse(cx, cy, w, h) {
        const EPS = 2.0;
        if (w < EPS || h < EPS)
            return this;
        cx |= 0;
        cy |= 0;
        w /= 2;
        h /= 2;
        let rh = Math.round(h);
        let dw = 0;
        for (let y = cy - rh; y <= cy + rh; ++y) {
            dw = Math.round(w * Math.sqrt(1 - ((y - cy) * (y - cy)) / (h * h)));
            this.fillRect(cx - dw, y, dw * 2, 1);
        }
        return this;
    }
    fillCircleOutside(r, cx = this.width / 2, cy = this.height / 2) {
        let start = Math.max(0, cy - r) | 0;
        let end = Math.min(this.height, cy + r) | 0;
        if (start > 0)
            this.fillRect(0, 0, this.width, start);
        if (end < this.height)
            this.fillRect(0, end, this.width, this.height - end);
        let dy;
        let px1;
        let px2;
        for (let y = start; y < end; ++y) {
            dy = y - cy;
            if (Math.abs(dy) >= r) {
                this.fillRect(0, y, this.width, 1);
                continue;
            }
            px1 = Math.round(cx - Math.sqrt(r * r - dy * dy));
            px2 = Math.round(cx + Math.sqrt(r * r - dy * dy));
            if (px1 > 0)
                this.fillRect(0, y, px1, 1);
            if (px2 < this.width)
                this.fillRect(px2, y, this.width - px1, 1);
        }
        return this;
    }
    fillRegularStar(cx, cy, radius) {
        let leftx = Math.round(Math.sin(-Math.PI * 2 / 3) * radius);
        let bottomy = -Math.round(Math.cos(-Math.PI * 2 / 3) * radius);
        let x = 0;
        let stepx = bottomy / Math.abs(leftx);
        let rx;
        for (let y = -radius; y <= bottomy; ++y, x += stepx) {
            rx = Math.round(x);
            this.fillRect(cx - rx, cy + y, rx * 2, 1);
            this.fillRect(cx - rx, cy + radius - bottomy * 2 - y, rx * 2, 1);
        }
        return this;
    }
}
