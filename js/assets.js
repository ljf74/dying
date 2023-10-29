import { loadBitmapRGB222 } from "./bitmapgen.js";
export class Assets {
    constructor() {
        this.loaded = 0;
        this.loadCount = 0;
        this.hasLoaded = () => this.loaded >= this.loadCount;
        this.bitmaps = new Map();
        this.samples = new Map();
    }
    addSample(name, s) {
        this.samples.set(name, s);
    }
    addBitmap(name, b) {
        this.bitmaps.set(name, b);
    }
    loadBitmapRGB222(name, path, lookup, palette) {
        ++this.loadCount;
        this.addBitmap(name, loadBitmapRGB222(path, lookup, palette, () => {
            ++this.loaded;
        }));
    }
    getBitmap(name) {
        return this.bitmaps.get(name);
    }
    getSample(name) {
        return this.samples.get(name);
    }
}
