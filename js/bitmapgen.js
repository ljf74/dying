import { Canvas, getColorString } from "./canvas.js";
const TILE_WIDTH = 8;
const TILE_HEIGHT = 8;
export const generateRGB222LookupTable = () => {
    let out = new Array(64);
    let r;
    let g;
    let b;
    for (let c = 0; c < 64; ++c) {
        r = c >> 4;
        g = (c & 0b1100) >> 2;
        b = (c & 0b11);
        out[c * 3] = r * 85;
        out[c * 3 + 1] = g * 85;
        out[c * 3 + 2] = b * 85;
    }
    return out;
};
const getColorIndex = (pixels, start) => {
    const INDICES = [0, 1, 2, 3];
    let r = (pixels[start] / 85) | 0;
    let g = (pixels[start + 1] / 85) | 0;
    let b = (pixels[start + 2] / 85) | 0;
    let index = ((r + g + b) / 3) | 0;
    return INDICES[index];
};
const convertChar = (data, width, startx, starty, endx, endy, lookup, palette) => {
    let k;
    let p;
    let index;
    for (let y = starty; y < endy; ++y) {
        for (let x = startx; x < endx; ++x) {
            k = y * width + x;
            index = getColorIndex(data.data, k * 4);
            p = palette[index];
            if (p < 0) {
                data.data[k * 4 + 3] = 0;
            }
            else {
                data.data[k * 4] = lookup[p * 3];
                data.data[k * 4 + 1] = lookup[p * 3 + 1];
                data.data[k * 4 + 2] = lookup[p * 3 + 2];
                data.data[k * 4 + 3] = 255;
            }
        }
    }
};
const convertToMono = (src, color, alphaLimit = 64) => {
    let ctx = src.getContext("2d");
    let data = ctx.getImageData(0, 0, src.width, src.height);
    for (let i = 0; i < src.width * src.height; ++i) {
        for (let j = 0; j < 3; ++j) {
            data.data[i * 4 + j] = color[j];
        }
        data.data[i * 4 + 3] = data.data[i * 4 + 3] < alphaLimit ? 0 : 255;
    }
    ctx.putImageData(data, 0, 0);
};
const addBlackBorder = (src, startRow, endRow = src.height) => {
    let ctx = src.getContext("2d");
    let data = ctx.getImageData(0, 0, src.width, src.height);
    let pixels = Uint8ClampedArray.from(data.data);
    let i;
    let index;
    for (let y = startRow + 1; y < endRow - 1; ++y) {
        i = y * src.width + 1;
        for (let x = 1; x < src.width - 1; ++x, ++i) {
            if (pixels[i * 4 + 3] == 255) {
                for (let j = y - 1; j <= y + 1; ++j) {
                    for (let k = x - 1; k <= x + 1; ++k) {
                        index = j * src.width + k;
                        if (pixels[index * 4 + 3] == 0) {
                            data.data[index * 4] = 0;
                            data.data[index * 4 + 1] = 0;
                            data.data[index * 4 + 2] = 0;
                            data.data[index * 4 + 3] = 255;
                        }
                    }
                }
            }
        }
    }
    ctx.putImageData(data, 0, 0);
};
export const convert2BitImageToRGB222 = (ctx, width, height, lookup, palette) => {
    let data = ctx.getImageData(0, 0, width, height);
    let w = (width / TILE_WIDTH) | 0;
    let h = (height / TILE_HEIGHT) | 0;
    for (let j = 0; j < h; ++j) {
        for (let i = 0; i < w; ++i) {
            convertChar(data, width, i * TILE_WIDTH, j * TILE_HEIGHT, (i + 1) * TILE_WIDTH, (j + 1) * TILE_HEIGHT, lookup, palette[j * w + i]);
        }
    }
    ctx.putImageData(data, 0, 0);
};
export const loadBitmapRGB222 = (path, lookup, palette, callback) => {
    let image = document.createElement('img');
    let canvas = document.createElement("canvas");
    image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        convert2BitImageToRGB222(ctx, canvas.width, canvas.height, lookup, palette);
        callback();
    };
    image.src = path;
    return canvas;
};
export const generateFreeStyleBitmap = (assets, width, height, renderFunc) => {
    let canvas = new Canvas(width, height, false, assets);
    renderFunc(canvas);
    return canvas.convertToBitmap();
};
export const generateFont = (font, charWidth, charHeight, rowStart = 0, rowEnd = 16, alphaLimit = 64, color = [255, 255, 255], blackBorder = false) => {
    let width = charWidth * 16;
    let height = charHeight * 16;
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.fillStyle = getColorString(...color, 1.0);
    let i = rowStart * 16;
    for (let y = rowStart; y < rowEnd; ++y) {
        for (let x = 0; x < 16; ++x) {
            ctx.fillText(i == "@".charCodeAt(0) ? "ä" : String.fromCharCode(i), (x + 0.5) * charWidth, (y + 0.67) * charHeight);
            ++i;
        }
    }
    convertToMono(canvas, color, alphaLimit);
    if (blackBorder) {
        addBlackBorder(canvas, rowStart * charHeight, rowEnd * charHeight);
    }
    return canvas;
};
